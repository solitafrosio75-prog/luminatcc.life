/**
 * mockClinicalEngine.ts
 *
 * Motor de respuestas simuladas para desarrollo sin API key.
 * Produce respuestas clínicamente coherentes con el formato estructurado
 * que espera useInterview.ts:
 *
 *   [texto del terapeuta]
 *   ---
 *   [opción A]|[opción B]|[opción C]|[opción D]
 *
 * Las respuestas siguen la secuencia de fases de Beck y responden
 * a palabras clave del texto del paciente para simular coherencia clínica.
 *
 * INSTRUCCIONES DE USO:
 * 1. Reemplazá el archivo useInterview.ts por la versión que importa este módulo
 *    (o activá MOCK_MODE=true en tu .env.local)
 * 2. Para volver a la API real, simplemente desactivá el flag.
 */

// ── Tipos internos ────────────────────────────────────────────────────────────

interface MockResponse {
  text: string;
  options: string[];
}

// ── Banco de respuestas por fase ──────────────────────────────────────────────

// Fase: apertura (turno 1)
const OPENING_RESPONSES: MockResponse[] = [
  {
    text: 'Gracias por estar acá. Sé que dar este paso no siempre es fácil.\n\n¿Qué te trajo a buscar ayuda en este momento?',
    options: [
      'Vengo sintiéndome mal hace tiempo',
      'Alguien me recomendó que viniera',
      'Tuve algo difícil que me hizo reflexionar',
      'No sé muy bien, pero algo tenía que cambiar',
    ],
  },
  {
    text: 'Me alegra que hayas podido venir. Este es un espacio sin apuro, podemos ir a tu ritmo.\n\n¿Qué fue lo que te llevó a tomar esta decisión ahora?',
    options: [
      'Las cosas se pusieron difíciles en el trabajo',
      'Mis relaciones están complicadas',
      'Me siento agotado/a sin razón aparente',
      'Estoy pasando por una pérdida',
    ],
  },
];

