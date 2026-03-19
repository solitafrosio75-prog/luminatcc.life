import { useState } from 'react';
import { useInterviewStore, type InventoryType } from '../interviewStore';

// ── BDI-II items ──────────────────────────────────────────────────────────────

const BDI_ITEMS = [
  { id: 1,  stem: 'Tristeza', options: ['No me siento triste.', 'Me siento triste gran parte del tiempo.', 'Me siento triste continuamente.', 'Me siento tan triste o tan desgraciado/a que no puedo soportarlo.'] },
  { id: 2,  stem: 'Pesimismo', options: ['No estoy desanimado/a sobre mi futuro.', 'Me siento más desanimado/a sobre mi futuro que antes.', 'No espero que las cosas mejoren.', 'Siento que mi futuro es desesperanzador y que las cosas solo empeorarán.'] },
  { id: 3,  stem: 'Fracaso', options: ['No me siento fracasado/a.', 'He fracasado más de lo que debería.', 'Cuando miro hacia atrás, veo fracaso tras fracaso.', 'Me siento una persona totalmente fracasada.'] },
  { id: 4,  stem: 'Pérdida de placer', options: ['Las cosas me satisfacen tanto como antes.', 'No disfruto de las cosas tanto como antes.', 'Obtengo muy poco placer de las cosas que antes disfrutaba.', 'No obtengo ningún placer de las cosas que antes disfrutaba.'] },
  { id: 5,  stem: 'Sentimientos de culpa', options: ['No me siento especialmente culpable.', 'Me siento culpable de muchas cosas que he hecho o que debería haber hecho.', 'Me siento bastante culpable la mayor parte del tiempo.', 'Me siento culpable constantemente.'] },
  { id: 6,  stem: 'Sentimientos de castigo', options: ['No creo que esté siendo castigado/a.', 'Siento que puedo ser castigado/a.', 'Espero ser castigado/a.', 'Siento que estoy siendo castigado/a.'] },
  { id: 7,  stem: 'Disconformidad con uno mismo', options: ['Tengo la misma opinión sobre mí que antes.', 'He perdido confianza en mí mismo/a.', 'Estoy decepcionado/a de mí mismo/a.', 'No me gusto.'] },
  { id: 8,  stem: 'Autocrítica', options: ['No me critico más que antes.', 'Me critico más que antes.', 'Me critico por todos mis errores.', 'Me culpo por todo lo malo que ocurre.'] },
  {
    id: 9,
    stem: 'Pensamientos o deseos suicidas',
    options: [
      'No tengo ningún pensamiento de suicidio.',
      'Tengo pensamientos de suicidio, pero no los llevaría a cabo.',
      'Me gustaría suicidarme.',
      'Me suicidaría si tuviera la oportunidad.',
    ],
  },
  { id: 10, stem: 'Llanto', options: ['No lloro más que antes.', 'Lloro más que antes.', 'Lloro continuamente.', 'No puedo dejar de llorar aunque quiera.'] },
  { id: 11, stem: 'Agitación', options: ['No me siento más inquieto/a que de costumbre.', 'Me siento más inquieto/a que de costumbre.', 'Estoy tan inquieto/a que me es difícil estar quieto/a.', 'Estoy tan inquieto/a que tengo que estar en continuo movimiento.'] },
  { id: 12, stem: 'Pérdida de interés', options: ['No he perdido el interés por otras personas o actividades.', 'Estoy menos interesado/a que antes en otras personas o actividades.', 'He perdido gran parte del interés en otras personas o actividades.', 'Me es difícil interesarme en algo.'] },
  { id: 13, stem: 'Indecisión', options: ['Tomo mis propias decisiones tan bien como siempre.', 'Me resulta más difícil tomar decisiones que de costumbre.', 'Tengo mucha más dificultad para tomar decisiones que de costumbre.', 'Tengo dificultad para tomar cualquier decisión.'] },
  { id: 14, stem: 'Inutilidad', options: ['No me siento inútil.', 'No me considero tan valioso/a y útil como solía ser.', 'Me siento inútil en comparación con otras personas.', 'Me siento completamente inútil.'] },
  { id: 15, stem: 'Pérdida de energía', options: ['Tengo tanta energía como siempre.', 'Tengo menos energía de la que solía tener.', 'No tengo suficiente energía para hacer demasiado.', 'No tengo suficiente energía para hacer nada.'] },
  { id: 16, stem: 'Cambios en el patrón de sueño', options: ['Mi patrón de sueño no ha cambiado.', 'Duermo algo más/menos que de costumbre.', 'Duermo mucho más/menos que de costumbre.', 'Duermo la mayor parte del día / me despierto 1–2 horas antes de lo habitual.'] },
  { id: 17, stem: 'Irritabilidad', options: ['No estoy más irritable que de costumbre.', 'Estoy más irritable que de costumbre.', 'Estoy mucho más irritable que de costumbre.', 'Estoy irritable continuamente.'] },
  { id: 18, stem: 'Cambios en el apetito', options: ['Mi apetito no ha cambiado.', 'Mi apetito es algo menor/mayor que de costumbre.', 'Mi apetito es mucho menor/mayor que de costumbre.', 'No tengo ningún apetito / tengo un apetito descontrolado.'] },
  { id: 19, stem: 'Dificultad de concentración', options: ['Puedo concentrarme tan bien como siempre.', 'No puedo concentrarme tan bien como siempre.', 'Me resulta difícil concentrarme en algo durante mucho tiempo.', 'No puedo concentrarme en nada.'] },
  { id: 20, stem: 'Cansancio o fatiga', options: ['No estoy más cansado/a que de costumbre.', 'Me canso más fácilmente que de costumbre.', 'Estoy demasiado cansado/a para hacer muchas cosas que antes hacía.', 'Estoy demasiado cansado/a para hacer la mayoría de las cosas que solía hacer.'] },
  { id: 21, stem: 'Pérdida de interés en el sexo', options: ['No he notado ningún cambio en mi interés por el sexo.', 'Estoy menos interesado/a en el sexo que de costumbre.', 'Estoy mucho menos interesado/a en el sexo que de costumbre.', 'He perdido completamente el interés en el sexo.'] },
];

