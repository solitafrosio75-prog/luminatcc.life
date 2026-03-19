/**
 * Adaptador de comunicación terapéutica
 *
 * Ajusta el lenguaje, directividad y tono según:
 *   1. Estado emocional del paciente → modifica el registro empático
 *   2. Fase terapéutica → ajusta el nivel de directividad
 *   3. Severidad clínica → adapta el tono y nivel de cautela
 *
 * La severidad se puede derivar automáticamente usando deriveClinicalSeverity()
 * del módulo severity.derivator.ts, que combina inventarios + perfil clínico.
 */

import type { SelectorContext } from './relational.selector';
import type { SeveridadClinica, SeverityDerivation } from './severity.derivator';

// ============================================================================
// Resultado del adaptador
// ============================================================================

export interface AdaptedMessage {
    /** Mensaje adaptado con anotaciones de tono/directividad */
    mensaje: string;
    /** Tono determinado por estado emocional */
    tono: string;
    /** Nivel de directividad por fase terapéutica */
    directividad: string;
    /** Severidad usada para la adaptación */
    severidad: SeveridadClinica;
    /** Si la derivación requiere cautela adicional (alertas críticas) */
    requiereCautela: boolean;
    /** Detalle de trazabilidad de la derivación (si se proporcionó) */
    derivacionDetalle?: string;
}

// ============================================================================
// Mapeos clínicos
// ============================================================================

const TONO_POR_EMOCION: Record<string, string> = {
    desesperanza: 'cauteloso y validante',
    ansiedad: 'calmante y tranquilizador',
    tristeza: 'empático y de acompañamiento',
    ira: 'contenedor y reflexivo',
    vergüenza: 'normalizador y sin juicio',
    motivacion: 'activo y motivacional',
    neutro: 'neutral y receptivo',
};

const DIRECTIVIDAD_POR_FASE: Record<string, string> = {
    inicio: 'acogedor',
    exploracion: 'no-directivo',
    intervencion: 'directivo',
    cierre: 'motivacional',
};

const PREFIJO_POR_SEVERIDAD: Record<SeveridadClinica, string> = {
    leve: '',
    moderada: '[Intervención adaptada] ',
    grave: '[Intervención cautelosa] ',
};

// ============================================================================
// API pública
// ============================================================================

/**
 * Adapta un mensaje terapéutico según contexto clínico y severidad.
 *
 * @param mensaje Mensaje clínico base
 * @param context Contexto de la sesión (fase, emoción, tipo de respuesta)
 * @param severidad Nivel de severidad (string simple o SeverityDerivation completa)
 * @returns AdaptedMessage con el mensaje adaptado y metadatos
 */
export function adaptTherapeuticLanguage(
    mensaje: string,
    context: SelectorContext,
    severidad: SeveridadClinica | SeverityDerivation,
): AdaptedMessage {
    // Resolver severidad: acepta tanto el string simple como la derivación completa
    const isDerivation = typeof severidad === 'object' && 'severidad' in severidad;
    const severidadNivel: SeveridadClinica = isDerivation
        ? (severidad as SeverityDerivation).severidad
        : severidad as SeveridadClinica;
    const derivacion = isDerivation ? severidad as SeverityDerivation : undefined;

    const tono = TONO_POR_EMOCION[context.estadoEmocional] ?? TONO_POR_EMOCION.neutro;
    const directividad = DIRECTIVIDAD_POR_FASE[context.fase] ?? 'empático';
    const prefijo = PREFIJO_POR_SEVERIDAD[severidadNivel];
    const requiereCautela = derivacion?.requiereCautelaAdicional ?? severidadNivel === 'grave';

    // En severidad grave con alertas críticas, reforzar el prefijo
    let prefijoFinal = prefijo;
    if (requiereCautela && derivacion?.alertasCriticas) {
        prefijoFinal = '[⚠ CAUTELA MÁXIMA — alertas críticas activas] ';
    }

    const mensajeAdaptado = `${prefijoFinal}[${tono}, ${directividad}] ${mensaje}`;

    return {
        mensaje: mensajeAdaptado,
        tono,
        directividad,
        severidad: severidadNivel,
        requiereCautela,
        derivacionDetalle: derivacion?.detalle,
    };
}
