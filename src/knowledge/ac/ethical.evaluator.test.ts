import { describe, it, expect } from 'vitest';
import { evaluateACEthics } from './resolver';
import { evaluateEthics } from './ethical.evaluator';
import type { EthicalRule, DereferralCriterion } from './ethical.types';
import type { CriticalItemAlert } from '../inventories/types/inventory_types';

// Test unitario para el evaluador ético AC

describe('evaluateACEthics', () => {
    it('detecta contraindicación absoluta y derivación obligatoria con critical_alerts', async () => {
        // Usa critical_alerts (fuente de verdad) en lugar de bdi_ii_item9
        const criticalAlerts: CriticalItemAlert[] = [{
            item_id: 9,
            value: 2,
            domain_descriptor: 'pensamientos_suicidas',
            urgency: 'high',
        }];
        const input = {
            riesgo_suicida: true,
            critical_alerts: criticalAlerts,
            banderas_seguridad: ['abandono total de autocuidado'],
        };
        const result = await evaluateACEthics(input);
        expect(result.resultado).toBe('derivacion');
        expect(result.reglas_aplicadas.some(r => r.tipo === 'absoluta')).toBe(true);
        expect(result.senales_alarma.some(s => s.includes('ALERTA ALTA'))).toBe(true);
        expect(result.banderas_seguridad).toContain('abandono total de autocuidado');
        expect(result.criterios_derivacion.some(c => c.criterio === 'riesgo_suicida_alto')).toBe(true);
        expect(result.mensaje_clinico).toMatch(/Derivación obligatoria/);
    });

    it('genera EMERGENCIA con critical_alert urgency critical', async () => {
        const criticalAlerts: CriticalItemAlert[] = [{
            item_id: 9,
            value: 3,
            domain_descriptor: 'pensamientos_suicidas',
            urgency: 'critical',
        }];
        const input = {
            riesgo_suicida: true,
            critical_alerts: criticalAlerts,
        };
        const result = await evaluateACEthics(input);
        expect(result.senales_alarma.some(s => s.includes('EMERGENCIA'))).toBe(true);
        expect(result.senales_alarma.some(s => s.includes('urgencia crítica'))).toBe(true);
    });

    it('genera alerta moderada con critical_alert urgency moderate', async () => {
        const criticalAlerts: CriticalItemAlert[] = [{
            item_id: 9,
            value: 1,
            domain_descriptor: 'pensamientos_suicidas',
            urgency: 'moderate',
        }];
        const input = {
            critical_alerts: criticalAlerts,
        };
        const result = await evaluateACEthics(input);
        expect(result.senales_alarma.some(s => s.includes('Alerta:'))).toBe(true);
    });

    it('fallback deprecated bdi_ii_item9 funciona para backward compat', async () => {
        const input = {
            riesgo_suicida: true,
            bdi_ii_item9: 2,
            banderas_seguridad: ['abandono total de autocuidado'],
        };
        const result = await evaluateACEthics(input);
        // Deprecated path: genera señal con formato nuevo (valor exacto)
        expect(result.senales_alarma.some(s => s.includes('BDI-II ítem 9 = 2'))).toBe(true);
    });

    it('critical_alerts tiene prioridad sobre bdi_ii_item9', async () => {
        const criticalAlerts: CriticalItemAlert[] = [{
            item_id: 9,
            value: 3,
            domain_descriptor: 'pensamientos_suicidas',
            urgency: 'critical',
        }];
        const input = {
            riesgo_suicida: true,
            critical_alerts: criticalAlerts,
            bdi_ii_item9: 2, // debería ser ignorado
        };
        const result = await evaluateACEthics(input);
        // Solo la señal de critical_alerts, no la deprecated
        expect(result.senales_alarma.some(s => s.includes('EMERGENCIA'))).toBe(true);
        expect(result.senales_alarma.every(s => !s.includes('BDI-II ítem 9'))).toBe(true);
    });

    it('permite intervención si no hay restricciones', async () => {
        const input = {
            riesgo_suicida: false,
            psicosis_activa: false,
            bipolar_sin_estabilizacion: false,
            consumo_severo: false,
            critical_alerts: [],
        };
        const result = await evaluateACEthics(input);
        expect(result.resultado).toBe('permitido');
        expect(result.reglas_aplicadas.length).toBe(0);
        expect(result.criterios_derivacion.length).toBe(0);
        expect(result.mensaje_clinico).toMatch(/No se detectan restricciones/);
    });
});

