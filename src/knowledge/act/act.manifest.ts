import { KBArea } from '../types/technique.types';
import type { TechniqueManifest } from '../types/technique.types';

/**
 * act.manifest.ts — Registro v2-full para ACT
 *
 * Terapia de Aceptación y Compromiso (Hayes, Strosahl & Wilson).
 * 13 áreas: 10 compartidas + 3 específicas ACT (hexaflex, defusión, valores-acción).
 */
export const ACT_MANIFEST: TechniqueManifest = {
  id: 'act',
  nombre: 'Terapia de Aceptación y Compromiso',
  descripcion: 'Terapia contextual de tercera generación que busca aumentar la flexibilidad psicológica mediante aceptación, defusión, contacto con el presente, yo-como-contexto, clarificación de valores y acción comprometida.',
  version: '2.0.0',
  fuentes_principales: [
    'Hayes, S. C., Strosahl, K. D. & Wilson, K. G. (2012). Acceptance and Commitment Therapy (2nd ed.). Guilford Press.',
    'Harris, R. (2009). ACT Made Simple. New Harbinger Publications.',
    'Luoma, J. B., Hayes, S. C. & Walser, R. D. (2007). Learning ACT. New Harbinger Publications.',
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
    // ── Específicas ACT ──
    [KBArea.ACT_HEXAFLEX]:            () => import('./data/act_hexaflex.json'),
    [KBArea.ACT_DEFUSION_COGNITIVA]:  () => import('./data/act_defusion_cognitiva.json'),
    [KBArea.ACT_VALORES_ACCION]:      () => import('./data/act_valores_accion.json'),
  },
};