// ── BAI items ─────────────────────────────────────────────────────────────────

const BAI_ITEMS = [
  { id: 1,  stem: 'Sensaciones de calor' },
  { id: 2,  stem: 'Sensación de entumecimiento u hormigueo' },
  { id: 3,  stem: 'Sensación de oscilación del estómago' },
  { id: 4,  stem: 'Incapacidad para relajarse' },
  { id: 5,  stem: 'Miedo a que ocurra lo peor' },
  { id: 6,  stem: 'Sensación de mareo o aturdimiento' },
  { id: 7,  stem: 'Palpitaciones o latidos acelerados' },
  { id: 8,  stem: 'Sensación de inestabilidad' },
  { id: 9,  stem: 'Aterrorizado/a' },
  { id: 10, stem: 'Nerviosismo' },
  { id: 11, stem: 'Sensación de ahogo' },
  { id: 12, stem: 'Temblores de manos' },
  { id: 13, stem: 'Temblores, escalofríos' },
  { id: 14, stem: 'Miedo a perder el control' },
  { id: 15, stem: 'Dificultad para respirar' },
  { id: 16, stem: 'Miedo a morir' },
  { id: 17, stem: 'Asustado/a' },
  { id: 18, stem: 'Indigestión o malestar en el abdomen' },
  { id: 19, stem: 'Desmayos' },
  { id: 20, stem: 'Enrojecimiento de la cara' },
  { id: 21, stem: 'Sudoración (no relacionada con el calor)' },
];

const BAI_OPTIONS = [
  'En absoluto',
  'Levemente (no me molestó mucho)',
  'Moderadamente (fue muy desagradable, pero podía soportarlo)',
  'Gravemente (casi no podía soportarlo)',
];

// ── Component ─────────────────────────────────────────────────────────────────

interface InventoryOverlayProps {
  onClose: () => void;
  onComplete: (
    type: InventoryType,
    score: number,
    hasCritical: boolean,
    crisisAlert: boolean,
    itemAnswers: Record<number, number>,
  ) => void;
}

