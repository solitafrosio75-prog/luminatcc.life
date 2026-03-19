/**
 * useTemplateStore — Zustand store para gestionar plantillas clinicas
 *
 * Persistencia manual en localStorage (misma key que KnowledgeControlPanel).
 * Las plantillas built-in vienen de kb.types.ts.
 */

import { create } from 'zustand';
import type { FormField, TemplateItem, TemplateKind } from '../../../components/kb/kb.types';
import { BUILT_IN_TEMPLATES } from '../../../components/kb/kb.types';
import { readLocalList, writeLocalList, downloadJsonFile } from '../../../components/kb/kb.utils';

const STORAGE_KEY = 'tcc-lab:knowledge:templates:v1';

interface TemplateState {
  customTemplates: TemplateItem[];
  /** All templates: built-in + custom */
  allTemplates: () => TemplateItem[];

  // Builder state
  builderFields: FormField[];
  builderName: string;
  builderKind: TemplateKind;
  builderDescription: string;
  builderTechniques: string;

  // Actions
  loadFromStorage: () => void;
  addTemplate: (template: Omit<TemplateItem, 'id' | 'isBuiltIn' | 'createdAt'>) => void;
  removeTemplate: (id: string) => void;
  exportAsJSON: (template: TemplateItem) => void;

  // Builder actions
  setBuilderName: (name: string) => void;
  setBuilderKind: (kind: TemplateKind) => void;
  setBuilderDescription: (desc: string) => void;
  setBuilderTechniques: (techs: string) => void;
  addBuilderField: (field: Omit<FormField, 'id'>) => void;
  removeBuilderField: (id: string) => void;
  clearBuilder: () => void;
  buildAndSave: () => void;
}

export const useTemplateStore = create<TemplateState>()((set, get) => ({
  customTemplates: [],
  builderFields: [],
  builderName: '',
  builderKind: 'formulario',
  builderDescription: '',
  builderTechniques: '',

  allTemplates: () => [...BUILT_IN_TEMPLATES, ...get().customTemplates],

  loadFromStorage: () => {
    const custom = readLocalList<TemplateItem>(STORAGE_KEY, []);
    set({ customTemplates: custom });
  },

  addTemplate: (template) => {
    const item: TemplateItem = {
      ...template,
      id: `custom-${Date.now()}`,
      isBuiltIn: false,
      createdAt: new Date().toISOString(),
    };
    const updated = [...get().customTemplates, item];
    writeLocalList(STORAGE_KEY, updated);
    set({ customTemplates: updated });
  },

  removeTemplate: (id) => {
    const updated = get().customTemplates.filter((t) => t.id !== id);
    writeLocalList(STORAGE_KEY, updated);
    set({ customTemplates: updated });
  },

  exportAsJSON: (template) => {
    downloadJsonFile(`${template.id}.json`, template);
  },

  setBuilderName: (builderName) => set({ builderName }),
  setBuilderKind: (builderKind) => set({ builderKind }),
  setBuilderDescription: (builderDescription) => set({ builderDescription }),
  setBuilderTechniques: (builderTechniques) => set({ builderTechniques }),

  addBuilderField: (field) => {
    const newField: FormField = { ...field, id: `f-${Date.now()}` };
    set({ builderFields: [...get().builderFields, newField] });
  },

  removeBuilderField: (id) => {
    set({ builderFields: get().builderFields.filter((f) => f.id !== id) });
  },

  clearBuilder: () => {
    set({
      builderFields: [],
      builderName: '',
      builderKind: 'formulario',
      builderDescription: '',
      builderTechniques: '',
    });
  },

  buildAndSave: () => {
    const state = get();
    if (!state.builderName.trim() || state.builderFields.length === 0) return;

    const techniqueIds = state.builderTechniques
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    state.addTemplate({
      name: state.builderName,
      kind: state.builderKind,
      description: state.builderDescription,
      techniqueIds,
      fields: [...state.builderFields],
    });

    state.clearBuilder();
  },
}));