// ============================================================================
// Tests RC: evaluateEthics con reglas RC (rc.profile.json)
// ============================================================================

describe('evaluateEthics — reglas RC (signal-based matching)', () => {
    // Reglas RC extraídas de rc.profile.json
    const rcRules: EthicalRule[] = [
        {
            id: 'rc_ci_01',
            condicion: 'Psicosis activa con nula conciencia de enfermedad',
            tipo: 'absoluta',
            razon_clinica: 'No hay condiciones para evaluar pensamientos como hipotesis.',
            alternativa_sugerida: 'Estabilizacion psiquiatrica',
        },
        {
            id: 'rc_ci_02',
            condicion: 'Deterioro cognitivo significativo',
            tipo: 'relativa',
            razon_clinica: 'Compromete memoria de trabajo y razonamiento.',
            alternativa_sugerida: 'Intervenciones conductuales',
        },
        {
            id: 'rc_ci_03',
            condicion: 'Riesgo suicida inminente',
            tipo: 'absoluta',
            razon_clinica: 'Prioridad: seguridad y contencion.',
            alternativa_sugerida: 'Protocolo de crisis',
        },
    ];

    const rcCriteria: DereferralCriterion[] = [
        { criterio: 'riesgo_suicida_alto', fuente: 'rc_profile' },
        { criterio: 'sintomas_psicoticos_no_controlados', fuente: 'rc_profile' },
        { criterio: 'consumo_agudo_de_sustancias', fuente: 'rc_profile' },
    ];

    it('RC rc_ci_01: psicosis activa → derivación obligatoria', () => {
        const result = evaluateEthics(
            { psicosis_activa: true },
            rcRules,
            rcCriteria,
        );
        expect(result.resultado).toBe('derivacion');
        expect(result.reglas_aplicadas.some(r => r.id === 'rc_ci_01')).toBe(true);
        expect(result.reglas_aplicadas.some(r => r.tipo === 'absoluta')).toBe(true);
        // Criterio de derivación RC-specific
        expect(result.criterios_derivacion.some(c => c.criterio === 'sintomas_psicoticos_no_controlados')).toBe(true);
        expect(result.criterios_derivacion.some(c => c.fuente === 'rc_profile')).toBe(true);
    });

    it('RC rc_ci_02: deterioro cognitivo → restringido (relativa)', () => {
        const result = evaluateEthics(
            { deterioro_cognitivo: true },
            rcRules,
            rcCriteria,
        );
        expect(result.resultado).toBe('restringido');
        expect(result.reglas_aplicadas.some(r => r.id === 'rc_ci_02')).toBe(true);
        expect(result.reglas_aplicadas.some(r => r.tipo === 'relativa')).toBe(true);
        expect(result.mensaje_clinico).toContain('Requiere supervisión');
    });

    it('RC rc_ci_03: riesgo suicida → derivación obligatoria', () => {
        const result = evaluateEthics(
            { riesgo_suicida: true },
            rcRules,
            rcCriteria,
        );
        expect(result.resultado).toBe('derivacion');
        expect(result.reglas_aplicadas.some(r => r.id === 'rc_ci_03')).toBe(true);
        // Criterio de derivación RC
        expect(result.criterios_derivacion.some(c => c.criterio === 'riesgo_suicida_alto')).toBe(true);
    });

    it('RC sin señales clínicas → permitido', () => {
        const result = evaluateEthics(
            {
                riesgo_suicida: false,
                psicosis_activa: false,
                deterioro_cognitivo: false,
                consumo_severo: false,
            },
            rcRules,
            rcCriteria,
        );
        expect(result.resultado).toBe('permitido');
        expect(result.reglas_aplicadas).toHaveLength(0);
        expect(result.criterios_derivacion).toHaveLength(0);
        expect(result.mensaje_clinico).toContain('No se detectan restricciones');
    });
});
