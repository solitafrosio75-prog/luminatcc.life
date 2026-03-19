"""
Script to create all missing JSON data files for ACT, DC, TREC, and Mindfulness techniques.
Run with: python3 scripts/create-missing-json.py
"""
import json
import os

BASE = os.path.join(os.path.dirname(__file__), "..", "src", "knowledge")


def write_json(technique_folder: str, filename: str, data: dict):
    path = os.path.join(BASE, technique_folder, "data", filename)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  Created: {technique_folder}/data/{filename}")


# ============================================================================
# ACT — Missing files
# ============================================================================
print("=== ACT ===")

write_json("act", "act_hexaflex.json", {
    "area_id": "act_hexaflex",
    "nombre": "Hexaflex \u2014 Los 6 Procesos de Flexibilidad Psicol\u00f3gica",
    "descripcion": "Modelo central de ACT: seis procesos interrelacionados de flexibilidad e inflexibilidad psicol\u00f3gica organizados en el hexaflex.",
    "fuentes": [
        "Hayes, S. C., Strosahl, K. D. & Wilson, K. G. (2012). Acceptance and Commitment Therapy (2nd ed.). Guilford Press.",
        "Hayes, S. C., Luoma, J. B., Bond, F. W., Masuda, A. & Lillis, J. (2006). ACT: Model, processes and outcomes. Behaviour Research and Therapy, 44(1), 1-25.",
        "Harris, R. (2009). ACT Made Simple. New Harbinger Publications."
    ],
    "procesos": [
        {
            "id": "aceptacion", "nombre": "Aceptaci\u00f3n",
            "polo_inflexible": "Evitaci\u00f3n experiencial",
            "polo_flexible": "Aceptaci\u00f3n activa",
            "descripcion": "Disposici\u00f3n activa a experimentar pensamientos, emociones y sensaciones sin intentar cambiarlos, controlarlos o evitarlos. No es resignaci\u00f3n pasiva sino apertura voluntaria a la experiencia completa.",
            "indicadores_inflexibilidad": ["Supresi\u00f3n emocional sistem\u00e1tica", "Uso de sustancias para evitar malestar", "Evitaci\u00f3n de situaciones que generan emociones dif\u00edciles", "Distracci\u00f3n compulsiva ante pensamientos no deseados", "Somatizaci\u00f3n como expresi\u00f3n de emociones no procesadas"],
            "estrategias": ["Ejercicio de expansi\u00f3n: hacer espacio a las emociones en el cuerpo", "Met\u00e1fora de las arenas movedizas: luchar intensifica el problema", "Pr\u00e1ctica de willingness escalonada desde intensidad baja", "Observaci\u00f3n de la emoci\u00f3n sin intentar cambiarla"],
            "ejemplo_clinico": "Paciente con ansiedad social que evita reuniones. Se trabaja aceptaci\u00f3n del nerviosismo como experiencia natural, permitiendo asistir a reuniones CON la ansiedad presente."
        },
        {
            "id": "defusion", "nombre": "Defusi\u00f3n Cognitiva",
            "polo_inflexible": "Fusi\u00f3n cognitiva",
            "polo_flexible": "Defusi\u00f3n cognitiva",
            "descripcion": "Cambiar la relaci\u00f3n con los pensamientos: verlos como eventos mentales pasajeros en lugar de verdades literales que deben obedecerse.",
            "indicadores_inflexibilidad": ["Creer literalmente todo lo que piensa la mente", "Obedecer pensamientos como si fueran \u00f3rdenes", "Rumiaci\u00f3n: engancharse repetidamente con pensamientos", "Actuar seg\u00fan reglas verbales r\u00edgidas", "Confundir tener un pensamiento con que sea verdad"],
            "estrategias": ["Prefijo: Estoy teniendo el pensamiento de que...", "Repetici\u00f3n de palabras hasta perder significado emocional", "Agradecer a la mente por el pensamiento", "Cantar el pensamiento con melod\u00eda absurda", "Visualizaci\u00f3n: hojas en el r\u00edo, nubes en el cielo"],
            "ejemplo_clinico": "Paciente deprimido fusionado con Soy un fracaso. Mediante defusi\u00f3n aprende a decir Mi mente me est\u00e1 contando la historia de que soy un fracaso. El pensamiento sigue pero ya no controla su conducta."
        },
        {
            "id": "momento_presente", "nombre": "Contacto con el Momento Presente",
            "polo_inflexible": "Dominancia del pasado conceptualizado o futuro temido",
            "polo_flexible": "Contacto flexible con el aqu\u00ed y ahora",
            "descripcion": "Atender de manera consciente y no evaluativa a lo que est\u00e1 ocurriendo en el momento presente, tanto interna como externamente.",
            "indicadores_inflexibilidad": ["Vivir en piloto autom\u00e1tico", "Rumiaci\u00f3n sobre el pasado", "Preocupaci\u00f3n constante por el futuro", "Desconexi\u00f3n de la experiencia sensorial directa"],
            "estrategias": ["Ejercicio de los 5 sentidos: notar 5 cosas que ves, 4 que tocas, 3 que oyes, 2 que hueles, 1 que saboreas", "Anclaje a la respiraci\u00f3n: 3 respiraciones conscientes", "Etiquetado experiencial: nombrar lo que se observa sin juzgar", "Pr\u00e1ctica de atenci\u00f3n plena durante actividades rutinarias"],
            "ejemplo_clinico": "Paciente con ansiedad generalizada que vive anticipando cat\u00e1strofes. Se practica regresar al momento presente usando anclajes sensoriales concretos."
        },
        {
            "id": "yo_como_contexto", "nombre": "Yo-como-Contexto",
            "polo_inflexible": "Yo-como-contenido (apego a la autoimagen)",
            "polo_flexible": "Yo-como-contexto (observador estable)",
            "descripcion": "Contactar con un sentido de s\u00ed mismo como el contexto en el que ocurren las experiencias, no como el contenido de esas experiencias.",
            "indicadores_inflexibilidad": ["Identificarse r\u00edgidamente con roles: SOY depresivo", "Amenaza ante cambios de autoimagen", "Fusi\u00f3n con autodescripciones negativas", "No distinguir entre tener una experiencia y SER esa experiencia"],
            "estrategias": ["Met\u00e1fora del cielo: las emociones son el clima, t\u00fa eres el cielo", "Ejercicio del observador: observar pensamientos desde posici\u00f3n de testigo", "Met\u00e1fora del tablero de ajedrez: t\u00fa no eres las piezas, eres el tablero", "Continuidad temporal: conectar con el yo que ha estado presente en todas las experiencias"],
            "ejemplo_clinico": "Paciente con depresi\u00f3n cr\u00f3nica fusionado con Soy un fracasado. Se trabaja contactar con el yo-observador que ha presenciado momentos de \u00e9xito y fracaso."
        },
        {
            "id": "valores", "nombre": "Valores",
            "polo_inflexible": "Falta de claridad, desconexi\u00f3n o valores impuestos",
            "polo_flexible": "Claridad de valores elegidos como gu\u00eda de acci\u00f3n",
            "descripcion": "Direcciones de vida elegidas libremente que dan sentido y prop\u00f3sito. Los valores no son metas (que se alcanzan) sino br\u00fajulas (que orientan continuamente).",
            "indicadores_inflexibilidad": ["No saber qu\u00e9 es importante m\u00e1s all\u00e1 de aliviar el malestar", "Vivir seg\u00fan valores de otros sin cuestionarlos", "Confundir metas con valores", "Pliance: seguir reglas por aprobaci\u00f3n social", "Desconexi\u00f3n entre lo que se dice valorar y lo que se hace"],
            "estrategias": ["Bulls Eye: mapa visual de distancia entre vida actual y valores", "Ejercicio del funeral: qu\u00e9 te gustar\u00eda que dijeran de ti", "Br\u00fajula de valores: explorar dominios vitales", "Preguntas de clarificaci\u00f3n: qu\u00e9 har\u00edas si nadie te juzgara"],
            "ejemplo_clinico": "Paciente con burnout que trabaja 14 horas diarias. Al clarificar valores descubre que estar presente para mi familia es m\u00e1s importante que \u00e9xito profesional."
        },
        {
            "id": "accion_comprometida", "nombre": "Acci\u00f3n Comprometida",
            "polo_inflexible": "Inacci\u00f3n, impulsividad o evitaci\u00f3n persistente",
            "polo_flexible": "Patrones de acci\u00f3n al servicio de los valores",
            "descripcion": "Conductas concretas alineadas con los valores elegidos, realizadas incluso en presencia de malestar psicol\u00f3gico.",
            "indicadores_inflexibilidad": ["Esperar a sentirse motivado para actuar", "Procrastinaci\u00f3n cr\u00f3nica", "Patrones de acci\u00f3n impulsiva que alejan de valores", "Abandonar compromisos ante el primer obst\u00e1culo"],
            "estrategias": ["Micro-acciones comprometidas: pasos m\u00ednimos hoy", "SMART goals al servicio de valores", "Compromiso p\u00fablico de acci\u00f3n", "Disposici\u00f3n a fallar y recomprometerse", "Choice Point: identificar momentos de elecci\u00f3n hacia/lejos"],
            "ejemplo_clinico": "Paciente con depresi\u00f3n y aislamiento. Valor: conexi\u00f3n. Acci\u00f3n comprometida: enviar un mensaje a un amigo HOY, sin esperar sentir ganas."
        }
    ]
})

