/**
 * Área DSM-5 — Criterios diagnósticos relevantes para TCC
 *
 * Este archivo define los tipos base y estructura para integrar criterios DSM-5 en el sistema.
 * Permite detectar casos que requieren intervención psiquiátrica o derivación.
 *
 * Referencias:
 * - American Psychiatric Association. (2013). DSM-5. Manual diagnóstico y estadístico de los trastornos mentales.
 * - Guías NICE, APA, y metaanálisis recientes sobre TCC y comorbilidad.
 */

export type DSM5Disorder =
    | 'Depresión Mayor'
    | 'Trastorno Bipolar'
    | 'Esquizofrenia'
    | 'Riesgo Suicida'
    | 'Trastorno de Ansiedad'
    | 'Trastorno Obsesivo-Compulsivo'
    | 'Trastorno de Estrés Postraumático'
    | 'Trastorno de Personalidad'
    | 'Otro';

export interface DSM5Criterion {
    /** Nombre del criterio DSM-5 */
    name: DSM5Disorder;
    /** Descripción breve del criterio clínico */
    description: string;
    /** Código DSM-5 (ej: F32.1) */
    code?: string;
    /** Referencia clínica/documental */
    reference?: string;
}

export interface DSM5Alert {
    /** Criterio detectado */
    criterion: DSM5Criterion;
    /** Nivel de gravedad (ej: leve, moderado, grave, riesgo vital) */
    severity: 'leve' | 'moderado' | 'grave' | 'riesgo vital';
    /** Requiere derivación psiquiátrica inmediata */
    requiresPsychReferral: boolean;
    /** Observaciones clínicas */
    notes?: string;
}

// Ejemplo de uso
// const depresionMayor: DSM5Criterion = {
//   name: 'Depresión Mayor',
//   description: 'Episodio depresivo mayor según criterios DSM-5',
//   code: 'F32.1',
//   reference: 'DSM-5, APA 2013',
// };

// const alertaSuicida: DSM5Alert = {
//   criterion: depresionMayor,
//   severity: 'grave',
//   requiresPsychReferral: true,
//   notes: 'Paciente con ideación suicida activa',
// };
