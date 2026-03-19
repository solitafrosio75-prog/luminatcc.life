/**
 * useTherapist — Motor clínico del módulo terapeuta TCC.
 *
 * El "Terapeuta Perfecto" es un Científico-Practicante que integra:
 *   - Epistemología conductual (Pavlov, Skinner, Bandura)
 *   - Modelos cognitivos (Beck, Ellis, Young)
 *   - Protocolos específicos (EPR, AC, TPC, Protocolo Unificado)
 *   - Tercera generación (ACT, DBT, Mindfulness)
 *   - Habilidad socrática: guía sin enseñar
 *   - Alianza terapéutica: empatía estratégica, calidez, autenticidad
 *
 * Sistemas coordinados:
 *   1. Identidad clínica permanente (prompt importado de therapistIdentity.ts)
 *   2. Estado dinámico de sesión (fase, técnica, rapport, afecto)
 *   3. Respuesta estructurada: [texto]\n---\n[TECNICA:x]\n[opts]
 *   4. Progresión de fase: check_in → agenda → main_work → ...
 *   5. Crisis: override de prioridad máxima
 */

import { useRef, useCallback } from 'react';
import { useTherapistStore, type TherapistPhase, type TherapyTechnique } from './therapistStore';
import { THERAPIST_IDENTITY } from './therapistIdentity';
import { AFFECT_LABELS, AFFECT_TONE_MAP, AFFECT_INTENSITY_MAP, type AffectValence } from '../interview/interviewStore';

// ── Crisis detection ───────────────────────────────────────────────────────────

const CRISIS_PATTERNS = [
  'suicid', 'matarme', 'matarse', 'no quiero vivir', 'no quiero seguir',
  'quitarme la vida', 'quitarse la vida', 'acabar con todo', 'terminar con todo',
  'me lastimo', 'me corto', 'autolesion', 'hacerme daño',
  'no tiene sentido seguir', 'estoy pensando en hacerme',
];

function detectCrisis(text: string): boolean {
  const l = text.toLowerCase();
  return CRISIS_PATTERNS.some((p) => l.includes(p));
}

// ── Emotional tone (fallback textual) ─────────────────────────────────────────

function detectTone(text: string): string {
  const l = text.toLowerCase();
  if (['solo', 'sola', 'cansado', 'cansada', 'miedo', 'ansiedad', 'no puedo',
    'desesperado', 'triste', 'angustia', 'vacío', 'llorar', 'no aguanto'].some((w) => l.includes(w)))
    return 'distressed';
  if (['no sé', 'supongo', 'quizás', 'tal vez', 'complicado'].some((w) => l.includes(w)))
    return 'guarded';
  if (['creo que', 'pienso que', 'me di cuenta', 'noté', 'entiendo'].some((w) => l.includes(w)))
    return 'analytical';
  if (text.length > 200) return 'open';
  return 'neutral';
}

function detectIntensity(text: string): number {
  const l = text.toLowerCase();
  let s = 0;
  if (l.includes('no puedo'))                               s += 2;
  if (l.includes('siempre') || l.includes('nunca'))         s += 1;
  if (l.includes('desesper'))                               s += 2;
  if (l.includes('crisis') || l.includes('colapso'))        s += 2;
  if (l.includes('no aguanto') || l.includes('no soporto')) s += 2;
  if (text.length > 300)                                    s += 1;
  return Math.min(s, 5);
}

// ── Technique parser ──────────────────────────────────────────────────────────

const TECHNIQUE_KEYS = new Set<TherapyTechnique>([
  'exploracion', 'socratica', 'reestructuracion', 'activacion_conductual',
  'exposicion', 'defusion_act', 'validacion_dbt', 'experimento_conductual',
  'psicoeducacion', 'analisis_funcional',
]);

function parseTechniqueKey(raw: string): TherapyTechnique | null {
  const match = raw.match(/\[?TECNICA:\s*([a-z_]+)\]?/i);
  if (!match) return null;
  const key = match[1].toLowerCase().trim() as TherapyTechnique;
  return TECHNIQUE_KEYS.has(key) ? key : null;
}

/**
 * Parsea la respuesta estructurada del terapeuta:
 *
 *   [texto terapéutico]
 *   ---
 *   [TECNICA: nombre]           ← opcional
 *   [opción A]|[opción B]|[opción C]|[opción D]
 */
