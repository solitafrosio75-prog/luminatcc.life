// ============================================================
// KNOWLEDGE MODULE - REGISTRY CENTRAL
// Punto de entrada para todas las bases de conocimiento
// ============================================================

// ── Activación Conductual (AC) ──
export * from './ac';

// ── Shared / Transversal ──
// export * from './shared';

// ── Futuras técnicas ──
// export * from './rc';   // Reestructuración Cognitiva
// export * from './pu';   // Protocolo Unificado (Barlow)
// export * from './exp';  // Técnicas de Exposición
// export * from './hs';   // Habilidades Sociales
// export * from './mc';   // Mindfulness Clínico

/**
 * Registro de bases de conocimiento disponibles.
 * Cada técnica se registra aquí para que la app pueda
 * descubrir dinámicamente qué módulos están disponibles.
 */
export const KNOWLEDGE_REGISTRY = {
  ac: {
    id: 'ac',
    nombre: 'Activación Conductual',
    version: '2.0.0',
    descripcion: 'Base de conocimiento completa de Activación Conductual (Martell, Lejuez, Barraca)',
    areas: 8,
    disponible: true,
  },
  // rc: {
  //   id: 'rc',
  //   nombre: 'Reestructuración Cognitiva',
  //   version: '0.0.0',
  //   descripcion: 'Pendiente',
  //   areas: 0,
  //   disponible: false,
  // },
} as const;

export type KnowledgeModuleId = keyof typeof KNOWLEDGE_REGISTRY;