write_json("act", "act_defusion_cognitiva.json", {
    "area_id": "act_defusion_cognitiva",
    "nombre": "T\u00e9cnicas de Defusi\u00f3n Cognitiva",
    "descripcion": "Cat\u00e1logo de t\u00e9cnicas de defusi\u00f3n para distanciarse del contenido mental y cambiar la funci\u00f3n de los pensamientos.",
    "fuentes": [
        "Hayes, S. C. et al. (2012). ACT (2nd ed.). Guilford Press.",
        "Harris, R. (2009). ACT Made Simple. New Harbinger.",
        "Luoma, J. B. et al. (2007). Learning ACT. New Harbinger.",
        "Titchener, E. B. (1916). A Text-Book of Psychology. Macmillan."
    ],
    "tecnicas_defusion": [
        {
            "id": "repeticion_palabras", "nombre": "Repetici\u00f3n de Palabras (Titchener)",
            "tipo": "experiencial",
            "objetivo": "Reducir el impacto emocional de una palabra o frase repiti\u00e9ndola hasta que pierda su significado literal y se experimente como mero sonido.",
            "instrucciones": ["Elige una palabra angustiante (ej: fracaso, in\u00fatil, gordo)", "Rep\u00edtela en voz alta r\u00e1pidamente durante 30-60 segundos", "Nota c\u00f3mo pierde gradualmente su significado emocional", "Observa que es solo un sonido, no una verdad"],
            "duracion_aproximada": "2-5 minutos",
            "indicaciones": ["Fusi\u00f3n con autodescripciones negativas", "Rumiaci\u00f3n con palabras clave recurrentes", "Pensamientos catastrofistas con etiquetas fijas"],
            "ejemplo": "Paciente que repite in\u00fatil 45 veces. Al final dice: ahora suena raro, como si no fuera una palabra. Eso es defusi\u00f3n."
        },
        {
            "id": "nombrar_historias", "nombre": "Nombrar Historias",
            "tipo": "verbal",
            "objetivo": "Crear distancia de narrativas recurrentes poni\u00e9ndoles un nombre reconocible.",
            "instrucciones": ["Identifica una narrativa que tu mente repite frecuentemente", "Ponle un nombre: La historia de que no soy suficiente", "Cuando aparezca, nota: Ah\u00ed est\u00e1 otra vez la historia de...", "No intentes detenerla, solo reconocerla como una historia familiar"],
            "duracion_aproximada": "Continuo, cada vez que aparece",
            "indicaciones": ["Narrativas autocr\u00edticas recurrentes", "Historias de victimizaci\u00f3n o catastrofismo", "Rumiaci\u00f3n con tema identificable"],
            "ejemplo": "Paciente con ansiedad social: nombra La historia de que todos me juzgan. Cuando aparece antes de una reuni\u00f3n, dice: ah\u00ed est\u00e1 mi historia otra vez, y puede elegir ir de todos modos."
        },
        {
            "id": "agradecer_mente", "nombre": "Agradecer a la Mente",
            "tipo": "verbal",
            "objetivo": "Reconocer que la mente intenta proteger (aunque sea de forma contraproducente) sin engancharse con el contenido.",
            "instrucciones": ["Cuando aparezca un pensamiento dif\u00edcil, di internamente: Gracias mente por intentar protegerme", "No discutas con el pensamiento ni intentes cambiarlo", "Vuelve a lo que estabas haciendo", "Practica con pensamientos de intensidad baja primero"],
            "duracion_aproximada": "10 segundos cada vez",
            "indicaciones": ["Pensamientos de preocupaci\u00f3n anticipatoria", "Autocr\u00edtica leve a moderada", "Pensamiento catastrofista habitual"],
            "ejemplo": "Paciente antes de presentaci\u00f3n: mente dice Vas a hacer el rid\u00edculo. Responde: Gracias mente, entiendo que quieres protegerme. Y sube al escenario."
        },
        {
            "id": "cantar_pensamiento", "nombre": "Cantar el Pensamiento",
            "tipo": "experiencial",
            "objetivo": "Cambiar la forma del pensamiento (cantarlo, decirlo con voz graciosa) para alterar su funci\u00f3n sin cambiar su contenido.",
            "instrucciones": ["Toma un pensamiento angustiante y dilo en voz alta", "Ahora c\u00e1ntalo con la melod\u00eda de Cumplea\u00f1os Feliz", "Prueba con voz de dibujo animado", "Nota: el contenido es el mismo, pero la relaci\u00f3n con el pensamiento cambi\u00f3"],
            "duracion_aproximada": "2-3 minutos",
            "indicaciones": ["Fusi\u00f3n con pensamientos espec\u00edficos", "Pacientes que responden bien al humor", "Sesiones donde se necesita aligerar la intensidad"],
            "ejemplo": "Paciente deprimido que se repite No valgo nada. Al cantarlo con voz de Mickey Mouse, se r\u00ede y dice: es un pensamiento, no una realidad."
        },
        {
            "id": "prefijo_defusion", "nombre": "Prefijo de Defusi\u00f3n",
            "tipo": "verbal",
            "objetivo": "A\u00f1adir un prefijo metacognitivo que crea distancia entre la persona y el pensamiento.",
            "instrucciones": ["Cuando aparezca un pensamiento, a\u00f1ade: Estoy notando que tengo el pensamiento de que...", "Practica la cadena completa: primero Soy un fracaso, luego Estoy pensando que soy un fracaso, luego Estoy notando que estoy pensando que soy un fracaso", "Cada nivel a\u00f1ade m\u00e1s distancia", "Usa el nivel que necesites en cada momento"],
            "duracion_aproximada": "Continuo",
            "indicaciones": ["Primera t\u00e9cnica de defusi\u00f3n a ense\u00f1ar (b\u00e1sica)", "Fusi\u00f3n con cualquier tipo de pensamiento", "Complemento a otras t\u00e9cnicas de defusi\u00f3n"],
            "ejemplo": "Paciente ansioso: Mi mente me est\u00e1 diciendo que no voy a poder con esto. Noto el pensamiento, pero puedo actuar de todos modos."
        },
        {
            "id": "fisicalizar", "nombre": "Fisicalizar Pensamientos",
            "tipo": "corporal",
            "objetivo": "Dar forma f\u00edsica (tama\u00f1o, color, textura, peso) a un pensamiento para crear distancia y observarlo como objeto externo.",
            "instrucciones": ["Cierra los ojos y enfoca un pensamiento dif\u00edcil", "Si tuviera forma, \u00bfcu\u00e1l ser\u00eda?", "Si tuviera color, \u00bfcu\u00e1l ser\u00eda? \u00bfTemperatura? \u00bfTextura? \u00bfPeso?", "Imagina que lo sacas de tu cabeza y lo colocas frente a ti", "Observa el objeto. \u00bfPuedes tenerlo ah\u00ed sin que te controle?"],
            "duracion_aproximada": "5-10 minutos",
            "indicaciones": ["Pacientes con facilidad para imaginer\u00eda", "Emociones intensas con componente som\u00e1tico", "Complemento a defusi\u00f3n verbal cuando esta no es suficiente"],
            "ejemplo": "Paciente describe su ansiedad como una bola negra, caliente, del tama\u00f1o de un pu\u00f1o en el pecho. Al externalizarla puede decir: la bola est\u00e1 ah\u00ed, pero no soy la bola."
        },
        {
            "id": "hojas_rio", "nombre": "Hojas en el R\u00edo",
            "tipo": "metaforica",
            "objetivo": "Observar pensamientos como eventos que fluyen, sin aferrarse ni rechazarlos, desde la posici\u00f3n de observador sentado junto al r\u00edo.",
            "instrucciones": ["Imagina que est\u00e1s sentado junto a un r\u00edo tranquilo", "Por el r\u00edo flotan hojas", "Cada vez que aparezca un pensamiento, col\u00f3calo sobre una hoja y d\u00e9jalo pasar", "No aceleres el r\u00edo ni detengas las hojas", "Si te enganchas y pierdes el r\u00edo, nota que ocurri\u00f3 y vuelve a la orilla"],
            "duracion_aproximada": "5-10 minutos",
            "indicaciones": ["Rumiaci\u00f3n intensa", "Ejercicio formal de defusi\u00f3n en sesi\u00f3n", "Complemento a meditaci\u00f3n mindfulness"],
            "ejemplo": "Paciente con duelo: pensamientos de culpa aparecen como hojas. No se intenta que desaparezcan, solo que fluyan. Algunos pensamientos vuelven varias veces, y eso est\u00e1 bien."
        }
    ]
})

