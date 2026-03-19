/**
 * severity.derivator.ts — Derivador de severidad clínica
 *
 * Determina el nivel de severidad combinando dos fuentes:
 *   1. Inventarios (BDI-II, PHQ-9) → puntuación y severity_label
 *   2. Perfil clínico (ClinicalProfile de Dexie) → duración, frecuencia, impacto funcional
 *
 * Regla de prioridad:
 *   - Si hay inventarios recientes (< 14 días), son la fuente primaria.
 *   - El perfil clínico modula: puede SUBIR la severidad si el impacto funcional
 *     reportado es peor que lo que indica el inventario, pero NUNCA la baja.
 *   - Si no hay inventarios, se estima desde el perfil clínico solamente.
 *
 * Referencia clínica:
 *   BDI-II: Sanz, J. (2003). Niveles de severidad en muestra clínica española.
 *   PHQ-9: Kroenke et al. (2001). Umbrales de screening.
 */

// ============================================================================
// Tipos
// ============================================================================

/** Nivel de severidad unificado para el adaptador de comunicación */
export type SeveridadClinica = 'leve' | 'moderada' | 'grave';

/** Datos de inventario simplificados (lo que el derivador necesita) */
export interface InventorySnapshot {
    inventoryId: 'bdi_ii' | 'phq_9';
    totalScore: number;
    severityLabel: string;
    administeredAt: number; // timestamp
    criticalAlerts?: Array<{
        domain: string;
        alertLevel: 'warning' | 'urgent' | 'emergency';
    }>;
}

/** Datos del perfil clínico simplificados */
export interface ProfileSnapshot {
    problemFrequency: 'daily' | 'several_weekly' | 'weekly' | 'occasional';
    problemDuration: 'weeks' | 'months' | 'one_to_two_years' | 'years' | 'lifelong';
    baselineFunctionalImpairment?: 'minimal' | 'mild' | 'moderate' | 'severe' | 'very_severe';
    areasAffected: string[];
    currentPhase: string;
}

/** Resultado del derivador con trazabilidad */
export interface SeverityDerivation {
    severidad: SeveridadClinica;
    confianza: 'alta' | 'media' | 'baja';
    fuentes: string[];
    detalle: string;
    alertasCriticas: boolean;
    requiereCautelaAdicional: boolean;
}

// ============================================================================
// Constantes clínicas
// ============================================================================

/** Mapeo de severity_label a SeveridadClinica */
const BDI_II_SEVERITY_MAP: Record<string, SeveridadClinica> = {
    'Depresión mínima': 'leve',
    'Depresión leve': 'leve',
    'Depresión moderada': 'moderada',
    'Depresión grave': 'grave',
};

const PHQ_9_SEVERITY_MAP: Record<string, SeveridadClinica> = {
    'Depresión mínima': 'leve',
    'Depresión leve': 'leve',
    'Depresión moderada': 'moderada',
    'Depresión moderadamente grave': 'grave',
    'Depresión grave': 'grave',
};

/** Mapeo de impairment a severidad base */
const IMPAIRMENT_SEVERITY_MAP: Record<string, SeveridadClinica> = {
    'minimal': 'leve',
    'mild': 'leve',
    'moderate': 'moderada',
    'severe': 'grave',
    'very_severe': 'grave',
};

/** Ventana de vigencia de inventarios (14 días en ms) */
const INVENTORY_VALIDITY_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

/** Orden para comparaciones (mayor = más grave) */
const SEVERITY_ORDER: Record<SeveridadClinica, number> = {
    leve: 0,
    moderada: 1,
    grave: 2,
};

// ============================================================================
// Funciones internas
// ============================================================================

function maxSeverity(a: SeveridadClinica, b: SeveridadClinica): SeveridadClinica {
    return SEVERITY_ORDER[a] >= SEVERITY_ORDER[b] ? a : b;
}

function isInventoryRecent(snapshot: InventorySnapshot, now: number): boolean {
    return (now - snapshot.administeredAt) <= INVENTORY_VALIDITY_WINDOW_MS;
}

function hasCriticalAlerts(snapshot: InventorySnapshot): boolean {
    return (snapshot.criticalAlerts ?? []).some(
        a => a.alertLevel === 'urgent' || a.alertLevel === 'emergency'
    );
}

