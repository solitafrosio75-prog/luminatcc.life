/**
 * ReportModal — Reporte de primera entrevista con 4 capas integradas:
 *
 * 1. Alertas clínicas prioritarias  (ítem 9, neurovegetativos, deseabilidad social)
 * 2. Cuadro de Conexiones            (frases literales del paciente por área Beck)
 * 3. Puntajes de inventarios         (BDI-II / BAI con criterios de corte)
 * 4. Hipótesis clínica inicial       (generada por IA, lenguaje técnico para el terapeuta)
 * 
 * MEJORAS v3:
 * - Barra de progreso durante análisis de datos
 * - Visualización detallada de resultados de inventarios
 * - Explicación del proceso de análisis y formulación de hipótesis
 */

import { useState, useEffect } from 'react';
import { useInterviewStore } from '../interviewStore';
import type { BeckKey, BeckAreaState, AnalysisStage } from '../interviewStore';

// ── Labels ────────────────────────────────────────────────────────────────────

const BECK_LABELS: Record<BeckKey, string> = {
  symptoms:    'Síntomas actuales',
  history:     'Historia clínica',
  functioning: 'Funcionamiento',
  personal:    'Rasgos personales',
  strengths:   'Recursos y fortalezas',
};

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  done:    { label: 'Cubierto',  cls: 'text-amber-400 bg-amber-950/40 border-amber-900/30' },
  partial: { label: 'Parcial',   cls: 'text-orange-400 bg-orange-950/40 border-orange-900/30' },
  pending: { label: 'Pendiente', cls: 'text-slate-600 bg-slate-800/40 border-slate-800' },
};

// Ítems críticos del BDI-II para mostrar en detalle
const BDI_ITEMS = [
  { n: 1, label: 'Tristeza' },
  { n: 2, label: 'Pesimismo' },
  { n: 3, label: 'Fracaso' },
  { n: 4, label: 'Pérdida de placer' },
  { n: 5, label: 'Sentimientos de culpa' },
  { n: 6, label: 'Sentimientos de castigo' },
  { n: 7, label: 'Disconformidad con uno mismo' },
  { n: 8, label: 'Autocrítica' },
  { n: 9, label: 'Pensamientos suicidas' },
  { n: 10, label: 'Llanto' },
  { n: 11, label: 'Agitación' },
  { n: 12, label: 'Pérdida de interés' },
  { n: 13, label: 'Indecisión' },
  { n: 14, label: 'Desvalorización' },
  { n: 15, label: 'Pérdida de energía' },
  { n: 16, label: 'Cambios en el sueño' },
  { n: 17, label: 'Irritabilidad' },
  { n: 18, label: 'Cambios en el apetito' },
  { n: 19, label: 'Dificultad de concentración' },
  { n: 20, label: 'Cansancio o fatiga' },
  { n: 21, label: 'Pérdida de interés en el sexo' },
];

const BAI_ITEMS = [
  { n: 1, label: 'Entumecimiento u hormigueo' },
  { n: 2, label: 'Sensación de calor' },
  { n: 3, label: 'Temblor en las piernas' },
  { n: 4, label: 'Incapacidad para relajarse' },
  { n: 5, label: 'Miedo a que ocurra lo peor' },
  { n: 6, label: 'Mareo o aturdimiento' },
  { n: 7, label: 'Palpitaciones o taquicardia' },
  { n: 8, label: 'Desorientación' },
  { n: 9, label: 'Temor a perder el control' },
  { n: 10, label: 'Dificultad para respirar' },
  { n: 11, label: 'Miedo a morir' },
  { n: 12, label: 'Miedo a quedarse solo' },
  { n: 13, label: 'Indigestión' },
  { n: 14, label: 'Sensación de debilidad' },
  { n: 15, label: 'Temblor en las manos' },
  { n: 16, label: 'Inestabilidad' },
  { n: 17, label: 'Náuseas o malestar estomacal' },
  { n: 18, label: 'Sensación de vacío' },
  { n: 19, label: 'Sensación de bloque' },
  { n: 20, label: 'Sofocos' },
  { n: 21, label: 'Escalofríos' },
  { n: 22, label: 'Sequedad de boca' },
  { n: 23, label: 'Dificultad para tragar' },
];

function bdiCategory(score: number): { label: string; cls: string } {
  if (score <= 13) return { label: 'Depresión mínima (0–13)',    cls: 'text-emerald-400' };
  if (score <= 19) return { label: 'Depresión leve (14–19)',     cls: 'text-amber-400'   };
  if (score <= 28) return { label: 'Depresión moderada (20–28)', cls: 'text-orange-400'  };
  return              { label: 'Depresión grave (29–63)',        cls: 'text-red-400'     };
}

