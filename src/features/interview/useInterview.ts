/**
 * useInterview — Motor clínico de la primera entrevista.
 *
 * Sistemas coordinados:
 *
 * 1. Motor de cobertura Beck
 *    Mapa de 5 áreas (pending/partial/done). Cada mención avanza el estado
 *    y extrae frases literales como evidencia. El prompt se reconstruye en
 *    cada turno con este mapa.
 *
 * 2. Detector de apertura de inventarios (3 condiciones simultáneas)
 *    a) rapport >= 1.5
 *    b) afecto auto-reportado <= 2  O  intensidad textual >= 2  O  tono 'distressed'
 *    c) al menos 2 áreas Beck con información
 *
 * 3. Respuesta estructurada con chips contextuales
 *    El modelo devuelve texto del terapeuta + 4 frases socráticas para el
 *    paciente, separados por el delimitador ---. Las frases son generadas
 *    dinámicamente según el estado clínico y el contexto conversacional.
 *
 * 4. Selector afectivo
 *    La selección del paciente en el AffectSelector sobreescribe la
 *    detección textual de tono e intensidad, que es menos fiable.
 *
 * 5. Prompt dinámico guiado por estado clínico completo
 */

import { useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useInterviewStore,
  type BeckKey,
  type BeckState,
  type BeckAreaState,
  type InventoryReadiness,
  type InterviewPhase,
  type AffectValence,
  AFFECT_LABELS,
  AFFECT_TONE_MAP,
  AFFECT_INTENSITY_MAP,
} from './interviewStore';
import { useSessionStore } from '../../shared/sessionStore';
import { buildInterviewTechniqueContext } from '../../services/interviewKnowledgeV3Service';

// ── Detección de tono emocional (fallback textual) ───────────────────────────

function detectTone(text: string): string {
  const l = text.toLowerCase();
  if (
    ['solo', 'sola', 'cansado', 'cansada', 'miedo', 'ansiedad', 'no puedo',
     'desesperado', 'triste', 'angustia', 'vacío', 'sin esperanza', 'llorar',
     'no aguanto', 'me siento mal', 'bajón'].some((w) => l.includes(w))
  ) return 'distressed';
  if (
    ['no sé', 'supongo', 'quizás', 'tal vez', 'complicado',
     'difícil de explicar', 'no estoy seguro'].some((w) => l.includes(w))
  ) return 'guarded';
  if (
    ['creo que', 'pienso que', 'me di cuenta', 'noté', 'analizo',
     'entiendo que'].some((w) => l.includes(w))
  ) return 'analytical';
  if (text.length > 200) return 'open';
  return 'neutral';
}

// ── Detección de intensidad emocional (fallback textual) ─────────────────────

function detectIntensity(text: string): number {
  const l = text.toLowerCase();
  let s = 0;
  if (l.includes('no puedo'))                               s += 2;
  if (l.includes('siempre') || l.includes('nunca'))         s += 1;
  if (l.includes('desesper'))                               s += 2;
  if (l.includes('crisis') || l.includes('colapso'))        s += 2;
  if (l.includes('no aguanto') || l.includes('no soporto')) s += 2;
  if (l.includes('mucho miedo') || l.includes('terror'))    s += 2;
  if (text.length > 300)                                    s += 1;
  return Math.min(s, 5);
}

// ── Detección de crisis ───────────────────────────────────────────────────────

const CRISIS_PATTERNS = [
  'suicid', 'matarme', 'matarse', 'no quiero vivir', 'no quiero seguir viviendo',
  'quitarme la vida', 'quitarse la vida', 'acabar con todo', 'terminar con todo',
  'me lastimo', 'me corto', 'me lacero', 'autolesion', 'hacerme daño',
  'no tiene sentido seguir', 'estoy pensando en hacerme',
];

function detectCrisis(text: string): boolean {
  const l = text.toLowerCase();
  return CRISIS_PATTERNS.some((p) => l.includes(p));
}

// ── Señales lingüísticas por área Beck ───────────────────────────────────────

