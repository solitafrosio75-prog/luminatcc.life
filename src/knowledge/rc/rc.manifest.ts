import { KBArea } from '../types/technique.types';
import type { TechniqueManifest } from '../types/technique.types';

export const RC_MANIFEST: TechniqueManifest = {
  id: 'rc',
  nombre: 'Reestructuracion Cognitiva',
  descripcion: 'Base de conocimiento de Reestructuracion Cognitiva en estructura flexible v2 (10 areas compartidas + 4 areas cognitivas especificas).',
  version: '2.0.0',
  fuentes_principales: [
    'Beck (1979). Cognitive Therapy of Depression',
    'Beck, J. S. (2020). Cognitive Behavior Therapy: Basics and Beyond (3rd ed.)',
    'Ellis (1962). Reason and Emotion in Psychotherapy'
  ],
  areas: {
    // Compartidas
    [KBArea.CONOCIMIENTO]: () => import('./data/conocimiento.json'),
    [KBArea.OBJETIVOS_CLINICOS]: () => import('./data/objetivos_clinicos.json'),
    [KBArea.HERRAMIENTAS_EVALUACION]: () => import('./data/herramientas_evaluacion.json'),
    [KBArea.EJERCICIOS_TAREAS]: () => import('./data/ejercicios_tareas.json'),
    [KBArea.RECURSOS_MATERIALES]: () => import('./data/recursos_materiales.json'),
    [KBArea.TECNICAS_ESPECIFICAS]: () => import('./data/tecnicas_especificas.json'),
    [KBArea.ESTRUCTURA_SESIONES]: () => import('./data/estructura_sesiones.json'),
    [KBArea.BARRERAS]: () => import('./data/barreras.json'),
    [KBArea.HABILIDADES_TERAPEUTA]: () => import('./data/habilidades_terapeuta.json'),
    [KBArea.SINTOMAS_PROBLEMAS]: () => import('./data/sintomas_problemas.json'),
    // Especificas RC
    [KBArea.RC_DISTORSIONES_COGNITIVAS]: () => import('./data/rc_distorsiones_cognitivas.json'),
    [KBArea.RC_REGISTRO_PENSAMIENTOS]: () => import('./data/rc_registro_pensamientos.json'),
    [KBArea.RC_CREENCIAS_NUCLEARES]: () => import('./data/rc_creencias_nucleares.json'),
    [KBArea.RC_EXPERIMENTOS_CONDUCTUALES]: () => import('./data/rc_experimentos_conductuales.json'),
  },
};