write_json("act", "act_valores_accion.json", {
    "area_id": "act_valores_accion",
    "nombre": "Valores y Acci\u00f3n Comprometida",
    "descripcion": "Sistema de clarificaci\u00f3n de valores, herramientas de exploraci\u00f3n y plan de acci\u00f3n comprometida graduada.",
    "fuentes": [
        "Hayes, S. C. et al. (2012). ACT (2nd ed.). Guilford Press.",
        "Harris, R. (2009). ACT Made Simple. New Harbinger.",
        "Wilson, K. G. & Murrell, A. R. (2004). Values work in ACT. In S. C. Hayes & K. D. Strosahl (Eds.), A practical guide to ACT. Springer.",
        "Lundgren, T., Luoma, J. B., Dahl, J., Strosahl, K. & Melin, L. (2012). The Bulls Eye Values Survey. The Behavior Analyst Today, 13(3-4), 3-7."
    ],
    "dominios_valores": [
        {"dominio": "Relaciones \u00edntimas / pareja", "preguntas_exploracion": ["\u00bfQu\u00e9 tipo de pareja quieres ser?", "\u00bfC\u00f3mo quieres tratar a tu pareja incluso en momentos dif\u00edciles?", "\u00bfQu\u00e9 cualidades quieres aportar a una relaci\u00f3n?", "\u00bfQu\u00e9 dir\u00eda tu pareja ideal sobre c\u00f3mo le tratas?"], "ejemplo_valores": ["Presencia emocional", "Honestidad con amabilidad", "Intimidad vulnerable", "Apoyo incondicional"]},
        {"dominio": "Familia", "preguntas_exploracion": ["\u00bfQu\u00e9 tipo de hijo/padre/hermano quieres ser?", "\u00bfC\u00f3mo quieres que te recuerden tus hijos?", "\u00bfQu\u00e9 priorizas en tu tiempo con la familia?"], "ejemplo_valores": ["Estar presente", "Paciencia", "Celebrar logros ajenos", "Protecci\u00f3n con autonom\u00eda"]},
        {"dominio": "Amistades y vida social", "preguntas_exploracion": ["\u00bfQu\u00e9 tipo de amigo quieres ser?", "\u00bfQu\u00e9 cualidades valoras en la amistad?", "\u00bfC\u00f3mo inviertes tu tiempo social?"], "ejemplo_valores": ["Lealtad", "Generosidad de tiempo", "Autenticidad", "Diversi\u00f3n compartida"]},
        {"dominio": "Trabajo y carrera", "preguntas_exploracion": ["\u00bfQu\u00e9 tipo de profesional quieres ser?", "\u00bfQu\u00e9 contribuci\u00f3n quieres hacer con tu trabajo?", "\u00bfElige tu trabajo o lo soportas?"], "ejemplo_valores": ["Excelencia sin perfeccionismo", "Contribuci\u00f3n significativa", "Colaboraci\u00f3n", "Aprendizaje continuo"]},
        {"dominio": "Educaci\u00f3n y crecimiento personal", "preguntas_exploracion": ["\u00bfQu\u00e9 te gustar\u00eda aprender si no tuvieras miedo?", "\u00bfC\u00f3mo alimentas tu curiosidad?", "\u00bfQu\u00e9 habilidades te gustar\u00eda desarrollar?"], "ejemplo_valores": ["Curiosidad activa", "Humildad ante el aprendizaje", "Perseverancia", "Crecimiento continuo"]},
        {"dominio": "Ocio y diversi\u00f3n", "preguntas_exploracion": ["\u00bfQu\u00e9 actividades te hacen sentir vivo?", "\u00bfCu\u00e1ndo fue la \u00faltima vez que hiciste algo solo por diversi\u00f3n?", "\u00bfQu\u00e9 hobbies abandonaste y te gustar\u00eda retomar?"], "ejemplo_valores": ["Juego y espontaneidad", "Creatividad", "Aventura", "Descanso activo"]},
        {"dominio": "Salud y bienestar f\u00edsico", "preguntas_exploracion": ["\u00bfC\u00f3mo quieres tratar tu cuerpo?", "\u00bfQu\u00e9 relaci\u00f3n quieres con el ejercicio y la alimentaci\u00f3n?", "\u00bfQu\u00e9 h\u00e1bitos reflejar\u00edan autocuidado genuino?"], "ejemplo_valores": ["Autocuidado compasivo", "Movimiento como disfrute", "Equilibrio", "Escuchar al cuerpo"]},
        {"dominio": "Espiritualidad y comunidad", "preguntas_exploracion": ["\u00bfQu\u00e9 te conecta con algo mayor que t\u00fa mismo?", "\u00bfC\u00f3mo quieres contribuir a tu comunidad?", "\u00bfQu\u00e9 legado quieres dejar?"], "ejemplo_valores": ["Servicio a otros", "Conexi\u00f3n con la naturaleza", "Sentido de pertenencia", "Trascendencia"]}
    ],
    "herramientas_clarificacion": [
        {"id": "bulls_eye", "nombre": "Diana de Valores (Bulls Eye)", "instrucciones": ["Dibuja una diana con 4 cuadrantes: trabajo, relaciones, ocio, salud", "En cada cuadrante escribe el valor m\u00e1s importante para ti", "Marca un punto: centro = vivo plenamente este valor, borde = totalmente desconectado", "La distancia al centro indica d\u00f3nde enfocar la acci\u00f3n comprometida"]},
        {"id": "brujula_valores", "nombre": "Br\u00fajula de Valores", "instrucciones": ["Lista los 8 dominios vitales", "Para cada dominio puntua 0-10: importancia y vivencia actual", "Calcula la discrepancia (importancia - vivencia)", "Los dominios con mayor discrepancia son prioridad para acci\u00f3n"]},
        {"id": "ejercicio_funeral", "nombre": "Ejercicio del Funeral", "instrucciones": ["Imagina tu funeral. Cuatro personas hablan: pareja, familiar, compa\u00f1ero de trabajo, amigo de comunidad", "Escribe qu\u00e9 te gustar\u00eda que cada uno dijera de ti", "Eso que escribiste son tus valores", "Compara con tu vida actual: \u00bfd\u00f3nde hay discrepancia?"]},
        {"id": "carta_futuro", "nombre": "Carta desde el Futuro", "instrucciones": ["Imagina que tienes 80 a\u00f1os y escribes una carta a tu yo actual", "Qu\u00e9 consejos te dar\u00edas sobre lo que realmente importa", "Qu\u00e9 te arrepentir\u00edas de no haber hecho", "Qu\u00e9 te alegrar\u00edas de haber hecho"]}
    ],
    "plan_accion_comprometida": {
        "pasos": [
            "Clarificar el valor espec\u00edfico que gu\u00eda la acci\u00f3n",
            "Definir una meta concreta al servicio de ese valor",
            "Desglosar la meta en micro-acciones realizables hoy",
            "Identificar barreras internas (pensamientos, emociones) que aparecer\u00e1n",
            "Aplicar habilidades ACT (defusi\u00f3n, aceptaci\u00f3n) a las barreras",
            "Realizar la acci\u00f3n ANTES de sentir motivaci\u00f3n",
            "Evaluar: \u00bfla acci\u00f3n me acerc\u00f3 a mi valor? \u00bfQu\u00e9 aprend\u00ed?",
            "Recomprometerse sin autocr\u00edtica si hubo desv\u00edo"
        ],
        "criterio_compromiso": "El compromiso no es hacerlo perfecto sino volver a elegir la direcci\u00f3n valiosa cada vez que te desv\u00edas. Caer no es fracasar; no levantarse s\u00ed lo es."
    }
})

