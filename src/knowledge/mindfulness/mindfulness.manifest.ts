import { KBArea } from '../types/technique.types';
import type { TechniqueManifest } from '../types/technique.types';

/**
 * mindfulness.manifest.ts — Registro v2-full para Mindfulness Terapéutico
 *
 * MBSR (Kabat-Zinn), MBCT (Segal, Williams & Teasdale).
 * 13 áreas: 10 compartidas + 3 específicas Mindfulness (prácticas formales, informales, aplicaciones clínicas).
 */
export const MINDFULNESS_MANIFEST: TechniqueManifest = {
  id: 'mindfulness',
  nombre: 'Mindfulness Terapéutico',
  descripcion: 'Intervención basada en atención plena para aumentar conciencia del momento presente, reducir reactividad automática y mejorar regulación emocional y cognitiva. Incluye protocolos estructurados como MBSR y MBCT.',
  version: '2.0.0',
  fuentes_principales: [
    'Kabat-Zinn, J. (1990). Full Catastrophe Living. Delacorte Press.',
    'Segal, Z. V., Williams, J. M. G. & Teasdale, J. D. (2013). Mindfulness-Based Cognitive Therapy for Depression (2nd ed.). Guilford Press.',
    'Germer, C. K. (2009). The Mindful Path to Self-Compassion. Guilford Press.',
  ],
  areas: {
    // ── Compartidas ──
    [KBArea.CONOCIMIENTO]:            () => import('./data/conocimiento.json'),
    [KBArea.OBJETIVOS_CLINICOS]:      () => import('./data/objetivos_clinicos.json'),
    [KBArea.HERRAMIENTAS_EVALUACION]: () => import('./data/herramientas_evaluacion.json'),
    [KBArea.EJERCICIOS_TAREAS]:       () => import('./data/ejercicios_tareas.json'),
    [KBArea.RECURSOS_MATERIALES]:     () => import('./data/recursos_materiales.json'),
    [KBArea.TECNICAS_ESPECIFICAS]:    () => import('./data/tecnicas_especificas.json'),
    [KBArea.ESTRUCTURA_SESIONES]:     () => import('./data/estructura_sesiones.json'),
    [KBArea.BARRERAS]:                () => import('./data/barreras.json'),
    [KBArea.HABILIDADES_TERAPEUTA]:   () => import('./data/habilidades_terapeuta.json'),
    [KBArea.SINTOMAS_PROBLEMAS]:      () => import('./data/sintomas_problemas.json'),
    // ── Específicas Mindfulness ──
    [KBArea.MINDFULNESS_PRACTICAS_FORMALES]:    () => import('./data/mindfulness_practicas_formales.json'),
    [KBArea.MINDFULNESS_PRACTICAS_INFORMALES]:  () => import('./data/mindfulness_practicas_informales.json'),
    [KBArea.MINDFULNESS_APLICACIONES_CLINICAS]: () => import('./data/mindfulness_aplicaciones_clinicas.json'),
  },
};