function parseTherapistResponse(raw: string): {
  text: string;
  technique: TherapyTechnique | null;
  options: string[];
} {
  const DELIM = '\n---\n';
  const delimIdx = raw.indexOf(DELIM);
  const splitIdx = delimIdx !== -1 ? delimIdx : raw.indexOf('\n---');
  const offset   = delimIdx !== -1 ? DELIM.length : 4;

  if (splitIdx === -1) return { text: raw.trim(), technique: null, options: [] };

  const text = raw.slice(0, splitIdx).trim();
  const rest = raw.slice(splitIdx + offset).trim();
  const lines = rest.split('\n').map((l) => l.trim()).filter(Boolean);

  let technique: TherapyTechnique | null = null;
  let optionsLine = '';

  for (const line of lines) {
    const tech = parseTechniqueKey(line);
    if (tech) {
      technique = tech;
    } else if (line.includes('|')) {
      optionsLine = line;
    } else if (!optionsLine) {
      optionsLine = line;
    }
  }

  const options = optionsLine
    .split('|')
    .map((o) => o.trim())
    .filter((o) => o.length > 2 && o.length < 90);

  return { text, technique, options };
}

// ── Signal config ──────────────────────────────────────────────────────────────

export function getTechniqueSignal(
  technique: TherapyTechnique | null,
  phase: TherapistPhase,
  crisisDetected: boolean,
): { color: string; text: string } {
  if (crisisDetected) return { color: '#ef4444', text: 'contención · señal de crisis' };
  if (!technique) {
    const phaseColors: Partial<Record<TherapistPhase, string>> = {
      check_in:            '#b8956a',
      agenda:              '#b8956a',
      homework_review:     '#7c9e8a',
      main_work:           '#6b9e78',
      summary:             '#4a90a4',
      homework_assignment: '#4a90a4',
      closure:             '#4a90a4',
    };
    return { color: phaseColors[phase] ?? '#4a4845', text: phase.replace(/_/g, ' ') };
  }
  const techniqueSignals: Record<TherapyTechnique, { color: string; text: string }> = {
    exploracion:            { color: '#6b7280', text: 'exploración empática' },
    socratica:              { color: '#d97706', text: 'diálogo socrático' },
    reestructuracion:       { color: '#3b82f6', text: 'reestructuración cognitiva' },
    activacion_conductual:  { color: '#10b981', text: 'activación conductual' },
    exposicion:             { color: '#f97316', text: 'exposición gradual' },
    defusion_act:           { color: '#8b5cf6', text: 'defusión ACT' },
    validacion_dbt:         { color: '#14b8a6', text: 'validación DBT' },
    experimento_conductual: { color: '#6366f1', text: 'experimento conductual' },
    psicoeducacion:         { color: '#0ea5e9', text: 'psicoeducación' },
    analisis_funcional:     { color: '#f43f5e', text: 'análisis funcional ABC' },
  };
  return techniqueSignals[technique];
}

// ── Affect summary ─────────────────────────────────────────────────────────────

function buildAffectSummary(affectHistory: { valence: number; label: string; turnNumber: number }[]): string {
  if (affectHistory.length === 0) return 'Sin datos afectivos aún.';
  const last = affectHistory[affectHistory.length - 1];
  const avg  = affectHistory.reduce((s, e) => s + e.valence, 0) / affectHistory.length;
  const trend = affectHistory.length >= 2
    ? affectHistory[affectHistory.length - 1].valence > affectHistory[0].valence
      ? '↑ mejorando'
      : affectHistory[affectHistory.length - 1].valence < affectHistory[0].valence
        ? '↓ empeorando'
        : '→ estable'
    : '→ sin tendencia aún';
  return `Último reporte: "${last.label}" (turno ${last.turnNumber}) | Promedio: ${avg.toFixed(1)}/5 | Tendencia: ${trend}`;
}

// ── Phase instructions ─────────────────────────────────────────────────────────