// Respuestas de exploración — variadas por tema detectado
const EXPLORATION_RESPONSES: Record<string, MockResponse[]> = {

  trabajo: [
    {
      text: 'Escucho que el trabajo está siendo una fuente importante de malestar. Eso puede ser muy desgastante.\n\n¿Cómo se manifiesta eso en tu día a día?',
      options: [
        'Me cuesta concentrarme y rendir como antes',
        'Tengo conflictos con mi jefe o compañeros',
        'Me siento sin motivación para ir',
        'El trabajo me consume y no tengo tiempo para nada más',
      ],
    },
    {
      text: 'Entiendo. Cuando el trabajo genera tanto peso, es difícil desconectarse incluso fuera del horario.\n\n¿Eso afecta también tu descanso o tu vida fuera del trabajo?',
      options: [
        'Sí, no puedo dormir bien',
        'Pienso en el trabajo constantemente',
        'Me distancié de mi familia o amigos',
        'Perdí interés en cosas que antes disfrutaba',
      ],
    },
  ],

  relaciones: [
    {
      text: 'Las relaciones pueden ser una fuente enorme de dolor cuando no están bien. Lo que describís tiene sentido.\n\n¿Hay alguna relación en particular que sientas que está en el centro de todo esto?',
      options: [
        'Mi pareja y yo estamos muy distanciados',
        'Con mi familia hay tensiones desde hace tiempo',
        'Me siento solo/a aunque esté rodeado/a de gente',
        'Perdí una relación importante recientemente',
      ],
    },
  ],

  familia: [
    {
      text: 'La familia puede pesar mucho, especialmente cuando hay vínculos que se van complicando con el tiempo.\n\n¿Eso que pasó con tu familia es algo reciente o viene de antes?',
      options: [
        'Viene de hace mucho, desde la infancia',
        'Empezó hace poco con algo concreto',
        'Siempre fue así pero ahora lo siento más',
        'Hubo algo puntual que lo cambió todo',
      ],
    },
  ],

  pérdida: [
    {
      text: 'Una pérdida duele de maneras que a veces sorprenden. No hay forma correcta de transitarla.\n\n¿Querés contarme un poco más sobre lo que pasó?',
      options: [
        'Perdí a alguien muy importante para mí',
        'Fue una separación o ruptura',
        'Perdí mi trabajo o algo que me daba identidad',
        'Fue un cambio grande que no esperaba',
      ],
    },
  ],

  default: [
    {
      text: 'Lo que describís suena a algo que venís cargando hace tiempo. Eso tiene sentido.\n\n¿Cuándo empezaste a notar que algo no estaba bien?',
      options: [
        'Hace varios meses, gradualmente',
        'Fue algo puntual que lo desencadenó',
        'Siempre estuve así, pero ahora lo veo más claro',
        'No sé exactamente, fue difuso',
      ],
    },
    {
      text: 'Entiendo. Eso que describís — esa sensación de que algo no encaja — a veces es difícil de poner en palabras.\n\n¿Cómo afecta eso a tu vida cotidiana?',
      options: [
        'Me cuesta hacer cosas que antes hacía fácil',
        'Estoy más irritable o sensible que antes',
        'Me aislé de personas que me importan',
        'Funciono, pero me exige mucho más esfuerzo',
      ],
    },
    {
      text: 'Eso que contás es importante. A veces cuando llevamos mucho peso encima, el cuerpo y la mente lo sienten de maneras distintas.\n\n¿Cómo estás durmiendo y comiendo últimamente?',
      options: [
        'El sueño está muy alterado',
        'Como diferente, más o menos que antes',
        'Me siento físicamente agotado/a',
        'Eso está más o menos bien',
      ],
    },
    {
      text: 'Gracias por contarme eso. Me ayuda mucho entender el contexto.\n\n¿Hay algo en tu vida ahora mismo que sientas que te da cierto sostén o alivio, aunque sea pequeño?',
      options: [
        'Tengo personas que me apoyan',
        'Hay actividades que me ayudan a despejarme',
        'La verdad que ahora no encuentro mucho',
        'Mi trabajo o mis rutinas me dan estructura',
      ],
    },
    {
      text: 'Escucho que hay mucho que estás procesando. Todo eso que describís me da una imagen clara de lo que estás viviendo.\n\n¿Cómo te sentías antes de que todo esto empezara?',
      options: [
        'Estaba mucho mejor, esto es nuevo para mí',
        'Siempre fui así, con altos y bajos',
        'Tuve otras épocas difíciles antes',
        'No recuerdo haberme sentido muy diferente',
      ],
    },
  ],
};

// Respuestas de transición al inventario
const INVENTORY_TRANSITION: MockResponse = {
  text: 'Lo que me estás contando me da una imagen bastante clara. Hay algo que me gustaría pedirte, si te parece bien.\n\nTenemos unos cuestionarios breves — no son tests, son más bien preguntas estructuradas que nos ayudan a entender mejor cómo te está afectando todo esto. ¿Estarías dispuesto/a a completarlos?',
  options: [
    'Sí, de acuerdo',
    'Prefiero seguir hablando un poco más',
    'Me da un poco de miedo responder esas preguntas',
    'Está bien, ¿son muchas preguntas?',
  ],
};

// Respuestas de integración Beck (post-inventario)
const INTEGRATION_RESPONSES: MockResponse[] = [
  {
    text: 'Gracias por la honestidad con la que respondiste. Eso requiere valentía.\n\nCon todo lo que me contaste hoy, empiezo a tener una imagen más clara. ¿Hay algo más que quieras compartir antes de que te cuente mis primeras impresiones?',
    options: [
      'Creo que lo más importante ya lo dije',
      'Hay algo que no sé si mencioné',
      'Me gustaría saber qué pensás vos',
      'Estoy cansado/a, fue mucho para hoy',
    ],
  },
];

// Respuestas de contención de crisis
const CRISIS_RESPONSES: MockResponse[] = [
  {
    text: 'Lo que me estás diciendo es muy importante, y quiero que sepas que estoy acá con vos.\n\nAhora mismo lo más importante eres vos. ¿Podés decirme cómo estás en este momento?',
    options: [
      'Necesito ayuda ahora mismo',
      'Estoy asustado/a pero no en peligro inmediato',
      'Me siento un poco mejor al contarlo',
      'No sé cómo estoy',
    ],
  },
  {
    text: 'Gracias por contarme eso. Hace falta mucho coraje para decirlo.\n\nQuiero que sepas que no estás solo/a en esto. ¿Tenés a alguien de confianza cerca con quien puedas estar hoy?',
    options: [
      'Sí, tengo alguien',
      'No, estoy solo/a',
      'No quiero preocupar a nadie',
      'Prefiero estar solo/a ahora',
    ],
  },
];