const BECK_KEYWORDS: Record<BeckKey, string[]> = {
  symptoms:    ['siento', 'síntoma', 'dolor', 'ansiedad', 'tristeza', 'miedo', 'angustia',
                'mal', 'cansado', 'insomnio', 'apetito', 'lloro', 'llorar', 'nervioso',
                'bajón', 'agotado', 'pánico', 'deprimido'],
  history:     ['antes', 'siempre', 'desde que', 'pasó', 'ocurrió', 'cuando era', 'infancia',
                'antes de', 'hace años', 'hace tiempo', 'tratamiento', 'terapia', 'medicación',
                'episodio', 'recaída', 'la primera vez'],
  functioning: ['trabajo', 'estudio', 'amigos', 'pareja', 'familia', 'actividades', 'salir',
                'motivación', 'energía', 'rutina', 'rendir', 'concentrar', 'dormir',
                'levantarme', 'relaciones'],
  personal:    ['soy', 'me considero', 'mi manera de', 'perfeccionista', 'exigente',
                'sensible', 'carácter', 'personalidad', 'siempre fui', 'toda la vida fui',
                'me caracteriza'],
  strengths:   ['puedo', 'logré', 'me ayuda', 'apoyo', 'fuerza', 'recurso', 'positivo',
                'bien', 'habilidad', 'deporte', 'arte', 'disfruto', 'me gusta', 'me sostiene'],
};

function extractPhrase(text: string, matchedKeyword: string): string {
  const sentences = text.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
  const matched   = sentences.find((s) => s.toLowerCase().includes(matchedKeyword));
  const phrase    = matched ?? sentences[0] ?? text;
  return phrase.length > 100 ? phrase.slice(0, 97) + '…' : phrase;
}

function detectBeckAreas(text: string): { key: BeckKey; phrase: string }[] {
  const l       = text.toLowerCase();
  const results: { key: BeckKey; phrase: string }[] = [];
  for (const key of Object.keys(BECK_KEYWORDS) as BeckKey[]) {
    const matched = BECK_KEYWORDS[key].find((w) => l.includes(w));
    if (matched) results.push({ key, phrase: extractPhrase(text, matched) });
  }
  return results;
}

// ── Detección de temas narrativos ─────────────────────────────────────────────

const THEME_KEYWORDS: Record<string, string[]> = {
  'relaciones': ['pareja', 'relación', 'novio', 'novia', 'esposo', 'esposa', 'amigos',
                 'amistad', 'separación', 'ruptura', 'solo', 'soledad'],
  'trabajo':    ['trabajo', 'empleo', 'jefe', 'empresa', 'laboral', 'estudio', 'carrera', 'rendir'],
  'familia':    ['familia', 'padres', 'madre', 'padre', 'hermano', 'hermana', 'hijos', 'mamá', 'papá'],
  'pérdida':    ['perdí', 'pérdida', 'murió', 'falleció', 'duelo', 'extraño', 'ya no está'],
  'autoestima': ['no valgo', 'fracasé', 'inútil', 'no sirvo', 'me odio', 'soy un desastre'],
  'ansiedad':   ['ansiedad', 'angustia', 'nervios', 'ataque de pánico', 'taquicardia'],
};

function detectThemes(text: string): string[] {
  const l = text.toLowerCase();
  return Object.entries(THEME_KEYWORDS)
    .filter(([, keywords]) => keywords.some((k) => l.includes(k)))
    .map(([theme]) => theme);
}

// ── Tendencia narrativa (basada en trayectoria afectiva si hay datos) ─────────