function baiCategory(score: number): { label: string; cls: string } {
  if (score <= 7)  return { label: 'Ansiedad mínima (0–7)',      cls: 'text-emerald-400' };
  if (score <= 15) return { label: 'Ansiedad leve (8–15)',       cls: 'text-amber-400'   };
  if (score <= 25) return { label: 'Ansiedad moderada (16–25)',  cls: 'text-orange-400'  };
  return              { label: 'Ansiedad grave (26–63)',         cls: 'text-red-400'     };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] uppercase tracking-widest text-slate-600 font-medium mb-3">
      {children}
    </h3>
  );
}

// Componente de barra de progreso de análisis
function AnalysisProgressBar({ stage }: { stage: string }) {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    // Animación de progreso
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 90) return p;
        return p + Math.random() * 15;
      });
    }, 400);
    return () => clearInterval(interval);
  }, []);

  const stageLabels: Record<string, string> = {
    'hypothesis': 'Sintetizando hipótesis clínica',
    'abc': 'Analizando modelo ABC',
    'history': 'Explorando historia de aprendizaje',
    'complete': 'Análisis completado',
  };

  return (
    <div className="bg-slate-800/30 rounded-xl px-4 py-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
        <p className="text-sm text-slate-400">{stageLabels[stage] || 'Analizando datos...'}</p>
      </div>
      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <p className="text-xs text-slate-600">
        Integrando datos cualitativos del chat con puntajes de inventarios...
      </p>
    </div>
  );
}