// Hipótesis clínica mock
const MOCK_HYPOTHESES = [
  'La presentación del paciente sugiere un cuadro compatible con sintomatología depresiva de intensidad moderada, con componentes ansiosos secundarios. Las verbalizaciones recogidas revelan esquemas cognitivos de indefensión y rumiación persistente, posiblemente mantenidos por evitación conductual y aislamiento social progresivo. Se identifican como variables de mantenimiento la ausencia de reforzadores positivos en la vida cotidiana y la presencia de pensamientos automáticos negativos de contenido autoevaluativo. La trayectoria afectiva auto-reportada durante la sesión muestra una leve apertura hacia el final del encuentro, lo que sugiere receptividad terapéutica. Se recomienda priorizar la conceptualización del caso compartida con el paciente y la exploración de actividades de activación conductual como intervención inicial.',

  'El paciente presenta una constelación sintomática que incluye alteraciones del sueño, reducción del placer en actividades previas y dificultades de concentración, consistent con criterios de episodio depresivo mayor. La narrativa revela un patrón de larga data de exigencia personal elevada y dificultad para reconocer recursos propios, lo que orienta a esquemas de insuficiencia y estándares inflexibles. Los factores de mantenimiento más relevantes parecen ser la sobrecarga laboral, el aislamiento de la red de apoyo y la ausencia de conductas de autocuidado. El rapport establecido en la sesión fue suficiente para explorar áreas sensibles, lo que augura buena alianza terapéutica. Se recomienda foco inicial en psicoeducación sobre el modelo cognitivo y registro de actividades para identificar patrones de evitación.',
];

// ── Detector de contexto ──────────────────────────────────────────────────────

function detectContext(messages: { role: string; content: string }[]): {
  theme: string;
  turnCount: number;
  phase: string;
  lastUserText: string;
} {
  const userMessages = messages.filter((m) => m.role === 'user');
  const turnCount    = userMessages.length;
  const lastUserText = userMessages[userMessages.length - 1]?.content ?? '';
  const allUserText  = userMessages.map((m) => m.content).join(' ').toLowerCase();

  // Detectar tema dominante
  let theme = 'default';
  if (/trabajo|empleo|jefe|laboral|estudio|rendir/.test(allUserText))   theme = 'trabajo';
  if (/pareja|relación|novio|novia|solo|soledad|separación/.test(allUserText)) theme = 'relaciones';
  if (/familia|madre|padre|padres|hermano|mamá|papá/.test(allUserText)) theme = 'familia';
  if (/perdí|pérdida|murió|duelo|extraño|falleció/.test(allUserText))  theme = 'pérdida';

  // Detectar fase por palabras clave del sistema en el historial
  const systemText  = messages.filter((m) => m.role === 'assistant').map((m) => m.content).join(' ').toLowerCase();
  let phase = 'exploration';
  if (turnCount <= 1)                                          phase = 'opening';
  if (/cuestionarios|preguntas estructuradas/.test(systemText)) phase = 'inventory';
  if (/gracias por la honestidad/.test(systemText))            phase = 'beck_integration';
  if (/crisis|estoy acá con vos|contención/.test(systemText)) phase = 'crisis';

  return { theme, turnCount, phase, lastUserText };
}

// ── Selector de respuesta ─────────────────────────────────────────────────────