function buildPhaseInstruction(
  phase: TherapistPhase,
  sessionNumber: number,
  sessionGoals: string[],
  currentHomework: string | null,
  homeworkReviewed: boolean,
): string {
  const goals = sessionGoals.length > 0
    ? sessionGoals.join(' / ')
    : 'aún por definir con el paciente';

  switch (phase) {
    case 'check_in':
      return `FASE: CHECK-IN — Sesión ${sessionNumber}.
Recibí al paciente con calidez. Preguntá brevemente cómo está hoy, cómo fue la semana.
${sessionNumber > 1 && currentHomework && !homeworkReviewed
  ? `Tarea pendiente de revisar: "${currentHomework.slice(0, 120)}". Pero primero chequeá el estado emocional.`
  : sessionNumber === 1 ? 'Primera sesión — abrí con curiosidad genuina.' : ''}
UNA pregunta abierta. Escuchá. No analices aún.`;

    case 'agenda':
      return `FASE: AGENDA DE SESIÓN.
Guiá al paciente a identificar 1-2 objetivos concretos para HOY.
"¿Qué es lo más importante que podemos trabajar hoy para que esta sesión sea útil?"
Los objetivos deben ser específicos y alcanzables en esta sesión.
No dejés que la sesión se disperse — la agenda es el ancla.`;

    case 'homework_review':
      return `FASE: REVISIÓN DE TAREA INTERSESIÓN.
${currentHomework ? `Tarea asignada: "${currentHomework}"` : 'Revisar si el paciente realizó alguna práctica.'}
Sin juicio si no la completó — explorá qué interfirió (análisis funcional).
Si la hizo: reforzá el logro, integrá los aprendizajes en el trabajo de hoy.
"¿Pudiste hacer el ejercicio que acordamos? ¿Qué notaste?"`;

    case 'main_work':
      return `FASE: TRABAJO TERAPÉUTICO CENTRAL.
Aplicá la técnica más adecuada para los objetivos de hoy.
Usá el método socrático como base — una pregunta por turno.
SIEMPRE reflejá el contenido emocional ANTES de intervenir.
Adaptá la técnica si el paciente no responde — la flexibilidad supera a la rigidez.
Objetivos de esta sesión: ${goals}.`;

    case 'summary':
      return `FASE: RESUMEN E INTEGRACIÓN.
Sintetizá los insights clave del trabajo de hoy en 2-3 oraciones.
Usá la voz del paciente: "Hoy vimos que..." / "Lo que emergió fue...".
Validá el esfuerzo. Preguntá: "¿Qué te llevás de esta sesión?"`;

    case 'homework_assignment':
      return `FASE: TAREA INTERSESIÓN.
Proponé una tarea conductual concreta, específica, alcanzable.
Debe estar directamente vinculada al trabajo de hoy.
Pedí feedback: "¿Te parece posible? ¿Qué podría interferir?"`;

    case 'closure':
      return `FASE: CIERRE DE SESIÓN.
Mensaje cálido de cierre. Reforzá el trabajo del paciente.
Recordá la tarea acordada. Confirmá próxima sesión.`;

    case 'crisis':
      return `⚠ SEÑAL DE CRISIS — PRIORIDAD MÁXIMA: CONTENCIÓN.
Suspendé TODO trabajo técnico. Solo presencia, seguridad, validación del dolor.
"Estoy acá con vos. Lo que sentís es real. ¿Estás seguro/a ahora mismo?"
NO des tareas. NO des psicoeducación. Solo contención.`;
  }
}

// ── Technique instruction block ────────────────────────────────────────────────