/**
 * Deriva severidad desde un inventario individual.
 */
function deriveSeverityFromInventory(snapshot: InventorySnapshot): SeveridadClinica {
    const map = snapshot.inventoryId === 'bdi_ii' ? BDI_II_SEVERITY_MAP : PHQ_9_SEVERITY_MAP;
    const mapped = map[snapshot.severityLabel];
    if (mapped) return mapped;

    // Fallback por puntuación directa si el label no coincide
    if (snapshot.inventoryId === 'bdi_ii') {
        if (snapshot.totalScore <= 19) return 'leve';
        if (snapshot.totalScore <= 28) return 'moderada';
        return 'grave';
    }
    // PHQ-9
    if (snapshot.totalScore <= 9) return 'leve';
    if (snapshot.totalScore <= 14) return 'moderada';
    return 'grave';
}

/**
 * Deriva severidad desde el perfil clínico.
 */
function deriveSeverityFromProfile(profile: ProfileSnapshot): SeveridadClinica {
    // Fuente 1: Impairment funcional reportado
    let severidadBase: SeveridadClinica = 'moderada'; // default conservador
    if (profile.baselineFunctionalImpairment) {
        severidadBase = IMPAIRMENT_SEVERITY_MAP[profile.baselineFunctionalImpairment] ?? 'moderada';
    }

    // Fuente 2: Cronicidad (duración del problema)
    if (profile.problemDuration === 'years' || profile.problemDuration === 'lifelong') {
        severidadBase = maxSeverity(severidadBase, 'moderada');
    }

    // Fuente 3: Frecuencia del síntoma principal
    if (profile.problemFrequency === 'daily') {
        severidadBase = maxSeverity(severidadBase, 'moderada');
    }

    // Fuente 4: Número de áreas afectadas (≥4 sugiere mayor severidad)
    if (profile.areasAffected.length >= 4) {
        severidadBase = maxSeverity(severidadBase, 'moderada');
    }
    if (profile.areasAffected.length >= 6) {
        severidadBase = maxSeverity(severidadBase, 'grave');
    }

    return severidadBase;
}

// ============================================================================
// API pública
// ============================================================================

/**
 * Deriva la severidad clínica combinando inventarios y perfil clínico.
 *
 * Regla clave: el perfil puede SUBIR la severidad, nunca bajarla respecto
 * a los inventarios. Esto protege contra infraestimación cuando el paciente
 * reporta impacto funcional que el inventario no captura completamente.
 *
 * @param inventories Snapshots de inventarios disponibles (puede ser vacío)
 * @param profile Snapshot del perfil clínico (puede ser undefined)
 * @returns SeverityDerivation con severidad, confianza y trazabilidad
 */