function selectResponse(
  messages: { role: string; content: string }[],
  systemPrompt: string,
): MockResponse {
  const { theme, turnCount, phase, lastUserText } = detectContext(messages);

  // Crisis tiene prioridad absoluta
  const crisisWords = ['suicid', 'matarme', 'no quiero vivir', 'hacerme daño', 'no quiero seguir'];
  if (crisisWords.some((w) => lastUserText.toLowerCase().includes(w))) {
    return CRISIS_RESPONSES[Math.floor(Math.random() * CRISIS_RESPONSES.length)];
  }

  // Por fase
  if (phase === 'crisis') {
    return CRISIS_RESPONSES[Math.floor(Math.random() * CRISIS_RESPONSES.length)];
  }

  if (phase === 'opening' || turnCount <= 1) {
    return OPENING_RESPONSES[Math.floor(Math.random() * OPENING_RESPONSES.length)];
  }

  if (phase === 'beck_integration') {
    return INTEGRATION_RESPONSES[Math.floor(Math.random() * INTEGRATION_RESPONSES.length)];
  }

  // Detectar si el prompt indica fase inventory
  if (systemPrompt.includes('inventory') || systemPrompt.includes('BDI')) {
    return INVENTORY_TRANSITION;
  }

  // Exploración: elegir por tema con fallback a default
  const pool = EXPLORATION_RESPONSES[theme] ?? EXPLORATION_RESPONSES.default;

  // Rotar respuestas basándonos en el turno para no repetir
  const idx = (turnCount - 1) % pool.length;
  return pool[idx];
}

// ── Generador de hipótesis mock ───────────────────────────────────────────────

export function generateMockHypothesis(): string {
  return MOCK_HYPOTHESES[Math.floor(Math.random() * MOCK_HYPOTHESES.length)];
}

// ── Simulador de SSE streaming ────────────────────────────────────────────────

/**
 * Simula el streaming SSE de la API de Anthropic.
 * Devuelve un ReadableStream que emite chunks con el formato:
 *   data: {"type":"content_block_delta","delta":{"text":"..."}}
 */
function createMockStream(fullText: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  // Dividir el texto en chunks pequeños para simular streaming real
  const words  = fullText.split(' ');
  const chunks: string[] = [];

  // Agrupar de 1-3 palabras por chunk (más natural)
  let i = 0;
  while (i < words.length) {
    const size  = Math.floor(Math.random() * 3) + 1;
    const chunk = words.slice(i, i + size).join(' ');
    chunks.push(i === 0 ? chunk : ' ' + chunk);
    i += size;
  }

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const chunk of chunks) {
        // Delay variable para simular velocidad de escritura natural
        const delay = 20 + Math.random() * 40;
        await new Promise((r) => setTimeout(r, delay));

        const sseEvent = JSON.stringify({
          type:  'content_block_delta',
          delta: { text: chunk },
        });
        controller.enqueue(encoder.encode(`data: ${sseEvent}\n\n`));
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });
}

// ── Fetch interceptor ─────────────────────────────────────────────────────────

/**
 * Reemplaza el fetch global para interceptar llamadas a /api/chat
 * y devolver respuestas mock sin tocar la red.
 *
 * Llamar una vez al inicio de la app (en main.tsx o App.tsx).
 */
export function installMockFetch(): void {
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;

    // Solo interceptamos /api/chat
    if (!url.includes('/api/chat')) {
      return originalFetch(input, init);
    }

    // Parsear el body para extraer mensajes y system prompt
    let messages: { role: string; content: string }[] = [];
    let systemPrompt = '';

    try {
      const body     = JSON.parse((init?.body as string) ?? '{}');
      messages       = body.messages ?? [];
      systemPrompt   = body.system   ?? '';
    } catch {
      // body malformado — respuesta genérica
    }

    // Pequeño delay inicial (simula latencia de red)
    await new Promise((r) => setTimeout(r, 300 + Math.random() * 200));

    // Seleccionar respuesta clínica
    const { text, options } = selectResponse(messages, systemPrompt);

    // Formatear con el delimitador que espera parseStructuredResponse
    const fullResponse = options.length > 0
      ? `${text}\n---\n${options.join('|')}`
      : text;

    // Crear stream SSE
    const stream = createMockStream(fullResponse);

    return new Response(stream, {
      status:  200,
      headers: { 'Content-Type': 'text/event-stream' },
    });
  };

  console.info('[MockClinicalEngine] ✓ Fetch interceptado — modo desarrollo sin API activo');
}

/**
 * Desinstala el mock y restaura el fetch original.
 * Llamar cuando se tenga API key real.
 */
export function uninstallMockFetch(): void {
  // El fetch original fue guardado en closure — para desinstalar
  // simplemente recargá la página con MOCK_MODE=false
  console.info('[MockClinicalEngine] Mock desactivado — usando API real');
}