function buildTechniqueBlock(technique: TherapyTechnique | null): string {
  if (!technique) return '';
  const blocks: Record<TherapyTechnique, string> = {
    exploracion:
      `TÉCNICA ACTIVA: EXPLORACIÓN EMPÁTICA.
Escuchá sin juzgar. Refleja el contenido emocional. Validá antes de preguntar.
Una pregunta abierta por turno. No reformulés ni reencuadrés aún.`,

    socratica:
      `TÉCNICA ACTIVA: DIÁLOGO SOCRÁTICO — DESCUBRIMIENTO GUIADO.
NO das la respuesta. Guiás hasta que el paciente llegue solo/a.
Preguntas: "¿Qué pruebas tenés?" / "¿Hubo alguna vez que eso no ocurrió?" / "¿Es un hecho o una interpretación?"`,

    reestructuracion:
      `TÉCNICA ACTIVA: REESTRUCTURACIÓN COGNITIVA (Beck).
1. Identificá el Pensamiento Automático específico.
2. Examiná evidencias A FAVOR y EN CONTRA.
3. Construí un pensamiento alternativo más equilibrado y basado en evidencia.
NO es "pensar positivo" — es pensar de forma más REAL y flexible.`,

    activacion_conductual:
      `TÉCNICA ACTIVA: ACTIVACIÓN CONDUCTUAL.
El problema: círculo vicioso de retirada → menos refuerzo → más retirada.
Programá pequeños pasos concretos. El movimiento precede a la motivación.
"¿Qué actividad pequeña podría intentar esta semana, aunque no tenga ganas?"`,

    exposicion:
      `TÉCNICA ACTIVA: EXPOSICIÓN GRADUAL (EPR).
La evitación mantiene el miedo. La exposición lo extingue.
1. Construí jerarquía de situaciones temidas (0-100 SUDS).
2. Comenzá por el estímulo menos amenazante.
La meta: aprender que la ansiedad no es peligrosa.`,

    defusion_act:
      `TÉCNICA ACTIVA: DEFUSIÓN COGNITIVA (ACT).
NO debatimos el pensamiento. Lo observamos como evento mental.
"Tu mente está diciendo que..." / "Notás ese pensamiento de..."
Objetivo: DISTANCIA del pensamiento, no su eliminación.`,

    validacion_dbt:
      `TÉCNICA ACTIVA: VALIDACIÓN RADICAL (DBT).
Primero: validá completamente la experiencia como comprensible.
"Tiene todo el sentido del mundo que sientas eso dado lo que viviste."
Luego desde la aceptación: introducí el cambio.`,

    experimento_conductual:
      `TÉCNICA ACTIVA: EXPERIMENTO CONDUCTUAL.
La evidencia supera al debate. Diseñá una prueba real de la creencia.
Predicción específica → Conducta → Observación → Conclusión.`,

    psicoeducacion:
      `TÉCNICA ACTIVA: PSICOEDUCACIÓN DEL MODELO.
Explicá en lenguaje accesible, sin jerga técnica. Usá analogías.
No más de 2-3 conceptos. Verificá comprensión: "¿Esto tiene sentido para vos?"`,

    analisis_funcional:
      `TÉCNICA ACTIVA: ANÁLISIS FUNCIONAL ABC.
Mapeá: ANTECEDENTE → CONDUCTA → CONSECUENCIA.
Buscá el Refuerzo Negativo. ¿Qué ganás al no enfrentar esto? (beneficios secundarios).`,
  };
  return `\n━━━ TÉCNICA ACTIVA ━━━\n${blocks[technique]}\n━━━━━━━━━━━━━━━━━━━━`;
}

// ── Dynamic system prompt builder ──────────────────────────────────────────────

function buildTherapistSystemPrompt(
  phase: TherapistPhase,
  sessionNumber: number,
  turnCount: number,
  emotionalTone: string,
  emotionalIntensity: number,
  rapportScore: number,
  crisisDetected: boolean,
  affectHistory: { valence: number; label: string; turnNumber: number }[],
  lastAffectValence: AffectValence | null,
  sessionGoals: string[],
  currentHomework: string | null,
  homeworkReviewed: boolean,
  activeTechnique: TherapyTechnique | null,
): string {
  const phaseInstruction = buildPhaseInstruction(
    phase, sessionNumber, sessionGoals, currentHomework, homeworkReviewed,
  );
  const techniqueBlock = buildTechniqueBlock(activeTechnique);
  const affectSummary  = buildAffectSummary(affectHistory);
  const lastAffectStr  = lastAffectValence
    ? `El paciente reportó sentirse "${AFFECT_LABELS[lastAffectValence]}" antes de este mensaje.`
    : 'Sin reporte afectivo en este turno.';
  const goalsStr = sessionGoals.length > 0 ? sessionGoals.join(' | ') : 'no establecidos aún';

  return `${THERAPIST_IDENTITY}

━━━ ESTADO CLÍNICO ACTUAL ━━━
Sesión: #${sessionNumber} | Turno: ${turnCount} | Fase: ${phase}
Tono detectado: ${emotionalTone} | Intensidad: ${emotionalIntensity}/5 | Rapport: ${rapportScore.toFixed(1)}/5
${crisisDetected ? '⚠ SEÑAL DE CRISIS — PRIORIDAD: CONTENCIÓN SOBRE TODO' : ''}
Objetivos de sesión: ${goalsStr}
${currentHomework ? `Tarea intersesión: "${currentHomework.slice(0, 120)}" (revisada: ${homeworkReviewed ? 'sí' : 'no'})` : 'Sin tarea asignada aún.'}
━━━━━━━━━━━━━━━━━━━━

━━━ AFECTO AUTO-REPORTADO ━━━
${lastAffectStr}
Trayectoria sesión: ${affectSummary}
━━━━━━━━━━━━━━━━━━━━
${techniqueBlock}

━━━ INSTRUCCIÓN DE FASE ━━━
${phaseInstruction}
━━━━━━━━━━━━━━━━━━━━

━━━ REGLAS IRROMPIBLES ━━━
1. UNA sola pregunta por turno. Nunca dos preguntas en el mismo mensaje.
2. SIEMPRE reflejá el contenido emocional ANTES de preguntar o intervenir.
3. NUNCA usés vocabulario técnico/clínico con el paciente.
4. Tono: cálido, presente, genuino. Lenguaje rioplatense (vos, te, tu).
5. Si hay crisis: suspendé TODA técnica. Solo contención y seguridad.
6. No des la respuesta socrática — guiá al paciente para que la descubra.
━━━━━━━━━━━━━━━━━━━━

━━━ FORMATO DE RESPUESTA (OBLIGATORIO) ━━━
Respondé EXACTAMENTE en este formato de dos partes:

[Texto del terapeuta — lenguaje cálido, sin comillas externas, sin numeración]
---
[TECNICA: nombre_de_tecnica]
[Frase A — 1ª persona, max 10 palabras]|[Frase B — distinta emocionalmente]|[Frase C — otra dirección]|[Frase D — alternativa diferente]

Técnicas válidas: exploracion | socratica | reestructuracion | activacion_conductual | exposicion | defusion_act | validacion_dbt | experimento_conductual | psicoeducacion | analisis_funcional
Las 4 frases son lo que el PACIENTE podría elegir decir. Deben ser DIFERENTES entre sí.
Si hay crisis activa: todas las opciones son de contención/seguridad.
━━━━━━━━━━━━━━━━━━━━`;
}