write_json("act", "habilidades_terapeuta.json", {
    "area_id": "habilidades_terapeuta",
    "nombre": "Habilidades del Terapeuta ACT",
    "descripcion": "Competencias cl\u00ednicas espec\u00edficas del terapeuta ACT, incluyendo postura terap\u00e9utica, uso de met\u00e1foras y modelado de flexibilidad.",
    "fuentes": [
        "Luoma, J. B. et al. (2007). Learning ACT. New Harbinger.",
        "Hayes, S. C. et al. (2012). ACT (2nd ed.). Guilford Press.",
        "Villatte, M., Villatte, J. L. & Hayes, S. C. (2016). Mastering the Clinical Conversation. Guilford Press."
    ],
    "habilidades": [
        {"nombre": "Postura de igualdad", "descripcion": "El terapeuta ACT trabaja desde una posici\u00f3n de igualdad: ambos tienen mentes que generan fusi\u00f3n y evitaci\u00f3n. El terapeuta modela vulnerabilidad y apertura.", "importancia": "Reduce la jerarqu\u00eda terap\u00e9utica y normaliza las luchas humanas. El paciente siente que no est\u00e1 roto sino humano.", "como_desarrollar": "Pr\u00e1ctica personal de ACT. Autorrevelaci\u00f3n selectiva de experiencias propias con fusi\u00f3n o evitaci\u00f3n. Supervisi\u00f3n enfocada en procesos propios del terapeuta."},
        {"nombre": "Uso de met\u00e1foras cl\u00ednicas", "descripcion": "Las met\u00e1foras son la herramienta principal de comunicaci\u00f3n en ACT. Transmiten conceptos experienciales de forma vivencial, no intelectual.", "importancia": "Las met\u00e1foras evitan la trampa de la explicaci\u00f3n l\u00f3gica (que a\u00f1ade m\u00e1s lenguaje al problema). Comunican a nivel experiencial, no verbal-literal.", "como_desarrollar": "Estudiar el cat\u00e1logo de met\u00e1foras ACT (Stoddard & Afari, 2014). Practicar crear met\u00e1foras propias adaptadas al contexto del paciente. Supervisar la precisi\u00f3n funcional de la met\u00e1fora."},
        {"nombre": "Modelado de apertura experiencial", "descripcion": "El terapeuta demuestra estar dispuesto a experimentar incomodidad en sesi\u00f3n. Si surge emoci\u00f3n, no la evita ni la intelectualiza.", "importancia": "El paciente aprende por observaci\u00f3n: si el terapeuta puede estar con emociones dif\u00edciles, yo tambi\u00e9n puedo.", "como_desarrollar": "Pr\u00e1ctica personal de mindfulness y aceptaci\u00f3n. Tolerar silencios emocionales en sesi\u00f3n. No rescatar al paciente del malestar prematuramente."},
        {"nombre": "Flexibilidad de agenda", "descripcion": "Seguir el proceso del paciente en lugar del protocolo r\u00edgido. Si surge un momento de flexibilidad/inflexibilidad, abordarlo aunque no est\u00e9 en el plan de sesi\u00f3n.", "importancia": "ACT es un modelo basado en procesos, no en sesiones numeradas. La rigidez del terapeuta contradice el mensaje de flexibilidad.", "como_desarrollar": "Manejar la ansiedad propia ante la falta de estructura. Desarrollar radar para detectar procesos ACT en tiempo real. Supervisi\u00f3n con grabaciones de sesiones."},
        {"nombre": "Gu\u00eda experiencial vs. did\u00e1ctica", "descripcion": "Priorizar ejercicios vivenciales sobre explicaciones te\u00f3ricas. ACT se aprende haciendo, no entendiendo intelectualmente.", "importancia": "La comprensi\u00f3n intelectual de ACT puede ser otra forma de evitaci\u00f3n experiencial. El cambio ocurre en la experiencia directa, no en la explicaci\u00f3n.", "como_desarrollar": "Mantener ratio 70% experiencial / 30% did\u00e1ctico. Cada concepto se introduce con un ejercicio, no con una explicaci\u00f3n. Practicar la pregunta: \u00bfpuedo mostrar esto en lugar de explicarlo?"},
        {"nombre": "Manejo de la propia evitaci\u00f3n", "descripcion": "Detectar cu\u00e1ndo el terapeuta evita temas dif\u00edciles, cambia de tema ante emociones intensas, o intelectualiza para no sentir.", "importancia": "La evitaci\u00f3n del terapeuta modela evitaci\u00f3n en el paciente. Es la barrera m\u00e1s com\u00fan y menos visible.", "como_desarrollar": "Terapia personal basada en ACT. Supervisi\u00f3n con foco en evitaci\u00f3n terap\u00e9utica. Auto-monitoreo: \u00bfpor qu\u00e9 cambi\u00e9 de tema en ese momento?"}
    ]
})

