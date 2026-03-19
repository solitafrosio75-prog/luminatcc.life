/**
 * ac.manifest.ts — Manifest de Activación Conductual (v2)
 *
 * 10 áreas compartidas + 3 áreas específicas AC = 13 áreas total.
 * Cada import() genera un chunk Vite separado en producción.
 */

import { KBArea } from '../types/technique.types';
import type { TechniqueManifest } from '../types/technique.types';

export const AC_MANIFEST: TechniqueManifest = {
  id: 'ac',
  nombre: 'Activación Conductual',
  descripcion: 'Tratamiento estructurado para depresión basado en aumento de reforzamiento positivo y reducción de evitación experiencial',
  version: '2.0.0',
  fuentes_principales: [
    'Martell, Dimidjian & Herman-Dunn (2010). Behavioral Activation for Depression: A Clinician\'s Guide',
    'Lejuez, Hopko, Acierno, Daughters & Pagoto (2011). Ten Year Revision of the Brief Behavioral Activation Treatment for Depression',
    'Lewinsohn (1974). A Behavioral Approach to Depression',
    'Barraca & Pérez-Álvarez (2015). Activación Conductual para el tratamiento de la depresión',
    'Jacobson, Martell & Dimidjian (2001). Behavioral Activation Treatment for Depression: Returning to Contextual Roots',
  ],
  areas: {
    // Compartidas
    [KBArea.CONOCIMIENTO]:            () => import('./data/area_01_conocimiento.json'),
    [KBArea.OBJETIVOS_CLINICOS]:      () => import('./data/area_02_objetivos_clinicos.json'),
    [KBArea.HERRAMIENTAS_EVALUACION]: () => import('./data/area_03_herramientas_evaluacion.json'),
    [KBArea.EJERCICIOS_TAREAS]:       () => import('./data/area_04_ejercicios_tareas.json'),
    [KBArea.RECURSOS_MATERIALES]:     () => import('./data/area_05_recursos_materiales.json'),
    [KBArea.TECNICAS_ESPECIFICAS]:    () => import('./data/area_06_tecnicas_especificas.json'),
    [KBArea.ESTRUCTURA_SESIONES]:     () => import('./data/area_07_estructura_sesiones.json'),
    [KBArea.BARRERAS]:                () => import('./data/area_09_barreras.json'),
    [KBArea.HABILIDADES_TERAPEUTA]:   () => import('./data/area_10_habilidades_terapeuta.json'),
    [KBArea.SINTOMAS_PROBLEMAS]:      () => import('./data/area_12_sintomas_problemas.json'),
    // Específicas AC
    [KBArea.AC_AREAS_VITALES]:            () => import('./data/area_11_areas_vitales.json'),
    [KBArea.AC_VALORES_REFORZADORES]:     () => import('./data/area_08_valores_objetivos.json'),
    [KBArea.AC_ACTIVIDADES_POR_PROBLEMA]: () => import('./data/area_13_actividades_por_problema.json'),
  },
};
