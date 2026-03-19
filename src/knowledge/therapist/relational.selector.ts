/**
 * relational.selector.ts — Selector de habilidad terapéutica
 *
 * Selecciona la habilidad relacional más apropiada según el contexto clínico:
 * - fase terapéutica
 * - estado emocional
 * - tipo de respuesta del paciente
 *
 * Regla: siempre validar antes de intervenir (prioridad a habilidades de validación)
 *
 * Usa el campo `cuando_usar` de habilidades_entrevista.json para filtrar y priorizar.
 */

import type { RelationalSkill, CommunicationStyle, ValidationLevel, CategoriaEntrevista, TherapeuticResponse } from './relational.types';
import { loadRelationalSkills, getSkillsByCategoria, getDefaultStyleForCategoria } from './relational.loader';

export interface SelectorContext {
    fase: 'inicio' | 'exploracion' | 'intervencion' | 'cierre';
    estadoEmocional: 'neutro' | 'ansiedad' | 'tristeza' | 'ira' | 'vergüenza' | 'desesperanza' | 'motivacion';
    tipoRespuesta: 'narrativa' | 'emocional' | 'evitativa' | 'ambivalente' | 'directa';
}

/**
 * Selecciona la habilidad relacional más apropiada según el contexto.
 * Prioriza validación emocional antes de cualquier intervención.
 */
export async function selectRelationalSkill(
    context: SelectorContext,
    severidad?: 'leve' | 'moderada' | 'grave',
    alertasCriticas?: boolean
): Promise<RelationalSkill | null> {
    const skills = await loadRelationalSkills();

    // 0. Si severidad grave o alertas críticas, priorizar habilidades de contención/intervención urgente
    if (severidad === 'grave' || alertasCriticas) {
        const contencion = skills.find(s =>
            s.categoria === 'confrontacion' ||
            (s.cuando_usar && s.cuando_usar.toLowerCase().includes('crisis')) ||
            (s.cuando_usar && s.cuando_usar.toLowerCase().includes('grave'))
        );
        if (contencion) return contencion;
    }

    // 1. Prioridad: validación emocional
    const validacion = skills.find(s => s.nombre.toLowerCase().includes('validación') || s.categoria === 'rapport');
    if (validacion) return validacion;

    // 2. Filtrar por fase terapéutica
    let faseFiltro = skills.filter(s => s.cuando_usar && s.cuando_usar.toLowerCase().includes(context.fase));

    // 3. Filtrar por estado emocional
    let emocionFiltro = faseFiltro.filter(s => s.cuando_usar && s.cuando_usar.toLowerCase().includes(context.estadoEmocional));

    // 4. Filtrar por tipo de respuesta
    let tipoFiltro = emocionFiltro.filter(s => s.cuando_usar && s.cuando_usar.toLowerCase().includes(context.tipoRespuesta));

    // 5. Si severidad leve, priorizar habilidades motivacionales/psicoeducativas/exploratorias
    if (severidad === 'leve') {
        const motivacional = skills.find(s =>
            s.categoria === 'motivacional' ||
            s.categoria === 'exploratorio' ||
            (s.cuando_usar && s.cuando_usar.toLowerCase().includes('leve'))
        );
        if (motivacional) return motivacional;
    }

    // 6. Si hay coincidencias, devolver la primera
    if (tipoFiltro.length > 0) return tipoFiltro[0];
    if (emocionFiltro.length > 0) return emocionFiltro[0];
    if (faseFiltro.length > 0) return faseFiltro[0];

    // 7. Si no hay coincidencias, devolver una habilidad empática o exploratoria
    const empatica = skills.find(s => s.categoria === 'escucha' || s.categoria === 'exploratorio');
    if (empatica) return empatica;

    // 8. Si no hay nada, devolver null
    return null;
}

/**
 * Genera una respuesta terapéutica usando la habilidad seleccionada.
 */
export async function generateTherapeuticResponse(
    context: SelectorContext,
    mensaje: string,
    severidad?: 'leve' | 'moderada' | 'grave',
    alertasCriticas?: boolean
): Promise<TherapeuticResponse | null> {
    const skill = await selectRelationalSkill(context, severidad, alertasCriticas);
    if (!skill) return null;

    // Determinar estilo por categoría
    const estilo: CommunicationStyle = skill.categoria ? getDefaultStyleForCategoria(skill.categoria) : 'empático';

    // Determinar nivel de validación
    let validacion: ValidationLevel = 'mínima';
    if (skill.nombre.toLowerCase().includes('validación') || skill.categoria === 'rapport') validacion = 'profunda';
    else if (estilo === 'validante') validacion = 'moderada';

    return {
        mensaje,
        estilo,
        validacion,
        habilidad: skill,
        contexto: `${context.fase}, ${context.estadoEmocional}, ${context.tipoRespuesta} | severidad: ${severidad ?? 'no especificada'}${alertasCriticas ? ' | alertas críticas' : ''}`,
    };
}