function detectNarrativeTrend(
  history: { role: string; content: string }[],
  affectHistory: { valence: number }[],
): 'expanding' | 'contracting' | 'stable' | 'unknown' {
  // Si hay suficiente historial afectivo, lo usamos (más fiable que longitud de texto)
  if (affectHistory.length >= 4) {
    const n    = affectHistory.length;
    const mid  = Math.floor(n / 2);
    const firstHalf = affectHistory.slice(0, mid).reduce((s, e) => s + e.valence, 0) / mid;
    const lastHalf  = affectHistory.slice(mid).reduce((s, e) => s + e.valence, 0) / (n - mid);
    if (lastHalf > firstHalf + 0.5) return 'expanding';
    if (lastHalf < firstHalf - 0.5) return 'contracting';
    return 'stable';
  }
  // Fallback: longitud de mensajes de texto libre (excluimos mensajes de chips cortos)
  const freeTexts = history
    .filter((m) => m.role === 'user' && m.content.length > 20)
    .map((m) => m.content.length);
  if (freeTexts.length < 3) return 'unknown';
  const recent    = freeTexts.slice(-3);
  const older     = freeTexts.length >= 6 ? freeTexts.slice(-6, -3) : freeTexts.slice(0, -3);
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg  = older.length > 0 ? older.reduce((a, b) => a + b, 0) / older.length : recentAvg;
  if (recentAvg > olderAvg * 1.35) return 'expanding';
  if (recentAvg < olderAvg * 0.65) return 'contracting';
  return 'stable';
}

// ── Mapa Beck serializado ─────────────────────────────────────────────────────

function buildBeckMap(beck: BeckState): string {
  const labels: Record<BeckKey, string> = {
    symptoms:    'SÍNTOMAS ACTUALES',
    history:     'HISTORIA CLÍNICA',
    functioning: 'FUNCIONAMIENTO',
    personal:    'RASGOS PERSONALES',
    strengths:   'RECURSOS/FORTALEZAS',
  };
  return (Object.entries(beck) as [BeckKey, BeckAreaState][])
    .map(([key, area]) => {
      const mark      = area.status === 'done' ? '✓' : area.status === 'partial' ? '◑' : '○';
      const phrasesStr = area.keyPhrases.length > 0
        ? '\n  ' + area.keyPhrases.map((p) => `"${p}"`).join('\n  ')
        : '';
      return `${mark} ${labels[key]} [${area.status}]${phrasesStr}`;
    })
    .join('\n');
}

// ── Instrucción de fase ───────────────────────────────────────────────────────

function buildPhaseInstruction(
  phase: InterviewPhase,
  pendingAreas: string[],
  readiness: InventoryReadiness,
  crisisDetected: boolean,
): string {
  if (crisisDetected) {
    return `SEÑAL DE CRISIS DETECTADA. Tu única prioridad es la contención emocional.
No hagas preguntas de evaluación. No hablés de cuestionarios.
Validá el dolor, expresá presencia, preguntá cómo está ahora mismo.`;
  }
  switch (phase) {
    case 'opening':
      return `Apertura. Recibí con calidez. Hacé UNA pregunta abierta sobre el motivo de consulta. No analices aún.`;
    case 'exploration':
      if (pendingAreas.length === 0) {
        return `Cobertura completa. Integrá lo escuchado. Podés preguntar si hay algo más que quiera compartir.`;
      }
      return `Exploración activa. Seguí el hilo natural del paciente.
Áreas pendientes: ${pendingAreas.join(', ')}.
No preguntes directamente — dejá que surjan naturalmente.`;
    case 'inventory':
      return `Las condiciones clínicas están dadas (rapport ✓ | carga emocional ✓ | cobertura Beck ✓).
Introducí el BDI-II de forma conversacional y empática.
No lo llames "test". Decí "unas preguntas cortas". Validá primero lo que dijo el paciente.`;
    case 'beck_integration':
      return `Los cuestionarios fueron completados. Ahora es momento de INTEGRAR toda la información.
Agradecé la honestidad. Podés resumir brevemente lo que entendiste y preguntar:
- "¿Hay algo de lo que respondiste que quieras profundizar o corregir?"
- "¿Cómo te sentiste respondiendo estas preguntas?"
- "¿Querés agregar algo que no hayamos hablado?"
Este es el momento para cerrar la primera entrevista y preparar la transición al tratamiento.`;
    default:
      return `Continuá con calidez y curiosidad clínica. Una pregunta por turno.`;
  }
}

// ── Resumen de trayectoria afectiva para el prompt ────────────────────────────

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
  return `Último reporte: "${last.label}" (turno ${last.turnNumber}) | Promedio sesión: ${avg.toFixed(1)}/5 | Tendencia: ${trend}`;
}