// ── Phase progression logic ────────────────────────────────────────────────────

function computeNextPhase(
  currentPhase: TherapistPhase,
  turnCount: number,
  sessionNumber: number,
  homeworkReviewed: boolean,
  sessionGoals: string[],
  crisisDetected: boolean,
): TherapistPhase | null {
  if (crisisDetected) return 'crisis';
  if (currentPhase === 'crisis') return null;

  if (currentPhase === 'check_in' && turnCount >= 2) return 'agenda';
  if (currentPhase === 'agenda' && sessionGoals.length > 0) {
    return sessionNumber > 1 && !homeworkReviewed ? 'homework_review' : 'main_work';
  }
  if (currentPhase === 'homework_review' && homeworkReviewed) return 'main_work';
  return null;
}

// ── Main hook ─────────────────────────────────────────────────────────────────

export function useTherapist() {
  const isStreaming = useRef(false);

  const processUserMessage = useCallback(async (
    text: string,
    onTyping: (typing: boolean) => void,
    onChunk: (chunk: string) => void,
    onComplete: (
      reply: string | null,
      signal: { color: string; text: string },
      options: string[],
    ) => void,
    affectValence: AffectValence | null = null,
  ): Promise<void> => {
    if (isStreaming.current) return;
    isStreaming.current = true;

    const store = useTherapistStore.getState();

    // ── 1. Crisis ─────────────────────────────────────────────────────────────
    if (detectCrisis(text)) {
      store.setCrisisDetected(true);
      store.setPhase('crisis');
    }

    // ── 2. Emotional state ────────────────────────────────────────────────────
    let tone: string;
    let intensity: number;

    if (affectValence !== null) {
      tone      = AFFECT_TONE_MAP[affectValence];
      intensity = AFFECT_INTENSITY_MAP[affectValence];
      store.addAffectEntry(affectValence);
    } else {
      tone      = detectTone(text);
      intensity = detectIntensity(text);
    }
    store.setEmotionalTone(tone);
    store.setEmotionalIntensity(Math.max(store.emotionalIntensity, intensity));

    // ── 3. Rapport ────────────────────────────────────────────────────────────
    let rapportDelta: number;
    if (affectValence !== null) {
      rapportDelta = affectValence >= 4 ? 0.6 : affectValence === 3 ? 0.3 : 0.4;
    } else {
      rapportDelta =
        tone === 'open'       ? 0.7  :
        tone === 'analytical' ? 0.4  :
        tone === 'distressed' ? 0.3  :
        tone === 'guarded'    ? 0.05 : 0.2;
    }
    store.setRapportScore(Math.min(Math.max(store.rapportScore + rapportDelta, 0), 5));

    // ── 4. Homework review detection ──────────────────────────────────────────
    if (store.phase === 'homework_review' && !store.homeworkReviewed) {
      const hwKw = ['hice', 'hizo', 'pude', 'pudo', 'completé', 'intenté', 'no pude', 'no hice'];
      if (hwKw.some((k) => text.toLowerCase().includes(k))) {
        store.setHomeworkReviewed(true);
      }
    }

    // ── 5. History ────────────────────────────────────────────────────────────
    const historyContent = affectValence
      ? `[me siento ${AFFECT_LABELS[affectValence]}] ${text}`
      : text;
    store.addToHistory('user', historyContent);

    // ── 6. Phase progression ──────────────────────────────────────────────────
    const current   = useTherapistStore.getState();
    const turnCount = current.conversationHistory.filter((m) => m.role === 'user').length;
    const nextPhase = computeNextPhase(
      current.phase, turnCount, current.sessionNumber,
      current.homeworkReviewed, current.sessionGoals.map((g) => g.text), current.crisisDetected,
    );
    if (nextPhase && nextPhase !== current.phase) store.setPhase(nextPhase);

    // ── 7. Build system prompt ────────────────────────────────────────────────
    const state = useTherapistStore.getState();
    const systemPrompt = buildTherapistSystemPrompt(
      state.phase, state.sessionNumber, turnCount,
      state.emotionalTone, state.emotionalIntensity, state.rapportScore,
      state.crisisDetected, state.affectHistory, affectValence,
      state.sessionGoals.map((g) => g.text), state.currentHomework,
      state.homeworkReviewed, state.activeTechnique,
    );

    // ── 8. Typing delay ───────────────────────────────────────────────────────
    onTyping(true);
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 700));
    onTyping(false);

    // ── 9. API call ───────────────────────────────────────────────────────────
    let response: Response;
    try {
      response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: systemPrompt,
          messages: state.conversationHistory,
          max_tokens: 600,
        }),
      });
    } catch {
      onComplete(null, { color: '#4a4845', text: 'error de conexión' }, []);
      isStreaming.current = false;
      return;
    }

    if (!response.ok) {
      onComplete(null, { color: '#4a4845', text: 'error del servidor' }, []);
      isStreaming.current = false;
      return;
    }

    // ── 10. SSE streaming ─────────────────────────────────────────────────────
    const reader  = response.body!.getReader();
    const decoder = new TextDecoder();
    let fullText  = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      for (const line of decoder.decode(value).split('\n')) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (!raw || raw === '[DONE]') continue;
        try {
          const p = JSON.parse(raw) as { type?: string; delta?: { text?: string } };
          if (p.type === 'content_block_delta' && p.delta?.text) {
            fullText += p.delta.text;
            const { text: displayText } = parseTherapistResponse(fullText);
            onChunk(displayText);
          }
        } catch { /* ignore malformed SSE */ }
      }
    }
    reader.releaseLock();

    // ── 11. Parse & store response ────────────────────────────────────────────
    const { text: responseText, technique, options } = parseTherapistResponse(fullText);
    const finalStore = useTherapistStore.getState();
    finalStore.addToHistory('assistant', responseText);
    finalStore.setLastAffectValence(null);
    if (technique) finalStore.setActiveTechnique(technique);

    // Auto-detectar tarea propuesta en fase homework_assignment
    if (finalStore.phase === 'homework_assignment' && responseText.length > 50) {
      const hwSentence = responseText.split(/[.!?]/).find((s) =>
        ['esta semana', 'para la próxima', 'te propongo', 'podés hacer'].some((k) =>
          s.toLowerCase().includes(k),
        ),
      );
      if (hwSentence) finalStore.setCurrentHomework(hwSentence.trim());
    }

    const signal = getTechniqueSignal(technique, finalStore.phase, finalStore.crisisDetected);
    onComplete(responseText, signal, options);
    isStreaming.current = false;
  }, []);

  // ── Manual controls ───────────────────────────────────────────────────────

  const advancePhase = useCallback((to: TherapistPhase): void => {
    useTherapistStore.getState().setPhase(to);
  }, []);

  const addGoal = useCallback((text: string): void => {
    if (text.trim()) useTherapistStore.getState().addSessionGoal(text.trim());
  }, []);

  return { isStreaming, processUserMessage, advancePhase, addGoal };
}