export function InventoryOverlay({ onClose, onComplete }: InventoryOverlayProps) {
  const store          = useInterviewStore();
  const currentInventory = store.currentInventory;
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [page, setPage]       = useState(0);

  if (!currentInventory) return null;

  const isBdi  = currentInventory === 'bdi';
  const items  = isBdi ? BDI_ITEMS : BAI_ITEMS;
  const ITEMS_PER_PAGE = 7;
  const pageItems  = items.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const answeredOnPage = pageItems.every((item) => answers[item.id] !== undefined);

  function handleSelect(itemId: number, value: number) {
    setAnswers((prev) => ({ ...prev, [itemId]: value }));
  }

  function handleNext() {
    if (page < totalPages - 1) {
      setPage((p) => p + 1);
      return;
    }
    const total      = Object.values(answers).reduce((sum, v) => sum + v, 0);
    const hasCritical  = isBdi ? (answers[9] ?? 0) >= 1 : false;
    const crisisAlert  = isBdi ? (answers[9] ?? 0) >= 2 : false;

    if (isBdi) {
      store.setBdi({ done: true, score: total, hasCritical, crisisAlert, itemAnswers: answers });
    } else {
      store.setBai({ done: true, score: total, itemAnswers: answers });
    }

    onComplete(currentInventory as InventoryType, total, hasCritical, crisisAlert, answers);
    setAnswers({});
    setPage(0);
  }

  // Item 9 crisis alert is shown inline when user selects option 2 or 3
  const item9Answer = answers[9] ?? -1;
  const showCrisisInlineAlert = isBdi && item9Answer >= 2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-sm font-medium text-slate-200">
              {isBdi ? 'Inventario de Depresión de Beck (BDI-II)' : 'Inventario de Ansiedad de Beck (BAI)'}
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              {page + 1} / {totalPages} · Elegí la opción que mejor describe cómo te sentiste en las últimas dos semanas
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-400 hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-slate-800 shrink-0">
          <div
            className="h-full bg-amber-600 transition-all duration-500"
            style={{ width: `${((page + 1) / totalPages) * 100}%` }}
          />
        </div>

        {/* Crisis alert banner — shown at top of page when item 9 is active AND answered 2/3 */}
        {showCrisisInlineAlert && (
          <div className="mx-4 mt-3 px-4 py-3 bg-red-950/50 border border-red-800/50 rounded-xl shrink-0">
            <p className="text-xs text-red-300 font-medium mb-1">Estamos acá con vos.</p>
            <p className="text-xs text-red-400/90 leading-relaxed">
              Si estás pensando en hacerte daño, no tenés que atravesarlo solo/a.
              Podés comunicarte con el <strong className="text-red-300">Centro de Asistencia al Suicida: 135</strong> (gratuito, 24 hs).
            </p>
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {pageItems.map((item) => {
            const isItem9 = isBdi && item.id === 9;
            const itemOptions = isBdi
              ? (item as typeof BDI_ITEMS[0]).options
              : BAI_OPTIONS;

            return (
              <div
                key={item.id}
                className={isItem9 ? 'border border-red-900/30 rounded-xl p-3 -mx-1 bg-red-950/10' : ''}
              >
                <p className={`text-xs font-medium uppercase tracking-wider mb-3 ${
                  isItem9 ? 'text-red-400' : 'text-slate-500'
                }`}>
                  {isItem9 && <span className="mr-1.5 text-red-500">⚠</span>}
                  {item.id}. {item.stem}
                </p>

                <div className="space-y-2">
                  {itemOptions.map((opt, idx) => {
                    const isCriticalOption = isItem9 && idx >= 2;
                    const isSelected = answers[item.id] === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelect(item.id, idx)}
                        className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                          isSelected
                            ? isCriticalOption
                              ? 'bg-red-950/60 border-red-700/60 text-red-200'
                              : 'bg-amber-950/60 border-amber-800/60 text-amber-200'
                            : isCriticalOption
                              ? 'bg-slate-800/40 border-red-900/20 text-slate-400 hover:border-red-800/30 hover:text-red-300'
                              : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                        }`}
                      >
                        <span className={`mr-2 ${isCriticalOption ? 'text-red-800' : 'text-slate-600'}`}>
                          {idx}.
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 shrink-0 flex justify-between items-center">
          <span className="text-xs text-slate-700">
            {Object.keys(answers).length} / {items.length} respondidas
          </span>
          <button
            onClick={handleNext}
            disabled={!answeredOnPage}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
              answeredOnPage
                ? 'bg-amber-700 hover:bg-amber-600 text-white'
                : 'bg-slate-800 text-slate-700 cursor-not-allowed'
            }`}
          >
            {page < totalPages - 1 ? 'Continuar' : 'Finalizar'}
          </button>
        </div>

      </div>
    </div>
  );
}
