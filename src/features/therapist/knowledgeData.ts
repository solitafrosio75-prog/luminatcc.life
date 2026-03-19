/**
 * knowledgeData.ts — Biblioteca clínica pre-cargada del Terapeuta TCC.
 *
 * Contiene entradas de sólo-lectura (isBuiltIn: true) organizadas por packs.
 * Los datos aquí NO se almacenan en localStorage — son estáticos y viven en el bundle.
 *
 * Pack actual: Distorsiones Cognitivas Completas (18 entradas)
 * Referencia principal: Beck (1979), Burns (1980), Young (1990), Hayes (1999)
 */

import type { KnowledgeEntry } from './therapistStore';

// ── Helper ────────────────────────────────────────────────────────────────────

function bi(
  id:       string,
  category: KnowledgeEntry['category'],
  title:    string,
  summary:  string,
  content:  string,
  tags:     string[],
  source?:  string,
): KnowledgeEntry {
  return { id, category, title, summary, content, tags, source, isBuiltIn: true, addedAt: 0 };
}

// ══════════════════════════════════════════════════════════════════════════════
//  PACK 1 — Distorsiones Cognitivas (18 entradas)
//  Las 15 de Burns/Beck + 3 adicionales de la literatura contemporánea
// ══════════════════════════════════════════════════════════════════════════════

