/**
 * Glosario clínico DSM-5/TCC
 *
 * Definiciones breves de términos clave para la base de conocimiento, criterios de alerta y scripts de extracción.
 *
 * Referencias:
 * - DSM-5, APA 2013
 * - Guías NICE, APA, metaanálisis TCC
 */

export interface GlossaryTerm {
    /** Término clínico */
    term: string;
    /** Definición breve */
    definition: string;
    /** Categoría (diagnóstico, alerta, exclusión, comorbilidad, técnica) */
    category: 'diagnóstico' | 'alerta' | 'exclusión' | 'comorbilidad' | 'técnica';
    /** Referencia clínica/documental */
    reference?: string;
}

export const glossaryDSM5: GlossaryTerm[] = [
    {
        term: 'Depresión mayor',
        definition: 'Trastorno caracterizado por episodios de ánimo deprimido, anhedonia y síntomas somáticos/psíquicos.',
        category: 'diagnóstico',
        reference: 'DSM-5, APA 2013',
    },
    {
        term: 'Riesgo suicida',
        definition: 'Presencia de ideación, plan o intento suicida. Requiere intervención urgente.',
        category: 'alerta',
        reference: 'DSM-5, APA 2013',
    },
    {
        term: 'Psicosis',
        definition: 'Síntomas como alucinaciones, delirios, desorganización del pensamiento.',
        category: 'exclusión',
        reference: 'DSM-5, APA 2013',
    },
    {
        term: 'Trastorno bipolar',
        definition: 'Alternancia de episodios depresivos y maníacos/mixtos.',
        category: 'diagnóstico',
        reference: 'DSM-5, APA 2013',
    },
    {
        term: 'Manía',
        definition: 'Estado de ánimo elevado, hiperactividad, disminución de necesidad de sueño.',
        category: 'alerta',
        reference: 'DSM-5, APA 2013',
    },
    {
        term: 'Esquizofrenia',
        definition: 'Trastorno psicótico crónico con síntomas positivos y negativos.',
        category: 'diagnóstico',
        reference: 'DSM-5, APA 2013',
    },
    {
        term: 'Trastorno de personalidad',
        definition: 'Patrones desadaptativos persistentes de pensamiento, emoción y conducta.',
        category: 'comorbilidad',
        reference: 'DSM-5, APA 2013',
    },
    {
        term: 'TOC',
        definition: 'Presencia de obsesiones y compulsiones que generan deterioro funcional.',
        category: 'diagnóstico',
        reference: 'DSM-5, APA 2013',
    },
    {
        term: 'Estrés postraumático',
        definition: 'Síntomas de reexperimentación, evitación, hiperactivación tras evento traumático.',
        category: 'diagnóstico',
        reference: 'DSM-5, APA 2013',
    },
    {
        term: 'Exclusión',
        definition: 'Criterio que impide la aplicación de TCC automatizada.',
        category: 'exclusión',
    },
    {
        term: 'Derivación',
        definition: 'Necesidad de enviar al paciente a atención psiquiátrica.',
        category: 'alerta',
    },
    {
        term: 'Urgente',
        definition: 'Situación que requiere intervención inmediata.',
        category: 'alerta',
    },
    {
        term: 'Agresividad',
        definition: 'Conducta violenta o riesgo de daño a otros.',
        category: 'alerta',
    },
    {
        term: 'Disociación',
        definition: 'Alteración de la conciencia, memoria o identidad.',
        category: 'comorbilidad',
    },
    {
        term: 'Sustancias',
        definition: 'Consumo problemático de drogas o alcohol.',
        category: 'comorbilidad',
    },
    {
        term: 'Neurocognitivo',
        definition: 'Deterioro de funciones cognitivas (demencia, etc).',
        category: 'exclusión',
    },
    {
        term: 'Deterioro',
        definition: 'Pérdida significativa de capacidades funcionales.',
        category: 'alerta',
    },
    {
        term: 'Juicio de realidad',
        definition: 'Capacidad de distinguir entre lo real y lo imaginario.',
        category: 'exclusión',
    },
    {
        term: 'Riesgo vital',
        definition: 'Situación que amenaza la vida del paciente.',
        category: 'alerta',
    },
];
