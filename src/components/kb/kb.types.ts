/**
 * kb.types.ts — Tipos compartidos para UI de la base de conocimiento
 *
 * Extraido de KnowledgeControlPanel.tsx + nuevos tipos para DevTools.
 * Ambas vistas (/dev y /therapist/knowledge) importan de aqui.
 */

import type { KBArea, SlotStatus, TechniqueId } from '../../knowledge/types/technique.types';

// ============================================================================
// Tipos de formularios y plantillas (extraidos del panel)
// ============================================================================

export type TemplateKind = 'inventario' | 'cuestionario' | 'registro' | 'formulario';
export type FormFieldType = 'text' | 'textarea' | 'number' | 'likert_1_5' | 'checkbox' | 'date';

export interface FormField {
  id: string;
  label: string;
  type: FormFieldType;
  required: boolean;
}

export interface TemplateItem {
  id: string;
  name: string;
  kind: TemplateKind;
  techniqueIds: string[];
  description: string;
  fields: FormField[];
  isBuiltIn: boolean;
  createdAt: string;
}

// ============================================================================
// Plantillas built-in (extraidas del panel)
// ============================================================================

export const BUILT_IN_TEMPLATES: TemplateItem[] = [
  {
    id: 'bdi-ii',
    name: 'Inventario de Depresion BDI-II',
    kind: 'inventario',
    techniqueIds: ['ac', 'rc', 'act'],
    description: 'Auto-reporte para severidad de sintomas depresivos.',
    fields: [
      { id: 'fecha', label: 'Fecha de aplicacion', type: 'date', required: true },
      { id: 'total', label: 'Puntaje total BDI-II', type: 'number', required: true },
      { id: 'observaciones', label: 'Observaciones clinicas', type: 'textarea', required: false },
    ],
    isBuiltIn: true,
    createdAt: '2026-03-07T00:00:00.000Z',
  },
  {
    id: 'bai',
    name: 'Inventario de Ansiedad BAI',
    kind: 'inventario',
    techniqueIds: ['exposicion', 'mindfulness', 'trec'],
    description: 'Escala breve para sintomas de ansiedad.',
    fields: [
      { id: 'fecha', label: 'Fecha de aplicacion', type: 'date', required: true },
      { id: 'total', label: 'Puntaje total BAI', type: 'number', required: true },
      { id: 'riesgo', label: 'Riesgo percibido por el paciente', type: 'likert_1_5', required: false },
    ],
    isBuiltIn: true,
    createdAt: '2026-03-07T00:00:00.000Z',
  },
  {
    id: 'registro-pensamientos',
    name: 'Registro de Pensamientos',
    kind: 'registro',
    techniqueIds: ['rc', 'trec'],
    description: 'Plantilla para situacion, pensamiento automatico y alternativa.',
    fields: [
      { id: 'situacion', label: 'Situacion', type: 'textarea', required: true },
      { id: 'pensamiento', label: 'Pensamiento automatico', type: 'textarea', required: true },
      { id: 'emocion', label: 'Intensidad emocional (1-5)', type: 'likert_1_5', required: true },
      { id: 'alternativa', label: 'Pensamiento alternativo', type: 'textarea', required: true },
    ],
    isBuiltIn: true,
    createdAt: '2026-03-07T00:00:00.000Z',
  },
  {
    id: 'phq-9',
    name: 'Cuestionario PHQ-9',
    kind: 'cuestionario',
    techniqueIds: ['ac', 'rc', 'act', 'mindfulness'],
    description: 'Screening rapido de depresion (9 items).',
    fields: [
      { id: 'fecha', label: 'Fecha', type: 'date', required: true },
      { id: 'total', label: 'Puntaje total PHQ-9 (0-27)', type: 'number', required: true },
      { id: 'item9', label: 'Item 9 - Ideacion suicida (0-3)', type: 'number', required: true },
      { id: 'notas', label: 'Notas clinicas', type: 'textarea', required: false },
    ],
    isBuiltIn: true,
    createdAt: '2026-03-07T00:00:00.000Z',
  },
  {
    id: 'registro-actividades',
    name: 'Registro de Actividades AC',
    kind: 'registro',
    techniqueIds: ['ac'],
    description: 'Registro diario de actividades con puntuacion placer/dominio.',
    fields: [
      { id: 'fecha', label: 'Fecha', type: 'date', required: true },
      { id: 'actividad', label: 'Actividad realizada', type: 'text', required: true },
      { id: 'placer', label: 'Placer (0-10)', type: 'number', required: true },
      { id: 'dominio', label: 'Dominio (0-10)', type: 'number', required: true },
      { id: 'area_vital', label: 'Area vital', type: 'text', required: false },
    ],
    isBuiltIn: true,
    createdAt: '2026-03-07T00:00:00.000Z',
  },
  {
    id: 'registro-abcde',
    name: 'Registro ABCDE (TREC)',
    kind: 'registro',
    techniqueIds: ['trec'],
    description: 'Registro del modelo ABCDE para disputacion racional emotiva.',
    fields: [
      { id: 'fecha', label: 'Fecha', type: 'date', required: true },
      { id: 'a_evento', label: 'A - Evento activador', type: 'textarea', required: true },
      { id: 'b_creencia', label: 'B - Creencia irracional', type: 'textarea', required: true },
      { id: 'c_emocional', label: 'C - Consecuencia emocional', type: 'textarea', required: true },
      { id: 'c_intensidad', label: 'C - Intensidad (0-10)', type: 'number', required: true },
      { id: 'd_disputacion', label: 'D - Disputacion', type: 'textarea', required: false },
      { id: 'e_efecto', label: 'E - Nuevo efecto', type: 'textarea', required: false },
      { id: 'e_intensidad', label: 'E - Intensidad nueva (0-10)', type: 'number', required: false },
    ],
    isBuiltIn: true,
    createdAt: '2026-03-07T00:00:00.000Z',
  },
  {
    id: 'registro-exposicion',
    name: 'Registro de Exposicion',
    kind: 'registro',
    techniqueIds: ['exposicion', 'ds'],
    description: 'Registro de sesion de exposicion con SUDs pre/post.',
    fields: [
      { id: 'fecha', label: 'Fecha', type: 'date', required: true },
      { id: 'situacion', label: 'Situacion de exposicion', type: 'textarea', required: true },
      { id: 'suds_pre', label: 'SUDs pre-exposicion (0-100)', type: 'number', required: true },
      { id: 'suds_post', label: 'SUDs post-exposicion (0-100)', type: 'number', required: true },
      { id: 'duracion', label: 'Duracion (minutos)', type: 'number', required: true },
      { id: 'observaciones', label: 'Observaciones', type: 'textarea', required: false },
    ],
    isBuiltIn: true,
    createdAt: '2026-03-07T00:00:00.000Z',
  },
  {
    id: 'diario-mindfulness',
    name: 'Diario de Practica Mindfulness',
    kind: 'registro',
    techniqueIds: ['mindfulness', 'act'],
    description: 'Registro diario de practica de atencion plena.',
    fields: [
      { id: 'fecha', label: 'Fecha', type: 'date', required: true },
      { id: 'tipo_practica', label: 'Tipo de practica', type: 'text', required: true },
      { id: 'duracion', label: 'Duracion (minutos)', type: 'number', required: true },
      { id: 'experiencia', label: 'Que notaste durante la practica', type: 'textarea', required: true },
      { id: 'dificultades', label: 'Dificultades', type: 'textarea', required: false },
    ],
    isBuiltIn: true,
    createdAt: '2026-03-07T00:00:00.000Z',
  },
];

// ============================================================================
// Tipos para DevTools
// ============================================================================

export interface SearchResult {
  techniqueId: TechniqueId;
  area: KBArea;
  matchField: string;
  snippet: string;
}

export interface CoverageCell {
  techniqueId: TechniqueId;
  area: KBArea;
  available: boolean;
  status: SlotStatus;
  label: string;
}

export interface CoverageStats {
  total: number;
  available: number;
  loaded: number;
  errors: number;
  idle: number;
}