// ── System prompt dinámico ────────────────────────────────────────────────────

/**
 * IMPORTANTE: El modelo debe responder con formato estructurado:
 *   [texto del terapeuta]
 *   ---
 *   [opción A]|[opción B]|[opción C]|[opción D]
 *
 * Las 4 opciones son frases cortas en primera persona que el PACIENTE podría decir.
 * Deben representar direcciones narrativas/emocionales genuinamente diferentes.
 */
function buildSystemPrompt(
  phase: InterviewPhase,
  turnCount: number,
  beck: BeckState,
  emotionalTone: string,
  emotionalIntensity: number,
  rapportScore: number,
  readiness: InventoryReadiness,
  crisisDetected: boolean,
  affectHistory: { valence: number; label: string; turnNumber: number }[],
  lastAffectValence: AffectValence | null,
  techniqueGuidance: string,
): string {
  const beckMap          = buildBeckMap(beck);
  const pendingAreas     = (Object.entries(beck) as [BeckKey, BeckAreaState][])
    .filter(([, v]) => v.status === 'pending')
    .map(([k]) => (
      { symptoms: 'síntomas', history: 'historia', functioning: 'funcionamiento',
        personal: 'rasgos personales', strengths: 'fortalezas' }[k]
    ));
  const phaseInstruction = buildPhaseInstruction(phase, pendingAreas, readiness, crisisDetected);
  const affectSummary    = buildAffectSummary(affectHistory);
  const lastAffectStr    = lastAffectValence
    ? `El paciente reportó sentirse "${AFFECT_LABELS[lastAffectValence]}" antes de este mensaje.`
    : 'Sin reporte afectivo en este turno.';

  return `Sos el terapeuta clínico en la PRIMERA ENTREVISTA cognitivo-conductual (modelo Beck).

━━━ ESTADO CLÍNICO ━━━
Fase: ${phase} | Turno: ${turnCount}
Tono detectado: ${emotionalTone} | Intensidad: ${emotionalIntensity}/5 | Rapport: ${rapportScore.toFixed(1)}/5
${crisisDetected ? '⚠ SEÑAL DE CRISIS — priorizá contención' : ''}
━━━━━━━━━━━━━━━━━━━━

━━━ AFECTO AUTO-REPORTADO ━━━
${lastAffectStr}
Trayectoria sesión: ${affectSummary}
━━━━━━━━━━━━━━━━━━━━

━━━ MAPA BECK ━━━
${beckMap}
Pendientes: ${pendingAreas.length > 0 ? pendingAreas.join(', ') : 'ninguna — cobertura completa'}
━━━━━━━━━━━━━━━━━━━━

━━━ INSTRUCCIÓN DE FASE ━━━
${phaseInstruction}
━━━━━━━━━━━━━━━━━━━━

━━━ GUÍA TÉCNICA V3 (NO EXPLICAR AL PACIENTE) ━━━
${techniqueGuidance || 'Sin guia tecnica adicional para este turno.'}
━━━━━━━━━━━━━━━━━━━━

━━━ REGLAS IRROMPIBLES ━━━
1. UNA sola pregunta por turno. Nunca dos.
2. SIEMPRE refleja el contenido emocional ANTES de preguntar.
3. NUNCA usés vocabulario técnico/clínico con el paciente.
4. Tono: cálido, presente, sin apuro. Lenguaje rioplatense (vos, te, tu).
5. Si hay crisis: priorizá contención sobre todo.
━━━━━━━━━━━━━━━━━━━━

━━━ FORMATO DE RESPUESTA ━━━
Respondé EXACTAMENTE en este formato de dos partes:

[Texto del terapeuta — lenguaje cálido, sin comillas externas]
---
[Frase A breve, 1ª persona, max 10 palabras]|[Frase B — distinta emocionalmente]|[Frase C — otra dirección]|[Frase D — alternativa diferente]

Las 4 frases son palabras que el PACIENTE podría elegir decir.
Deben representar DIFERENTES estados emocionales o perspectivas (ej: una más abierta, una más resistente, una más descriptiva, una de cambio de tema).
NO uses comillas ni numeración en las frases.
Si hay crisis activa, las 4 opciones deben ser de contención/apoyo.
━━━━━━━━━━━━━━━━━━━━`;
}