export const BUILT_IN_KNOWLEDGE: KnowledgeEntry[] = [

  // ── 01 ─────────────────────────────────────────────────────────────────────
  bi(
    'dc_01_dicotomico',
    'distorsiones_cognitivas',
    'Pensamiento Dicotómico',
    'Todo o nada. Ver las experiencias en extremos opuestos sin matices intermedios.',
    `DESCRIPCIÓN
Tendencia a categorizar las experiencias en uno de dos polos opuestos, ignorando toda la gama de posibilidades intermedias. Si una situación no es perfecta, se percibe como un desastre total.

EJEMPLOS CLÍNICOS
• "Si no lo hago perfectamente, soy un completo fracasado."
• "O me quieren al 100% o definitivamente me odian."
• "Estoy bien o estoy destrozado. No hay término medio."
• "Un solo error arruinó todo el proyecto."

INDICADORES LINGÜÍSTICOS
Siempre, nunca, todo, nada, completamente, imposible, perfecto, desastre, absoluto, totalmente. El paciente no tolera la ambigüedad ni los grises.

DIAGNÓSTICOS ASOCIADOS
Depresión mayor (autocrítica extrema), perfeccionismo clínico, Trastorno Límite de Personalidad (idealización/devaluación), bulimia nerviosa (dieta perfecta → ruptura → atracón).

INTERVENCIÓN TCC
1. Introducir el continuo: "En una escala del 0 al 100, ¿cuánto fracasaste en esto?"
2. Buscar contra-ejemplos: "¿Existe alguna situación que fue un 50%? ¿Un 70%?"
3. Reestructuración: ¿Qué describiría un observador imparcial?
4. Análisis de ventajas/desventajas del pensamiento en extremos.
5. Experimento conductual: actuar desde el "suficientemente bien" y observar resultados.

PREGUNTAS SOCRÁTICAS
→ "¿Es posible tener algo intermedio entre el éxito total y el fracaso total?"
→ "Si tu mejor amigo cometiera ese error, ¿lo llamarías un fracasado?"
→ "¿Qué porcentaje exacto de éxito tuvo esta situación?"
→ "¿Cuáles serían las señales de un 60%? ¿Te ocurrieron algunas?"`,
    ['todo o nada', 'dicotomico', 'polarizado', 'perfeccionismo', 'absoluto', 'blanco negro'],
    'Beck (1979); Burns (1980) Feeling Good; Young (1990) Cognitive Therapy for Personality Disorders.',
  ),

  // ── 02 ─────────────────────────────────────────────────────────────────────
  bi(
    'dc_02_catastrofizacion',
    'distorsiones_cognitivas',
    'Catastrofización',
    'Exagerar la gravedad de un evento negativo o predecir el peor resultado posible como si fuera inevitable.',
    `DESCRIPCIÓN
Amplificar la importancia o las consecuencias de algo negativo hasta el punto de imaginar una catástrofe. Puede orientarse al pasado ("fue lo peor que me pudo pasar") o al futuro ("esto va a terminar en desastre"). También llamada Magnificación.

EJEMPLOS CLÍNICOS
• "Si me tiembla la voz en la presentación, todos pensarán que soy un imbécil y perderé mi trabajo."
• "Tengo un dolor de cabeza. Seguro que tengo un tumor."
• "Si me dice que no, nunca voy a poder superar el rechazo."
• "Este accidente de tránsito menor arruinó mi vida."

INDICADORES LINGÜÍSTICOS
Terrible, horrible, insoportable, lo peor, no lo puedo tolerar, desastre, catástrofe, nunca me voy a recuperar, todo se derrumbó.

DIAGNÓSTICOS ASOCIADOS
Trastorno de Ansiedad Generalizada (TAG), hipocondría/ansiedad por salud, PTSD, fobia social, trastorno de pánico.

INTERVENCIÓN TCC
1. Escala de catástrofes (0-100): ubicar el evento real en comparación con catástrofes objetivas.
2. Descatastrofizar: "¿Cuál sería el peor caso? ¿Cuál es el más probable? ¿Cuál el mejor?"
3. Probabilidad real: estimar con datos objetivos la probabilidad del resultado temido.
4. Estrategias de afrontamiento: "Si ocurriera lo peor, ¿qué harías? ¿Sobrevivirías?"
5. Exposición conductual a la incertidumbre.

PREGUNTAS SOCRÁTICAS
→ "En una escala del 0 al 100, ¿qué tan catastrófico sería este resultado comparado con perder a un ser querido?"
→ "¿Cuántas veces anticipaste una catástrofe que no ocurrió?"
→ "Si ocurriera lo peor, ¿qué recursos tendrías para afrontarlo?"
→ "¿Qué probabilidad real (%) tiene el resultado que más temés?"`,
    ['catastrofe', 'magnificacion', 'exageracion', 'ansiedad', 'peor caso', 'amplificacion'],
    'Beck (1979); Burns (1980); Clark & Beck (2010) Cognitive Therapy of Anxiety Disorders.',
  ),

  // ── 03 ─────────────────────────────────────────────────────────────────────
  bi(
    'dc_03_abstraccion_selectiva',
    'distorsiones_cognitivas',
    'Abstracción Selectiva (Filtrado Mental)',
    'Focalizarse exclusivamente en un detalle negativo e ignorar todos los aspectos positivos del conjunto.',
    `DESCRIPCIÓN
Extraer un elemento negativo del contexto y construir toda la interpretación sobre ese único elemento, volviendo invisible el resto. Como ver una mancha en un mantel blanco y concluir que el mantel está sucio.

EJEMPLOS CLÍNICOS
• Recibir 9 comentarios positivos y 1 crítica → "Mi presentación fue un fracaso."
• Un día productivo con un momento de ansiedad → "Fue un día horrible."
• "Me felicitaron por el informe, pero yo cometí ese error de tipografía — todo fue mal."
• "La cena estuvo bien, pero se quemó ligeramente el arroz — arruiné la noche."

INDICADORES LINGÜÍSTICOS
"Pero...", "aunque...", descalificación de todo lo bueno por un detalle, incapacidad de recordar aspectos positivos de una situación.

DIAGNÓSTICOS ASOCIADOS
Depresión mayor (atención selectiva a lo negativo), TAG, PTSD (hipervigilancia a señales de amenaza), perfeccionismo.

INTERVENCIÓN TCC
1. Registro de datos: listar TODOS los elementos (positivos y negativos) de la situación.
2. Cálculo de proporciones: "¿Qué porcentaje del total fue negativo?"
3. Reencuadre: "Si esto le pasara a un amigo, ¿cómo lo describirías en conjunto?"
4. Experimento: registrar 3 cosas positivas por día durante 2 semanas.

PREGUNTAS SOCRÁTICAS
→ "¿Estás describiendo la situación completa o sólo una parte?"
→ "Si pusieras los aspectos positivos y negativos en una balanza, ¿cuál pesa más?"
→ "¿Qué parte de la situación estás dejando fuera de tu análisis?"
→ "¿Cómo describiría esta situación alguien que no conocías pero que la observó?"`,
    ['filtrado mental', 'atencion selectiva', 'detalle negativo', 'depresion', 'mancha', 'tunel'],
    'Beck et al. (1979); Burns (1980).',
  ),

  // ── 04 ─────────────────────────────────────────────────────────────────────
  bi(
    'dc_04_sobregeneralizacion',
    'distorsiones_cognitivas',
    'Sobregeneralización',
    'Extraer una regla o conclusión global a partir de uno o pocos eventos aislados y aplicarla a todo.',
    `DESCRIPCIÓN
A partir de un evento puntual (o muy pocos), formular una ley general que se aplica de manera rígida e injustificada a situaciones futuras. Una experiencia negativa se convierte en un patrón interminable de derrota.

EJEMPLOS CLÍNICOS
• Fracasar una vez en una cita → "Nadie me va a querer jamás."
• Cometer un error en el trabajo → "Siempre arruino todo lo que hago."
• Un rechazo social → "Nunca encajo en ningún grupo."
• "Me puse ansioso en esa situación → siempre me pongo ansioso."

INDICADORES LINGÜÍSTICOS
Siempre, nunca, jamás, todo el mundo, nadie, en todas partes, constantemente, es que soy así. Frecuente uso de cuantificadores absolutos.

DIAGNÓSTICOS ASOCIADOS
Depresión mayor (indefensión aprendida — Seligman), baja autoestima crónica, ansiedad social, PTSD.

INTERVENCIÓN TCC
1. Cuantificar: "¿Cuántas veces ocurrió esto exactamente? ¿3? ¿10? ¿De cuántas oportunidades totales?"
2. Buscar excepciones: "¿Hubo alguna vez en que NO ocurrió esto?"
3. Reformular en específico: reemplazar "siempre" por "en esta situación" o "a veces".
4. Análisis ABC: ¿Qué condiciones específicas precipitaron el evento?

PREGUNTAS SOCRÁTICAS
→ "¿En cuántas de las últimas 10 veces ocurrió esto realmente?"
→ "¿Qué evidencia concreta tenés de que esto ocurre SIEMPRE?"
→ "¿Podría haber alguna condición bajo la cual no ocurriera?"
→ "¿Estás sacando una regla general de un caso particular?"`,
    ['siempre', 'nunca', 'generalizacion', 'indefensión', 'regla', 'patron', 'absoluto'],
    'Beck (1979); Seligman (1975) Helplessness.',
  ),

  // ── 05 ─────────────────────────────────────────────────────────────────────
  bi(
    'dc_05_descalificacion_positivo',
    'distorsiones_cognitivas',
    'Descalificación de lo Positivo',
    'Ignorar o restar validez a las experiencias positivas argumentando que "no cuentan" o "fue suerte".',
    `DESCRIPCIÓN
Transformar activamente las experiencias neutras o positivas en negativas, o simplemente invalidarlas. El paciente no puede integrar feedback positivo porque siempre encuentra una razón para desecharlo. Mantiene la creencia negativa incluso ante evidencia contraria.

EJEMPLOS CLÍNICOS
• Recibe un elogio → "Me lo dijeron por educación, no lo decían en serio."
• Logra algo difícil → "Fue de casualidad, no cuento."
• "Que me haya salido bien esta vez no prueba nada."
• "Cualquiera podría haberlo hecho, no tiene mérito."

INDICADORES LINGÜÍSTICOS
"Fue suerte", "no cuenta", "era fácil", "cualquiera lo hubiera hecho", "lo hicieron por lástima", minimización sistemática de logros propios.

DIAGNÓSTICOS ASOCIADOS
Depresión mayor (visión negativa de sí mismo), baja autoestima, perfeccionismo, síndrome del impostor.

INTERVENCIÓN TCC
1. Registrar TODAS las evidencias (pro y contra la creencia) sin filtrar.
2. Cuestionar el estándar doble: "¿Aplicarías el mismo criterio a un amigo?"
3. Experimento: pedir al paciente que acepte 1 elogio por semana sin invalidarlo.
4. Registro de logros: lista diaria de pequeños éxitos objetivos.

PREGUNTAS SOCRÁTICAS
→ "Si una persona que admirás dijera lo mismo que lograste vos, ¿también lo descalificarías?"
→ "¿Qué tendría que pasar para que un logro 'cuente' para vos?"
→ "¿Existe algún logro tuyo que sí reconocés como válido? ¿Por qué ese sí?"
→ "¿Estás aplicando un estándar diferente para vos que para los demás?"`,
    ['descalificacion', 'invalidar', 'no cuenta', 'suerte', 'impostor', 'elogio'],
    'Burns (1980); Fennell (1997) Low Self-Esteem.',
  ),

  // ── 06 ─────────────────────────────────────────────────────────────────────
  bi(
    'dc_06_lectura_mental',
    'distorsiones_cognitivas',
    'Lectura Mental',
    'Asumir que se sabe lo que piensan los demás (habitualmente algo negativo) sin evidencia suficiente.',
    `DESCRIPCIÓN
El paciente actúa como si pudiera leer la mente de los otros y asume que sus pensamientos son negativos hacia él. No verifica la suposición — la trata como un hecho. Suele generar conductas de evitación o hipervigilancia social.

EJEMPLOS CLÍNICOS
• "Sé que le caigo mal, aunque no me lo diga."
• "En la reunión todos pensaron que era un idiota."
• "Me miró así — definitivamente está enojado conmigo."
• "No me contestó el mensaje — le molestó algo que hice."

INDICADORES LINGÜÍSTICOS
"Sé que piensa...", "estoy seguro de que...", "es obvio que...", conclusiones sobre estados mentales de otros sin evidencia directa.

DIAGNÓSTICOS ASOCIADOS
Fobia social/ansiedad social (anticipación de evaluación negativa), paranoia, depresión (interpretación negativa del entorno), TLP.

INTERVENCIÓN TCC
1. Buscar evidencia: "¿Qué evidencia tenés de que eso es lo que piensa?"
2. Alternativas plausibles: generar 3-5 explicaciones alternativas para la conducta observada.
3. Verificación conductual: preguntar directamente a la persona (experimento).
4. Análisis de sesgos: "¿Estás interpretando su silencio desde tu propio miedo?"

PREGUNTAS SOCRÁTICAS
→ "¿Qué evidencia directa tenés de que piensa eso?"
→ "¿Cuáles serían otras 3 razones por las que podría haber actuado así?"
→ "¿Alguna vez alguien actuó de manera similar y tenía un motivo completamente diferente?"
→ "¿Podrías verificar esta suposición de alguna forma?"`,
    ['lectura mental', 'suposicion', 'adivinar pensamientos', 'social', 'interpretacion', 'pareja'],
    'Beck (1979); Clark & Wells (1995) Social Phobia.',
  ),

  // ── 07 ─────────────────────────────────────────────────────────────────────
  bi(
    'dc_07_adivinanza_futuro',
    'distorsiones_cognitivas',
    'Adivinación del Futuro (Predicción Negativa)',
    'Predecir que las cosas saldrán mal y tratar esa predicción como un hecho inevitable.',
    `DESCRIPCIÓN
El paciente anticipa el peor resultado posible y lo trata como una certeza, no como una posibilidad. Esto retroalimenta la ansiedad y la evitación, generando profecías autocumplidas (la evitación impide desconfirmar la predicción).

EJEMPLOS CLÍNICOS
• "No tiene sentido que solicite el trabajo — no me van a tomar."
• "Si voy a la fiesta, voy a pasar vergüenza."
• "Sé que si me hago ese análisis, va a salir algo malo."
• "No voy a poder dormir esta noche — ya sé que va a ser horrible."

INDICADORES LINGÜÍSTICOS
"Sé que va a pasar...", "es seguro que...", "inevitablemente...", "no tiene sentido intentarlo porque...".

DIAGNÓSTICOS ASOCIADOS
Ansiedad generalizada (preocupación crónica), trastorno de pánico (predicción de ataques), depresión (desesperanza), insomnio conductual.

INTERVENCIÓN TCC
1. Registro de predicciones: fecha, predicción, resultado real. Comparar a lo largo del tiempo.
2. Análisis de probabilidad: "¿Qué % de tus predicciones anteriores se cumplieron?"
3. Experimento conductual: hacer lo que se evita y registrar el resultado real.
4. Desmontaje de la profecía autocumplida: cómo la evitación confirma artificialmente la predicción.

PREGUNTAS SOCRÁTICAS
→ "¿Qué porcentaje de tus predicciones anteriores se hicieron realidad?"
→ "¿Hay alguna forma de probar esa predicción en lugar de asumirla?"
→ "¿Podrías actuar como si el resultado fuera incierto (no garantizado malo)?"
→ "Si la predicción no se cumple, ¿qué aprenderías sobre tu pensamiento?"`,
    ['prediccion', 'futuro', 'adivinanza', 'anticipacion', 'ansiedad', 'evitacion', 'certeza'],
    'Beck (1979); Clark & Beck (2010).',
  ),

  // ── 08 ─────────────────────────────────────────────────────────────────────
  bi(
    'dc_08_razonamiento_emocional',
    'distorsiones_cognitivas',
    'Razonamiento Emocional',
    'Tomar las emociones como evidencia de la realidad: "Si lo siento, debe ser verdad."',
    `DESCRIPCIÓN
Usar el estado emocional como prueba de la realidad objetiva. La emoción se convierte en el criterio de verdad, ignorando la evidencia factual. Muy frecuente en ansiedad (la ansiedad = el peligro es real).

EJEMPLOS CLÍNICOS
• "Me siento un fracasado, por lo tanto soy un fracasado."
• "Siento que voy a desmayarme — algo malo me está pasando."
• "Me siento culpable, así que debo haber hecho algo malo."
• "Siento que la reunión salió mal, aunque me dijeron que salió bien."

INDICADORES LINGÜÍSTICOS
"Me siento [X], por lo tanto [X] es verdad", confusión sistemática entre sentir y ser/estar. El paciente no distingue entre la emoción y el hecho que supuestamente la genera.

DIAGNÓSTICOS ASOCIADOS
Trastorno de pánico (sensaciones físicas = peligro real), depresión (emociones = evidencia de fracaso), ansiedad generalizada, culpa patológica.

INTERVENCIÓN TCC
1. Separar emoción de hecho: "¿Qué emoción sentís? ¿Qué evidencia objetiva tenés?"
2. Lista de evidencias: pro y contra la creencia, independientemente del estado emocional.
3. Psicoeducación: las emociones son respuestas del sistema, no detectores de verdad.
4. Defusión (ACT): "Tu mente dice que sos un fracasado. ¿Eso es un hecho o un pensamiento?"

PREGUNTAS SOCRÁTICAS
→ "¿Es posible sentirse culpable sin haber hecho nada malo?"
→ "¿Qué evidencia concreta (más allá de la emoción) apoya esa conclusión?"
→ "Si alguien más estuviera en tu situación y no sintiera lo mismo, ¿seguiría siendo un fracasado?"
→ "¿Tu emoción está basada en cómo ves la situación, o es al revés?"`,
    ['emocion', 'sentir', 'verdad', 'panico', 'culpa', 'evidencia', 'ansiedad'],
    'Beck (1979); Burns (1980); Hayes (1999) ACT.',
  ),

  // ── 09 ─────────────────────────────────────────────────────────────────────
  bi(
    'dc_09_deberia',
    'distorsiones_cognitivas',
    'Afirmaciones de "Debería" (Imperativo Moral)',
    'Tener reglas rígidas e inflexibles sobre cómo uno mismo o los demás deben comportarse.',
    `DESCRIPCIÓN
Imposición de normas absolutas y rígidas sobre el comportamiento propio o ajeno, generando culpa cuando uno mismo las viola y resentimiento/ira cuando los demás no las cumplen. Ellis la llamó "musturbation" (la tiranía de los debería). Estas reglas suelen ser heredadas sin cuestionamiento.

EJEMPLOS CLÍNICOS
• "Debería poder controlar mi ansiedad sola, sin ayuda."
• "No tendría que necesitar tanto afecto de los demás."
• "Ella debería haber entendido que estaba mal — no necesito explicárselo."
• "Tendría que haber terminado esto hace una semana."

INDICADORES LINGÜÍSTICOS
Debería, tendría que, no debería, tiene que, hay que, es obligatorio. Especialmente cuando se usan como imperativos morales y no como preferencias.

DIAGNÓSTICOS ASOCIADOS
Depresión (autocrítica basada en estándares imposibles), perfeccionismo, ira crónica e irritabilidad, culpa patológica, ansiedad.

INTERVENCIÓN TCC
1. Flexibilizar la regla: "¿Podrías reformularlo como una preferencia? 'Me gustaría poder...' vs 'Debo...'"
2. Origen de la regla: ¿De dónde viene esta norma? ¿Es universal? ¿Quién la estableció?
3. Costo-beneficio: ¿Qué le cuesta al paciente aferrarse a esta regla?
4. TREC de Ellis: disputar la creencia irracional subyacente.

PREGUNTAS SOCRÁTICAS
→ "¿Quién estableció esa regla? ¿Es una ley universal o una preferencia tuya?"
→ "¿Qué pasaría si no pudieras cumplir ese 'debería'? ¿Sería una catástrofe?"
→ "¿Podrías reemplazar 'debería' por 'me gustaría' o 'preferiría'? ¿Qué cambia?"
→ "¿Aplicarías esa misma exigencia a alguien que querés?"`,
    ['deberia', 'tendria que', 'perfeccionismo', 'culpa', 'rigidez', 'exigencia', 'TREC', 'Ellis'],
    'Ellis (1962) Reason and Emotion in Psychotherapy; Burns (1980).',
  ),

  // ── 10 ─────────────────────────────────────────────────────────────────────
  bi(
    'dc_10_etiquetacion',
    'distorsiones_cognitivas',
    'Etiquetación y Mala Etiquetación',
    'Asignar una etiqueta global y negativa a uno mismo o a otros a partir de un error o conducta puntual.',
    `DESCRIPCIÓN
Forma extrema de sobregeneralización. En lugar de describir un error o conducta específica, el paciente asigna una identidad negativa global. La etiqueta reemplaza el análisis específico y bloquea el cambio.

EJEMPLOS CLÍNICOS
• Comete un error → "Soy un idiota."
• Se pone ansioso → "Soy débil."
• Pierde el trabajo → "Soy un perdedor total."
• Alguien comete un error → "Es un inútil."

INDICADORES LINGÜÍSTICOS
"Soy [etiqueta]" en lugar de "hice [conducta]". El verbo "ser" en lugar del verbo "hacer". Sustantivos con carga evaluativa global.

DIAGNÓSTICOS ASOCIADOS
Depresión (identidad negativa nuclear), baja autoestima, ira y resentimiento (etiquetación de otros), TLP.

INTERVENCIÓN TCC
1. Especificación: "¿Cometiste un error o sos un idiota? ¿Qué es diferente entre las dos cosas?"
2. Separar conducta de identidad: la persona ≠ su conducta.
3. Continuo de la etiqueta: "Si fueras completamente [idiota], ¿qué conductas tendrías? ¿Las tenés todas?"
4. Definición operacional: "¿Qué significa exactamente ser un [fracasado]? ¿Cuántos criterios cumplís?"

PREGUNTAS SOCRÁTICAS
→ "¿Sos un [idiota] o cometiste una equivocación?"
→ "¿Puede una persona que cometió UN error ser calificada como esa etiqueta para siempre?"
→ "Si definiéramos [fracasado] con precisión, ¿cuántos criterios cumplís realmente?"
→ "¿Cambiaría algo si en lugar de 'soy' dijeras 'actué de manera'?"`,
    ['etiqueta', 'soy', 'idiota', 'fracasado', 'identidad', 'rotular', 'autoconcepto'],
    'Burns (1980); Beck (1979).',
  ),

  // ── 11 ─────────────────────────────────────────────────────────────────────
  bi(
    'dc_11_personalizacion',
    'distorsiones_cognitivas',
    'Personalización',
    'Asumir responsabilidad excesiva por eventos negativos externos sin evidencia suficiente de causalidad.',
    `DESCRIPCIÓN
El paciente se hace responsable de eventos externos negativos sobre los cuales tenía poco o ningún control real. También puede manifestarse como compararse constantemente con los demás y salir perdiendo. Genera culpa y vergüenza desproporcionadas.

EJEMPLOS CLÍNICOS
• "Si yo hubiera estado en casa, no habría tenido ese accidente."
• "Mi hijo está mal en el colegio — es por mi culpa."
• "El equipo perdió porque yo no rendí al 100% ese día."
• "Mi madre está de mal humor — seguro hice algo que la molestó."

INDICADORES LINGÜÍSTICOS
"Por mi culpa", "si yo hubiera...", "soy el responsable de...", asunción de causalidad sin cadena lógica.

DIAGNÓSTICOS ASOCIADOS
Depresión (culpa excesiva), TOC (responsabilidad inflada — Salkovskis), PTSD (culpa del sobreviviente), ansiedad generalizada.

INTERVENCIÓN TCC
1. Análisis de causas múltiples: "¿Cuáles son TODOS los factores que contribuyeron a este resultado?"
2. Gráfico de responsabilidades: asignar % a cada factor causante, incluyéndose a sí mismo.
3. Doble estándar: "¿Responsabilizarías a otra persona en igual medida por el mismo evento?"
4. En TOC: protocolo de responsabilidad inflada (Salkovskis 1985).

PREGUNTAS SOCRÁTICAS
→ "¿De todos los factores que contribuyeron a este resultado, cuántos controlabas vos?"
→ "Si asignaras porcentajes de responsabilidad a cada causa, ¿qué % correspondería exactamente a vos?"
→ "¿Hay alguien más que también contribuyó a que esto ocurriera?"
→ "¿Tenías control real sobre todos los elementos de esta situación?"`,
    ['personalizacion', 'culpa', 'responsabilidad', 'culpa del sobreviviente', 'causalidad', 'TOC'],
    'Beck (1979); Salkovskis (1985) OCD responsibility model; Gilbert (2010) Compassion.',
  ),

  // ── 12 ─────────────────────────────────────────────────────────────────────
  bi(
    'dc_12_magnificacion_minimizacion',
    'distorsiones_cognitivas',
    'Magnificación y Minimización',
    'Exagerar la importancia de los errores propios (magnificación) y reducir la de los logros (minimización).',
    `DESCRIPCIÓN
Distorsión de la magnitud de los eventos en una dirección sistemática: lo negativo se amplifica, lo positivo se encoge. Frecuentemente se amplifica lo negativo de uno mismo y se magnifican los logros de los demás.

EJEMPLOS CLÍNICOS
• "Ese error fue tremendo" (error menor magnificado) vs "Mi éxito no fue para tanto" (logro minimizado).
• "Comparado con X, lo que yo hago no vale nada."
• "Que me haya salido bien fue una casualidad, pero que salga mal sería confirmar que no sirvo."

INDICADORES LINGÜÍSTICOS
"Es horrible", "fue terrible", minimizaciones sistemáticas con "fue de casualidad", "no fue para tanto", "cualquiera lo haría".

DIAGNÓSTICOS ASOCIADOS
Depresión, perfeccionismo, ansiedad social (magnificar el error social), síndrome del impostor.

INTERVENCIÓN TCC
1. Escala objetiva: "En una escala del 0 al 100, ¿cuán grande es realmente este error comparado con X?"
2. Detectar el patrón: ¿Se magnifica siempre lo negativo y se minimiza siempre lo positivo?
3. Aplicar el mismo criterio de medición a éxitos y errores.
4. Registro de logros con evidencia objetiva.

PREGUNTAS SOCRÁTICAS
→ "Si usáramos la misma escala para medir este error y tus logros, ¿qué medida obtendrías para cada uno?"
→ "¿Estás aplicando el mismo microscopio a tus errores y a tus logros?"
→ "¿Cómo mediría un observador neutral la importancia de este error?"`,
    ['magnificar', 'minimizar', 'exagerar', 'amplificar', 'comparacion', 'escala', 'microscopio'],
    'Burns (1980); Beck (1979).',
  ),

  // ── 13 ─────────────────────────────────────────────────────────────────────
  bi(
    'dc_13_inferencia_arbitraria',
    'distorsiones_cognitivas',
    'Inferencia Arbitraria',
    'Llegar a conclusiones sin evidencia suficiente o incluso en contra de la evidencia disponible.',
    `DESCRIPCIÓN
Concepto original de Beck (1979) que engloba y da sustento a muchas otras distorsiones. El paciente salta a conclusiones negativas sin pasar por el proceso lógico de evaluación de la evidencia. La conclusión precede al análisis, no lo sigue.

EJEMPLOS CLÍNICOS
• "Me miró diferente — definitivamente está enojado conmigo." (sin más datos)
• "No me llamó todavía — seguro que pasó algo malo."
• "No entendí esa parte → nunca voy a poder aprender esto."

INDICADORES LINGÜÍSTICOS
"Definitivamente", "seguramente", "obviamente", "es claro que" — usados sin sustento factual. Ausencia total de calificadores epistémicos ("tal vez", "quizás", "podría ser").

DIAGNÓSTICOS ASOCIADOS
Presente como mecanismo base en depresión, ansiedad, trastornos de personalidad.

INTERVENCIÓN TCC
1. Evidencia pro y contra: listar en dos columnas ANTES de llegar a la conclusión.
2. Probabilidad estimada: "¿Qué % de probabilidad tiene cada posible explicación?"
3. Experimento: obtener información real antes de concluir.
4. Registro de pensamientos: columna extra para "evidencia que apoya / evidencia que contradice".

PREGUNTAS SOCRÁTICAS
→ "¿Qué evidencia concreta apoya esta conclusión?"
→ "¿Hay alguna evidencia que contradiga esta interpretación?"
→ "¿Cuántas otras explicaciones posibles tiene esta situación?"
→ "¿Llegaste a esta conclusión antes de revisar los datos o después?"`,
    ['inferencia', 'conclusion', 'evidencia', 'logica', 'saltar', 'conclusion precipitada'],
    'Beck, A.T. (1979) — concepto original de inferencia arbitraria.',
  ),

  // ── 14 ─────────────────────────────────────────────────────────────────────
  bi(
    'dc_14_sesgo_confirmatorio',
    'distorsiones_cognitivas',
    'Sesgo Confirmatorio',
    'Buscar, recordar e interpretar selectivamente la información que confirma las creencias previas, ignorando la que las contradice.',
    `DESCRIPCIÓN
Una vez formada una creencia (ej: "soy incompetente"), el sistema cognitivo filtra activamente la información para confirmarla: busca evidencias a favor, ignora evidencias en contra, e interpreta las ambiguas como confirmación. Es el mecanismo de mantenimiento más potente de las creencias nucleares disfuncionales.

EJEMPLOS CLÍNICOS
• Paciente que cree "soy aburrido": recuerda sólo las veces que alguien se fue de una conversación.
• Cree que "no le caigo bien a nadie": registra miradas frías, ignora gestos de afecto.
• "Cuando me va bien, es suerte. Cuando me va mal, confirma lo que ya sabía."

INDICADORES LINGÜÍSTICOS
No hay indicadores verbales directos — se detecta por el patrón de memoria sesgada y la incapacidad de integrar disconfirmación.

DIAGNÓSTICOS ASOCIADOS
Creencias nucleares disfuncionales (Young), depresión crónica, baja autoestima, paranoia, relaciones disfuncionales repetitivas.

INTERVENCIÓN TCC
1. Registro prospectivo (no retrospectivo): registrar TODOS los eventos relevantes al día siguiente.
2. Experimento conductual de desconfirmación: diseñar situaciones donde se ponga a prueba la creencia.
3. Terapia de Esquemas: explorar el origen del sesgo en la historia de aprendizaje temprana.
4. Técnica del abogado defensor: argumentar ACTIVAMENTE en contra de la creencia.

PREGUNTAS SOCRÁTICAS
→ "¿Podrías listar 5 evidencias CONTRA esta creencia con el mismo esfuerzo que encontraste evidencias a favor?"
→ "Cuando algo no confirma tu creencia, ¿qué hacés con esa información?"
→ "Si empezaras con la creencia contraria, ¿encontrarías también evidencias que la apoyan?"`,
    ['sesgo', 'confirmacion', 'filtro', 'memoria sesgada', 'creencia nuclear', 'Young', 'esquema'],
    'Young (1990) Schema Therapy; Nickerson (1998) Confirmation Bias.',
  ),

  // ── 15 ─────────────────────────────────────────────────────────────────────
  bi(
    'dc_15_falacia_control',
    'distorsiones_cognitivas',
    'Falacia de Control',
    'Creer que uno controla todo lo que ocurre (omnipotencia) o que no controla absolutamente nada (impotencia).',
    `DESCRIPCIÓN
Dos versiones opuestas de la misma distorsión:
A) Control externo extremo: "Los demás y el azar controlan mi vida completamente — no puedo hacer nada."
B) Control interno extremo: "Soy responsable de todo lo que ocurre — incluyendo las emociones y conductas de los demás."

EJEMPLOS CLÍNICOS
• Versión A: "No tiene sentido intentarlo, igual no puedo cambiar nada."
• Versión A: "Mi ansiedad me controla a mí, yo no puedo controlar a mi ansiedad."
• Versión B: "Si él está mal, yo tengo que arreglarlo."
• Versión B: "Soy responsable de que mi familia sea feliz."

INDICADORES LINGÜÍSTICOS
Versión A: "No puedo", "es imposible para mí", "no depende de mí". Versión B: "Tengo que hacer que...", "depende de mí que...", "si yo no...".

DIAGNÓSTICOS ASOCIADOS
Versión A: depresión (indefensión aprendida), ansiedad. Versión B: ansiedad por relaciones, cuidadores con burnout, perfeccionismo relacional.

INTERVENCIÓN TCC
1. Análisis de locus de control: ¿qué SÍ está bajo tu control y qué NO?
2. Experimento: identificar una pequeña área de acción posible y actuar.
3. Para versión B: gráfico de responsabilidades compartidas.
4. ACT: valores vs control — actuar desde los valores aunque el resultado sea incierto.

PREGUNTAS SOCRÁTICAS
→ "¿Qué aspectos de esta situación SÍ podés influenciar, aunque sea parcialmente?"
→ "¿Cuál es la diferencia entre influenciar un resultado y controlarlo completamente?"
→ "¿Qué pasaría si actuaras como si tuvieras un 20% de influencia real?"`,
    ['control', 'impotencia', 'omnipotencia', 'locus', 'indefension', 'responsabilidad', 'ACT'],
    'Rotter (1966) Locus of Control; Seligman (1975); Burns (1980).',
  ),

  // ── 16 ─────────────────────────────────────────────────────────────────────
  bi(
    'dc_16_falacia_justicia',
    'distorsiones_cognitivas',
    'Falacia de Justicia',
    'Creer que la vida debería ser justa según los propios términos, generando resentimiento cuando no lo es.',
    `DESCRIPCIÓN
El paciente tiene un sentido rígido de cómo deberían ser las cosas y experimenta furia, amargura o victimización cuando la realidad no cumple ese estándar. La creencia tácita es que "si yo me porto bien, la vida me debería recompensar".

EJEMPLOS CLÍNICOS
• "No es justo que yo trabaje tanto y otros cobren más."
• "Después de todo lo que hice por él, ¿cómo puede tratarme así?"
• "La vida no es justa conmigo — siempre me pasan estas cosas a mí."
• "Yo nunca haría eso — ¿por qué lo hacen conmigo?"

INDICADORES LINGÜÍSTICOS
"No es justo", "cómo puede ser que...", "después de todo lo que...", "yo nunca...", sentimiento crónico de agravio o victimización.

DIAGNÓSTICOS ASOCIADOS
Ira crónica, amargura patológica (embitterment disorder), depresión reactiva, conflictos relacionales crónicos.

INTERVENCIÓN TCC
1. Distinguir "la vida DEBERÍA ser justa" de "a mí ME GUSTARÍA que la vida fuera justa".
2. Aceptación radical (DBT): la vida ES como ES, no como debería ser.
3. Costo de la creencia: ¿Cuánta energía consume mantener esta expectativa?
4. Valores: ¿Qué podés hacer desde tus valores independientemente de que sea "justo"?

PREGUNTAS SOCRÁTICAS
→ "¿Quién estableció que la vida debería ser justa según tus criterios?"
→ "¿Podés aceptar que una situación es injusta Y aun así decidir cómo actuás ante ella?"
→ "¿Cuánta energía emocional te cuesta mantener la expectativa de que todo sea justo?"
→ "¿Qué harías diferente si aceptaras que la vida no siempre es justa?"`,
    ['justicia', 'resentimiento', 'injusticia', 'victimizacion', 'amargura', 'fairness', 'DBT'],
    'Burns (1980); Linehan (1993) DBT; Linden (2003) Embitterment.',
  ),

  // ── 17 ─────────────────────────────────────────────────────────────────────
  bi(
    'dc_17_culpabilizacion',
    'distorsiones_cognitivas',
    'Culpabilización (Externalización)',
    'Responsabilizar a otros por los propios problemas emocionales o conductuales, eximiéndose de agencia personal.',
    `DESCRIPCIÓN
El paciente asigna la responsabilidad de sus emociones y conductas a factores externos (personas, circunstancias), reduciendo su percepción de agencia y la posibilidad de cambio. Es el opuesto de la Personalización.

EJEMPLOS CLÍNICOS
• "Es que ella me pone de mal humor — si no fuera por ella, yo estaría bien."
• "No puedo mejorar porque mi jefe no me da las condiciones."
• "Mi infancia arruinó todo — nunca voy a poder cambiar."
• "Es que tuve mala suerte, no pude hacer nada."

INDICADORES LINGÜÍSTICOS
"Por culpa de X", "si no fuera por...", "es que ellos...", "no puedo porque...", ausencia de verbos en primera persona activa.

DIAGNÓSTICOS ASOCIADOS
Ira crónica, trastornos de personalidad (cluster B), conflictos de pareja, baja motivación para el cambio terapéutico.

INTERVENCIÓN TCC
1. Análisis de agencia: "¿Qué parte de tu respuesta emocional SÍ depende de vos?"
2. Modelo ABC: separar el Antecedente del pensamiento y la respuesta.
3. Valores: actuar según los propios valores independientemente de cómo actúen los demás.
4. Entrevista motivacional: explorar ambivalencia sobre el cambio personal.

PREGUNTAS SOCRÁTICAS
→ "Si X no cambia nunca, ¿qué podés hacer VOS de todas formas?"
→ "¿Hay alguna parte de tu respuesta emocional que sí depende de vos?"
→ "¿Qué cambiaría si respondieras a la situación desde tus valores, independientemente de lo que haga X?"
→ "¿Cómo sería tu vida si decidieras no esperar a que el otro cambie para sentirte mejor?"`,
    ['culpa', 'externalizacion', 'responsabilizar', 'agencia', 'victima', 'cambio', 'motivacion'],
    'Burns (1980); Miller & Rollnick (2002) Motivational Interviewing.',
  ),

  // ── 18 ─────────────────────────────────────────────────────────────────────
  bi(
    'dc_18_falacia_cambio',
    'distorsiones_cognitivas',
    'Falacia de Cambio',
    'Creer que la propia felicidad depende de que los demás cambien su comportamiento.',
    `DESCRIPCIÓN
El paciente condiciona su bienestar al cambio de otras personas. Invierte energía desproporcionada en intentar modificar a otros (presión, súplica, manipulación) en lugar de ajustar sus propias expectativas o conductas.

EJEMPLOS CLÍNICOS
• "Seré feliz cuando él cambie."
• "Si ella dejara de hacer eso, yo podría estar bien."
• "Con mis hijos cambiando un poco, todo sería diferente."
• "No puedo vivir bien hasta que mi madre me trate diferente."

INDICADORES LINGÜÍSTICOS
"Cuando X cambie...", "si X hiciera/dejara de hacer...", "lo que necesito es que los demás...". Inversión de recursos en el cambio ajeno en lugar del propio.

DIAGNÓSTICOS ASOCIADOS
Conflictos relacionales crónicos, codependencia, dificultades de asertividad, resentimiento.

INTERVENCIÓN TCC
1. Inventario de control: ¿Qué podés controlar (tus conductas, pensamientos) y qué no (la conducta ajena)?
2. Locus de bienestar: ¿qué condiciones internas de bienestar son independientes de los demás?
3. Asertividad: comunicar necesidades sin exigir cambio como condición de felicidad.
4. ACT: identificar valores propios y actuar según ellos independientemente del comportamiento ajeno.

PREGUNTAS SOCRÁTICAS
→ "¿Es posible que X nunca cambie? ¿Cómo sería tu vida en ese escenario?"
→ "¿Hay algún bienestar que puedas construir que NO dependa de que X cambie?"
→ "¿Qué parte de tu felicidad actual sí está en tus manos, sin esperar nada de los demás?"
→ "¿Qué harías diferente esta semana si aceptaras que X puede no cambiar?"`,
    ['cambio', 'dependencia', 'felicidad', 'condicion', 'control', 'aceptacion', 'asertividad', 'ACT'],
    'Burns (1980); Hayes (1999) ACT; Linehan (1993) DBT Aceptación Radical.',
  ),

];

// ── Re-exports por pack para uso futuro ──────────────────────────────────────

export const DISTORTION_PACK = BUILT_IN_KNOWLEDGE.filter(
  (e) => e.category === 'distorsiones_cognitivas',
);

/** IDs de las distorsiones built-in — para vincular con el store de sesión */
export const BUILT_IN_DISTORTION_IDS = DISTORTION_PACK.map((e) => e.id);