write_json("act", "sintomas_problemas.json", {
    "area_id": "sintomas_problemas",
    "nombre": "S\u00edntomas y Problemas Diana de ACT",
    "descripcion": "Trastornos y problemas cl\u00ednicos abordados por ACT, con foco en la evitaci\u00f3n experiencial como proceso transdiagn\u00f3stico.",
    "fuentes": [
        "Hayes, S. C. et al. (2012). ACT (2nd ed.). Guilford Press.",
        "A-Tjak, J. G. L. et al. (2015). A meta-analysis of the efficacy of ACT. Behaviour Research and Therapy, 69, 60-75.",
        "Twohig, M. P. & Levin, M. E. (2017). ACT as treatment for anxiety and depression. Psychiatric Clinics of North America, 40(4), 751-770."
    ],
    "trastornos": [
        {"nombre": "Evitaci\u00f3n experiencial cr\u00f3nica", "sintomas_principales": ["Supresi\u00f3n emocional sistem\u00e1tica", "Evitaci\u00f3n de situaciones que generan malestar", "Uso de sustancias o conductas adictivas como escape", "Estrechamiento progresivo de la vida", "Desconexion de emociones, sensaciones y relaciones"], "como_se_manifiesta_en_conducta": "Restricci\u00f3n progresiva del repertorio conductual: cada vez hace menos cosas para evitar sentir malestar. Vida cada vez m\u00e1s peque\u00f1a.", "foco_intervencion": "Aceptaci\u00f3n activa + acci\u00f3n comprometida: ampliar el repertorio conductual aceptando el malestar como compa\u00f1ero de viaje, no como obst\u00e1culo."},
        {"nombre": "Rumiaci\u00f3n depresiva", "sintomas_principales": ["Pensamientos autocr\u00edticos repetitivos", "An\u00e1lisis interminable de por qu\u00e9 me pasa esto", "Comparaci\u00f3n constante con otros o con el pasado", "Sensaci\u00f3n de estar atrapado en la cabeza", "Fusi\u00f3n con narrativas de fracaso o inutilidad"], "como_se_manifiesta_en_conducta": "Inactividad, aislamiento, dificultad para tomar decisiones. El paciente pasa horas pensando pero sin actuar.", "foco_intervencion": "Defusi\u00f3n cognitiva de la rumiaci\u00f3n + contacto con el momento presente + micro-acciones comprometidas que rompan el ciclo."},
        {"nombre": "Ansiedad con evitaci\u00f3n", "sintomas_principales": ["Anticipaci\u00f3n catastrofista", "Evitaci\u00f3n de situaciones temidas", "Conductas de seguridad", "Hipervigilancia", "Tensi\u00f3n f\u00edsica cr\u00f3nica"], "como_se_manifiesta_en_conducta": "Estrechamiento de la vida social, laboral y de ocio. El paciente organiza su vida alrededor de evitar la ansiedad.", "foco_intervencion": "Aceptaci\u00f3n de la ansiedad como experiencia normal + defusi\u00f3n de pensamientos catastrofistas + exposici\u00f3n a situaciones evitadas al servicio de valores."},
        {"nombre": "Dolor cr\u00f3nico con catastrofizaci\u00f3n", "sintomas_principales": ["Dolor persistente sin causa org\u00e1nica clara", "Catastrofizaci\u00f3n del dolor", "Fusi\u00f3n con identidad de enfermo", "Evitaci\u00f3n de actividades por miedo al dolor", "P\u00e9rdida de roles y actividades significativas"], "como_se_manifiesta_en_conducta": "Inactividad progresiva, dependencia de f\u00e1rmacos, aislamiento social. La vida gira alrededor de evitar o controlar el dolor.", "foco_intervencion": "Aceptaci\u00f3n del dolor (no resignaci\u00f3n) + defusi\u00f3n de catastrofizaci\u00f3n + activaci\u00f3n graduada al servicio de valores. ACT es tratamiento de elecci\u00f3n."},
        {"nombre": "Adicciones como evitaci\u00f3n emocional", "sintomas_principales": ["Uso de sustancias para regular emociones", "Craving intenso ante malestar emocional", "P\u00e9rdida de control sobre el consumo", "Desconexi\u00f3n de valores por la sustancia", "Recaidas repetidas tras intentos de control"], "como_se_manifiesta_en_conducta": "Ciclo de malestar \u2192 consumo \u2192 alivio temporal \u2192 culpa \u2192 m\u00e1s malestar \u2192 m\u00e1s consumo. La sustancia es la estrategia de evitaci\u00f3n experiencial.", "foco_intervencion": "Aceptaci\u00f3n del craving (urge surfing) + defusi\u00f3n de pensamientos que justifican el consumo + reconexion con valores que la adicci\u00f3n destruye."}
    ]
})

# ============================================================================
# DC (DBT) — Missing files
# ============================================================================
print("\n=== DC ===")

write_json("dialectico_conductual", "habilidades_terapeuta.json", {
    "area_id": "habilidades_terapeuta",
    "nombre": "Habilidades del Terapeuta DBT",
    "descripcion": "Competencias cl\u00ednicas espec\u00edficas del terapeuta DBT, incluyendo balance dial\u00e9ctico, validaci\u00f3n multinivel y manejo de crisis.",
    "fuentes": [
        "Linehan, M. M. (1993). Cognitive-Behavioral Treatment of Borderline Personality Disorder. Guilford Press.",
        "Linehan, M. M. (2015). DBT Skills Training Manual (2nd ed.). Guilford Press.",
        "Koerner, K. (2012). Doing Dialectical Behavior Therapy. Guilford Press."
    ],
    "habilidades": [
        {"nombre": "Balance dial\u00e9ctico (aceptaci\u00f3n y cambio)", "descripcion": "Mantener simult\u00e1neamente la validaci\u00f3n de la experiencia del paciente y el empuje hacia el cambio. Ni invalidar ni reforzar la pasividad.", "importancia": "El desequilibrio hacia cualquier polo fracasa: solo validar mantiene el patr\u00f3n; solo empujar al cambio invalida y genera abandono.", "como_desarrollar": "Pr\u00e1ctica de encontrar verdad en ambos lados de cualquier dilema. Supervisi\u00f3n dial\u00e9ctica. Equipo de consulta."},
        {"nombre": "Validaci\u00f3n multinivel (6 niveles de Linehan)", "descripcion": "Escuchar activamente (N1), reflejar sin juicio (N2), leer emociones no verbalizadas (N3), explicar conducta en contexto hist\u00f3rico (N4), normalizar en contexto actual (N5), tratar al paciente como persona competente (N6).", "importancia": "La validaci\u00f3n es el antidoto contra el ambiente invalidante que caus\u00f3 la desregulaci\u00f3n. Sin validaci\u00f3n, el paciente abandona.", "como_desarrollar": "Practicar cada nivel por separado. Grabaciones de sesiones con feedback de equipo. Auto-monitoreo de momentos de invalidaci\u00f3n accidental."},
        {"nombre": "Manejo de crisis telef\u00f3nicas", "descripcion": "Atender llamadas de crisis entre sesiones seg\u00fan protocolo DBT: evaluar riesgo, coaching de habilidades, limitar duraci\u00f3n, no reforzar conductas disfuncionales.", "importancia": "La accesibilidad telef\u00f3nica es parte esencial de DBT pero debe estar estructurada para no reforzar la crisis como forma de contacto.", "como_desarrollar": "Protocolo claro de disponibilidad. Pr\u00e1ctica de coaching breve (10-15 min). Regla de 24 horas post-autolesion."},
        {"nombre": "Consulta de equipo (peer consultation)", "descripcion": "Participar en equipo de consulta semanal donde se trabajan los procesos del terapeuta, no solo los del paciente. Acuerdos: dial\u00e9ctica, falibilidad, consulta al paciente.", "importancia": "DBT con pacientes de alto riesgo genera burnout. El equipo es la terapia del terapeuta y previene errores por agotamiento.", "como_desarrollar": "Formar o unirse a equipo de consulta DBT. Practicar vulnerabilidad en el equipo. Aceptar feedback sin defensividad."},
        {"nombre": "Uso estrat\u00e9gico de la irreverencia", "descripcion": "Comunicaci\u00f3n inesperada, directa o humor\u00edstica que rompe patrones r\u00edgidos del paciente. Contrasta con el estilo rec\u00edproco (c\u00e1lido, emp\u00e1tico).", "importancia": "La irreverencia genera movimiento cuando el paciente est\u00e1 estancado en polarizaciones. Debe usarse con relaci\u00f3n terap\u00e9utica s\u00f3lida.", "como_desarrollar": "Observar sesiones de Linehan. Practicar en supervisi\u00f3n. Calibrar timing: la irreverencia mal colocada invalida."},
        {"nombre": "An\u00e1lisis funcional de cadena", "descripcion": "Habilidad para conducir un an\u00e1lisis detallado de la secuencia de eventos internos y externos que llev\u00f3 a una conducta problema, identificando eslabones vulnerables.", "importancia": "El an\u00e1lisis en cadena es la herramienta diagn\u00f3stica principal de DBT para conductas de riesgo. Sin \u00e9l, la intervenci\u00f3n es gen\u00e9rica.", "como_desarrollar": "Practicar con casos simulados. Supervisar cadenas completas. Desarrollar habilidad para identificar eslabones cr\u00edticos donde intervenir."}
    ]
})