// ── Signal config ─────────────────────────────────────────────────────────────

function getSignalConfig(
  phase: string,
  emotionalTone: string,
  crisisDetected: boolean,
): { color: string; text: string } {
  if (crisisDetected) return { color: '#ef4444', text: 'contención · señal de crisis' };
  const configs: Record<string, { color: string; text: string }> = {
    opening:          { color: '#b8956a', text: 'apertura · primera entrevista' },
    exploration:      { color: '#b8956a', text: `exploración · ${emotionalTone}` },
    inventory:        { color: '#6b9e78', text: 'transición a cuestionarios' },
    beck_integration: { color: '#6b9e78', text: 'integración Beck' },
    complete:         { color: '#4a90a4', text: 'entrevista completa' },
  };
  return configs[phase] ?? { color: '#4a4845', text: phase };
}

// ── Parser de respuesta estructurada ─────────────────────────────────────────

/**
 * Separa el texto del terapeuta de las opciones generadas.
 * Formato esperado:  [texto]\n---\n[op1]|[op2]|[op3]|[op4]
 * Si el formato falla, devuelve el texto completo y opciones vacías.
 */
function parseStructuredResponse(raw: string): { text: string; options: string[] } {
  const DELIMITER = '\n---\n';
  const idx = raw.indexOf(DELIMITER);
  if (idx === -1) {
    // Intentar con variantes del delimitador
    const alt = raw.indexOf('\n---');
    if (alt === -1) return { text: raw.trim(), options: [] };
    const text    = raw.slice(0, alt).trim();
    const optsPart = raw.slice(alt + 4).trim();
    const options  = optsPart.split('|').map((o) => o.trim()).filter((o) => o.length > 2 && o.length < 80);
    return { text, options };
  }
  const text     = raw.slice(0, idx).trim();
  const optsPart = raw.slice(idx + DELIMITER.length).trim();
  const options  = optsPart.split('|').map((o) => o.trim()).filter((o) => o.length > 2 && o.length < 80);
  return { text, options };
}

// ── Hook principal ────────────────────────────────────────────────────────────