// Componente de resultado detallado de inventario
function InventoryDetail({ 
  type, 
  score, 
  items, 
  itemAnswers 
}: { 
  type: 'bdi' | 'bai'; 
  score: number; 
  items: { n: number; label: string }[];
  itemAnswers: Record<number, number>;
}) {
  const [expanded, setExpanded] = useState(false);
  const highItems = items.filter(i => (itemAnswers[i.n] ?? 0) >= 2);
  const criticalItems = type === 'bdi' 
    ? [9]  // Ítem 9 de BDI es el de ideación suicida
    : [5, 9, 10, 11, 12, 13, 14, 21]; // Ítems de riesgo en BAI

  return (
    <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl overflow-hidden">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-300">
            {type === 'bdi' ? 'BDI-II' : 'BAI'}
          </span>
          {highItems.length > 0 && (
            <span className="px-2 py-0.5 bg-orange-900/40 border border-orange-800/40 rounded-full text-[10px] text-orange-400">
              {highItems.length} ítems elevados
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-slate-200">{score}</span>
          <svg 
            className={`w-4 h-4 text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      
      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-800/50">
          <div className="grid grid-cols-2 gap-1 mt-3">
            {items.map(item => {
              const value = itemAnswers[item.n] ?? 0;
              const isCritical = criticalItems.includes(item.n);
              const isHigh = value >= 2;
              return (
                <div 
                  key={item.n}
                  className={`flex items-center justify-between px-2 py-1.5 rounded text-xs ${
                    isCritical ? 'bg-red-900/20 border border-red-800/30' :
                    isHigh ? 'bg-orange-900/20 border border-orange-800/30' :
                    'bg-slate-900/40'
                  }`}
                >
                  <span className={isCritical ? 'text-red-400' : isHigh ? 'text-orange-400' : 'text-slate-500'}>
                    {item.n}. {item.label.length > 18 ? item.label.slice(0, 18) + '...' : item.label}
                  </span>
                  <span className={`font-medium ${isCritical ? 'text-red-400' : isHigh ? 'text-orange-400' : 'text-slate-400'}`}>
                    {value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function ReportModal({ isOpen, onClose, onComplete }: ReportModalProps) {
  const {
    beck, bdi, bai, clinicalAlerts,
    emotionalTone, emotionalIntensity, rapportScore,
    narrativeTrend, detectedThemes, phase, hypothesis,
    functionalAnalysis, learningHistory, isGeneratingHypothesis,
    analysisStage,
  } = useInterviewStore();

  if (!isOpen) return null;

  const beckEntries = Object.entries(beck) as [BeckKey, BeckAreaState][];
  const hasAnyAlert =
    clinicalAlerts.riskFlag     ||
    clinicalAlerts.crisisAlert  ||
    clinicalAlerts.neurovegetative ||
    clinicalAlerts.socialDesirability;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-sm font-medium text-slate-200">Reporte de Primera Entrevista</h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Evaluación cognitivo-conductual · Modelo de Beck · Para uso del terapeuta
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-400 hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-7">

          {/* ── Introducción al proceso de análisis ────────────────────────────── */}
          <section>
            <SectionHeader>Proceso de Análisis y Formulación de Hipótesis</SectionHeader>
            <div className="bg-slate-800/40 rounded-xl px-4 py-4 text-sm text-slate-300 leading-relaxed space-y-3">
              <p>
                Este reporte integra <strong className="text-amber-400">datos cualitativos</strong> de la conversación 
                (frases literales, tono emocional, trayectoria afectiva, tendencias narrativas) con 
                <strong className="text-amber-400">datos cuantitativos</strong> de los inventarios 
                (puntajes BDI-II/BAI, ítems críticos, rangos clínicos).
              </p>
              <div className="border-t border-slate-700/50 pt-3 mt-3">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Etapas del análisis:</p>
                <ul className="text-xs text-slate-400 space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">1.</span>
                    <span><strong className="text-slate-300">Cuadro de Conexiones:</strong> Síntesis de las 5 áreas de Beck — qué información se obtuvo, qué falta, y las frases literales del paciente como evidencia.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">2.</span>
                    <span><strong className="text-slate-300">Análisis Funcional (ABC):</strong> Identificación de Antecedentes, Conductas y Consecuencias que mantienen el problema actual — el modelo E-O-R-K-C.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">3.</span>
                    <span><strong className="text-slate-300">Historia de Aprendizaje:</strong> Exploración de cómo se formaron las creencias nucleares (ej. "No soy digno de amor") a partir de experiencias pasadas.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">4.</span>
                    <span><strong className="text-slate-300">Hipótesis Clínica:</strong> Síntesis integradora que propone el foco tentativo de intervención basado en el modelo TCC de Beck.</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* ── CAPA 1: Alertas clínicas (prioridad si hay flags) ─────────── */}
          {hasAnyAlert && (
            <section>
              <SectionHeader>Alertas clínicas</SectionHeader>
              <div className="space-y-2">

                {clinicalAlerts.crisisAlert && (
                  <div className="flex items-start gap-3 px-4 py-3 bg-red-950/50 border border-red-800/50 rounded-xl">
                    <span className="text-red-400 text-sm mt-0.5 shrink-0">🔴</span>
                    <div>
                      <p className="text-xs font-semibold text-red-300 mb-0.5">Ideación suicida activa — Ítem 9 BDI-II (score ≥ 2)</p>
                      <p className="text-xs text-red-400/80">Se recomienda evaluación de riesgo inmediata. Verificar red de apoyo y plan de seguridad.</p>
                    </div>
                  </div>
                )}

                {!clinicalAlerts.crisisAlert && clinicalAlerts.riskFlag && (
                  <div className="flex items-start gap-3 px-4 py-3 bg-orange-950/40 border border-orange-900/40 rounded-xl">
                    <span className="text-orange-400 text-sm mt-0.5 shrink-0">🟠</span>
                    <div>
                      <p className="text-xs font-semibold text-orange-300 mb-0.5">Ideación suicida pasiva — Ítem 9 BDI-II (score = 1)</p>
                      <p className="text-xs text-orange-400/80">Monitorear en próximas sesiones. Evaluar factores de protección.</p>
                    </div>
                  </div>
                )}

                {clinicalAlerts.neurovegetative && (
                  <div className="flex items-start gap-3 px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl">
                    <span className="text-amber-500/70 text-sm mt-0.5 shrink-0">◆</span>
                    <div>
                      <p className="text-xs font-semibold text-slate-300 mb-0.5">Síntomas neurovegetativos presentes</p>
                      <p className="text-xs text-slate-500">Ítems de energía (15), sueño (16), apetito (18) y fatiga (20) con puntuación elevada.</p>
                    </div>
                  </div>
                )}

                {clinicalAlerts.socialDesirability && (
                  <div className="flex items-start gap-3 px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl">
                    <span className="text-blue-400/70 text-sm mt-0.5 shrink-0">◇</span>
                    <div>
                      <p className="text-xs font-semibold text-slate-300 mb-0.5">Posible deseabilidad social</p>
                      <p className="text-xs text-slate-500">Respuestas mínimas en el inventario con alta carga emocional en el chat. Considerar re-exploración en próxima sesión.</p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ── CAPA 2: Cuadro de Conexiones ─────────────────────────────── */}
          <section>
            <SectionHeader>Cuadro de Conexiones — evidencia por área Beck</SectionHeader>
            <div className="space-y-3">
              {beckEntries.map(([key, area]) => {
                const badge = STATUS_BADGE[area.status] ?? STATUS_BADGE.pending;
                return (
                  <div key={key} className="border border-slate-800/60 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/30">
                      <span className="text-xs font-medium text-slate-300">{BECK_LABELS[key]}</span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>
                    {area.keyPhrases.length > 0 ? (
                      <div className="px-4 py-2.5 space-y-1.5 bg-slate-900/60">
                        {area.keyPhrases.map((phrase, i) => (
                          <p key={i} className="text-xs text-slate-500 italic before:content-['\u201c'] after:content-['\u201d']">
                            {phrase}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-2 bg-slate-900/40">
                        <p className="text-xs text-slate-700 italic">Sin cobertura registrada</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── CAPA 3: Puntajes de inventarios ──────────────────────────── */}
          {(bdi.done || bai.done) && (
            <section>
              <SectionHeader>Inventarios — resultados detallados</SectionHeader>
              <div className="space-y-3">

                {bdi.done && (
                  <InventoryDetail
                    type="bdi"
                    score={bdi.score}
                    items={BDI_ITEMS}
                    itemAnswers={bdi.itemAnswers}
                  />
                )}

                {bai.done && (
                  <InventoryDetail
                    type="bai"
                    score={bai.score}
                    items={BAI_ITEMS}
                    itemAnswers={bai.itemAnswers}
                  />
                )}
              </div>
            </section>
          )}

          {/* ── Métricas cualitativas ─────────────────────────────────────── */}
          <section>
            <SectionHeader>Datos cualitativos de la entrevista</SectionHeader>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[
                { label: 'Tono',       value: emotionalTone === 'unknown' ? '—' : emotionalTone },
                { label: 'Intensidad', value: `${emotionalIntensity}/5` },
                { label: 'Tendencia',  value: narrativeTrend === 'unknown' ? '—' : narrativeTrend },
                { label: 'Fase final', value: phase },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-800/40 rounded-xl px-3 py-3">
                  <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">{label}</p>
                  <p className="text-sm text-slate-300 font-medium">{value}</p>
                </div>
              ))}
            </div>

            {/* Rapport */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] text-slate-700 uppercase tracking-wider">Rapport</span>
                <span className="text-[10px] text-slate-700">{rapportScore.toFixed(1)} / 5</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-600 rounded-full transition-all duration-700"
                  style={{ width: `${rapportScore * 20}%` }}
                />
              </div>
            </div>

            {/* Themes */}
            {detectedThemes.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {detectedThemes.map((theme) => (
                  <span
                    key={theme}
                    className="px-2.5 py-1 bg-slate-800/60 border border-slate-700/50 rounded-full text-[10px] text-slate-500 capitalize"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* ── CAPA 5: Análisis Funcional (ABC) ────────────────────────────── */}
          <section>
            <SectionHeader>Análisis Funcional — ABC</SectionHeader>
            {functionalAnalysis ? (
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 mb-2">Antecedentes (A)</h4>
                  <ul className="text-sm text-slate-400 space-y-1">
                    {functionalAnalysis.antecedents.map((a, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">•</span>
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 mb-2">Conductas (B)</h4>
                  <ul className="text-sm text-slate-400 space-y-1">
                    {functionalAnalysis.behaviors.map((b, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">•</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 mb-2">Consecuencias (C)</h4>
                  <ul className="text-sm text-slate-400 space-y-1">
                    {functionalAnalysis.consequences.map((c, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">•</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="bg-slate-800/20 rounded-xl px-4 py-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse shrink-0" />
                <p className="text-sm text-slate-600">Analizando variables de mantenimiento…</p>
              </div>
            )}
          </section>

          {/* ── CAPA 6: Historia de Aprendizaje ──────────────────────────────── */}
          <section>
            <SectionHeader>Historia de Aprendizaje</SectionHeader>
            {learningHistory ? (
              <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl px-4 py-4">
                <p className="text-sm text-slate-300 leading-relaxed">{learningHistory}</p>
              </div>
            ) : (
              <div className="bg-slate-800/20 rounded-xl px-4 py-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse shrink-0" />
                <p className="text-sm text-slate-600">Explorando formación de creencias…</p>
              </div>
            )}
          </section>

          {/* ── CAPA 7: Hipótesis clínica (IA, lenguaje técnico) ──────────── */}
          <section>
            <SectionHeader>Hipótesis clínica preliminar</SectionHeader>
            {isGeneratingHypothesis ? (
              <AnalysisProgressBar stage={analysisStage} />
            ) : hypothesis ? (
              <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl px-4 py-4">
                <p className="text-sm text-slate-300 leading-relaxed">{hypothesis}</p>
              </div>
            ) : (
              <div className="bg-slate-800/20 rounded-xl px-4 py-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse shrink-0" />
                <p className="text-sm text-slate-600">Generando hipótesis clínica…</p>
              </div>
            )}
          </section>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 shrink-0 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-400 transition-colors"
          >
            Continuar entrevista
          </button>
          <button
            onClick={onComplete}
            className="px-5 py-2 bg-amber-700 hover:bg-amber-600 rounded-xl text-sm font-medium text-white transition-colors"
          >
            Iniciar protocolo TCC →
          </button>
        </div>

      </div>
    </div>
  );
}
