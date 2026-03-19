/**
 * InterviewScreen.tsx
 * Módulo de primera entrevista clínica — v2
 *
 * Novedades vs v1:
 *   - AffectSelector: check-in emocional antes de cada respuesta
 *   - Chips contextuales generados por la IA (4 opciones socráticas por turno)
 *   - Transiciones automáticas de fase: BDI-II → BAI → Reporte sin acción manual
 *   - Persistencia de datos clínicos (localStorage + sessionStore)
 *   - Motor de rapport y readiness corregido para respuestas por chip
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import clsx from 'clsx';
import { useInterviewStore } from './interviewStore';
import { useInterview } from './useInterview';
import { ChatBubble, TypingIndicator, useChatScroll } from './components/ChatBubble';
import { InventoryOverlay } from './components/InventoryOverlay';
import { ReportModal } from './components/ReportModal';
import { AffectSelector } from './components/AffectSelector';
import { downloadSession } from './exportSession';
import type { ChatMessage, InventoryType, AffectValence } from './interviewStore';

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2);
}

const BECK_LABELS = ['Síntomas', 'Historia', 'Funcionam.', 'Personal', 'Fortalezas'];

// ── Component ─────────────────────────────────────────────────────────────────

export function InterviewScreen() {

  // ── UI state ──────────────────────────────────────────────────────────────
  const [inputValue,    setInputValue]    = useState('');
  const [isTyping,      setIsTyping]      = useState(false);
  const [streamingId,   setStreamingId]   = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const [showReport,    setShowReport]    = useState(false);
  const [reportReady,   setReportReady]   = useState(false);

  // Chips generados por la IA
  const [aiOptions, setAiOptions] = useState<string[]>([]);

  // Afecto seleccionado por el paciente (se resetea tras cada envío)
  const [selectedAffect, setSelectedAffect] = useState<AffectValence | null>(null);

  // Flags para transiciones automáticas
  const bdiAutoQueued = useRef(false);
  const baiAutoQueued = useRef(false);
  const reportAutoQueued = useRef(false);

  // ── Store ──────────────────────────────────────────────────────────────────
  const store = useInterviewStore();
  const {
    messages, beck, rapportScore, emotionalTone, emotionalIntensity,
    phase, bdi, bai, setCurrentInventory, crisisDetected, updateClinicalAlerts,
    affectHistory,
  } = store;

  // ── Clinical hook ──────────────────────────────────────────────────────────
  const interview = useInterview();

  // ── Scroll ─────────────────────────────────────────────────────────────────
  const chatRef     = useChatScroll([messages, isTyping, streamingText]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Beck progress metrics ──────────────────────────────────────────────────
  const beckKeys = Object.keys(beck) as (keyof typeof beck)[];
  const beckDone = beckKeys.filter((k) => beck[k].status !== 'pending').length;

  // ── Initialize welcome message ────────────────────────────────────────────
  useEffect(() => {
    if (useInterviewStore.getState().messages.length === 0) {
      const welcome: ChatMessage = {
        id: uid(), role: 'sys', timestamp: Date.now(),
        text: 'Hola. Bienvenido/a.\n\nEste es un espacio para escucharte. No hay apuro ni respuestas incorrectas.\n\n¿Qué te trajo hasta acá?',
        signal: { color: '#b8956a', text: 'bienvenida · primera entrevista' },
      };
      store.addMessage(welcome);
      // Opciones iniciales: baja demanda cognitiva, socráticas
      setAiOptions([
        'No sé muy bien cómo empezar',
        'Me cuesta hablar de esto',
        'Vengo hace un tiempo sintiéndome mal',
        'Alguien me recomendó buscar ayuda',
      ]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-transitions: BDI → BAI → Report ─────────────────────────────────
  useEffect(() => {
    // BDI completado → auto-trigger BAI después de un breve intercambio
    if (bdi.done && !bai.done && !baiAutoQueued.current && !useInterviewStore.getState().baiTriggered) {
      baiAutoQueued.current = true;
      setTimeout(() => {
        if (!useInterviewStore.getState().baiTriggered) {
          store.setBaiTriggered(true);
          setCurrentInventory('bai');
        }
      }, 1800); // Breve pausa para que el paciente lea el mensaje de cierre del BDI
    }

    // BAI completado → auto-generar hipótesis y mostrar reporte
    if (bai.done && !reportAutoQueued.current) {
      reportAutoQueued.current = true;
      setReportReady(true);
      // Auto-generar hipótesis en segundo plano
      interview.generateHypothesis().then(() => {
        // Auto-abrir reporte tras 2 segundos
        setTimeout(() => setShowReport(true), 2000);
      });
      // IMPORTANTE: Después del BAI, el sistema debe continuar con integración
      // No terminamos la entrevista - permitimos que el especialista revise el reporte
      // y luego pueda continuar con más exploración si es necesario
    }
  }, [bdi.done, bai.done]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text: string, fromChip = false) => {
    if (!text.trim() || interview.isStreaming.current) return;

    const affect = selectedAffect;
    setSelectedAffect(null);
    setAiOptions([]);

    const userMsg: ChatMessage = {
      id: uid(), role: 'usr', timestamp: Date.now(), text: text.trim(), fromChip,
    };
    store.addMessage(userMsg);
    setInputValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const msgId = uid();
    setStreamingId(msgId);
    setStreamingText('');

    await interview.processUserMessage(
      text.trim(),
      (typing) => {
        setIsTyping(typing);
        if (!typing) setStreamingText('');
      },
      (chunk) => setStreamingText(chunk),
      (reply, signal, options) => {
        setStreamingId(null);
        setStreamingText('');
        if (reply) {
          store.addMessage({ id: msgId, role: 'sys', timestamp: Date.now(), text: reply, signal });
        }

        const s = useInterviewStore.getState();

        if (s.crisisDetected) {
          // Opciones de crisis — no AI-generated, fijas por seguridad
          setAiOptions([
            'Necesito ayuda ahora mismo',
            'Quiero seguir hablando',
            'No estoy en peligro, pero lo estuve',
            'Me siento un poco mejor al contarlo',
          ]);
        } else if (s.phase === 'inventory' && !bdiAutoQueued.current) {
          // Propuesta de BDI → opciones de confirmación
          setAiOptions([
            'Sí, de acuerdo',
            'Prefiero seguir hablando un poco más',
            'Me da un poco de miedo responder esas preguntas',
            'Está bien, ¿son muchas preguntas?',
          ]);
        } else if (options.length >= 2) {
          // Opciones generadas por la IA
          setAiOptions(options.slice(0, 4));
        }

        if (interview.shouldShowReportButton()) {
          setReportReady(true);
        }
      },
      affect,
    );
  }, [interview, store, selectedAffect]);

  // ── Chip selection ────────────────────────────────────────────────────────
  async function handleChip(text: string) {
    if (text === 'Sí, de acuerdo') {
      store.addMessage({ id: uid(), role: 'usr', timestamp: Date.now(), text, fromChip: true });
      setAiOptions([]);
      bdiAutoQueued.current = true;
      setCurrentInventory('bdi');
      return;
    }
    if (text === 'Ver el reporte') {
      handleOpenReport();
      return;
    }
    await sendMessage(text, true);
  }

  // ── Report ────────────────────────────────────────────────────────────────
  async function handleOpenReport() {
    setShowReport(true);
    if (!useInterviewStore.getState().hypothesis) {
      await interview.generateHypothesis();
    }
  }

  // ── Inventory complete ────────────────────────────────────────────────────
  function handleInventoryComplete(
    type: InventoryType,
    score: number,
    hasCritical: boolean,
    crisisAlertFlag: boolean,
    itemAnswers: Record<number, number>,
  ): void {
    setCurrentInventory(null);

    if (hasCritical)     updateClinicalAlerts({ riskFlag: true });
    if (crisisAlertFlag) updateClinicalAlerts({ crisisAlert: true });

    if (type === 'bdi') {
      const neuroAvg = [15, 16, 18, 20]
        .map((i) => itemAnswers[i] ?? 0)
        .reduce((a, b) => a + b, 0) / 4;
      if (neuroAvg >= 1.5) updateClinicalAlerts({ neurovegetative: true });

      const vals      = Object.values(itemAnswers);
      const zeroRatio = vals.filter((v) => v === 0).length / vals.length;
      if (zeroRatio > 0.8 && store.emotionalIntensity >= 2) {
        updateClinicalAlerts({ socialDesirability: true });
      }
    }

    let text = '';
    if (type === 'bdi') {
      if (crisisAlertFlag) {
        text = 'Lo que me contaste es importante, y estoy acá con vos. Quiero asegurarme de que estés bien ahora mismo. ¿Podés contarme un poco más sobre cómo te sentís en este momento?';
      } else if (score <= 13) {
        text = 'Gracias por tomarte el tiempo. Me ayudó mucho para entender cómo te estás sintiendo. Voy a hacerte unas preguntas más, breves, sobre sensaciones físicas. ¿Estás?';
      } else if (score <= 19) {
        text = 'Gracias por la honestidad. Veo que hay algunas cosas que te pesan. Te pido un esfuerzo más — unas preguntas cortas sobre el cuerpo y los nervios. ¿Seguimos?';
      } else {
        text = 'Gracias por responder con tanta honestidad. Lo que describís me importa mucho. Antes de que hablemos sobre todo esto, te pido un último cuestionario breve. ¿Podemos?';
      }
    } else {
      // BAI completado → mensaje de cierre, auto-reporte se dispara en useEffect
      text = 'Perfecto. Ya tengo todo lo que necesito para darte una primera imagen de cómo está el panorama. Un momento mientras preparo el resumen…';
    }

    store.addMessage({
      id: uid(), role: 'sys', timestamp: Date.now(), text,
      signal: { color: '#6b9e78', text: `${type.toUpperCase()} completado · puntaje: ${score}` },
    });
    store.setPhase('beck_integration');

    if (type === 'bdi') {
      // Opciones para la transición BDI → BAI
      setTimeout(() => {
        if (crisisAlertFlag) {
          setAiOptions(['Quiero hablar sobre eso', 'Estoy bien, podemos seguir', 'Necesito un momento']);
        } else {
          setAiOptions(['Sí, seguimos', 'Necesito un momento', 'Tengo una pregunta antes']);
        }
      }, 400);
    }
    // Si type === 'bai', el useEffect dispara el reporte automáticamente
  }

  // ── Affect handler ────────────────────────────────────────────────────────
  function handleAffectChange(v: AffectValence | null) {
    setSelectedAffect(v ?? null);
  }

  // ── Input handlers ────────────────────────────────────────────────────────
  function handleTextareaInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInputValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  }

  // ── Indicador de trayectoria afectiva ─────────────────────────────────────
  const affectTrend = affectHistory.length >= 2
    ? affectHistory[affectHistory.length - 1].valence > affectHistory[0].valence
      ? '↑'
      : affectHistory[affectHistory.length - 1].valence < affectHistory[0].valence
        ? '↓'
        : '→'
    : null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 relative">

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-20 bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={clsx(
            'w-2 h-2 rounded-full animate-pulse',
            crisisDetected
              ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
              : 'bg-amber-500 shadow-[0_0_8px_rgba(251,191,36,0.5)]',
          )} />
          <span className="text-sm text-slate-400 font-light">
            {crisisDetected ? 'contención activa' : 'primera entrevista'}
          </span>
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-end">

          {/* Beck progress */}
          <div className="hidden sm:flex items-center gap-1.5" title={`Cobertura Beck: ${beckDone}/5`}>
            {beckKeys.map((key, i) => (
              <div
                key={key}
                title={BECK_LABELS[i]}
                className={clsx(
                  'w-6 h-1.5 rounded-full transition-all duration-500',
                  beck[key].status === 'done'    ? 'bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.4)]' :
                  beck[key].status === 'partial' ? 'bg-orange-500' :
                                                   'bg-slate-800',
                )}
              />
            ))}
          </div>

          {/* Trayectoria afectiva */}
          {affectHistory.length >= 2 && affectTrend && (
            <span
              className="text-[10px] text-slate-600 border border-slate-800 rounded-full px-2 py-0.5 hidden sm:block"
              title={`Trayectoria afectiva (${affectHistory.length} registros)`}
            >
              afecto {affectTrend}
            </span>
          )}

          {messages.length > 1 && (
            <button
              onClick={() => downloadSession(messages)}
              title="Descargar transcripción"
              className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:border-slate-700 transition-colors"
            >
              ↓ Descargar
            </button>
          )}

          {reportReady && (
            <button
              onClick={handleOpenReport}
              className="px-3 py-1.5 bg-blue-950/60 border border-blue-900/30 rounded-lg text-xs text-blue-400 hover:bg-blue-950 transition-colors"
            >
              Ver reporte
            </button>
          )}

          <span className="text-xs text-slate-700 border border-slate-800 rounded-full px-3 py-1 hidden sm:block">
            Entrevista inicial
          </span>
        </div>
      </header>

      {/* ── CHAT ── */}
      <div
        ref={chatRef}
        className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5 scroll-smooth"
      >
        <div className="flex items-center gap-3 opacity-30 my-1">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-xs text-slate-600">
            {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        {messages.map((msg) => (
          <ChatBubble key={msg.id} role={msg.role} text={msg.text} signal={msg.signal} />
        ))}

        {streamingId && <ChatBubble role="sys" text={streamingText} streaming={true} />}
        {isTyping && !streamingId && <TypingIndicator />}
      </div>

      {/* ── ZONA DE RESPUESTA (Selector + Chips + Input) ── */}
      <div className="px-6 pb-6 pt-2 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent flex flex-col gap-3">

        {/* Selector afectivo — solo cuando no hay streaming activo */}
        {!isTyping && !streamingId && messages.some((m) => m.role === 'sys') && (
          <div className="flex items-center">
            <AffectSelector
              value={selectedAffect}
              onChange={(v) => handleAffectChange(v)}
              showLabel={true}
              animate={true}
            />
          </div>
        )}

        {/* Chips / opciones contextuales */}
        {aiOptions.length > 0 && !isTyping && !streamingId && (
          <div className="flex flex-wrap gap-2">
            {aiOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => handleChip(opt)}
                className={clsx(
                  'px-4 py-2 rounded-full text-xs transition-all text-left',
                  'bg-slate-900 border border-slate-800',
                  'hover:border-amber-800/50 hover:text-amber-400 hover:bg-amber-950/20',
                  'text-slate-400',
                  // Chip de crisis: color especial
                  opt.toLowerCase().includes('ayuda') || opt.toLowerCase().includes('peligro')
                    ? 'border-red-900/30 text-red-400/80 hover:border-red-700/50 hover:text-red-300 hover:bg-red-950/20'
                    : '',
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* Input de texto libre */}
        <div className={clsx(
          'flex items-end gap-3 bg-slate-900 border rounded-2xl px-4 py-2 transition-colors',
          'focus-within:border-amber-800/40 focus-within:shadow-[0_0_0_3px_rgba(217,119,6,0.05)]',
          'border-slate-800',
        )}>
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleTextareaInput}
            onKeyDown={handleKeyDown}
            placeholder={
              aiOptions.length > 0
                ? 'O escribí lo que quieras...'
                : 'Escribí lo que quieras...'
            }
            rows={1}
            className="flex-1 bg-transparent text-slate-100 text-sm placeholder:text-slate-700 resize-none focus:outline-none leading-relaxed py-2 max-h-28 min-h-[40px]"
          />
          <button
            onClick={() => sendMessage(inputValue)}
            disabled={!inputValue.trim() || interview.isStreaming.current}
            title="Enviar mensaje"
            className={clsx(
              'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mb-1 transition-all',
              inputValue.trim()
                ? 'bg-amber-600 hover:bg-amber-500 text-white scale-100'
                : 'bg-slate-800 text-slate-700 scale-95',
            )}
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
            </svg>
          </button>
        </div>

        {/* Micro-texto: afecto seleccionado */}
        {selectedAffect !== null && (
          <p className="text-[10px] text-slate-700 px-1">
            Tu estado emocional fue registrado · se enviará con tu próximo mensaje
          </p>
        )}
      </div>

      {/* ── STATUS PANEL (desktop only) ── */}
      <div className="hidden xl:block fixed top-20 right-4 w-52 bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-xs backdrop-blur-sm">
        <p className="text-slate-700 uppercase tracking-widest text-[10px] font-medium mb-3">Motor clínico</p>
        {[
          ['Fase',       phase],
          ['Tono',       emotionalTone === 'unknown' ? '—' : emotionalTone],
          ['Intensidad', `${emotionalIntensity}/5`],
          ['Beck',       `${beckDone}/5`],
          ['BDI-II',     bdi.done ? `${bdi.score} pts` : 'pendiente'],
          ['BAI',        bai.done ? `${bai.score} pts` : 'pendiente'],
          ['Afecto reg.', `${affectHistory.length} turnos`],
        ].map(([label, val]) => (
          <div key={label as string} className="flex justify-between mb-1.5">
            <span className="text-slate-700">{label}</span>
            <span className="text-slate-500 font-medium">{val}</span>
          </div>
        ))}

        <div className="mt-3 h-1 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-600 rounded-full transition-all duration-700"
            style={{ width: `${rapportScore * 20}%` }}
          />
        </div>
        <p className="text-slate-800 text-[10px] text-right mt-1">rapport {rapportScore.toFixed(1)}/5</p>

        {/* Mini gráfica de trayectoria afectiva */}
        {affectHistory.length >= 2 && (
          <div className="mt-3 border-t border-slate-800 pt-3">
            <p className="text-slate-800 text-[10px] mb-2">Trayectoria afectiva</p>
            <div className="flex items-end gap-0.5 h-6">
              {affectHistory.slice(-12).map((entry, i) => (
                <div
                  key={i}
                  className={clsx(
                    'flex-1 rounded-sm transition-all',
                    entry.valence >= 4 ? 'bg-emerald-700' :
                    entry.valence === 3 ? 'bg-slate-600' :
                    entry.valence === 2 ? 'bg-orange-700' : 'bg-rose-800',
                  )}
                  style={{ height: `${(entry.valence / 5) * 100}%` }}
                  title={entry.label}
                />
              ))}
            </div>
          </div>
        )}

        {crisisDetected && (
          <div className="mt-3 px-2 py-1.5 bg-red-950/40 border border-red-900/30 rounded-lg">
            <p className="text-[10px] text-red-400 text-center">⚠ crisis detectada</p>
          </div>
        )}
      </div>

      {/* ── INVENTORY OVERLAY ── */}
      <InventoryOverlay
        onClose={() => setCurrentInventory(null)}
        onComplete={handleInventoryComplete}
      />

      {/* ── REPORT MODAL ── */}
      <ReportModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        onComplete={interview.completeInterview}
      />

    </div>
  );
}