export function useInterview() {
  const isStreaming = useRef(false);
  const navigate    = useNavigate();

  /**
   * Procesa un mensaje del usuario y llama a los callbacks con:
   *   - onTyping(boolean) — estado de "escribiendo"
   *   - onChunk(displayText) — texto streaming visible (sin la sección de opciones)
   *   - onComplete(reply, signal, options) — respuesta final + chips contextuales
   *
   * @param affectValence — selección afectiva previa del paciente (puede ser null)
   */
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

    const store = useInterviewStore.getState();

    // ── 1. Crisis detection ───────────────────────────────────────────────────
    if (detectCrisis(text)) {
      store.setCrisisDetected(true);
      store.setPhase('crisis_containment');
      store.updateClinicalAlerts({ riskFlag: true });
    }

    // ── 2. Estado emocional ───────────────────────────────────────────────────
    // Si hay selección afectiva, tiene prioridad sobre detección textual
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

    // ── 3. Beck coverage motor ────────────────────────────────────────────────
    const detectedAreas = detectBeckAreas(text);
    for (const { key, phrase } of detectedAreas) {
      store.recordBeckMention(key, phrase);
    }

    // ── 4. Themes ─────────────────────────────────────────────────────────────
    const newThemes = detectThemes(text);
    if (newThemes.length > 0) {
      const merged = [...new Set([...store.detectedThemes, ...newThemes])];
      store.setDetectedThemes(merged);
    }

    // ── 5. Rapport ────────────────────────────────────────────────────────────
    // Con afecto auto-reportado: apertura (valence >= 4) = más rapport
    let rapportDelta: number;
    if (affectValence !== null) {
      rapportDelta = affectValence >= 4 ? 0.7 : affectValence === 3 ? 0.3 : 0.4;
    } else {
      rapportDelta =
        tone === 'open'       ? 0.8  :
        tone === 'analytical' ? 0.4  :
        tone === 'distressed' ? 0.3  :
        tone === 'guarded'    ? 0.05 : 0.2;
    }
    store.setRapportScore(Math.min(Math.max(store.rapportScore + rapportDelta, 0), 5));

    // ── 6. Inventory readiness ────────────────────────────────────────────────
    store.refreshReadiness();

    // ── 7. Phase progression ──────────────────────────────────────────────────
    const afterUpdate = useInterviewStore.getState();
    if (!afterUpdate.crisisDetected) {
      if (afterUpdate.inventoryReadiness.allMet && !afterUpdate.inventoryTriggered) {
        store.setPhase('inventory');
        store.setInventoryTriggered(true);
      } else if (afterUpdate.phase === 'opening') {
        store.setPhase('exploration');
      }
    }

    // ── 8. History + narrative trend ──────────────────────────────────────────
    // Guardamos en el historial con el afecto como contexto si está disponible
    const historyContent = affectValence
      ? `[me siento ${AFFECT_LABELS[affectValence]}] ${text}`
      : text;
    store.addToHistory('user', historyContent);

    const withHistory = useInterviewStore.getState();
    store.setNarrativeTrend(
      detectNarrativeTrend(withHistory.conversationHistory, withHistory.affectHistory),
    );

    // ── 9. Build dynamic system prompt ────────────────────────────────────────
    const current     = useInterviewStore.getState();
    const turnCount   = current.conversationHistory.filter((m) => m.role === 'user').length;
    const techniqueGuidance = await buildInterviewTechniqueContext(current.detectedThemes);
    const systemPrompt = buildSystemPrompt(
      current.phase,
      turnCount,
      current.beck,
      current.emotionalTone,
      current.emotionalIntensity,
      current.rapportScore,
      current.inventoryReadiness,
      current.crisisDetected,
      current.affectHistory,
      affectValence,
      techniqueGuidance,
    );

    // ── 10. Typing delay ──────────────────────────────────────────────────────
    onTyping(true);
    await new Promise((r) => setTimeout(r, 700 + Math.random() * 600));
    onTyping(false);

    // ── 11. API call ──────────────────────────────────────────────────────────
    let response: Response;
    try {
      response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: systemPrompt,
          messages: current.conversationHistory,
          max_tokens: 500, // Más tokens para incluir las opciones
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

    // ── 12. SSE streaming ─────────────────────────────────────────────────────
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
            // Durante streaming mostramos solo el texto del terapeuta (antes del delimitador)
            const { text: displayText } = parseStructuredResponse(fullText);
            onChunk(displayText);
          }
        } catch { /* ignore malformed SSE */ }
      }
    }
    reader.releaseLock();

    // ── 13. Parse structured response ─────────────────────────────────────────
    const { text: responseText, options } = parseStructuredResponse(fullText);

    // ── 14. Store response ────────────────────────────────────────────────────
    useInterviewStore.getState().addToHistory('assistant', responseText);
    // Reset el último afecto para el próximo turno
    useInterviewStore.getState().setLastAffectValence(null);

    const final  = useInterviewStore.getState();
    const signal = getSignalConfig(final.phase, final.emotionalTone, final.crisisDetected);
    onComplete(responseText, signal, options);
    isStreaming.current = false;
  }, []);

  // ── Show report button ────────────────────────────────────────────────────

  const shouldShowReportButton = useCallback((): boolean => {
    const { beck, bdi } = useInterviewStore.getState();
    const coveredAreas  = Object.values(beck).filter((v) => v.status !== 'pending').length;
    return coveredAreas >= 3 || bdi.done;
  }, []);

  // ── Generate clinical hypothesis ──────────────────────────────────────────

  const generateHypothesis = useCallback(async (): Promise<void> => {
    const store = useInterviewStore.getState();
    if (store.hypothesis) return;

    store.setIsGeneratingHypothesis(true);
    store.setAnalysisStage('hypothesis');

    const beckContext = (Object.entries(store.beck) as [BeckKey, BeckAreaState][])
      .map(([k, v]) => {
        const label = {
          symptoms: 'Síntomas', history: 'Historia', functioning: 'Funcionamiento',
          personal: 'Rasgos personales', strengths: 'Fortalezas',
        }[k];
        const phrases = v.keyPhrases.length > 0
          ? ` — frases: "${v.keyPhrases.join('" / "')}"`
          : '';
        return `${label}: ${v.status}${phrases}`;
      })
      .join('\n');

    const affectSummary = buildAffectSummary(store.affectHistory);

    const context = [
      `Cobertura Beck:\n${beckContext}`,
      `Tono narrativo: ${store.emotionalTone} | Intensidad: ${store.emotionalIntensity}/5 | Rapport: ${store.rapportScore.toFixed(1)}/5`,
      `Tendencia narrativa: ${store.narrativeTrend}`,
      `Trayectoria afectiva (auto-reporte): ${affectSummary}`,
      `Temas detectados: ${store.detectedThemes.join(', ') || 'no especificados'}`,
      store.bdi.done
        ? `BDI-II: ${store.bdi.score} puntos (${
            store.bdi.score <= 13 ? 'depresión mínima' :
            store.bdi.score <= 19 ? 'depresión leve'   :
            store.bdi.score <= 28 ? 'depresión moderada' : 'depresión grave'
          })`
        : '',
      store.bai.done ? `BAI: ${store.bai.score} puntos` : '',
      store.clinicalAlerts.riskFlag ? '⚠ Ítem 9 positivo — ideación suicida reportada' : '',
      store.clinicalAlerts.neurovegetative ? 'Síntomas neurovegetativos presentes (ítems 15/16/18/20)' : '',
      store.clinicalAlerts.socialDesirability
        ? 'Posible deseabilidad social — respuestas mínimas con alta carga emocional'
        : '',
      await buildInterviewTechniqueContext(store.detectedThemes),
    ].filter(Boolean).join('\n');

    try {
      // Generar hipótesis
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: `Sos un clínico experto en TCC. Redactá una hipótesis clínica inicial (4–5 oraciones) en prosa continua, sin bullet points. Este texto es para el TERAPEUTA — usá lenguaje técnico clínico. Incluí: (1) área de presentación principal con evidencia de las frases del paciente, (2) posibles variables de mantenimiento cognitivo-conductuales, (3) alertas prioritarias si existen, (4) interpretación de la trayectoria afectiva auto-reportada, (5) foco tentativo de evaluación o intervención. NO uses el formato ---opciones.`,
          messages: [
            ...store.conversationHistory.slice(-8),
            { role: 'user', content: `Generá la hipótesis clínica inicial con estos datos:\n${context}` },
          ],
          max_tokens: 500,
        }),
      });
      if (response.ok) {
        const reader  = response.body!.getReader();
        const decoder = new TextDecoder();
        let text = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const line of decoder.decode(value).split('\n')) {
            if (!line.startsWith('data: ')) continue;
            try {
              const p = JSON.parse(line.slice(6)) as { type?: string; delta?: { text?: string } };
              if (p.type === 'content_block_delta' && p.delta?.text) text += p.delta.text;
            } catch { /* ignore */ }
          }
        }
        reader.releaseLock();
        const cleanText = text.split('\n---')[0].trim();
        if (cleanText) store.setHypothesis(cleanText);
      }

      // Generar Análisis Funcional
      store.setAnalysisStage('abc');
      const abcResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: `Sos un clínico experto en TCC. Basado en los datos de la entrevista, identifica los Antecedentes (A), Conductas (B) y Consecuencias (C) principales que mantienen el problema actual. Devuelve en formato JSON: {"antecedents": ["A1", "A2"], "behaviors": ["B1", "B2"], "consequences": ["C1", "C2"]}. Sé específico y clínico.`,
          messages: [
            { role: 'user', content: `Datos de la entrevista:\n${context}` },
          ],
          max_tokens: 300,
        }),
      });
      if (abcResponse.ok) {
        const abcReader = abcResponse.body!.getReader();
        const abcDecoder = new TextDecoder();
        let abcText = '';
        while (true) {
          const { done, value } = await abcReader.read();
          if (done) break;
          for (const line of abcDecoder.decode(value).split('\n')) {
            if (!line.startsWith('data: ')) continue;
            try {
              const p = JSON.parse(line.slice(6)) as { type?: string; delta?: { text?: string } };
              if (p.type === 'content_block_delta' && p.delta?.text) abcText += p.delta.text;
            } catch { /* ignore */ }
          }
        }
        abcReader.releaseLock();
        try {
          const abcData = JSON.parse(abcText.split('\n---')[0].trim());
          if (abcData.antecedents && abcData.behaviors && abcData.consequences) {
            store.setFunctionalAnalysis(abcData);
          }
        } catch { /* ignore */ }
      }

      // Generar Historia de Aprendizaje
      store.setAnalysisStage('history');
      const historyResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: `Sos un clínico experto en TCC. Basado en los datos, redacta una breve historia de aprendizaje (2-3 oraciones) sobre cómo se formaron las creencias nucleares del paciente. Enfócate en experiencias pasadas que llevaron a creencias como "No soy digno de amor" o similares.`,
          messages: [
            { role: 'user', content: `Datos de la entrevista:\n${context}` },
          ],
          max_tokens: 200,
        }),
      });
      if (historyResponse.ok) {
        const historyReader = historyResponse.body!.getReader();
        const historyDecoder = new TextDecoder();
        let historyText = '';
        while (true) {
          const { done, value } = await historyReader.read();
          if (done) break;
          for (const line of historyDecoder.decode(value).split('\n')) {
            if (!line.startsWith('data: ')) continue;
            try {
              const p = JSON.parse(line.slice(6)) as { type?: string; delta?: { text?: string } };
              if (p.type === 'content_block_delta' && p.delta?.text) historyText += p.delta.text;
            } catch { /* ignore */ }
          }
        }
        historyReader.releaseLock();
        const cleanHistory = historyText.split('\n---')[0].trim();
        if (cleanHistory) store.setLearningHistory(cleanHistory);
      }

    } catch { /* silently fail */ }

    store.setIsGeneratingHypothesis(false);
    store.setAnalysisStage('complete');
  }, []);

  // ── Complete interview ────────────────────────────────────────────────────

  const completeInterview = useCallback((): void => {
    const store = useInterviewStore.getState();

    // Exportar datos clínicos completos al sessionStore
    try {
      const sessionData = store.buildSessionData();
      const sessionStore = useSessionStore.getState() as {
        setChiefComplaint?: (v: string) => void;
        setInterviewData?: (v: typeof sessionData) => void;
      };
      if (typeof sessionStore.setChiefComplaint === 'function') {
        sessionStore.setChiefComplaint(sessionData.chiefComplaint);
      }
      if (typeof sessionStore.setInterviewData === 'function') {
        sessionStore.setInterviewData(sessionData);
      }
      // Guardar también en localStorage con clave de sesión para acceso futuro
      localStorage.setItem(
        `homeflow-session-${sessionData.startedAt}`,
        JSON.stringify(sessionData),
      );

      // Persistir conversación en IndexedDB para el historial
      import('../../db/conversationOps').then(({ saveInterviewAsConversation }) => {
        saveInterviewAsConversation({
          startedAt: sessionData.startedAt,
          messages: store.messages.map((m) => ({
            role: m.role,
            text: m.text,
            timestamp: m.timestamp,
          })),
          hypothesis: sessionData.hypothesis,
          chiefComplaint: sessionData.chiefComplaint,
          clinicalAlerts: sessionData.clinicalAlerts as unknown as Record<string, unknown>,
          bdiScore: sessionData.bdi?.score,
          baiScore: sessionData.bai?.score,
        }).catch(() => { /* silently fail */ });
      });
    } catch { /* sessionStore may not have all fields yet */ }

    navigate('/session/assessment');
  }, [navigate]);

  return { isStreaming, processUserMessage, shouldShowReportButton, generateHypothesis, completeInterview };
}