write_json("dialectico_conductual", "sintomas_problemas.json", {
    "area_id": "sintomas_problemas",
    "nombre": "S\u00edntomas y Problemas Diana de DBT",
    "descripcion": "Trastornos y problemas cl\u00ednicos abordados por la Terapia Dial\u00e9ctico Conductual, organizados por jerarqu\u00eda de conductas diana.",
    "fuentes": [
        "Linehan, M. M. (1993). Cognitive-Behavioral Treatment of BPD. Guilford Press.",
        "Stoffers-Winterling, J. M. et al. (2022). Psychological therapies for BPD. Cochrane Database of Systematic Reviews.",
        "Chapman, A. L. (2006). Dialectical Behavior Therapy. Psychiatry, 3(9), 62-68."
    ],
    "trastornos": [
        {"nombre": "Trastorno L\u00edmite de Personalidad (TLP)", "sintomas_principales": ["Inestabilidad afectiva intensa y r\u00e1pida", "Relaciones interpersonales ca\u00f3ticas (idealizaci\u00f3n/devaluaci\u00f3n)", "Conductas autolesivas", "Impulsividad destructiva", "Vac\u00edo cr\u00f3nico e identidad difusa", "Ira intensa e inapropiada", "Ideaci\u00f3n paranoide transitoria"], "como_se_manifiesta_en_conducta": "Ciclos de crisis interpersonal, autolesiones como regulaci\u00f3n emocional, hospitalizaciones recurrentes, abandono de tratamientos previos, conductas de riesgo.", "foco_intervencion": "Jerarqu\u00eda: 1) Conductas que amenazan la vida, 2) Conductas que interfieren con la terapia, 3) Conductas que interfieren con la calidad de vida, 4) Aumento de habilidades."},
        {"nombre": "Autolesi\u00f3n no suicida (NSSI)", "sintomas_principales": ["Cortarse, quemarse, golpearse", "Uso de la autolesi\u00f3n como regulaci\u00f3n emocional", "Alivio temporal seguido de culpa", "Patr\u00f3n repetitivo y escalante", "Secretismo y verg\u00fcenza"], "como_se_manifiesta_en_conducta": "Ciclo: emoci\u00f3n intensa \u2192 urgencia \u2192 autolesi\u00f3n \u2192 alivio inmediato \u2192 culpa/verg\u00fcenza \u2192 m\u00e1s desregulaci\u00f3n.", "foco_intervencion": "An\u00e1lisis en cadena de cada episodio, sustituci\u00f3n por habilidades TIPP/ACCEPTS, an\u00e1lisis de la funci\u00f3n de la autolesi\u00f3n (regulaci\u00f3n, comunicaci\u00f3n, autocastigo)."},
        {"nombre": "Desregulaci\u00f3n emocional severa", "sintomas_principales": ["Emociones intensas de inicio r\u00e1pido", "Reactividad emocional elevada", "Retorno lento a l\u00ednea base", "Sensibilidad emocional alta", "D\u00e9ficit en identificaci\u00f3n y etiquetado emocional"], "como_se_manifiesta_en_conducta": "Estallidos de ira, llanto incontrolable, cambios de humor en minutos, decisiones impulsivas en estados emocionales intensos.", "foco_intervencion": "M\u00f3dulo de regulaci\u00f3n emocional: verificar hechos, acci\u00f3n opuesta, ABC PLEASE, modelo de emoci\u00f3n."},
        {"nombre": "Inestabilidad relacional", "sintomas_principales": ["Idealizaci\u00f3n/devaluaci\u00f3n r\u00e1pida", "Miedo intenso al abandono", "Conflictos interpersonales frecuentes", "Dificultad para pedir necesidades", "Sumisi\u00f3n o agresi\u00f3n como extremos"], "como_se_manifiesta_en_conducta": "Relaciones intensas y breves, rupturas y reconciliaciones repetidas, dificultad para establecer l\u00edmites, aislamiento por miedo al rechazo.", "foco_intervencion": "M\u00f3dulo de efectividad interpersonal: DEAR MAN, GIVE, FAST. Trabajo en balance entre pedir y ceder, mantener autorrespeto."},
        {"nombre": "Impulsividad destructiva", "sintomas_principales": ["Gastos compulsivos", "Atracones alimentarios", "Conducta sexual de riesgo", "Conduccion temeraria", "Abuso de sustancias impulsivo"], "como_se_manifiesta_en_conducta": "Conductas de alto riesgo ejecutadas para aliviar malestar emocional inmediato sin considerar consecuencias a largo plazo.", "foco_intervencion": "Tolerancia al malestar (TIPP, pros/contras), an\u00e1lisis en cadena para identificar el eslab\u00f3n de urgencia conductual, accion opuesta."}
    ]
})

write_json("dialectico_conductual", "dc_regulacion_emocional.json", {
    "area_id": "dc_regulacion_emocional",
    "nombre": "Habilidades de Regulaci\u00f3n Emocional (DBT)",
    "descripcion": "M\u00f3dulo de regulaci\u00f3n emocional de DBT: modelo de emoci\u00f3n, habilidades para entender, reducir vulnerabilidad y cambiar respuestas emocionales.",
    "fuentes": [
        "Linehan, M. M. (2015). DBT Skills Training Manual (2nd ed.). Guilford Press.",
        "Linehan, M. M. (1993). Skills Training Manual for BPD. Guilford Press.",
        "Neacsiu, A. D., Eberle, J. W., Kramer, R., Wiesmann, T. & Linehan, M. M. (2014). DBT skills use as a mediator and outcome. Behaviour Research and Therapy, 53, 3-11."
    ],
    "modelo_emocion": {
        "componentes": [
            "Evento activador (interno o externo)",
            "Interpretaci\u00f3n del evento (evaluaci\u00f3n cognitiva)",
            "Cambios fisiol\u00f3gicos (activaci\u00f3n del SNA)",
            "Impulso de acci\u00f3n (tendencia conductual asociada a la emoci\u00f3n)",
            "Expresi\u00f3n emocional (facial, verbal, postural)",
            "Consecuencias de la acci\u00f3n (refuerzo o castigo del ciclo)"
        ],
        "funcion_emociones": "Las emociones cumplen tres funciones: comunicar a otros (funci\u00f3n social), motivar la acci\u00f3n (funci\u00f3n motivacional) y organizar la respuesta ante eventos importantes (funci\u00f3n adaptativa). No son el enemigo; la desregulaci\u00f3n s\u00ed lo es."
    },
    "habilidades": [
        {
            "id": "verificar_hechos", "nombre": "Verificar los Hechos",
            "objetivo": "Evaluar si la emoci\u00f3n y su intensidad corresponden a los hechos de la situaci\u00f3n, separando interpretaciones de realidad.",
            "pasos": ["Describir el evento que dispar\u00f3 la emoci\u00f3n en t\u00e9rminos objetivos", "Identificar la interpretaci\u00f3n/supuesto que hice", "Preguntar: \u00bfcu\u00e1les son los HECHOS a favor y en contra de mi interpretaci\u00f3n?", "Evaluar: \u00bfmi emoci\u00f3n corresponde a los hechos o a mi interpretaci\u00f3n?", "Si no corresponde: acci\u00f3n opuesta. Si corresponde: resoluci\u00f3n de problemas."],
            "cuando_usar": "Antes de actuar sobre una emoci\u00f3n intensa. Especialmente cuando la emoci\u00f3n parece desproporcionada.",
            "ejemplo_clinico": "Paciente furiosa porque su pareja no le respondi\u00f3 un mensaje. Verificar hechos: \u00bfest\u00e1 en reuni\u00f3n? \u00bfha ignorado mensajes antes? Resultado: la pareja estaba conduciendo. La ira era desproporcionada al hecho."
        },
        {
            "id": "accion_opuesta", "nombre": "Acci\u00f3n Opuesta",
            "objetivo": "Cambiar una emoci\u00f3n actuando de forma opuesta al impulso que genera, cuando la emoci\u00f3n no corresponde a los hechos.",
            "pasos": ["Identificar la emoci\u00f3n y su impulso de acci\u00f3n", "Verificar si la emoci\u00f3n corresponde a los hechos", "Si NO corresponde: identificar la acci\u00f3n opuesta al impulso", "Realizar la acci\u00f3n opuesta COMPLETAMENTE (conducta, postura, expresi\u00f3n facial)", "Repetir hasta que la emoci\u00f3n cambie"],
            "cuando_usar": "Cuando la emoci\u00f3n no corresponde a los hechos o cuando actuar seg\u00fan el impulso empeorar\u00eda la situaci\u00f3n.",
            "ejemplo_clinico": "Miedo a hablar en p\u00fablico sin peligro real. Impulso: evitar. Acci\u00f3n opuesta: acercarse a la situaci\u00f3n temida, hablar en voz alta, postura abierta, contacto visual."
        },
        {
            "id": "abc_please", "nombre": "ABC PLEASE",
            "acronimo": "ABC PLEASE",
            "objetivo": "Reducir la vulnerabilidad emocional mediante h\u00e1bitos de cuidado b\u00e1sico y acumulaci\u00f3n de experiencias positivas.",
            "pasos": ["A: Acumular experiencias positivas (a corto y largo plazo)", "B: Build mastery - construir maestr\u00eda haciendo cosas que generen competencia", "C: Cope ahead - anticipar situaciones dif\u00edciles y planificar habilidades", "PL: Tratar enfermedades f\u00edsicas (PhysicaL illness)", "E: Equilibrar alimentaci\u00f3n (Eating)", "A: Evitar sustancias que alteren el \u00e1nimo (Avoid drugs)", "S: Equilibrar el sue\u00f1o (Sleep)", "E: Hacer ejercicio (Exercise)"],
            "cuando_usar": "Como pr\u00e1ctica preventiva continua para reducir vulnerabilidad emocional basal.",
            "ejemplo_clinico": "Paciente con TLP que tiene crisis cada lunes. An\u00e1lisis: duerme 4 horas el fin de semana, no come, bebe alcohol. PLEASE como intervenci\u00f3n preventiva reduce frecuencia de crisis un 60%."
        },
        {
            "id": "resolucion_problemas", "nombre": "Resoluci\u00f3n de Problemas",
            "objetivo": "Cuando la emoci\u00f3n s\u00ed corresponde a los hechos, cambiar la situaci\u00f3n problem\u00e1tica en lugar de cambiar la emoci\u00f3n.",
            "pasos": ["Describir el problema en t\u00e9rminos espec\u00edficos y observables", "Verificar que la emoci\u00f3n corresponde a los hechos", "Generar m\u00faltiples soluciones (lluvia de ideas sin censura)", "Evaluar pros y contras de cada soluci\u00f3n", "Elegir la soluci\u00f3n m\u00e1s efectiva y planificar implementaci\u00f3n", "Ejecutar y evaluar resultados"],
            "cuando_usar": "Cuando verificar los hechos confirma que la emoci\u00f3n es justificada y la situaci\u00f3n es modificable.",
            "ejemplo_clinico": "Paciente triste porque su jefe le ignora sistem\u00e1ticamente. Verificar hechos: es cierto, otros compa\u00f1eros lo confirman. Resoluci\u00f3n: solicitar reuni\u00f3n con jefe usando DEAR MAN."
        }
    ]
})