export function deriveClinicalSeverity(
    inventories: InventorySnapshot[],
    profile?: ProfileSnapshot,
): SeverityDerivation {
    const now = Date.now();
    const fuentes: string[] = [];
    let alertasCriticas = false;
    let requiereCautelaAdicional = false;

    // ── Paso 1: Inventarios recientes ──
    const recentInventories = inventories.filter(inv => isInventoryRecent(inv, now));
    let severidadInventarios: SeveridadClinica | null = null;

    if (recentInventories.length > 0) {
        for (const inv of recentInventories) {
            const sev = deriveSeverityFromInventory(inv);
            severidadInventarios = severidadInventarios
                ? maxSeverity(severidadInventarios, sev)
                : sev;
            fuentes.push(`${inv.inventoryId.toUpperCase()} (${inv.severityLabel}, total=${inv.totalScore})`);

            if (hasCriticalAlerts(inv)) {
                alertasCriticas = true;
                requiereCautelaAdicional = true;
                fuentes.push(`${inv.inventoryId.toUpperCase()}: alertas críticas activas`);
            }
        }
    }

    // ── Paso 2: Perfil clínico ──
    let severidadPerfil: SeveridadClinica | null = null;
    if (profile) {
        severidadPerfil = deriveSeverityFromProfile(profile);
        fuentes.push(`Perfil clínico (impairment=${profile.baselineFunctionalImpairment ?? 'no disponible'}, duración=${profile.problemDuration}, frecuencia=${profile.problemFrequency})`);
    }

    // ── Paso 3: Combinación ──
    let severidadFinal: SeveridadClinica;
    let confianza: SeverityDerivation['confianza'];
    let detalle: string;

    if (severidadInventarios && severidadPerfil) {
        // Ambas fuentes: inventario es primario, perfil solo sube
        severidadFinal = maxSeverity(severidadInventarios, severidadPerfil);
        confianza = 'alta';
        detalle = severidadFinal === severidadInventarios
            ? `Concordancia entre inventarios (${severidadInventarios}) y perfil clínico.`
            : `Perfil clínico eleva la severidad de ${severidadInventarios} a ${severidadPerfil} por impacto funcional reportado.`;
    } else if (severidadInventarios) {
        // Solo inventarios
        severidadFinal = severidadInventarios;
        confianza = 'alta';
        detalle = 'Severidad basada en inventarios estandarizados. Sin perfil clínico para corroborar.';
    } else if (severidadPerfil) {
        // Solo perfil
        severidadFinal = severidadPerfil;
        confianza = 'media';
        detalle = 'Severidad estimada desde perfil clínico. Se recomienda administrar inventario estandarizado.';
    } else {
        // Ninguna fuente
        severidadFinal = 'moderada';
        confianza = 'baja';
        detalle = 'Sin datos de inventario ni perfil clínico. Se asigna severidad moderada como precaución clínica.';
    }

    // ── Paso 4: Override de seguridad ──
    // Alertas críticas fuerzan severidad grave
    if (alertasCriticas && severidadFinal !== 'grave') {
        severidadFinal = 'grave';
        detalle += ' OVERRIDE: alertas críticas activas fuerzan severidad grave.';
    }

    return {
        severidad: severidadFinal,
        confianza,
        fuentes,
        detalle,
        alertasCriticas,
        requiereCautelaAdicional,
    };
}

/**
 * Helper para construir un InventorySnapshot desde los datos del BDI-II engine.
 */
export function snapshotFromBDIII(
    totalScore: number,
    severityLabel: string,
    administeredAt: number,
    item9Value?: number,
): InventorySnapshot {
    const criticalAlerts: InventorySnapshot['criticalAlerts'] = [];
    if (item9Value != null && item9Value >= 1) {
        criticalAlerts.push({
            domain: 'suicidio',
            alertLevel: item9Value >= 3 ? 'emergency' : item9Value >= 2 ? 'urgent' : 'warning',
        });
    }
    return {
        inventoryId: 'bdi_ii',
        totalScore,
        severityLabel,
        administeredAt,
        criticalAlerts,
    };
}

/**
 * Helper para construir un InventorySnapshot desde los datos del PHQ-9 engine.
 */
export function snapshotFromPHQ9(
    totalScore: number,
    severityLabel: string,
    administeredAt: number,
    item9Value?: number,
): InventorySnapshot {
    const criticalAlerts: InventorySnapshot['criticalAlerts'] = [];
    if (item9Value != null && item9Value >= 1) {
        criticalAlerts.push({
            domain: 'suicidio',
            alertLevel: item9Value >= 3 ? 'emergency' : item9Value >= 2 ? 'urgent' : 'warning',
        });
    }
    return {
        inventoryId: 'phq_9',
        totalScore,
        severityLabel,
        administeredAt,
        criticalAlerts,
    };
}

/**
 * Helper para construir un ProfileSnapshot desde ClinicalProfile + PatientRecord de Dexie.
 * Los campos de intake (areasAffected) viven en PatientRecord.
 * Los campos de protocolo (baselineFunctionalImpairment, currentPhase) viven en ClinicalProfile.
 */
export function snapshotFromClinicalProfile(profile: {
    baselineFunctionalImpairment?: string;
    currentPhase: string;
}, patientRecord?: {
    affectedAreas?: string[];
    problemFrequency?: string;
    problemDuration?: string;
}): ProfileSnapshot {
    return {
        problemFrequency: (patientRecord?.problemFrequency ?? 'occasional') as ProfileSnapshot['problemFrequency'],
        problemDuration: (patientRecord?.problemDuration ?? 'months') as ProfileSnapshot['problemDuration'],
        baselineFunctionalImpairment: profile.baselineFunctionalImpairment as ProfileSnapshot['baselineFunctionalImpairment'],
        areasAffected: patientRecord?.affectedAreas ?? [],
        currentPhase: profile.currentPhase,
    };
}
