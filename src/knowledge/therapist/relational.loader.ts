/**
 * relational.loader.ts — Carga y unificación de habilidades relacionales
 *
 * Consume:
 * - habilidades_entrevista.json (SharedArea) via shared.manifest
 * - area_10_habilidades_terapeuta.json (AC v2) via ac.manifest
 *
 * Expone un catálogo unificado de RelationalSkill[] que el submódulo
 * relacional usa para seleccionar la habilidad apropiada en contexto.
 */

import type { HabilidadEntrevista, HabilidadesEntrevistaData } from '../types/shared.types';
import type {
    RelationalSkill,
    HabilidadTerapeutaAC,
    HabilidadesTerapeutaACData,
    CategoriaEntrevista,
} from './relational.types';
import { CATEGORIA_ESTILO_MAP } from './relational.types';
import { SharedArea } from '../types/technique.types';
import { useKnowledgeStore } from '../loaders/knowledge.store';

// ============================================================================
// Helpers
// ============================================================================

function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')  // quitar acentos
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

function fromEntrevista(h: HabilidadEntrevista): RelationalSkill {
    return {
        id: slugify(h.nombre),
        nombre: h.nombre,
        descripcion: h.descripcion,
        fuente: 'entrevista',
        categoria: h.categoria,
        ejemplo: h.ejemplo,
        cuando_usar: h.cuando_usar,
    };
}

function fromTerapeutaAC(h: HabilidadTerapeutaAC): RelationalSkill {
    return {
        id: slugify(h.nombre),
        nombre: h.nombre,
        descripcion: h.descripcion,
        fuente: 'terapeuta_ac',
        importancia: h.importancia,
        cuando_usar: h.como_desarrollar,
    };
}

// ============================================================================
// Cache
// ============================================================================

let _cache: RelationalSkill[] | null = null;

// ============================================================================
// Loader principal
// ============================================================================

/**
 * Carga ambas fuentes y devuelve el catálogo unificado de habilidades.
 * Cachea en memoria tras la primera carga.
 */
export async function loadRelationalSkills(): Promise<RelationalSkill[]> {
    if (_cache) return _cache;

    const store = useKnowledgeStore.getState();

    // Cargar SharedArea habilidades_entrevista
    await store.loadShared(SharedArea.HABILIDADES_ENTREVISTA);
    const sharedSlot = store.getSharedSlot(SharedArea.HABILIDADES_ENTREVISTA);

    // Cargar AC v2 area_10 (habilidades_terapeuta)
    await store.loadArea('ac', 'habilidades_terapeuta' as any);
    const acSlot = store.getSlot('ac', 'habilidades_terapeuta' as any);

    const skills: RelationalSkill[] = [];

    // Habilidades de entrevista (SharedArea)
    if (sharedSlot.status === 'loaded' && sharedSlot.data) {
        const data = sharedSlot.data as HabilidadesEntrevistaData;
        for (const h of data.habilidades) {
            skills.push(fromEntrevista(h));
        }
    }

    // Habilidades del terapeuta AC (AC v2)
    if (acSlot.status === 'loaded' && acSlot.data) {
        const data = acSlot.data as HabilidadesTerapeutaACData;
        for (const h of data.habilidades) {
            skills.push(fromTerapeutaAC(h));
        }
    }

    _cache = skills;
    return skills;
}

/**
 * Invalida la cache para forzar recarga en la próxima llamada.
 */
export function invalidateRelationalCache(): void {
    _cache = null;
}

// ============================================================================
// Consultas sobre el catálogo
// ============================================================================

/**
 * Filtra habilidades por categoría de entrevista.
 */
export async function getSkillsByCategoria(
    categoria: CategoriaEntrevista
): Promise<RelationalSkill[]> {
    const skills = await loadRelationalSkills();
    return skills.filter(s => s.categoria === categoria);
}

/**
 * Filtra habilidades por fuente de origen.
 */
export async function getSkillsByFuente(
    fuente: 'entrevista' | 'terapeuta_ac'
): Promise<RelationalSkill[]> {
    const skills = await loadRelationalSkills();
    return skills.filter(s => s.fuente === fuente);
}

/**
 * Busca una habilidad por su ID slugificado.
 */
export async function getSkillById(
    id: string
): Promise<RelationalSkill | undefined> {
    const skills = await loadRelationalSkills();
    return skills.find(s => s.id === id);
}

/**
 * Devuelve el estilo de comunicación por defecto para una categoría de entrevista.
 */
export function getDefaultStyleForCategoria(
    categoria: CategoriaEntrevista
) {
    return CATEGORIA_ESTILO_MAP[categoria];
}