write_json("dialectico_conductual", "dc_tolerancia_malestar.json", {
    "area_id": "dc_tolerancia_malestar",
    "nombre": "Habilidades de Tolerancia al Malestar (DBT)",
    "descripcion": "M\u00f3dulo de tolerancia al malestar: habilidades de supervivencia en crisis y habilidades de aceptaci\u00f3n de la realidad.",
    "fuentes": [
        "Linehan, M. M. (2015). DBT Skills Training Manual (2nd ed.). Guilford Press.",
        "McKay, M., Wood, J. C. & Brantley, J. (2007). The DBT Skills Workbook. New Harbinger."
    ],
    "habilidades_crisis": [
        {
            "id": "tipp", "nombre": "TIPP",
            "acronimo": "TIPP",
            "componentes": [
                {"letra": "T", "significado": "Temperatura", "instruccion": "Sumerge la cara en agua fr\u00eda (10-15\u00b0C) durante 30 segundos o aplica hielo en mejillas y ojos. Activa el reflejo de buceo y reduce frecuencia card\u00edaca."},
                {"letra": "I", "significado": "Ejercicio Intenso", "instruccion": "Realiza ejercicio aer\u00f3bico intenso durante 10-20 minutos (correr, saltar, subir escaleras). Quema adrenalina y cortisol."},
                {"letra": "P", "significado": "Respiraci\u00f3n Pautada", "instruccion": "Exhala m\u00e1s lento de lo que inhalas (ej: inhala 4 seg, exhala 8 seg). Activa el parasimpatico."},
                {"letra": "P", "significado": "Relajaci\u00f3n Muscular Progresiva", "instruccion": "Tensa cada grupo muscular 5 seg, suelta 15 seg. De pies a cabeza. Libera tensi\u00f3n f\u00edsica acumulada."}
            ],
            "intensidad": "alta",
            "duracion": "5-20 minutos"
        },
        {
            "id": "accepts", "nombre": "ACCEPTS",
            "acronimo": "ACCEPTS",
            "componentes": [
                {"letra": "A", "significado": "Actividades", "instruccion": "Realiza actividades que requieran atenci\u00f3n: puzzles, videojuegos, limpiar, cocinar."},
                {"letra": "C", "significado": "Contribuir", "instruccion": "Haz algo por alguien m\u00e1s: voluntariado, ayudar a un vecino, escribir una carta de agradecimiento."},
                {"letra": "C", "significado": "Comparaciones", "instruccion": "Compara con momentos en que estuviste peor y lo superaste. Evita comparaciones que invaliden."},
                {"letra": "E", "significado": "Emociones diferentes", "instruccion": "Genera una emoci\u00f3n distinta: pel\u00edcula de comedia, m\u00fasica alegre, fotos de momentos felices."},
                {"letra": "P", "significado": "Empujar (Push away)", "instruccion": "Aparta mentalmente la situaci\u00f3n: imag\u00ednala en una caja, pon la en un estante, vuelve a ella despu\u00e9s."},
                {"letra": "T", "significado": "Pensamientos (Thoughts)", "instruccion": "Ocupa la mente con pensamientos neutros: contar hacia atr\u00e1s de 7 en 7, recitar una canci\u00f3n."},
                {"letra": "S", "significado": "Sensaciones", "instruccion": "Usa estimulaci\u00f3n sensorial intensa pero segura: hielo en la mano, chile, ducha fr\u00eda, m\u00fasica alta."}
            ],
            "intensidad": "moderada",
            "duracion": "15-60 minutos"
        },
        {
            "id": "improve", "nombre": "IMPROVE",
            "acronimo": "IMPROVE",
            "componentes": [
                {"letra": "I", "significado": "Imaginer\u00eda", "instruccion": "Imagina un lugar seguro y tranquilo con todos los detalles sensoriales."},
                {"letra": "M", "significado": "Significado (Meaning)", "instruccion": "Encuentra un prop\u00f3sito o sentido en el sufrimiento actual."},
                {"letra": "P", "significado": "Oraci\u00f3n/Meditaci\u00f3n (Prayer)", "instruccion": "Conecta con algo mayor: oraci\u00f3n, meditaci\u00f3n, naturaleza, m\u00fasica sagrada."},
                {"letra": "R", "significado": "Relajaci\u00f3n", "instruccion": "Pr\u00e1ctica breve de relajaci\u00f3n: respiraci\u00f3n, escaneo corporal, tensi\u00f3n-relajaci\u00f3n."},
                {"letra": "O", "significado": "Una cosa a la vez (One thing)", "instruccion": "Enfoca TODA la atenci\u00f3n en una sola actividad del momento presente."},
                {"letra": "V", "significado": "Vacaciones breves", "instruccion": "T\u00f3mate una mini-vacaci\u00f3n mental de 20 minutos: ba\u00f1o caliente, paseo, helado."},
                {"letra": "E", "significado": "Auto-\u00e1nimo (Encouragement)", "instruccion": "H\u00e1blate como hablar\u00edas a un amigo querido que sufre: puedes con esto, ya lo has superado antes."}
            ],
            "intensidad": "baja-moderada",
            "duracion": "15-45 minutos"
        },
        {
            "id": "pros_contras", "nombre": "Pros y Contras",
            "acronimo": "P/C",
            "componentes": [
                {"letra": "P+", "significado": "Pros de tolerar", "instruccion": "Lista las ventajas de tolerar el malestar sin actuar impulsivamente."},
                {"letra": "C-", "significado": "Contras de tolerar", "instruccion": "Lista las desventajas de tolerar (el malestar continua temporalmente)."},
                {"letra": "P+", "significado": "Pros de NO tolerar", "instruccion": "Lista las ventajas de actuar impulsivamente (alivio inmediato)."},
                {"letra": "C-", "significado": "Contras de NO tolerar", "instruccion": "Lista las consecuencias negativas de actuar impulsivamente (da\u00f1o, culpa, problemas)."}
            ],
            "intensidad": "baja",
            "duracion": "5-10 minutos"
        }
    ],
    "habilidades_aceptacion": [
        {"id": "aceptacion_radical", "nombre": "Aceptaci\u00f3n Radical", "descripcion": "Aceptar completamente la realidad tal como es, sin luchar contra lo que no se puede cambiar. No es aprobaci\u00f3n ni resignaci\u00f3n, es dejar de pelear con la realidad.", "ejercicio": "Practica decir: Este es el momento como es. No me gusta, pero es real. Luchar contra la realidad solo a\u00f1ade sufrimiento. Puedo aceptar Y trabajar para cambiar lo que s\u00ed puedo."},
        {"id": "voluntad", "nombre": "Voluntad (Willingness vs Willfulness)", "descripcion": "Willingness: disposici\u00f3n a participar en la vida, hacer lo que se necesita en cada momento. Willfulness: negarse a tolerar, exigir que la realidad sea diferente.", "ejercicio": "Cuando detectes willfulness (brazos cruzados, no quiero), practica media sonrisa y manos de voluntad (palmas hacia arriba). Nota el cambio postural y su efecto en la disposici\u00f3n."},
        {"id": "media_sonrisa", "nombre": "Media Sonrisa", "descripcion": "Relajar la cara y levantar levemente las comisuras de los labios. La expresi\u00f3n facial influye en la experiencia emocional (hip\u00f3tesis de feedback facial).", "ejercicio": "Al despertar, practica media sonrisa durante 30 segundos. En momentos de frustraci\u00f3n, suelta la tensi\u00f3n facial y practica media sonrisa. Nota el efecto en la emoci\u00f3n."},
        {"id": "manos_voluntad", "nombre": "Manos de Voluntad", "descripcion": "Abrir las palmas de las manos hacia arriba como gesto f\u00edsico de apertura y disposici\u00f3n, opuesto a los pu\u00f1os cerrados de resistencia.", "ejercicio": "Cuando sientas resistencia intensa, abre las manos con palmas hacia arriba sobre las piernas. Respira. Nota c\u00f3mo la postura abierta influye en la disposici\u00f3n a aceptar."}
    ]
})

