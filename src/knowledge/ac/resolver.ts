/**
 * ac/resolver.ts — Resolver específico v3 para Activación Conductual
 *
 * Carga, valida y cachea ac_profile.json + ac_procedures.json.
 * Usa los schemas Zod compartidos de v3 para validación estricta.
 *
 * Patrón: igual que transversal_regulacion/resolver.ts
 * Justificación: AC es el foco del sprint y necesita acceso directo,
 * cacheado y tipado fuerte para los submódulos del Módulo Terapeuta.
 */

import { techniqueProfileSchema } from '../types/schemas.profile';
import { procedureCatalogSchema } from '../types/schemas.procedures';
import type { TechniqueProfile } from '../types/profile.types';
import type { ProcedureCatalog, ClinicalProcedure } from '../types/procedure.types';

import { evaluateEthics, EthicalEvaluatorInput, EthicalEvaluatorOutput } from './ethical.evaluator';
import type { EthicalRule, EthicalEvaluation, DereferralCriterion } from './ethical.types';

/**
 * Evalúa restricciones éticas, alertas y criterios de derivación para AC.
 * Usa profile.contraindicaciones y profile.requiere_derivacion_si.
 * Señales de alarma y banderas de seguridad pueden venir del estado clínico o protocolo_crisis.
 *
 * @param input Estado clínico del paciente (ver EthicalEvaluatorInput)
 * @returns Evaluación ética completa
 */
export async function evaluateACEthics(input: EthicalEvaluatorInput): Promise<EthicalEvaluatorOutput> {
    const pkg = await getACPackage();
    // Contraindicaciones (EthicalRule)
    const reglas: EthicalRule[] = pkg.profile.contraindicaciones as EthicalRule[];
    // Criterios de derivación (DereferralCriterion)
    const criterios: DereferralCriterion[] = (pkg.profile.requiere_derivacion_si || []).map((crit: string) => ({
        criterio: crit,
        fuente: 'ac_profile',
    }));
    // Señales de alarma (protocolo_crisis)
    // (Opcional: podrías cargar protocolo_crisis.json para enriquecer input.senales_alarma)
    return evaluateEthics(input, reglas, criterios);
}

// ============================================================================
// Tipos del paquete AC
// ============================================================================

export interface ACPackage {
    profile: TechniqueProfile;
    procedures: ProcedureCatalog;
    loadedAt: string;
}

// ============================================================================
// Cache
// ============================================================================

let cache: ACPackage | null = null;

// ============================================================================
// API pública
// ============================================================================

/**
 * Carga y valida el paquete v3 de Activación Conductual.
 * Resultado cacheado: la segunda llamada devuelve inmediatamente.
 */
export async function getACPackage(): Promise<ACPackage> {
    if (cache) return cache;

    const [profileModule, proceduresModule] = await Promise.all([
        import('./profile/ac.profile.json'),
        import('./procedures/ac.procedures.json'),
    ]);

    const profile = techniqueProfileSchema.parse(profileModule.default) as TechniqueProfile;
    const procedures = procedureCatalogSchema.parse(proceduresModule.default) as ProcedureCatalog;

    if (profile.technique_id !== 'ac') {
        throw new Error(
            `[KB v3 AC] profile.technique_id="${profile.technique_id}" — se esperaba "ac"`,
        );
    }

    if (procedures.technique_id !== 'ac') {
        throw new Error(
            `[KB v3 AC] procedures.technique_id="${procedures.technique_id}" — se esperaba "ac"`,
        );
    }

    for (const proc of procedures.procedures) {
        if (proc.technique_id !== 'ac') {
            throw new Error(
                `[KB v3 AC] procedure "${proc.procedure_id}" tiene technique_id="${proc.technique_id}"`,
            );
        }
    }

    cache = {
        profile,
        procedures,
        loadedAt: new Date().toISOString(),
    };

    return cache;
}

/**
 * Devuelve solo el perfil clínico AC (carga completa si no está cacheado).
 */
export async function getACProfile(): Promise<TechniqueProfile> {
    const pkg = await getACPackage();
    return pkg.profile;
}

/**
 * Devuelve solo el catálogo de procedures AC (carga completa si no está cacheado).
 */
export async function getACProcedures(): Promise<ProcedureCatalog> {
    const pkg = await getACPackage();
    return pkg.procedures;
}

/**
 * Busca un procedure AC por su ID.
 * Devuelve undefined si no existe.
 */
export async function getACProcedureById(
    procedureId: string,
): Promise<ClinicalProcedure | undefined> {
    const pkg = await getACPackage();
    return pkg.procedures.procedures.find((p) => p.procedure_id === procedureId);
}

/**
 * Filtra procedures AC por indicación clínica.
 * Devuelve todos los procedures cuyas `indications` incluyan el término buscado.
 */
export async function getACProceduresByIndication(
    indication: string,
): Promise<ClinicalProcedure[]> {
    const pkg = await getACPackage();
    const term = indication.toLowerCase();
    return pkg.procedures.procedures.filter((p) =>
        p.indications.some((ind) => ind.toLowerCase().includes(term)),
    );
}

/**
 * Invalida el cache (útil para tests o recarga forzada).
 */
export function clearACCache(): void {
    cache = null;
}
