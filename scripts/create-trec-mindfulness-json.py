"""
Script to create all missing JSON data files for TREC and Mindfulness techniques.
Run with: python scripts/create-trec-mindfulness-json.py
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
# TREC — Missing files (9)
# ============================================================================
print("=== TREC ===")

# 1. recursos_materiales
write_json("trec", "recursos_materiales.json", {
    "area_id": "recursos_materiales",
    "nombre": "Recursos y Materiales para TREC",
    "descripcion": "Material psicoeducativo, hojas de trabajo y recursos bibliograficos para la Terapia Racional Emotiva Conductual.",
    "fuentes": [
        "Ellis, A. & Dryden, W. (1997). The Practice of Rational Emotive Behavior Therapy (2nd ed.). Springer.",
        "Ellis, A. (2001). Overcoming Destructive Beliefs, Feelings, and Behaviors. Prometheus Books.",
        "DiGiuseppe, R. A., Doyle, K. A., Dryden, W. & Backx, W. (2014). A Practitioner's Guide to Rational Emotive Behavior Therapy (3rd ed.). Oxford University Press."
    ],
    "materiales_psicoeducativos": [
        {
            "id": "folleto_abc",
            "nombre": "Folleto explicativo del Modelo ABC",
            "tipo": "folleto",
            "descripcion": "Documento que explica al paciente como los eventos activadores (A), las creencias (B) y las consecuencias emocionales/conductuales (C) se interrelacionan.",
            "contenido_clave": ["Diferencia entre A y B", "Tipos de creencias racionales vs irracionales", "Ejemplos cotidianos del modelo ABC"],
            "momento_uso": "Primeras sesiones de psicoeducacion"
        },
        {
            "id": "folleto_creencias_irracionales",
            "nombre": "Guia de creencias irracionales comunes",
            "tipo": "folleto",
            "descripcion": "Listado de las principales creencias irracionales identificadas por Ellis con ejemplos y alternativas racionales.",
            "contenido_clave": ["Demandas absolutistas (debo/tiene que)", "Catastrofismo (es terrible)", "Baja tolerancia a la frustracion (no lo soporto)", "Condenacion global (soy un inutil)"],
            "momento_uso": "Fase de identificacion de creencias"
        },
        {
            "id": "folleto_disputacion",
            "nombre": "Guia de auto-disputacion",
            "tipo": "folleto",
            "descripcion": "Instrucciones paso a paso para que el paciente aprenda a cuestionar sus propias creencias irracionales de forma autonoma.",
            "contenido_clave": ["Preguntas empiricas", "Preguntas logicas", "Preguntas pragmaticas", "Preguntas alternativas"],
            "momento_uso": "Fase intermedia de terapia"
        }
    ],
    "hojas_de_trabajo": [
        {
            "id": "hoja_registro_abcde",
            "nombre": "Registro ABCDE completo",
            "campos": ["Situacion activadora (A)", "Creencia irracional (B)", "Consecuencias emocionales y conductuales (C)", "Disputacion de la creencia (D)", "Nuevo efecto emocional y conductual (E)"],
            "instrucciones": "Completar un registro por cada situacion problematica durante la semana. Identificar primero la consecuencia emocional (C), luego buscar la creencia (B) que la genera."
        },
        {
            "id": "hoja_analisis_creencias",
            "nombre": "Analisis de creencias irracionales",
            "campos": ["Creencia identificada", "Tipo (demanda/catastrofismo/BTF/condenacion)", "Evidencia a favor", "Evidencia en contra", "Creencia racional alternativa", "Intensidad emocional antes (0-10)", "Intensidad emocional despues (0-10)"],
            "instrucciones": "Usar despues de identificar una creencia irracional para analizarla sistematicamente."
        },
        {
            "id": "hoja_ejercicio_verguenza",
            "nombre": "Planificacion de ejercicios de ataque a la verguenza",
            "campos": ["Ejercicio planificado", "Prediccion catastrofica", "Resultado real", "Aprendizaje obtenido", "Nueva creencia"],
            "instrucciones": "Planificar ejercicios graduales de exposicion a la verguenza, registrando predicciones y resultados reales."
        }
    ],
    "recursos_bibliograficos": [
        {
            "titulo": "Una nueva guia para la vida racional",
            "autor": "Ellis, A. & Harper, R.",
            "uso": "Lectura recomendada para pacientes como complemento psicoeducativo"
        },
        {
            "titulo": "Controle su ira antes de que ella le controle a usted",
            "autor": "Ellis, A. & Tafrate, R. C.",
            "uso": "Para pacientes con problemas de manejo de ira"
        },
        {
            "titulo": "Como controlar la ansiedad antes de que le controle a usted",
            "autor": "Ellis, A.",
            "uso": "Para pacientes con trastornos de ansiedad"
        }
    ]
})

# 2. tecnicas_especificas
write_json("trec", "tecnicas_especificas.json", {
    "area_id": "tecnicas_especificas",
    "nombre": "Tecnicas Especificas de la TREC",
    "descripcion": "Repertorio completo de tecnicas cognitivas, emotivas y conductuales propias de la Terapia Racional Emotiva Conductual.",
    "fuentes": [
        "Ellis, A. & Dryden, W. (1997). The Practice of Rational Emotive Behavior Therapy (2nd ed.). Springer.",
        "DiGiuseppe, R. A., Doyle, K. A., Dryden, W. & Backx, W. (2014). A Practitioner's Guide to REBT (3rd ed.). Oxford University Press.",
        "Ellis, A. (1994). Reason and Emotion in Psychotherapy (revised ed.). Birch Lane Press."
    ],
    "tecnicas_cognitivas": [
        {
            "id": "disputacion_empirica",
            "nombre": "Disputacion empirica",
            "descripcion": "Cuestionar las creencias irracionales pidiendo evidencia factual que las sostenga.",
            "preguntas_tipo": ["Donde esta la evidencia de que...?", "Que hechos concretos apoyan esta creencia?", "Alguna vez ha sucedido realmente lo que temes?"],
            "indicaciones": "Util cuando el paciente mantiene creencias basadas en suposiciones sin datos reales.",
            "ejemplo": "Paciente: 'Todos me van a rechazar'. Terapeuta: 'Cuantas personas te han rechazado realmente en el ultimo mes? Todas las personas que conoces?'"
        },
        {
            "id": "disputacion_logica",
            "nombre": "Disputacion logica",
            "descripcion": "Examinar la coherencia logica interna de las creencias irracionales.",
            "preguntas_tipo": ["Se sigue logicamente que porque desees algo, deba ocurrir?", "Es logico concluir que porque fallaste una vez, siempre fallaras?", "Como se pasa de 'preferiria' a 'absolutamente debo'?"],
            "indicaciones": "Efectiva con pacientes que usan pensamiento absolutista.",
            "ejemplo": "Terapeuta: 'Es logico pensar que porque quieres gustarle a todo el mundo, entonces todo el mundo DEBE quererte?'"
        },
        {
            "id": "disputacion_pragmatica",
            "nombre": "Disputacion pragmatica (funcional)",
            "descripcion": "Evaluar las consecuencias practicas de mantener la creencia irracional.",
            "preguntas_tipo": ["Que te aporta pensar asi?", "Esa creencia te ayuda a conseguir tus objetivos?", "Como te sientes cuando piensas eso? Te resulta util?"],
            "indicaciones": "Muy util cuando el paciente reconoce la irracionalidad pero sigue aferrado a la creencia.",
            "ejemplo": "Terapeuta: 'Suponiendo que realmente deberias ser perfecto... te ayuda esa exigencia a rendir mejor o te paraliza?'"
        },
        {
            "id": "reatribucion_semantica",
            "nombre": "Reatribucion semantica",
            "descripcion": "Modificar el lenguaje absolutista del paciente por formulaciones preferenciales.",
            "instrucciones": "Sustituir 'debo/tengo que' por 'preferiria/me gustaria', 'es terrible' por 'es desagradable pero soportable', 'no lo soporto' por 'es dificil pero puedo tolerarlo'.",
            "indicaciones": "Usar a lo largo de toda la terapia como correccion constante del lenguaje."
        },
        {
            "id": "analisis_coste_beneficio",
            "nombre": "Analisis de coste-beneficio cognitivo",
            "descripcion": "Evaluar formalmente los costes y beneficios de mantener una creencia irracional vs adoptar una racional.",
            "instrucciones": "Crear tabla de dos columnas: costes de la creencia irracional vs beneficios de la alternativa racional. Incluir costes emocionales, conductuales y relacionales.",
            "indicaciones": "Util en fase de consolidacion para reforzar la motivacion al cambio."
        }
    ],
    "tecnicas_emotivas": [
        {
            "id": "ejercicios_verguenza",
            "nombre": "Ejercicios de ataque a la verguenza",
            "descripcion": "Ejercicios donde el paciente realiza deliberadamente actos socialmente incomodos para desensibilizarse a la evaluacion negativa.",
            "ejemplos_ejercicios": [
                "Cantar en voz alta en un lugar publico",
                "Pedir algo absurdo en una tienda",
                "Llevar ropa llamativa o inusual",
                "Preguntar la hora a alguien que lleva reloj visible"
            ],
            "principio_terapeutico": "Demostrar que las consecuencias temidas no ocurren o son tolerables, debilitando la creencia de que 'seria terrible' ser juzgado.",
            "precauciones": "Graduar segun tolerancia. No usar con pacientes en crisis o con trauma social severo sin preparacion previa.",
            "contraindicaciones": ["Fobia social severa sin preparacion", "Trauma reciente", "Psicosis activa"]
        },
        {
            "id": "imaginacion_racional_emotiva",
            "nombre": "Imaginacion racional emotiva (IRE)",
            "descripcion": "El paciente imagina vividamente la situacion temida, experimenta la emocion perturbadora y luego la transforma en una emocion negativa sana.",
            "pasos": [
                "Cerrar los ojos e imaginar la peor version del evento activador",
                "Permitir que surja la emocion perturbadora (ansiedad intensa, depresion, rabia)",
                "Mantener la imagen pero cambiar la emocion perturbadora por una negativa sana (preocupacion, tristeza, molestia)",
                "Identificar que cambio cognitivo produjo el cambio emocional",
                "Practicar repetidamente hasta que el cambio sea automatico"
            ],
            "indicaciones": "Util cuando el paciente tiene dificultad para disputar verbalmente."
        },
        {
            "id": "role_playing_racional",
            "nombre": "Role-playing racional",
            "descripcion": "Dramatizacion donde terapeuta y paciente intercambian roles para practicar la disputacion.",
            "modalidades": [
                {"tipo": "Terapeuta como voz irracional", "descripcion": "El terapeuta defiende la creencia irracional y el paciente la disputa."},
                {"tipo": "Paciente como voz irracional", "descripcion": "El paciente verbaliza la creencia y el terapeuta modela la disputacion."},
                {"tipo": "Dialogo entre las dos sillas", "descripcion": "El paciente alterna entre la parte irracional y la racional de si mismo."}
            ]
        },
        {
            "id": "humor_terapeutico",
            "nombre": "Uso terapeutico del humor",
            "descripcion": "Emplear humor e ironia para ayudar al paciente a tomar distancia de sus creencias irracionales.",
            "principios": [
                "El humor se dirige a la creencia, NUNCA al paciente",
                "Debe usarse solo cuando hay buena alianza terapeutica",
                "Busca exagerar la creencia hasta el absurdo para que el paciente vea su irracionalidad",
                "Canciones humoristicas racionales (tradicion de Ellis)"
            ],
            "precauciones": "No usar si el paciente se siente invalidado. Evaluar previamente la receptividad al humor."
        }
    ],
    "tecnicas_conductuales": [
        {
            "id": "tareas_contra_demandas",
            "nombre": "Tareas para casa contra demandas absolutistas",
            "descripcion": "Asignaciones conductuales disenadas para poner a prueba y debilitar las demandas irracionales del paciente.",
            "tipos": [
                {"tipo": "Exposicion deliberada al fracaso", "descripcion": "Realizar actividades donde el resultado no esta garantizado."},
                {"tipo": "Tolerar incomodidad", "descripcion": "Permanecer en situaciones desagradables sin evitarlas."},
                {"tipo": "Actuar contra la creencia", "descripcion": "Comportarse de manera opuesta a lo que la creencia irracional dicta."}
            ]
        },
        {
            "id": "biblioterapia_dirigida",
            "nombre": "Biblioterapia dirigida",
            "descripcion": "Lectura asignada de textos especificos de autoayuda racional con analisis posterior en sesion.",
            "procedimiento": "Asignar capitulos relevantes, pedir al paciente que anote dudas, acuerdos y desacuerdos, discutir en la siguiente sesion."
        },
        {
            "id": "refuerzo_penalizacion",
            "nombre": "Programas de refuerzo y penalizacion",
            "descripcion": "Establecer contingencias para motivar la practica de conductas racionales y desincentivar las irracionales.",
            "procedimiento": "Paciente elige recompensa por completar tareas disputativas y consecuencia aversiva leve (donar dinero a causa que no apoya) por no completarlas."
        }
    ]
})

# 3. estructura_sesiones
write_json("trec", "estructura_sesiones.json", {
    "area_id": "estructura_sesiones",
    "nombre": "Estructura de Sesiones TREC",
    "descripcion": "Organizacion y fases del proceso terapeutico en la Terapia Racional Emotiva Conductual.",
    "fuentes": [
        "Dryden, W. (2009). Rational Emotive Behaviour Therapy: Distinctive Features. Routledge.",
        "Ellis, A. & Dryden, W. (1997). The Practice of REBT (2nd ed.). Springer.",
        "DiGiuseppe, R. A. et al. (2014). A Practitioner's Guide to REBT (3rd ed.). Oxford University Press."
    ],
    "fases_tratamiento": [
        {
            "fase": 1,
            "nombre": "Evaluacion y socializacion",
            "sesiones_estimadas": "1-3",
            "objetivos": [
                "Evaluar problemas presentados usando el marco ABC",
                "Establecer alianza terapeutica activo-directiva",
                "Psicoeducar sobre el modelo TREC y el ABC",
                "Establecer metas terapeuticas concretas"
            ],
            "tareas_terapeuta": [
                "Realizar evaluacion inicial con formato ABC",
                "Identificar problemas primarios y secundarios (perturbacion sobre la perturbacion)",
                "Explicar que las emociones perturbadoras provienen de las creencias, no de los eventos",
                "Diferenciar emociones negativas sanas de perturbadoras"
            ],
            "tareas_paciente": [
                "Describir problemas y metas",
                "Aprender la distincion ABC",
                "Comenzar autoregistro ABC basico"
            ]
        },
        {
            "fase": 2,
            "nombre": "Insight y descubrimiento de creencias",
            "sesiones_estimadas": "3-6",
            "objetivos": [
                "Alcanzar los tres insights TREC",
                "Identificar creencias irracionales nucleares",
                "Clasificar tipo de creencia (demanda, catastrofismo, BTF, condenacion)"
            ],
            "tres_insights": [
                "Insight 1: Las perturbaciones emocionales son causadas principalmente por creencias irracionales, no por eventos",
                "Insight 2: Independientemente de cuando adquiriste estas creencias, sigues perturbado porque continuas reforzandolas en el presente",
                "Insight 3: Solo el trabajo persistente y la practica repetida de nuevas creencias racionales lograra un cambio duradero"
            ],
            "tareas_terapeuta": [
                "Usar preguntas socraticas para descubrir creencias irracionales",
                "Conectar Bs con Cs de forma clara",
                "Ensenar a diferenciar entre preferencias y demandas"
            ]
        },
        {
            "fase": 3,
            "nombre": "Disputacion activa",
            "sesiones_estimadas": "6-15",
            "objetivos": [
                "Disputar sistematicamente creencias irracionales",
                "Desarrollar filosofia racional alternativa (E)",
                "Practicar disputacion en sesion y como tarea para casa"
            ],
            "tareas_terapeuta": [
                "Modelar disputacion empirica, logica y pragmatica",
                "Asignar ejercicios conductuales contra las creencias",
                "Usar IRE, role-playing y humor terapeutico",
                "Revisar registros ABCDE del paciente"
            ],
            "tareas_paciente": [
                "Completar registros ABCDE diarios",
                "Realizar ejercicios de ataque a la verguenza (si aplica)",
                "Practicar auto-disputacion ante eventos activadores",
                "Biblioterapia asignada"
            ]
        },
        {
            "fase": 4,
            "nombre": "Consolidacion y prevencion de recaidas",
            "sesiones_estimadas": "15-20",
            "objetivos": [
                "Consolidar nueva filosofia racional",
                "Generalizar aprendizajes a nuevas situaciones",
                "Prevenir recaidas mediante identificacion de senales de alarma",
                "Fomentar autonomia en auto-disputacion"
            ],
            "tareas_terapeuta": [
                "Espaciar sesiones gradualmente",
                "Revisar progreso y areas pendientes",
                "Preparar al paciente para ser su propio terapeuta",
                "Anticipar posibles situaciones de riesgo"
            ],
            "tareas_paciente": [
                "Auto-disputacion autonoma",
                "Aplicar TREC a nuevos problemas sin guia del terapeuta",
                "Mantener practica de ejercicios conductuales",
                "Identificar y manejar senales de recaida"
            ]
        }
    ],
    "estructura_sesion_tipica": {
        "duracion_minutos": 45,
        "secuencia": [
            {"paso": "Revision de tarea", "minutos": 10, "descripcion": "Revisar registros ABCDE y tareas conductuales. Reforzar logros, analizar dificultades."},
            {"paso": "Agenda de sesion", "minutos": 2, "descripcion": "Acordar foco de la sesion: problema especifico a trabajar con formato ABC."},
            {"paso": "Trabajo terapeutico central", "minutos": 25, "descripcion": "Identificar ABC del problema actual, disputar creencias irracionales, desarrollar alternativa racional."},
            {"paso": "Asignacion de tarea", "minutos": 5, "descripcion": "Asignar tarea especifica: registro ABCDE, ejercicio conductual, lectura o IRE."},
            {"paso": "Resumen y feedback", "minutos": 3, "descripcion": "Resumir aprendizajes clave, solicitar feedback del paciente sobre la sesion."}
        ]
    }
})

# 4. barreras
write_json("trec", "barreras.json", {
    "area_id": "barreras",
    "nombre": "Barreras y Dificultades en TREC",
    "descripcion": "Obstaculos comunes en la aplicacion de la TREC y estrategias para superarlos.",
    "fuentes": [
        "Ellis, A. (2002). Overcoming Resistance (2nd ed.). Springer.",
        "Dryden, W. (2001). Reason to Change: A Rational Emotive Behaviour Therapy Workbook. Routledge.",
        "DiGiuseppe, R. A. et al. (2014). A Practitioner's Guide to REBT (3rd ed.). Oxford."
    ],
    "barreras_del_paciente": [
        {
            "barrera": "Intelectualizacion sin cambio emocional",
            "descripcion": "El paciente comprende racionalmente que sus creencias son irracionales pero no experimenta cambio emocional.",
            "estrategias": [
                "Aumentar tecnicas emotivas (IRE, role-playing, ejercicios de verguenza)",
                "Distinguir entre insight intelectual e insight emocional",
                "Asignar mas tareas conductuales que pongan a prueba las creencias",
                "Usar disputacion vigorosa y energica"
            ]
        },
        {
            "barrera": "Resistencia a abandonar demandas absolutistas",
            "descripcion": "El paciente se aferra a sus 'debos' porque cree que sin ellos perderia motivacion.",
            "estrategias": [
                "Distinguir entre preferencias fuertes (motivadoras) y demandas absolutistas (perturbadoras)",
                "Demostrar que las preferencias fuertes motivan sin perturbar",
                "Analisis coste-beneficio de demandas vs preferencias",
                "Experimentos conductuales comparativos"
            ]
        },
        {
            "barrera": "Baja tolerancia a la frustracion del paciente",
            "descripcion": "El paciente abandona la terapia o las tareas porque el proceso le resulta incomodo.",
            "estrategias": [
                "Abordar primero las creencias BTF sobre la propia terapia",
                "Graduar dificultad de tareas",
                "Reforzar pequenos logros",
                "Usar disputacion pragmatica sobre los costes de evitar la incomodidad"
            ]
        },
        {
            "barrera": "Perturbacion secundaria",
            "descripcion": "El paciente se perturba por estar perturbado (ansiedad por la ansiedad, depresion por estar deprimido).",
            "estrategias": [
                "Identificar y abordar la perturbacion secundaria PRIMERO",
                "Normalizar las emociones negativas sanas",
                "Distinguir entre problema practico y problema emocional",
                "Usar psicoeducacion sobre emociones sanas vs perturbadoras"
            ]
        }
    ],
    "barreras_del_terapeuta": [
        {
            "barrera": "Ser demasiado directivo sin alianza",
            "descripcion": "Intentar disputar activamente sin haber establecido alianza terapeutica suficiente.",
            "estrategia": "Invertir sesiones iniciales en validacion y comprension antes de disputar. Usar estilo socratico al principio."
        },
        {
            "barrera": "Disputar sin conviccion",
            "descripcion": "El terapeuta disputa de forma mecanica o sin creer realmente en la alternativa racional.",
            "estrategia": "El terapeuta debe trabajar sus propias creencias irracionales. Practicar TREC en si mismo."
        },
        {
            "barrera": "Confundir disputacion con invalidacion",
            "descripcion": "El paciente siente que el terapeuta minimiza su sufrimiento al disputar.",
            "estrategia": "Validar la emocion y el sufrimiento antes de disputar la creencia. Separar explicitamente: 'Tu sufrimiento es real; lo que cuestionamos es la creencia que lo amplifica.'"
        }
    ],
    "errores_comunes": [
        "Disputar el evento activador (A) en lugar de la creencia (B)",
        "No diferenciar entre emociones negativas sanas y perturbadoras",
        "Confundir pensamiento racional con pensamiento positivo",
        "Ignorar las tareas para casa o no revisarlas en sesion",
        "Aplicar disputacion a pacientes en crisis aguda sin estabilizar primero",
        "No abordar la perturbacion secundaria antes de la primaria"
    ]
})

# 5. habilidades_terapeuta
write_json("trec", "habilidades_terapeuta.json", {
    "area_id": "habilidades_terapeuta",
    "nombre": "Habilidades del Terapeuta TREC",
    "descripcion": "Competencias especificas que debe desarrollar el terapeuta para la practica efectiva de la TREC.",
    "fuentes": [
        "Ellis, A. (1994). Reason and Emotion in Psychotherapy (revised ed.). Birch Lane Press.",
        "Dryden, W. (2009). REBT: Distinctive Features. Routledge.",
        "DiGiuseppe, R. A. et al. (2014). A Practitioner's Guide to REBT (3rd ed.). Oxford."
    ],
    "habilidades_nucleares": [
        {
            "habilidad": "Estilo activo-directivo",
            "descripcion": "El terapeuta TREC es activamente directivo: guia la sesion, confronta creencias irracionales y asigna tareas especificas.",
            "componentes": [
                "Dirigir el foco hacia las creencias irracionales, no quedarse en la narrativa del problema",
                "Confrontar con respeto pero firmeza las distorsiones cognitivas",
                "Mantener el ritmo terapeutico sin ser avasallador",
                "Equilibrar directividad con escucha empatica"
            ]
        },
        {
            "habilidad": "Dominio de la disputacion",
            "descripcion": "Capacidad para disputar creencias irracionales de forma flexible usando multiples estrategias.",
            "componentes": [
                "Fluidez en disputacion empirica, logica y pragmatica",
                "Capacidad de adaptar el estilo de disputacion al paciente",
                "Saber cuando cambiar de estrategia si una disputacion no funciona",
                "Uso habil de metaforas y analogias"
            ]
        },
        {
            "habilidad": "Deteccion de creencias irracionales",
            "descripcion": "Habilidad para identificar rapidamente las creencias irracionales subyacentes a partir del discurso del paciente.",
            "componentes": [
                "Reconocer marcadores linguisticos de demandas ('debo', 'tiene que', 'deberia')",
                "Identificar catastrofismo ('es terrible', 'seria el fin')",
                "Detectar baja tolerancia a la frustracion ('no lo soporto', 'es insoportable')",
                "Identificar condenacion global ('soy un fracasado', 'es una mala persona')"
            ]
        },
        {
            "habilidad": "Uso terapeutico del humor",
            "descripcion": "Capacidad de emplear humor e ironia de forma terapeutica sin invalidar al paciente.",
            "componentes": [
                "Dirigir el humor hacia la creencia, nunca hacia el paciente",
                "Evaluar receptividad del paciente al humor",
                "Usar exageracion para mostrar la irracionalidad de una creencia",
                "Conocer y aplicar las canciones racionales humoristicas de Ellis"
            ]
        },
        {
            "habilidad": "Aceptacion incondicional",
            "descripcion": "Demostrar aceptacion incondicional del paciente como persona mientras se cuestionan sus creencias.",
            "componentes": [
                "Separar claramente persona de conducta y de creencias",
                "Modelar la filosofia de no-condenacion global",
                "Aceptar al paciente incluso cuando se resiste al cambio",
                "Aplicar la TREC a las propias frustraciones como terapeuta"
            ]
        }
    ],
    "competencias_avanzadas": [
        "Manejar la resistencia terapeutica sin frustrar al paciente ni al terapeuta",
        "Abordar perturbaciones secundarias de forma elegante",
        "Integrar tecnicas emotivas y conductuales, no solo cognitivas",
        "Adaptar la TREC a diferentes trastornos y poblaciones",
        "Supervisar el propio trabajo con perspectiva TREC"
    ]
})

# 6. sintomas_problemas
write_json("trec", "sintomas_problemas.json", {
    "area_id": "sintomas_problemas",
    "nombre": "Sintomas y Problemas Abordables con TREC",
    "descripcion": "Mapa de trastornos y problemas clinicos abordables con TREC, con indicaciones y contraindicaciones.",
    "fuentes": [
        "Ellis, A. (2003). Similarities and Differences between REBT and CT. Journal of Cognitive Psychotherapy, 17(3), 225-240.",
        "David, D., Lynn, S. J. & Ellis, A. (2010). Rational and Irrational Beliefs: Research, Theory, and Clinical Practice. Oxford University Press."
    ],
    "problemas_clinicos": [
        {
            "problema": "Ansiedad generalizada",
            "creencias_irracionales_tipicas": ["Debo tener certeza de que nada malo sucedera", "Seria terrible si pasara algo inesperado", "No soporto la incertidumbre"],
            "enfoque_trec": "Disputar demandas de certeza y catastrofismo. Desarrollar tolerancia a la incertidumbre. Ejercicios de exposicion a situaciones inciertas.",
            "eficacia": "Alta. Amplia evidencia de efectividad."
        },
        {
            "problema": "Depresion",
            "creencias_irracionales_tipicas": ["Debo ser exitoso y aprobado por todos", "Soy un inutil porque falle", "La vida deberia ser justa y facil"],
            "enfoque_trec": "Abordar autocondenacion global. Disputar demandas sobre uno mismo y el mundo. Activacion conductual complementaria.",
            "eficacia": "Alta. Evidencia comparable a TCC estandar."
        },
        {
            "problema": "Ira y hostilidad",
            "creencias_irracionales_tipicas": ["Los demas DEBEN tratarme justamente", "Es terrible que la gente sea tan estupida", "No soporto que me falten al respeto"],
            "enfoque_trec": "Disputar demandas hacia los demas. Desarrollar tolerancia a la frustracion. Ejercicios de ataque a la verguenza.",
            "eficacia": "Alta. Area clasica de la TREC con fuerte evidencia."
        },
        {
            "problema": "Fobia social",
            "creencias_irracionales_tipicas": ["Debo caer bien a todo el mundo", "Seria terrible que me juzgaran negativamente", "Soy inadecuado si alguien me rechaza"],
            "enfoque_trec": "Ejercicios de ataque a la verguenza (pilar central). Disputar demandas de aprobacion. IRE con escenas sociales temidas.",
            "eficacia": "Moderada-Alta. Los ejercicios de verguenza son especialmente efectivos."
        },
        {
            "problema": "Procrastinacion",
            "creencias_irracionales_tipicas": ["Deberia hacerlo perfectamente o no hacerlo", "No soporto la incomodidad de empezar", "Ya lo hare manana (BTF)"],
            "enfoque_trec": "Disputar baja tolerancia a la frustracion y perfeccionismo. Tareas conductuales anti-procrastinacion con contingencias.",
            "eficacia": "Moderada-Alta. Efectiva especialmente en perfeccionismo como causa."
        },
        {
            "problema": "Problemas de pareja",
            "creencias_irracionales_tipicas": ["Mi pareja DEBE saber lo que necesito", "Es terrible que no sea como yo quiero", "No soporto que no me entienda"],
            "enfoque_trec": "Disputar demandas hacia la pareja. Ensenar aceptacion incondicional del otro. Trabajo en habilidades de comunicacion.",
            "eficacia": "Moderada. Mejor cuando se combina con entrenamiento en comunicacion."
        }
    ],
    "contraindicaciones_relativas": [
        "Psicosis activa (la disputacion puede ser contraproducente)",
        "Discapacidad intelectual severa (requiere adaptacion significativa)",
        "Trastornos organicos con deterioro cognitivo marcado",
        "Crisis suicida aguda (estabilizar primero, TREC despues)"
    ]
})

# 7. trec_creencias_irracionales
write_json("trec", "trec_creencias_irracionales.json", {
    "area_id": "trec_creencias_irracionales",
    "nombre": "Creencias Irracionales en TREC",
    "descripcion": "Clasificacion completa de las creencias irracionales segun el modelo de Ellis, con sus derivaciones y alternativas racionales.",
    "fuentes": [
        "Ellis, A. (1962). Reason and Emotion in Psychotherapy. Lyle Stuart.",
        "Ellis, A. (1994). Reason and Emotion in Psychotherapy (revised). Birch Lane Press.",
        "Dryden, W. (2009). REBT: Distinctive Features. Routledge."
    ],
    "clasificacion_ellis": {
        "modelo_original_11_creencias": [
            "Es una necesidad extrema ser amado y aprobado por todos",
            "Para considerarme valioso debo ser competente y exitoso en todo",
            "Las personas que actuan mal son malvadas y deben ser castigadas",
            "Es terrible y catastrofico cuando las cosas no salen como uno quiere",
            "La desgracia humana es causada por factores externos y no tenemos control",
            "Si algo es peligroso o amenazante, uno debe preocuparse constantemente",
            "Es mas facil evitar las dificultades que enfrentarlas",
            "Uno debe depender de los demas y necesita a alguien mas fuerte",
            "El pasado determina el presente y no puede ser cambiado",
            "Uno debe perturbarse mucho por los problemas de los demas",
            "Siempre existe una solucion perfecta y hay que encontrarla"
        ],
        "modelo_actual_4_categorias": [
            {
                "categoria": "Demandas absolutistas (musts/shoulds)",
                "descripcion": "Exigencias rigidas e inflexibles sobre uno mismo, los demas o el mundo.",
                "subtipos": [
                    {"subtipo": "Demandas sobre uno mismo", "ejemplos": ["Debo hacerlo bien", "Tengo que ser aprobado", "Deberia ser mejor persona"]},
                    {"subtipo": "Demandas sobre los demas", "ejemplos": ["Deben tratarme bien", "Tienen que ser justos", "Deberian entenderme"]},
                    {"subtipo": "Demandas sobre el mundo/la vida", "ejemplos": ["La vida debe ser facil", "Las cosas tienen que salir bien", "El mundo deberia ser justo"]}
                ],
                "alternativa_racional": "Preferencias fuertes pero flexibles: 'Me gustaria mucho...', 'Preferiria enormemente...', 'Seria muy deseable que...'"
            },
            {
                "categoria": "Catastrofismo (awfulizing)",
                "descripcion": "Evaluar un evento negativo como absolutamente terrible, peor de lo que podria ser, 100% malo.",
                "marcadores_linguisticos": ["Es terrible", "Es horroroso", "Es el fin del mundo", "No puede haber nada peor"],
                "alternativa_racional": "Evaluacion mala pero no catastrofica: 'Es muy desagradable', 'Es un gran inconveniente', 'Es malo pero no el fin del mundo'."
            },
            {
                "categoria": "Baja tolerancia a la frustracion (BTF / I-can't-stand-it-itis)",
                "descripcion": "Creer que no se puede tolerar o soportar una situacion incomoda o frustrante.",
                "marcadores_linguisticos": ["No lo soporto", "No lo puedo aguantar", "Es insoportable", "No lo tolero"],
                "alternativa_racional": "Alta tolerancia a la frustracion: 'Es dificil pero puedo soportarlo', 'Es incomodo pero sobrevivire', 'No me gusta pero puedo tolerarlo'."
            },
            {
                "categoria": "Condenacion global (global rating / damning)",
                "descripcion": "Evaluar globalmente a una persona (uno mismo, otro, la vida) basandose en un aspecto o conducta.",
                "subtipos": [
                    {"subtipo": "Auto-condenacion", "ejemplos": ["Soy un fracasado", "Soy inutil", "No valgo nada"]},
                    {"subtipo": "Condenacion del otro", "ejemplos": ["Es una mala persona", "Es un idiota", "No vale nada"]},
                    {"subtipo": "Condenacion de la vida", "ejemplos": ["La vida es una porqueria", "Todo es horrible", "Nada vale la pena"]}
                ],
                "alternativa_racional": "Aceptacion incondicional: de uno mismo (AIO), del otro (AIA) y de la vida (AIV). Evaluar conductas especificas sin condenar globalmente."
            }
        ]
    },
    "creencias_irracionales": [
        {
            "id": "ci_aprobacion",
            "creencia": "Necesito absolutamente la aprobacion de las personas significativas para mi",
            "categoria": "Demanda sobre uno mismo / los demas",
            "derivaciones": ["Si me rechazan, soy un inutil (condenacion)", "Seria terrible que no les guste (catastrofismo)", "No soporto que alguien piense mal de mi (BTF)"],
            "alternativa_racional": "Prefiero la aprobacion de los demas, pero no la necesito para tener valor como persona. Puedo manejar el rechazo aunque sea desagradable.",
            "trastornos_asociados": ["Fobia social", "Dependencia emocional", "Ansiedad de desempeno"]
        },
        {
            "id": "ci_perfeccionismo",
            "creencia": "Debo ser competente, exitoso y lograr todo lo que me propongo",
            "categoria": "Demanda sobre uno mismo",
            "derivaciones": ["Si fallo, demuestra que soy un incompetente (condenacion)", "Seria catastrofico no alcanzar mis metas (catastrofismo)", "No soporto cometer errores (BTF)"],
            "alternativa_racional": "Me gustaria ser competente y exitoso, pero soy un ser humano falible. Puedo esforzarme sin exigirme perfeccion.",
            "trastornos_asociados": ["Depresion", "Ansiedad de desempeno", "Procrastinacion", "Burnout"]
        },
        {
            "id": "ci_justicia",
            "creencia": "Los demas deben tratarme de forma justa y considerada, y si no lo hacen son despreciables",
            "categoria": "Demanda sobre los demas",
            "derivaciones": ["Es terrible que sean injustos (catastrofismo)", "No soporto la injusticia (BTF)", "Son personas despreciables (condenacion del otro)"],
            "alternativa_racional": "Preferiria que los demas fueran justos, pero no hay ley universal que lo garantice. Puedo manejar la injusticia sin condenar a las personas.",
            "trastornos_asociados": ["Ira cronica", "Hostilidad", "Problemas interpersonales"]
        },
        {
            "id": "ci_comodidad",
            "creencia": "La vida deberia ser comoda, sin frustraciones ni incomodidades importantes",
            "categoria": "Demanda sobre el mundo",
            "derivaciones": ["Es terrible que las cosas sean dificiles (catastrofismo)", "No aguanto esta situacion (BTF)", "El mundo es una porqueria (condenacion de la vida)"],
            "alternativa_racional": "Seria ideal que la vida fuera facil, pero la realidad incluye dificultades. Puedo enfrentar la incomodidad y crecer a partir de ella.",
            "trastornos_asociados": ["Procrastinacion", "Adicciones", "Baja tolerancia a la frustracion generalizada"]
        }
    ]
})

# 8. trec_disputacion
write_json("trec", "trec_disputacion.json", {
    "area_id": "trec_disputacion",
    "nombre": "Disputacion en TREC",
    "descripcion": "Sistema completo de disputacion racional: tipos, estrategias, estilos y guia practica para el terapeuta.",
    "fuentes": [
        "DiGiuseppe, R. A. (1991). Comprehensive Cognitive Disputing in RET. In M. Bernard (Ed.), Using RET Effectively. Plenum.",
        "Dryden, W. (2009). REBT: Distinctive Features. Routledge.",
        "Ellis, A. & Dryden, W. (1997). The Practice of REBT (2nd ed.). Springer."
    ],
    "tipos_disputacion": [
        {
            "tipo": "Disputacion empirica",
            "objetivo": "Examinar si la creencia tiene soporte en la evidencia y los hechos.",
            "preguntas_clave": [
                "Donde esta la evidencia de que eso DEBA ser asi?",
                "Que hechos concretos apoyan esa creencia?",
                "Si hicieras una encuesta, que diria la mayoria?",
                "Cuantas veces ha ocurrido realmente lo que temes?"
            ],
            "ejemplo_dialogo": {
                "paciente": "Si suspendo este examen, demostrara que soy un completo fracasado.",
                "terapeuta": "Veamos la evidencia. Has suspendido examenes antes?",
                "paciente": "Si, uno el ano pasado.",
                "terapeuta": "Y eso te convirtio en un completo fracasado? Aprobaste otros examenes despues?",
                "paciente": "Si, aprobe los demas.",
                "terapeuta": "Entonces, la evidencia muestra que suspender un examen no te convierte en un fracasado. Un fracasado seria alguien que falla en absolutamente todo, siempre. Existe esa persona?"
            },
            "cuando_usar": "Cuando el paciente basa sus creencias en suposiciones o generalizaciones sin datos."
        },
        {
            "tipo": "Disputacion logica",
            "objetivo": "Revelar la incoherencia logica interna de la creencia irracional.",
            "preguntas_clave": [
                "Se sigue logicamente de que desees algo que DEBA ocurrir?",
                "Es logico que porque algo sea indeseable sea tambien terrible?",
                "Como se pasa de 'no me gusta' a 'no lo soporto'?",
                "Es valido evaluar a toda una persona por una sola conducta?"
            ],
            "ejemplo_dialogo": {
                "paciente": "Mi jefe debe reconocer mi trabajo.",
                "terapeuta": "Entiendo que te gustaria que lo hiciera. Pero logicamente, se sigue de que tu quieras reconocimiento que el DEBA dartelo?",
                "paciente": "Bueno, seria lo justo...",
                "terapeuta": "Puede que sea deseable e incluso justo. Pero existe alguna ley logica que convierta lo deseable en obligatorio?"
            },
            "cuando_usar": "Cuando el paciente confunde preferencias con obligaciones o hace saltos logicos."
        },
        {
            "tipo": "Disputacion pragmatica (funcional)",
            "objetivo": "Mostrar las consecuencias practicas negativas de mantener la creencia.",
            "preguntas_clave": [
                "Que te aporta pensar de esa manera?",
                "Te ayuda esa creencia a conseguir lo que quieres?",
                "Como te sientes cada vez que piensas asi?",
                "Si sigues pensando asi los proximos 5 anos, como sera tu vida?"
            ],
            "ejemplo_dialogo": {
                "paciente": "Se que no es del todo logico, pero realmente siento que no soporto la critica.",
                "terapeuta": "Entiendo que lo sientes asi. Pero dime: que resultado te da esa creencia? Como actuas cuando piensas que no lo soportas?",
                "paciente": "Evito hablar en reuniones, no propongo ideas...",
                "terapeuta": "Y eso te ayuda profesionalmente?",
                "paciente": "No, me estanca.",
                "terapeuta": "Asi que la creencia de que no soportas la critica te esta costando oportunidades profesionales. Te compensa?"
            },
            "cuando_usar": "Cuando el paciente reconoce la irracionalidad pero se resiste al cambio. Muy util como complemento."
        }
    ],
    "estrategias_avanzadas": [
        {
            "estrategia": "Disputacion didactica vs socratica",
            "descripcion": "La disputacion puede ser didactica (el terapeuta explica la irracionalidad) o socratica (el terapeuta guia al paciente a descubrirla). Se prefiere la socratica cuando es posible.",
            "recomendacion": "Comenzar con socratica. Si el paciente no llega a la conclusion, usar didactica brevemente y luego volver a socratica para confirmar comprension."
        },
        {
            "estrategia": "Disputacion vigorosa",
            "descripcion": "Disputacion especialmente energica y emotiva para cuando el paciente hace insight intelectual pero no emocional.",
            "recomendacion": "Usar tono firme y apasionado. El paciente tambien puede grabar su propia disputacion vigorosa y escucharla repetidamente."
        },
        {
            "estrategia": "Disputacion de creencias derivadas",
            "descripcion": "Ademas de disputar la demanda core, disputar las derivaciones (catastrofismo, BTF, condenacion) por separado.",
            "recomendacion": "Primero disputar la demanda (B), luego sus derivaciones. Cada derivacion puede requerir una estrategia diferente."
        }
    ],
    "errores_en_disputacion": [
        "Disputar demasiado rapido sin que el paciente identifique claramente su B",
        "Usar solo un tipo de disputacion (ej: solo empirica) cuando el paciente necesita otra",
        "Convertir la disputacion en un debate donde el terapeuta 'gana' y el paciente 'pierde'",
        "No verificar si el paciente entendio la disputacion",
        "Disputar A (el evento) en lugar de B (la creencia)",
        "No asignar tareas de auto-disputacion para entre sesiones"
    ]
})

# 9. trec_modelo_abcde
write_json("trec", "trec_modelo_abcde.json", {
    "area_id": "trec_modelo_abcde",
    "nombre": "Modelo ABCDE de la TREC",
    "descripcion": "El modelo ABCDE: marco central de conceptualizacion, evaluacion e intervencion en TREC.",
    "fuentes": [
        "Ellis, A. (1962). Reason and Emotion in Psychotherapy. Lyle Stuart.",
        "Ellis, A. & Harper, R. A. (1975). A New Guide to Rational Living. Wilshire Book Company.",
        "Dryden, W. & Neenan, M. (2004). The Rational Emotive Behavioural Approach to Therapeutic Change. Sage."
    ],
    "componentes": [
        {
            "componente": "A",
            "nombre": "Acontecimiento Activador (Activating Event)",
            "descripcion": "El evento, situacion o experiencia que activa el sistema de creencias. Puede ser externo (algo que sucede) o interno (un recuerdo, sensacion, pensamiento).",
            "tipos": [
                {"tipo": "A real", "descripcion": "Lo que objetivamente sucedio"},
                {"tipo": "A inferido", "descripcion": "La interpretacion o significado personal que la persona da al evento (aspectos criticos del A)"}
            ],
            "nota_clinica": "El terapeuta debe identificar tanto el A real como el A inferido. A menudo el A inferido es mas relevante clinicamente."
        },
        {
            "componente": "B",
            "nombre": "Creencias (Beliefs)",
            "descripcion": "Las creencias, evaluaciones y filosofia personal que la persona aplica al evento activador.",
            "tipos": [
                {
                    "tipo": "Creencias racionales (rBs)",
                    "caracteristicas": ["Flexibles", "Logicas", "Consistentes con la realidad", "Funcionales"],
                    "ejemplos": ["Preferiria aprobar", "Seria desagradable suspender", "Puedo soportar un fracaso"]
                },
                {
                    "tipo": "Creencias irracionales (iBs)",
                    "caracteristicas": ["Rigidas", "Ilogicas", "Inconsistentes con la realidad", "Disfuncionales"],
                    "ejemplos": ["DEBO aprobar", "Seria TERRIBLE suspender", "NO LO SOPORTO"]
                }
            ],
            "nota_clinica": "B es el corazon del modelo. Las creencias irracionales se derivan de demandas absolutistas (musts)."
        },
        {
            "componente": "C",
            "nombre": "Consecuencias (Consequences)",
            "descripcion": "Las consecuencias emocionales, conductuales y fisiologicas que resultan de la interaccion entre A y B.",
            "tipos": [
                {
                    "tipo": "Emociones negativas sanas (de creencias racionales)",
                    "ejemplos": ["Preocupacion (vs ansiedad)", "Tristeza (vs depresion)", "Molestia/enfado sano (vs ira/rabia)", "Remordimiento (vs culpa toxica)", "Decepcion (vs verguenza)"]
                },
                {
                    "tipo": "Emociones perturbadoras (de creencias irracionales)",
                    "ejemplos": ["Ansiedad", "Depresion", "Ira/rabia", "Culpa toxica", "Verguenza", "Envidia malsana", "Celos malsanos"]
                }
            ],
            "nota_clinica": "Es fundamental distinguir emociones negativas sanas de perturbadoras. La meta NO es eliminar emociones negativas, sino transformar las perturbadoras en sanas."
        },
        {
            "componente": "D",
            "nombre": "Disputacion (Disputing)",
            "descripcion": "El proceso de cuestionar, debatir y desafiar las creencias irracionales identificadas en B.",
            "metodos": ["Disputacion empirica", "Disputacion logica", "Disputacion pragmatica"],
            "nota_clinica": "D es la intervencion principal. Se hace inicialmente en sesion con guia del terapeuta y luego el paciente la practica de forma autonoma."
        },
        {
            "componente": "E",
            "nombre": "Efecto / Nueva Filosofia Efectiva (Effective new philosophy)",
            "descripcion": "El resultado de la disputacion exitosa: nuevas creencias racionales y emociones negativas sanas que reemplazan a las perturbadoras.",
            "tipos": [
                {"tipo": "E cognitivo", "descripcion": "Nueva creencia racional: preferencia fuerte pero flexible"},
                {"tipo": "E emocional", "descripcion": "Emocion negativa sana en lugar de perturbadora"},
                {"tipo": "E conductual", "descripcion": "Conducta funcional y orientada a metas"}
            ],
            "nota_clinica": "E no es pensamiento positivo ni minimizacion. Es una evaluacion realista, flexible y funcional."
        }
    ],
    "formatos_registro": [
        {
            "formato": "Registro ABC basico",
            "campos": ["A - Situacion", "B - Que me dije?", "C - Que senti/hice?"],
            "uso": "Fase inicial para aprender a identificar el patron"
        },
        {
            "formato": "Registro ABCDE completo",
            "campos": ["A - Evento activador", "A inferido - Aspecto critico", "B irracional - Creencia irracional (tipo)", "C emocional - Emocion perturbadora (0-10)", "C conductual - Lo que hice", "D - Disputacion (que tipo?)", "E cognitivo - Nueva creencia racional", "E emocional - Emocion sana (0-10)", "E conductual - Lo que hare diferente"],
            "uso": "Fase de disputacion activa y practica autonoma"
        }
    ],
    "principios_fundamentales": [
        "B causa C, no A (principio de responsabilidad emocional)",
        "Las emociones negativas son normales; las perturbadoras provienen de creencias irracionales",
        "Todas las creencias irracionales derivan de demandas absolutistas (musts)",
        "El cambio requiere trabajo persistente y repetido (Insight 3)",
        "La meta es la felicidad a largo plazo, no solo el alivio inmediato"
    ]
})

print(f"\nTotal TREC files: {len(os.listdir(os.path.join(BASE, 'trec', 'data')))}")


# ============================================================================
# MINDFULNESS — Missing files (10)
# ============================================================================
print("\n=== MINDFULNESS ===")

# 1. ejercicios_tareas
write_json("mindfulness", "ejercicios_tareas.json", {
    "area_id": "ejercicios_tareas",
    "nombre": "Ejercicios y Tareas de Mindfulness",
    "descripcion": "Repertorio de practicas y tareas para casa basadas en mindfulness aplicables en contexto clinico.",
    "fuentes": [
        "Kabat-Zinn, J. (2013). Full Catastrophe Living (revised ed.). Bantam Books.",
        "Segal, Z. V., Williams, J. M. G. & Teasdale, J. D. (2013). Mindfulness-Based Cognitive Therapy for Depression (2nd ed.). Guilford Press.",
        "Germer, C. K. (2009). The Mindful Path to Self-Compassion. Guilford Press."
    ],
    "ejercicios": [
        {
            "id": "respiracion_consciente",
            "nombre": "Respiracion consciente",
            "duracion_minutos": "5-15",
            "nivel": "basico",
            "instrucciones": [
                "Sentarse en posicion comoda con la espalda recta",
                "Cerrar los ojos o mantener mirada suave hacia abajo",
                "Dirigir la atencion a las sensaciones de la respiracion",
                "Notar la entrada y salida del aire (nariz, pecho o abdomen)",
                "Cuando la mente se disperse, notar suavemente y regresar a la respiracion",
                "No intentar controlar la respiracion, solo observarla"
            ],
            "tarea_para_casa": "Practicar 5 minutos diarios, preferiblemente a la misma hora. Registrar brevemente la experiencia.",
            "indicaciones_clinicas": ["Ansiedad", "Estres", "Inicio de cualquier programa de mindfulness"]
        },
        {
            "id": "body_scan",
            "nombre": "Escaneo corporal (Body Scan)",
            "duracion_minutos": "20-45",
            "nivel": "basico-intermedio",
            "instrucciones": [
                "Acostarse boca arriba en posicion comoda",
                "Llevar la atencion a los pies: notar sensaciones sin juzgar",
                "Gradualmente mover la atencion ascendiendo por el cuerpo",
                "En cada zona: notar sensaciones, tension, temperatura, pulsaciones",
                "Si hay zonas tensas, respirar hacia ellas con aceptacion",
                "Completar recorriendo todo el cuerpo hasta la coronilla",
                "Finalizar con atencion al cuerpo como un todo"
            ],
            "tarea_para_casa": "Practicar 3 veces por semana con audio guiado. Registrar zonas de tension y respuesta emocional.",
            "indicaciones_clinicas": ["Dolor cronico", "Somatizacion", "Disociacion leve", "Dificultad para conectar con emociones"]
        },
        {
            "id": "comer_consciente",
            "nombre": "Ejercicio de la uva pasa (comer consciente)",
            "duracion_minutos": "10-15",
            "nivel": "basico",
            "instrucciones": [
                "Tomar un alimento pequeno (uva pasa, trozo de fruta)",
                "Observarlo como si nunca se hubiera visto: forma, color, textura",
                "Olerlo: notar todas las cualidades del aroma",
                "Colocarlo en la boca sin masticar: notar sensaciones en la lengua",
                "Masticar lentamente: notar sabores, texturas, cambios",
                "Tragar conscientemente: seguir las sensaciones al descender"
            ],
            "tarea_para_casa": "Realizar una comida consciente a la semana (al menos los primeros 5 minutos).",
            "indicaciones_clinicas": ["Psicoeducacion inicial sobre mindfulness", "Trastornos alimentarios", "Comer emocional"]
        },
        {
            "id": "meditacion_sentada",
            "nombre": "Meditacion sentada formal",
            "duracion_minutos": "15-30",
            "nivel": "intermedio",
            "instrucciones": [
                "Sentarse con postura estable y dignificada",
                "Comenzar con atencion a la respiracion (5 min)",
                "Expandir a sensaciones corporales (5 min)",
                "Expandir a sonidos del entorno (5 min)",
                "Expandir a pensamientos y emociones (observar sin engancharse) (5 min)",
                "Atencion abierta y sin objeto (choiceless awareness) (5 min)",
                "Cerrar con tres respiraciones profundas"
            ],
            "tarea_para_casa": "Practicar diariamente 15-30 minutos. Aumentar gradualmente la duracion.",
            "indicaciones_clinicas": ["Rumia", "Ansiedad", "Prevencion de recaidas en depresion"]
        },
        {
            "id": "espacio_respiracion",
            "nombre": "Espacio de respiracion de tres minutos",
            "duracion_minutos": "3",
            "nivel": "basico",
            "instrucciones": [
                "Minuto 1 - AMPLIAR: Darse cuenta de la experiencia actual (pensamientos, emociones, sensaciones)",
                "Minuto 2 - FOCALIZAR: Dirigir atencion a la respiracion como ancla",
                "Minuto 3 - EXPANDIR: Ampliar la atencion a todo el cuerpo y al momento presente"
            ],
            "tarea_para_casa": "Usar 3 veces al dia (manana, mediodia, noche) y en cualquier momento de estres.",
            "indicaciones_clinicas": ["Practica de emergencia ante estres", "MBCT", "Regulacion emocional rapida"]
        },
        {
            "id": "caminar_consciente",
            "nombre": "Caminata consciente (Walking meditation)",
            "duracion_minutos": "10-20",
            "nivel": "basico",
            "instrucciones": [
                "Elegir un tramo de 10-15 metros para caminar de ida y vuelta",
                "Caminar lentamente, notando cada fase del paso",
                "Atender al levantar el pie, moverlo, apoyarlo",
                "Notar el contacto con el suelo, el equilibrio, el peso",
                "Al final del tramo, detenerse, respirar, girar conscientemente",
                "Mantener mirada suave hacia el suelo a unos metros"
            ],
            "tarea_para_casa": "Practicar 10 minutos diarios o incorporar atencion plena en caminatas cotidianas.",
            "indicaciones_clinicas": ["Personas que no toleran quietud", "Agitacion", "Complemento a meditacion sentada"]
        }
    ]
})

# 2. recursos_materiales
write_json("mindfulness", "recursos_materiales.json", {
    "area_id": "recursos_materiales",
    "nombre": "Recursos y Materiales para Mindfulness",
    "descripcion": "Materiales psicoeducativos, audios y recursos bibliograficos para la practica de mindfulness clinico.",
    "fuentes": [
        "Kabat-Zinn, J. (2013). Full Catastrophe Living (revised ed.). Bantam Books.",
        "Segal, Z. V. et al. (2013). MBCT for Depression (2nd ed.). Guilford Press.",
        "Williams, M. & Penman, D. (2011). Mindfulness: A Practical Guide. Piatkus."
    ],
    "materiales_psicoeducativos": [
        {
            "id": "folleto_que_es_mindfulness",
            "nombre": "Que es mindfulness: guia para pacientes",
            "tipo": "folleto",
            "contenido_clave": [
                "Definicion: prestar atencion de manera intencional, en el momento presente y sin juzgar",
                "Mindfulness NO es: vaciar la mente, relajacion, religion, escapar de problemas",
                "Piloto automatico vs atencion consciente",
                "Beneficios basados en evidencia",
                "Mitos comunes desmentidos"
            ],
            "momento_uso": "Primera sesion de psicoeducacion"
        },
        {
            "id": "folleto_actitudes_mindfulness",
            "nombre": "Las 7 actitudes fundamentales de mindfulness",
            "tipo": "folleto",
            "contenido_clave": [
                "No juzgar: observar sin etiquetar como bueno o malo",
                "Paciencia: permitir que las cosas se desenvuelvan a su tiempo",
                "Mente de principiante: ver cada experiencia como nueva",
                "Confianza: confiar en la propia experiencia",
                "No esforzarse: no tratar de lograr un estado especial",
                "Aceptacion: ver las cosas como son, no como quisieras",
                "Dejar ir: soltar la tendencia a aferrarse o rechazar"
            ],
            "momento_uso": "Primeras sesiones, reforzar a lo largo del programa"
        },
        {
            "id": "diario_practica",
            "nombre": "Diario de practica mindfulness",
            "tipo": "hoja_de_trabajo",
            "campos": ["Fecha", "Tipo de practica", "Duracion", "Que note durante la practica", "Dificultades", "Observaciones"],
            "instrucciones": "Completar despues de cada practica formal. Traer a sesion para revision."
        }
    ],
    "recursos_bibliograficos": [
        {
            "titulo": "Vivir con plenitud las crisis",
            "autor": "Kabat-Zinn, J.",
            "uso": "Texto fundamental para pacientes en programas MBSR"
        },
        {
            "titulo": "Mindfulness: guia practica para encontrar la paz en un mundo frenetico",
            "autor": "Williams, M. & Penman, D.",
            "uso": "Programa de 8 semanas accesible para pacientes"
        },
        {
            "titulo": "El camino del mindfulness hacia la autocompasion",
            "autor": "Germer, C. K.",
            "uso": "Para pacientes con autocritica severa y baja autoestima"
        }
    ],
    "audios_guiados_recomendados": [
        {"practica": "Body scan", "duracion": "20-45 min", "nota": "Se recomienda que el terapeuta grabe audios personalizados o use recursos de programas validados"},
        {"practica": "Meditacion sentada", "duracion": "15-30 min", "nota": "Progresion gradual de duracion"},
        {"practica": "Espacio de respiracion 3 min", "duracion": "3 min", "nota": "Audio breve para uso de emergencia"}
    ]
})

# 3. tecnicas_especificas
write_json("mindfulness", "tecnicas_especificas.json", {
    "area_id": "tecnicas_especificas",
    "nombre": "Tecnicas Especificas de Mindfulness Clinico",
    "descripcion": "Tecnicas especializadas de mindfulness para aplicacion en contexto clinico y terapeutico.",
    "fuentes": [
        "Segal, Z. V. et al. (2013). MBCT for Depression (2nd ed.). Guilford.",
        "Kabat-Zinn, J. (2013). Full Catastrophe Living. Bantam.",
        "Linehan, M. M. (2015). DBT Skills Training Manual (2nd ed.). Guilford.",
        "Germer, C. K. & Neff, K. D. (2013). Self-Compassion in Clinical Practice. Journal of Clinical Psychology, 69(8), 856-867."
    ],
    "tecnicas": [
        {
            "id": "descentramiento",
            "nombre": "Descentramiento (Decentering)",
            "descripcion": "Capacidad de observar los pensamientos y emociones como eventos mentales pasajeros, no como hechos o como parte de uno mismo.",
            "procedimiento": [
                "Notar cuando surge un pensamiento",
                "Etiquetarlo suavemente: 'Estoy teniendo el pensamiento de que...'",
                "Observarlo como si fuera una nube que pasa",
                "No engancharse ni intentar eliminarlo",
                "Regresar al momento presente"
            ],
            "indicaciones": ["Rumia depresiva", "Preocupacion ansiosa", "Fusion cognitiva"],
            "diferencia_con_reestructuracion": "No se busca cambiar el contenido del pensamiento (como en TCC), sino cambiar la relacion con el pensamiento."
        },
        {
            "id": "surf_emocional",
            "nombre": "Surfear la emocion (Urge Surfing)",
            "descripcion": "Observar la emocion o impulso como una ola que crece, alcanza su pico y naturalmente decrece.",
            "procedimiento": [
                "Notar la emocion o impulso cuando surge",
                "Localizar donde se siente en el cuerpo",
                "Observar su intensidad como si fuera una ola",
                "Respirar con la emocion sin intentar cambiarla",
                "Notar como gradualmente la intensidad cambia por si sola",
                "Reconocer que las emociones son transitorias"
            ],
            "indicaciones": ["Craving en adicciones", "Impulsos autolesivos", "Ira intensa", "Ansiedad aguda"]
        },
        {
            "id": "atencion_abierta",
            "nombre": "Atencion abierta (Choiceless Awareness)",
            "descripcion": "Estado de atencion receptiva a cualquier experiencia que surja, sin dirigir el foco a ningun objeto particular.",
            "procedimiento": [
                "Comenzar con atencion focalizada en respiracion",
                "Gradualmente soltar el ancla y abrir la atencion",
                "Notar lo que surja: sonidos, sensaciones, pensamientos, emociones",
                "Mantener ecuanimidad ante lo agradable y desagradable",
                "Observar como cada experiencia surge y desaparece"
            ],
            "indicaciones": ["Practicantes intermedios-avanzados", "Desarrollo de ecuanimidad", "Prevencion de recaidas"],
            "nivel": "avanzado"
        },
        {
            "id": "autocompasion_mindful",
            "nombre": "Autocompasion consciente (Mindful Self-Compassion)",
            "descripcion": "Practica que combina mindfulness con autocompasion: tratarse a uno mismo con la misma amabilidad que se trataria a un amigo querido.",
            "componentes": [
                {"componente": "Mindfulness", "descripcion": "Reconocer el sufrimiento sin suprimirlo ni exagerarlo"},
                {"componente": "Humanidad compartida", "descripcion": "Reconocer que el sufrimiento es parte de la experiencia humana universal"},
                {"componente": "Amabilidad hacia uno mismo", "descripcion": "Dirigirse palabras y gestos de cuidado y comprension"}
            ],
            "practica_breve": [
                "Poner una mano sobre el corazon",
                "Decirse: 'Este es un momento de sufrimiento' (mindfulness)",
                "Decirse: 'El sufrimiento es parte de la vida' (humanidad compartida)",
                "Decirse: 'Que pueda ser amable conmigo mismo' (amabilidad)"
            ],
            "indicaciones": ["Autocritica severa", "Verguenza", "Trauma", "Depresion recurrente"]
        },
        {
            "id": "rain",
            "nombre": "Tecnica RAIN",
            "descripcion": "Acronimo para trabajar con emociones dificiles de forma mindful.",
            "pasos": [
                {"paso": "R - Reconocer", "descripcion": "Reconocer que esta presente una emocion dificil. Nombrarla."},
                {"paso": "A - Aceptar/Permitir", "descripcion": "Permitir que la emocion este presente sin resistirla."},
                {"paso": "I - Investigar", "descripcion": "Explorar con curiosidad: donde la siento en el cuerpo? Que pensamientos la acompanan?"},
                {"paso": "N - No-identificacion", "descripcion": "Reconocer que la emocion no es 'yo'. Es una experiencia transitoria."}
            ],
            "indicaciones": ["Regulacion emocional", "Ansiedad", "Tristeza", "Ira"]
        }
    ]
})

# 4. estructura_sesiones
write_json("mindfulness", "estructura_sesiones.json", {
    "area_id": "estructura_sesiones",
    "nombre": "Estructura de Sesiones de Mindfulness Clinico",
    "descripcion": "Organizacion de programas basados en mindfulness (MBSR/MBCT) y estructura de sesiones individuales.",
    "fuentes": [
        "Kabat-Zinn, J. (2013). Full Catastrophe Living. Bantam.",
        "Segal, Z. V. et al. (2013). MBCT for Depression (2nd ed.). Guilford.",
        "Crane, R. (2009). Mindfulness-Based Cognitive Therapy. Routledge."
    ],
    "programa_mbct_8_semanas": [
        {
            "sesion": 1,
            "tema": "Piloto automatico",
            "objetivos": ["Comprender que es el piloto automatico", "Introducir la uva pasa", "Body scan"],
            "practica_en_casa": "Body scan diario + una actividad rutinaria con atencion plena"
        },
        {
            "sesion": 2,
            "tema": "Vivir en nuestra cabeza",
            "objetivos": ["Explorar como la mente crea narrativas", "Percepcion directa vs interpretacion"],
            "practica_en_casa": "Body scan diario + registro de eventos agradables"
        },
        {
            "sesion": 3,
            "tema": "Reunir la mente dispersa",
            "objetivos": ["Introducir meditacion sentada con foco en respiracion", "Movimiento consciente (yoga/estiramientos)"],
            "practica_en_casa": "Alternar body scan y meditacion sentada + registro eventos desagradables"
        },
        {
            "sesion": 4,
            "tema": "Reconocer la aversion",
            "objetivos": ["Explorar patrones de aversion y evitacion", "Espacio de respiracion 3 minutos"],
            "practica_en_casa": "Meditacion sentada 20 min + espacio de respiracion 3x dia"
        },
        {
            "sesion": 5,
            "tema": "Permitir/dejar ser",
            "objetivos": ["Practicar aceptacion de lo dificil", "Meditacion sentada con emociones"],
            "practica_en_casa": "Meditacion sentada 30 min con atencion abierta"
        },
        {
            "sesion": 6,
            "tema": "Los pensamientos no son hechos",
            "objetivos": ["Descentramiento", "Los pensamientos como eventos mentales"],
            "practica_en_casa": "Meditacion sentada 30 min + espacio de respiracion ante dificultades"
        },
        {
            "sesion": 7,
            "tema": "Como puedo cuidarme mejor?",
            "objetivos": ["Relacion entre actividad y estado de animo", "Plan de accion personalizado"],
            "practica_en_casa": "Practica elegida por el participante + plan de prevencion de recaidas"
        },
        {
            "sesion": 8,
            "tema": "Mantener y extender lo aprendido",
            "objetivos": ["Reflexion sobre el programa", "Consolidar practica personal sostenible"],
            "practica_en_casa": "Practica autonoma continuada segun plan personalizado"
        }
    ],
    "estructura_sesion_individual": {
        "duracion_minutos": 60,
        "secuencia": [
            {"paso": "Practica de apertura", "minutos": 10, "descripcion": "Meditacion guiada breve para entrar en modo mindful."},
            {"paso": "Revision de practica en casa", "minutos": 15, "descripcion": "Explorar la experiencia de la practica semanal. Que se noto? Que fue dificil?"},
            {"paso": "Tema de la sesion", "minutos": 20, "descripcion": "Presentar y explorar el tema central con ejercicios experienciales."},
            {"paso": "Practica principal", "minutos": 10, "descripcion": "Practica formal guiada relacionada con el tema."},
            {"paso": "Asignacion y cierre", "minutos": 5, "descripcion": "Indicar practica para casa y cerrar con atencion plena al momento."}
        ]
    }
})

# 5. barreras
write_json("mindfulness", "barreras.json", {
    "area_id": "barreras",
    "nombre": "Barreras y Dificultades en Mindfulness",
    "descripcion": "Obstaculos comunes en la practica de mindfulness y estrategias para superarlos.",
    "fuentes": [
        "Segal, Z. V. et al. (2013). MBCT for Depression (2nd ed.). Guilford.",
        "Kabat-Zinn, J. (2013). Full Catastrophe Living. Bantam.",
        "Treleaven, D. A. (2018). Trauma-Sensitive Mindfulness. W. W. Norton."
    ],
    "barreras_del_paciente": [
        {
            "barrera": "No puedo dejar la mente en blanco",
            "tipo": "expectativa_erronea",
            "descripcion": "El paciente cree que mindfulness consiste en no pensar.",
            "estrategias": [
                "Psicoeducar: mindfulness no es dejar la mente en blanco, es notar cuando la mente se ha ido y regresar",
                "Normalizar: la mente produce pensamientos, eso es su funcion natural",
                "Reencuadrar cada distraccion como oportunidad de practicar el 'regresar'",
                "Usar la metafora del cachorro: la mente es como un cachorro que se escapa, se le trae de vuelta con amabilidad"
            ]
        },
        {
            "barrera": "Me quedo dormido durante la practica",
            "tipo": "dificultad_practica",
            "descripcion": "El paciente se duerme durante body scan u otras practicas.",
            "estrategias": [
                "Practicar sentado en lugar de acostado",
                "Practicar a horas de mayor alerta (no justo despues de comer o antes de dormir)",
                "Abrir los ojos levemente",
                "Evaluar si hay privacion de sueno (necesidad real de descanso)"
            ]
        },
        {
            "barrera": "Aumento temporal de ansiedad",
            "tipo": "reaccion_paradojica",
            "descripcion": "Al prestar atencion al momento presente, el paciente nota mas ansiedad de la que sentia antes.",
            "estrategias": [
                "Normalizar: al prestar atencion, se notan cosas que antes se evitaban",
                "Graduar la exposicion: comenzar con practicas mas cortas",
                "Usar anclas externas (sonidos) si las internas (respiracion) son activadoras",
                "Mantener los ojos abiertos si cerrarlos genera malestar",
                "Evaluar si es apropiado continuar (contraindicaciones en trauma severo)"
            ]
        },
        {
            "barrera": "No tengo tiempo para practicar",
            "tipo": "resistencia",
            "descripcion": "El paciente reporta que no puede encontrar tiempo para la practica diaria.",
            "estrategias": [
                "Comenzar con practicas muy cortas (3 minutos)",
                "Integrar mindfulness en actividades cotidianas (lavarse los dientes, comer)",
                "Explorar que hay detras de la falta de tiempo (priorizacion, resistencia)",
                "Vincular la practica a un habito existente (anchor habit)"
            ]
        },
        {
            "barrera": "Experiencias disociativas o flashbacks",
            "tipo": "contraindicacion_relativa",
            "descripcion": "La practica desencadena disociacion o recuerdos traumaticos intrusivos.",
            "estrategias": [
                "Detener la practica si hay disociacion activa",
                "Usar tecnicas de grounding antes y durante",
                "Mantener ojos abiertos y atencion externa",
                "Acortar significativamente las practicas",
                "Considerar trauma-sensitive mindfulness (Treleaven, 2018)",
                "Evaluar si mindfulness es apropiado en este momento del tratamiento"
            ]
        }
    ],
    "barreras_del_terapeuta": [
        {
            "barrera": "Ensenar mindfulness sin practicarlo personalmente",
            "descripcion": "El terapeuta ensena tecnicas que no practica, lo que limita su capacidad de guiar y modelar.",
            "estrategia": "El terapeuta DEBE tener practica personal sostenida. Se recomienda minimo 6 meses de practica regular antes de ensenar. No se puede transmitir lo que no se ha experimentado."
        },
        {
            "barrera": "Usar mindfulness como tecnica de relajacion",
            "descripcion": "Reducir mindfulness a una herramienta de relajacion pierde su esencia transformadora.",
            "estrategia": "Recordar que el objetivo es la conciencia, no la relajacion. La relajacion puede ser un efecto secundario, pero no el proposito."
        }
    ],
    "contraindicaciones": [
        "Psicosis activa con alucinaciones",
        "Trauma severo no procesado (riesgo de retraumatizacion)",
        "Ideacion suicida activa (estabilizar primero)",
        "Adiccion activa severa sin estabilizacion previa",
        "Disociacion severa (evaluar caso a caso)"
    ]
})

# 6. habilidades_terapeuta
write_json("mindfulness", "habilidades_terapeuta.json", {
    "area_id": "habilidades_terapeuta",
    "nombre": "Habilidades del Terapeuta en Mindfulness",
    "descripcion": "Competencias necesarias para el terapeuta que aplica intervenciones basadas en mindfulness.",
    "fuentes": [
        "Crane, R. S. et al. (2012). Competences for Teaching Mindfulness-Based Courses. Mindfulness, 3, 76-84.",
        "Kabat-Zinn, J. (2013). Full Catastrophe Living. Bantam.",
        "Segal, Z. V. et al. (2013). MBCT for Depression (2nd ed.). Guilford."
    ],
    "habilidades_nucleares": [
        {
            "habilidad": "Practica personal sostenida",
            "descripcion": "El terapeuta debe tener una practica personal de mindfulness regular y continuada.",
            "componentes": [
                "Minimo 6-12 meses de practica personal antes de ensenar",
                "Practica diaria de al menos 20-30 minutos",
                "Haber completado al menos un retiro de mindfulness",
                "La practica personal informa y enriquece la ensenanza"
            ],
            "importancia": "Fundamental. No se puede guiar a otros en un territorio que uno no ha explorado."
        },
        {
            "habilidad": "Encarnacion del mindfulness (embodiment)",
            "descripcion": "Capacidad de modelar las actitudes mindful durante la sesion terapeutica.",
            "componentes": [
                "Presencia atenta y no reactiva durante la sesion",
                "Responder en lugar de reaccionar ante material dificil",
                "Mantener curiosidad genuina por la experiencia del paciente",
                "Transmitir aceptacion y no-juicio a traves del lenguaje y actitud"
            ]
        },
        {
            "habilidad": "Guiar practicas meditativas",
            "descripcion": "Capacidad de guiar meditaciones de forma clara, pausada y terapeuticamente sensible.",
            "componentes": [
                "Usar lenguaje invitacional ('puedes notar...', 'si lo deseas...')",
                "Mantener ritmo pausado con silencios significativos",
                "Adaptar las instrucciones al nivel del paciente",
                "Observar respuestas del paciente durante la practica",
                "Manejar reacciones adversas durante la practica"
            ]
        },
        {
            "habilidad": "Indagacion (Inquiry)",
            "descripcion": "Habilidad para explorar la experiencia del paciente despues de una practica mindful de forma que profundice el aprendizaje.",
            "componentes": [
                "Preguntas abiertas y curiosas sobre la experiencia directa",
                "Dirigir atencion a la experiencia del momento, no a explicaciones",
                "Distinguir entre descripcion de experiencia y narrativa sobre ella",
                "Usar preguntas como: 'Que notaste?', 'Donde lo sentiste en el cuerpo?', 'Como fue eso para ti?'"
            ]
        },
        {
            "habilidad": "Manejo de dificultades en la practica",
            "descripcion": "Capacidad de responder terapeuticamente cuando surgen dificultades durante o fuera de la practica.",
            "componentes": [
                "Normalizar la dificultad como parte del proceso",
                "Distinguir entre dificultad productiva y contraindicacion",
                "Saber cuando adaptar la practica y cuando pausarla",
                "Manejar llanto, ansiedad o disociacion durante meditaciones"
            ]
        }
    ],
    "competencias_avanzadas": [
        "Adaptar programas MBSR/MBCT a poblaciones especificas",
        "Integrar mindfulness con otras modalidades terapeuticas (TCC, DBT, ACT)",
        "Supervisar a otros terapeutas en mindfulness",
        "Evaluar la practica del paciente sin juicio pero con precision clinica",
        "Manejar la propia practica personal ante burnout y fatiga por compasion"
    ]
})

# 7. sintomas_problemas
write_json("mindfulness", "sintomas_problemas.json", {
    "area_id": "sintomas_problemas",
    "nombre": "Sintomas y Problemas Abordables con Mindfulness",
    "descripcion": "Mapa de trastornos y condiciones clinicas donde mindfulness tiene evidencia de eficacia.",
    "fuentes": [
        "Khoury, B. et al. (2013). Mindfulness-based therapy: A comprehensive meta-analysis. Clinical Psychology Review, 33(6), 763-771.",
        "Goldberg, S. B. et al. (2018). Mindfulness-based interventions for psychiatric disorders. Annals of the New York Academy of Sciences, 1426(1), 59-72.",
        "Hofmann, S. G. et al. (2010). The Effect of Mindfulness-Based Therapy on Anxiety and Depression. Journal of Consulting and Clinical Psychology, 78(2), 169-183."
    ],
    "problemas_clinicos": [
        {
            "problema": "Depresion recurrente",
            "programa_recomendado": "MBCT (Mindfulness-Based Cognitive Therapy)",
            "enfoque": "Prevencion de recaidas mediante descentramiento de pensamientos depresogenicos. Ensenar a reconocer senales tempranas de recaida.",
            "nivel_evidencia": "Alto. NICE (UK) lo recomienda como tratamiento de primera linea para prevencion de recaidas en depresion recurrente (3+ episodios).",
            "practicas_clave": ["Descentramiento", "Espacio de respiracion 3 min", "Registro de actividad y estado de animo"]
        },
        {
            "problema": "Ansiedad generalizada",
            "programa_recomendado": "MBSR o MBCT adaptado",
            "enfoque": "Reduccion de la preocupacion cronica mediante atencion al momento presente. Desarrollar tolerancia a la incertidumbre.",
            "nivel_evidencia": "Moderado-Alto. Meta-analisis muestran reduccion significativa de sintomas ansiosos.",
            "practicas_clave": ["Respiracion consciente", "Body scan", "Surfear la emocion"]
        },
        {
            "problema": "Dolor cronico",
            "programa_recomendado": "MBSR (Mindfulness-Based Stress Reduction)",
            "enfoque": "Cambiar la relacion con el dolor: distinguir sensacion de sufrimiento. Reducir la resistencia al dolor que amplifica el sufrimiento.",
            "nivel_evidencia": "Alto. MBSR fue originalmente desarrollado para dolor cronico con amplia evidencia.",
            "practicas_clave": ["Body scan", "Meditacion con atencion al dolor", "Movimiento consciente"]
        },
        {
            "problema": "Estres laboral y burnout",
            "programa_recomendado": "MBSR",
            "enfoque": "Reduccion de la reactividad al estres. Desarrollo de resiliencia mediante practica regular.",
            "nivel_evidencia": "Alto. Multiples estudios en poblacion laboral.",
            "practicas_clave": ["Espacio de respiracion 3 min", "Caminata consciente", "Practicas informales en el trabajo"]
        },
        {
            "problema": "Insomnio",
            "programa_recomendado": "MBSR o MBTI (Mindfulness-Based Therapy for Insomnia)",
            "enfoque": "Reduccion de la activacion cognitiva nocturna. Aceptacion de la experiencia de no dormir en lugar de luchar contra ella.",
            "nivel_evidencia": "Moderado. Evidencia creciente, especialmente combinado con higiene del sueno.",
            "practicas_clave": ["Body scan antes de dormir", "Respiracion consciente", "Aceptacion de la vigilia"]
        },
        {
            "problema": "Trastornos alimentarios",
            "programa_recomendado": "Mindful Eating o MB-EAT",
            "enfoque": "Desarrollar conciencia de senales de hambre y saciedad. Reducir comer emocional mediante atencion plena al acto de comer.",
            "nivel_evidencia": "Moderado. Evidencia prometedora especialmente para atracones.",
            "practicas_clave": ["Comer consciente", "Surfear impulsos", "Body scan para conciencia corporal"]
        }
    ],
    "contraindicaciones_relativas": [
        "Psicosis activa (la introspoccion puede empeorar sintomas)",
        "TEPT severo no estabilizado (riesgo de flashbacks durante practica)",
        "Disociacion severa activa",
        "Ideacion suicida activa (estabilizar primero)",
        "Intoxicacion aguda por sustancias"
    ],
    "nota_clinica": "Mindfulness no es un tratamiento en si mismo para la mayoria de trastornos, sino un componente que se integra en protocolos mas amplios (MBCT, DBT, ACT). Su eficacia depende de la practica sostenida del paciente."
})

# 8. mindfulness_practicas_formales
write_json("mindfulness", "mindfulness_practicas_formales.json", {
    "area_id": "mindfulness_practicas_formales",
    "nombre": "Practicas Formales de Mindfulness",
    "descripcion": "Practicas meditativas estructuradas con tiempo y espacio dedicados, columna vertebral de los programas basados en mindfulness.",
    "fuentes": [
        "Kabat-Zinn, J. (2013). Full Catastrophe Living. Bantam.",
        "Segal, Z. V. et al. (2013). MBCT for Depression (2nd ed.). Guilford.",
        "Crane, R. (2009). Mindfulness-Based Cognitive Therapy. Routledge."
    ],
    "practicas": [
        {
            "id": "body_scan_formal",
            "nombre": "Escaneo Corporal (Body Scan)",
            "duracion_sugerida": "30-45 min (puede acortarse a 15-20 para principiantes)",
            "posicion": "Tumbado boca arriba, brazos a los lados, ojos cerrados",
            "instrucciones": [
                "Comenzar con atencion a la respiracion y al cuerpo como un todo",
                "Dirigir atencion a los dedos del pie izquierdo",
                "Notar sensaciones presentes: hormigueo, temperatura, presion, nada",
                "Respirar hacia la zona observada",
                "Soltar y mover atencion al pie, tobillo, pantorrilla...",
                "Recorrer todo el lado izquierdo, luego el derecho",
                "Recorrer tronco, espalda, hombros, brazos, manos",
                "Cuello, cara (mandibula, mejillas, ojos, frente), coronilla",
                "Finalizar con atencion al cuerpo como totalidad"
            ],
            "desafios_comunes": ["Somnolencia", "Impaciencia", "No sentir nada en algunas zonas", "Dolor o incomodidad"],
            "respuestas_terapeuticas": {
                "somnolencia": "Practicar sentado, ojos entreabiertos, momento del dia con mas alerta",
                "no_sentir_nada": "Notar el 'no sentir' es tambien una observacion valida. No buscar sensaciones.",
                "dolor": "Observar el dolor con curiosidad: forma, tamano, densidad. Respirar hacia el. No es necesario eliminarlo."
            },
            "progresion_sugerida": ["Semana 1-2: body scan completo con audio (45 min)", "Semana 3-4: body scan sin audio (30 min)", "Semana 5+: body scan breve (15 min) o escaneo rapido como check-in"]
        },
        {
            "id": "meditacion_sentada_formal",
            "nombre": "Meditacion Sentada Formal",
            "duracion_sugerida": "20-40 min",
            "posicion": "Sentado en silla o cojin, espalda recta sin rigidez, manos en regazo",
            "progresion_de_focos": [
                {"etapa": 1, "foco": "Respiracion", "duracion_recomendada": "1-2 semanas", "instruccion": "Atencion a sensaciones de respiracion en nariz, pecho o abdomen"},
                {"etapa": 2, "foco": "Cuerpo y respiracion", "duracion_recomendada": "1-2 semanas", "instruccion": "Ampliar a sensaciones corporales manteniendo respiracion como ancla"},
                {"etapa": 3, "foco": "Sonidos", "duracion_recomendada": "1 semana", "instruccion": "Atencion abierta a sonidos: notar sin etiquetar ni juzgar"},
                {"etapa": 4, "foco": "Pensamientos y emociones", "duracion_recomendada": "2+ semanas", "instruccion": "Observar pensamientos como eventos mentales. Notar emociones como patrones de sensaciones corporales"},
                {"etapa": 5, "foco": "Atencion abierta (choiceless)", "duracion_recomendada": "practica avanzada", "instruccion": "Atencion receptiva sin objeto fijo. Notar lo que surge momento a momento"}
            ]
        },
        {
            "id": "movimiento_consciente",
            "nombre": "Movimiento Consciente (Mindful Movement)",
            "duracion_sugerida": "20-30 min",
            "descripcion": "Movimientos suaves basados en yoga o estiramientos realizados con plena atencion.",
            "instrucciones": [
                "Realizar movimientos lentos y suaves",
                "Atender a las sensaciones en cada movimiento",
                "Respetar los limites del cuerpo sin forzar",
                "Notar la transicion entre un movimiento y otro",
                "Mantener la respiracion natural y consciente"
            ],
            "indicaciones_especiales": "Especialmente util para pacientes que no toleran la quietud de la meditacion sentada. Tambien para dolor cronico donde el movimiento es terapeutico."
        },
        {
            "id": "meditacion_compasion",
            "nombre": "Meditacion de Amor Bondadoso (Loving-Kindness / Metta)",
            "duracion_sugerida": "15-25 min",
            "instrucciones": [
                "Sentarse en posicion comoda",
                "Traer a la mente alguien por quien se siente amor incondicional",
                "Dirigir frases de amabilidad: 'Que puedas estar bien, que puedas ser feliz, que puedas estar libre de sufrimiento'",
                "Gradualmente extender a: uno mismo, personas neutras, personas dificiles, todos los seres",
                "Notar las emociones que surgen sin juzgarlas"
            ],
            "progresion_sugerida": ["Comenzar con ser querido (mas facil)", "Incluirse a uno mismo", "Persona neutra", "Persona dificil (gradualmente)", "Todos los seres"],
            "indicaciones": ["Autocritica", "Resentimiento", "Aislamiento social", "Fatiga por compasion en cuidadores"]
        }
    ]
})

# 9. mindfulness_practicas_informales
write_json("mindfulness", "mindfulness_practicas_informales.json", {
    "area_id": "mindfulness_practicas_informales",
    "nombre": "Practicas Informales de Mindfulness",
    "descripcion": "Practicas de atencion plena integradas en actividades cotidianas, sin necesidad de tiempo o espacio dedicado.",
    "fuentes": [
        "Kabat-Zinn, J. (2013). Full Catastrophe Living. Bantam.",
        "Williams, M. & Penman, D. (2011). Mindfulness: A Practical Guide. Piatkus.",
        "Germer, C. K. (2009). The Mindful Path to Self-Compassion. Guilford."
    ],
    "practicas": [
        {
            "id": "actividades_rutinarias",
            "nombre": "Atencion plena en actividades rutinarias",
            "descripcion": "Llevar atencion consciente a una actividad que normalmente se hace en piloto automatico.",
            "ejemplos": [
                {"actividad": "Lavarse los dientes", "instruccion": "Notar el sabor de la pasta, la textura del cepillo, los movimientos de la mano, el sonido"},
                {"actividad": "Ducharse", "instruccion": "Sentir la temperatura del agua, el contacto con la piel, el aroma del jabon"},
                {"actividad": "Lavar los platos", "instruccion": "Notar la temperatura del agua, la textura de los platos, los movimientos de las manos"},
                {"actividad": "Vestirse", "instruccion": "Notar la textura de la tela, los movimientos al ponerse cada prenda"}
            ],
            "tarea": "Elegir UNA actividad rutinaria y practicar atencion plena en ella durante una semana antes de anadir otra."
        },
        {
            "id": "pausas_conscientes",
            "nombre": "Pausas conscientes durante el dia",
            "descripcion": "Momentos breves de atencion plena intercalados en la jornada.",
            "variantes": [
                {"nombre": "Tres respiraciones conscientes", "cuando": "Al cambiar de actividad, antes de una reunion, al llegar a un lugar", "instruccion": "Detenerse y tomar tres respiraciones con atencion plena"},
                {"nombre": "STOP", "cuando": "Ante estres o automatismo", "instruccion": "S-top (para), T-ake a breath (respira), O-bserve (observa tu experiencia), P-roceed (continua conscientemente)"},
                {"nombre": "Check-in corporal", "cuando": "Cada 2 horas", "instruccion": "Explorar brevemente: como esta mi cuerpo ahora? Tension? Postura?"}
            ]
        },
        {
            "id": "escucha_consciente",
            "nombre": "Escucha consciente",
            "descripcion": "Practicar escucha atenta y presente en conversaciones cotidianas.",
            "instrucciones": [
                "Prestar atencion completa a lo que la otra persona dice",
                "Notar cuando la mente se va a preparar una respuesta",
                "Regresar a escuchar sin juzgar lo que se dice",
                "Notar las emociones propias que surgen al escuchar"
            ],
            "aplicacion_clinica": "Especialmente util para problemas interpersonales y de comunicacion en pareja."
        },
        {
            "id": "comer_consciente_diario",
            "nombre": "Comer consciente en la vida diaria",
            "descripcion": "Aplicar principios de mindfulness a las comidas cotidianas.",
            "instrucciones": [
                "Antes de comer: notar el hambre (escala 0-10)",
                "Primeros bocados: saborear plenamente, sin distracciones",
                "Durante la comida: notar senales de saciedad",
                "Al terminar: notar como se siente el cuerpo"
            ],
            "progresion": ["Comenzar con solo los primeros 5 minutos de una comida", "Expandir gradualmente", "Una comida completa consciente por semana"]
        }
    ],
    "integracion_cotidiana": {
        "principio": "La practica informal no sustituye a la formal, sino que la complementa y extiende.",
        "recomendacion": "Comenzar con una practica informal sencilla y sostenerla una semana antes de anadir otra.",
        "senales_de_progreso": [
            "Notar momentos de piloto automatico con mas frecuencia",
            "Pausar antes de reaccionar automaticamente",
            "Mayor conciencia de sensaciones corporales en la vida diaria",
            "Disfrutar mas de experiencias cotidianas"
        ]
    }
})

# 10. mindfulness_aplicaciones_clinicas
write_json("mindfulness", "mindfulness_aplicaciones_clinicas.json", {
    "area_id": "mindfulness_aplicaciones_clinicas",
    "nombre": "Aplicaciones Clinicas del Mindfulness",
    "descripcion": "Protocolos y programas estructurados que integran mindfulness para poblaciones clinicas especificas.",
    "fuentes": [
        "Segal, Z. V. et al. (2013). MBCT for Depression (2nd ed.). Guilford.",
        "Bowen, S., Chawla, N. & Marlatt, G. A. (2011). Mindfulness-Based Relapse Prevention for Addictive Behaviors. Guilford.",
        "Brantley, J. (2007). Calming Your Anxious Mind (2nd ed.). New Harbinger.",
        "Germer, C. K. & Neff, K. D. (2019). Teaching the Mindful Self-Compassion Program. Guilford."
    ],
    "aplicaciones": [
        {
            "id": "mbct_depresion",
            "nombre": "MBCT para Depresion Recurrente",
            "poblacion_objetivo": "Adultos con 3 o mas episodios depresivos previos, actualmente en remision",
            "evidencia": "Fuerte. Reduce riesgo de recaida hasta un 43% comparado con tratamiento habitual. Recomendado por NICE (UK).",
            "mecanismo": "Descentramiento de pensamientos depresogenicos. Deteccion temprana de senales de recaida. Respuesta habil en lugar de reactividad automatica.",
            "duracion": "8 sesiones semanales de 2 horas + retiro de un dia",
            "componentes_clave": ["Body scan", "Meditacion sentada", "Espacio de respiracion 3 min", "Psicoeducacion sobre depresion", "Plan de accion ante recaida"]
        },
        {
            "id": "mbsr_estres",
            "nombre": "MBSR para Estres y Dolor Cronico",
            "poblacion_objetivo": "Adultos con estres cronico, dolor cronico o enfermedades medicas",
            "evidencia": "Fuerte. El programa original de Kabat-Zinn con decadas de investigacion.",
            "mecanismo": "Cambiar la relacion con el estres y el dolor. Reducir la reactividad. Aumentar la resiliencia.",
            "duracion": "8 sesiones semanales de 2.5 horas + retiro de un dia",
            "componentes_clave": ["Body scan", "Yoga consciente", "Meditacion sentada", "Caminata consciente", "Practica diaria 45 min"]
        },
        {
            "id": "mbrp_adicciones",
            "nombre": "MBRP para Prevencion de Recaidas en Adicciones",
            "poblacion_objetivo": "Personas en recuperacion de trastornos por uso de sustancias",
            "evidencia": "Moderada-Fuerte. Reduce craving y recaidas comparado con tratamiento habitual.",
            "mecanismo": "Surfear impulsos (urge surfing). Descentramiento de pensamientos de consumo. Atencion a senales de riesgo.",
            "duracion": "8 sesiones semanales",
            "componentes_clave": ["Urge surfing", "SOBER breathing space", "Identificacion de disparadores", "Practica de aceptacion"]
        },
        {
            "id": "msc_autocompasion",
            "nombre": "MSC - Mindful Self-Compassion",
            "poblacion_objetivo": "Personas con autocritica severa, verguenza, baja autoestima",
            "evidencia": "Moderada. Estudios muestran aumento significativo en autocompasion, bienestar y resiliencia.",
            "mecanismo": "Desarrollar una voz interna compasiva. Normalizar el sufrimiento como experiencia humana compartida.",
            "duracion": "8 sesiones semanales de 2.5 horas + retiro",
            "componentes_clave": ["Meditacion de amor bondadoso", "Autocompasion en momentos dificiles", "Trabajo con la voz critica interna", "Exploracion de valores"]
        },
        {
            "id": "mindfulness_trastornos_ansiedad",
            "nombre": "Mindfulness para Trastornos de Ansiedad",
            "poblacion_objetivo": "Adultos con TAG, fobia social, trastorno de panico",
            "evidencia": "Moderada. Meta-analisis muestran reducciones significativas en ansiedad.",
            "mecanismo": "Reducir evitacion experiencial. Exposicion interoceptiva (atencion a sensaciones ansiosas). Descentramiento.",
            "duracion": "Variable, tipicamente 8-12 sesiones integrado con TCC",
            "componentes_clave": ["Respiracion consciente", "Surfear la ansiedad", "Exposicion mindful a sensaciones temidas", "Aceptacion radical de la incertidumbre"]
        }
    ],
    "programas_estructurados": [
        {
            "nombre": "MBSR (Mindfulness-Based Stress Reduction)",
            "creador": "Jon Kabat-Zinn, University of Massachusetts (1979)",
            "formato": "8 semanas, grupal, 2.5h/sesion + retiro de un dia",
            "formacion_requerida": "Certificacion oficial por centros autorizados (Center for Mindfulness, UMASS; Bangor University; etc.)"
        },
        {
            "nombre": "MBCT (Mindfulness-Based Cognitive Therapy)",
            "creador": "Segal, Williams & Teasdale (2002)",
            "formato": "8 semanas, grupal, 2h/sesion + retiro de un dia",
            "formacion_requerida": "Formacion en MBCT por centros acreditados. Requiere experiencia previa en TCC y practica personal de mindfulness."
        },
        {
            "nombre": "MSC (Mindful Self-Compassion)",
            "creador": "Kristin Neff & Christopher Germer (2012)",
            "formato": "8 semanas, grupal, 2.5h/sesion + retiro",
            "formacion_requerida": "Formacion oficial MSC (Center for Mindful Self-Compassion)."
        }
    ]
})

print(f"\nTotal Mindfulness files: {len(os.listdir(os.path.join(BASE, 'mindfulness', 'data')))}")

print("\n=== RESUMEN ===")
for tech in ['act', 'dialectico_conductual', 'trec', 'mindfulness']:
    folder = os.path.join(BASE, tech, 'data')
    count = len(os.listdir(folder)) if os.path.exists(folder) else 0
    print(f"  {tech}: {count}/13 archivos")