write_json("dialectico_conductual", "dc_efectividad_interpersonal.json", {
    "area_id": "dc_efectividad_interpersonal",
    "nombre": "Habilidades de Efectividad Interpersonal (DBT)",
    "descripcion": "M\u00f3dulo de efectividad interpersonal: DEAR MAN para obtener objetivos, GIVE para mantener relaciones y FAST para mantener autorrespeto.",
    "fuentes": [
        "Linehan, M. M. (2015). DBT Skills Training Manual (2nd ed.). Guilford Press.",
        "Linehan, M. M. (1993). Skills Training Manual for BPD. Guilford Press."
    ],
    "modelos": [
        {
            "id": "dear_man", "nombre": "DEAR MAN", "acronimo": "DEAR MAN",
            "objetivo": "Obtener lo que necesitas o quieres de forma efectiva manteniendo la relaci\u00f3n y el autorrespeto.",
            "componentes": [
                {"letra": "D", "significado": "Describe", "ejemplo": "He notado que las \u00faltimas tres veces que quedamos, llegaste 30 minutos tarde."},
                {"letra": "E", "significado": "Expresa", "ejemplo": "Me siento frustrada y poco valorada cuando esto ocurre."},
                {"letra": "A", "significado": "Afirma (Assert)", "ejemplo": "Me gustar\u00eda que llegaras a la hora que acordamos."},
                {"letra": "R", "significado": "Refuerza", "ejemplo": "Si lo haces, podremos disfrutar m\u00e1s de nuestro tiempo juntos y yo me sentir\u00e9 respetada."},
                {"letra": "M", "significado": "Mindful", "ejemplo": "Mant\u00e9n el foco en tu objetivo. Si el otro desv\u00eda el tema, vuelve amablemente al punto."},
                {"letra": "A", "significado": "Aparenta confianza", "ejemplo": "Postura erguida, contacto visual, voz firme y calmada. Sin disculpas innecesarias."},
                {"letra": "N", "significado": "Negocia", "ejemplo": "Entiendo que a veces surgen imprevistos. \u00bfQu\u00e9 te parece avisarme si vas a retrasarte?"}
            ]
        },
        {
            "id": "give", "nombre": "GIVE", "acronimo": "GIVE",
            "objetivo": "Mantener y mejorar la relaci\u00f3n interpersonal durante una interacci\u00f3n dif\u00edcil.",
            "componentes": [
                {"letra": "G", "significado": "Gentle (Amable)", "ejemplo": "Sin ataques, amenazas ni juicios. Tono respetuoso incluso en desacuerdo."},
                {"letra": "I", "significado": "Interested (Interesado)", "ejemplo": "Escucha activa: contacto visual, asentir, parafrasear. Muestra inter\u00e9s genuino en la perspectiva del otro."},
                {"letra": "V", "significado": "Validate (Validar)", "ejemplo": "Entiendo que para ti es dif\u00edcil llegar a tiempo con tu horario. Eso tiene sentido."},
                {"letra": "E", "significado": "Easy manner (Actitud ligera)", "ejemplo": "Usa humor cuando sea apropiado. Sonr\u00ede. Evita rigidez o solemnidad excesiva."}
            ]
        },
        {
            "id": "fast", "nombre": "FAST", "acronimo": "FAST",
            "objetivo": "Mantener el autorrespeto y la integridad personal durante interacciones interpersonales.",
            "componentes": [
                {"letra": "F", "significado": "Fair (Justo)", "ejemplo": "S\u00e9 justo contigo mismo Y con el otro. No sacrifiques tus necesidades ni ignores las del otro."},
                {"letra": "A", "significado": "No Apologize (No disculparse en exceso)", "ejemplo": "No te disculpes por existir, tener necesidades o hacer peticiones razonables."},
                {"letra": "S", "significado": "Stick to values (Mant\u00e9n tus valores)", "ejemplo": "No vendas tus valores para conseguir aprobaci\u00f3n o evitar conflicto."},
                {"letra": "T", "significado": "Truthful (Honesto)", "ejemplo": "No exageres, no minimices, no mientas. La honestidad mantiene el autorrespeto a largo plazo."}
            ]
        }
    ],
    "factores_contextuales": [
        {"factor": "Intensidad de la petici\u00f3n", "descripcion": "Ajustar la firmeza de DEAR MAN seg\u00fan la importancia de lo que se pide y los derechos en juego.", "como_evaluar": "Pregunta: en una escala 1-10, \u00bfcu\u00e1n importante es esto para m\u00ed? \u00bfTengo derecho a pedirlo? A mayor puntuaci\u00f3n, mayor firmeza."},
        {"factor": "Poder relativo", "descripcion": "Considerar la din\u00e1mica de poder: jefe vs empleado, padre vs hijo, terapeuta vs paciente.", "como_evaluar": "Pregunta: \u00bfqui\u00e9n tiene m\u00e1s poder en esta relaci\u00f3n? \u00bfC\u00f3mo afecta eso a mi estrategia? Con m\u00e1s poder del otro, m\u00e1s GIVE y menos Assert."},
        {"factor": "Prioridad del momento", "descripcion": "Decidir qu\u00e9 priorizar en esta interacci\u00f3n: objetivo (DEAR MAN), relaci\u00f3n (GIVE) o autorrespeto (FAST).", "como_evaluar": "Pregunta: si solo pudiera lograr uno de los tres, \u00bfcu\u00e1l es m\u00e1s importante AHORA? Eso determina qu\u00e9 modelo enfatizar."},
        {"factor": "Historia de la relaci\u00f3n", "descripcion": "La historia de interacciones previas afecta la estrategia: \u00bfha habido conflictos previos? \u00bfHay confianza?", "como_evaluar": "Pregunta: \u00bfcu\u00e1l es el historial con esta persona? \u00bfNecesito reconstruir confianza (m\u00e1s GIVE) o proteger l\u00edmites (m\u00e1s FAST)?"}
    ]
})

print("\n=== DC complete ===")
print(f"Total DC files: {len(os.listdir(os.path.join(BASE, 'dialectico_conductual', 'data')))}")
print(f"Total ACT files: {len(os.listdir(os.path.join(BASE, 'act', 'data')))}")
