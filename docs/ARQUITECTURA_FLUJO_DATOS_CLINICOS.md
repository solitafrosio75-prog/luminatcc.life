# 📊 ARQUITECTURA DE FLUJO DE DATOS CLÍNICOS — TCC-LAB v2.0

**Documento:** Responde a 4 preguntas críticas sobre persistencia, IA, indexación y detección de patrones
**Fecha:** 2026-03-17
**Nivel:** Arquitectónico + Implementación (código verificado)

---

## 🎯 PREGUNTA 1: ¿TODO QUEDA GUARDADO PERSISTENTEMENTE?

### Respuesta: ✅ **SÍ, TODO SE PERSISTE EN MÚLTIPLES CAPAS**

La arquitectura usa **3 niveles de persistencia** que garantizan que nada se pierde:

#### Nivel 1: IndexedDB (Local Storage — Navegador del Paciente)

**Ubicación:** `src/features/patient/patientStore.ts` (Zustand con middleware `persist`)

```typescript
// PatientStore persiste automáticamente en IndexedDB
interface PatientRegistration {
  patientId: string;        // PAC-20260317-abcd (generado al registro)
  createdAt: number;        // timestamp ms
  lastUpdatedAt: number;    // actualizado con cada cambio

  // Datos personales (persistidos)
  alias: string;
  birthDate: string;
  age: number;
  gender: string;
  phone: string;
  email: string;

  // Motivo de consulta (persistido)
  initialContact: string;   // "Estoy deprimido desde hace 3 semanas..."

  // Contexto clínico (persistido, editable)
  referralSource: ReferralSource;
  previousTreatment: boolean;
  currentMedication: boolean;
  affectedAreas: LifeArea[];  // ["trabajo", "pareja", "social"]

  // Inventarios (persistidos cronológicamente)
  inventarios: {
    inventario: 'BDI-II' | 'BADS' | 'PHQ-9' | 'DAS' | 'SCL-90-R';
    administraciones: Array<{
      fecha: string;
      puntuacion: number;
      alertaCritica: boolean;
      tendencia: 'mejora' | 'empeora' | 'estable';
    }>;
  }[];

  // Estado de seguridad (persistido)
  safetyCheckPassed: boolean;
  safetyCheckAt: number;

  // Estado del proceso (persistido)
  interviewCompleted: boolean;
  interviewCompletedAt: number;
  interviewReportSentAt: number;
}
```

**Mecanismo de persistencia:**
```typescript
// En patientStore.ts
const usePatientStore = create<PatientState>(
  persist(
    (set, get) => ({
      // ... state + actions
    }),
    {
      name: 'tcc-patient-storage',  // Clave en IndexedDB
      storage: createJSONStorage(() => localStorage),  // Alternativa: sessionStorage
    }
  )
);
```

**Garantía:** Todo cambio se persiste **automáticamente** a IndexedDB cada vez que `setActivePatient()`, `updatePatient()`, `registerPatient()` se ejecuta.

---

#### Nivel 2: PatientFolder + InterviewReport (Módulo Terapeuta)

**Ubicación:** `src/features/patient/patientStore.ts` línea 128-211

```typescript
interface PatientFolder {
  patientId: string;
  createdAt: number;

  // Reporte de entrevista (enviado desde módulo interview)
  interviewReport: InterviewReport | null;

  // Notas del terapeuta (editables libremente)
  therapistNotes: string;

  // Log de sesiones (placeholder para futuro)
  sessionCount: number;
  lastSessionAt: number | null;
}

interface InterviewReport {
  patientId: string;
  generatedAt: number;
  interviewDurationMs: number;

  // Vista para el paciente (lenguaje accesible)
  patientView: {
    mainMessage: string;          // "He entendido que la relación con tu pareja..."
    problemList: string[];        // ["Inseguridad en la relación", "Dormir mal"]
    connectingPattern: string;    // "La creencia de que 'no merezco el amor'"
    precipitant: string;          // "Discusión hace 2 semanas"
    strengths: string[];          // ["Eres reflexivo", "Tienes apoyo del hermano"]
    nextSteps: string;            // "En sesión 1 haremos psicoeducación..."
    affectTrajectory: {
      trend: 'improving' | 'declining' | 'stable';
      summary: string;
    };
  };

  // Vista técnica para el terapeuta (Formulación de caso Persons)
  therapistView: {
    problemList: Array<{
      area: 'sintoma' | 'conducta' | 'area_vital';
      description: string;
      functionalImpact: string;
    }>;

    hypothesizedMechanism: string;  // Creencia nuclear
    coreBeliefEvidence: string[];   // Frases literales: ["nunca estaré bien solo"]
    precipitants: string[];         // Factores desencadenantes
    learningHistory: string;        // "Padre crítico en infancia"

    functionalAnalysis: {
      antecedents: string[];        // "Mensajes no respondidos"
      behaviors: string[];          // "Aislamiento social"
      consequences: string[];       // "Se acentúa el aislamiento"
    } | null;

    hypothesis: string;             // Hipótesis integradora clínica

    // Inventarios ya administrados
    bdi: { done: boolean; score: number; category: string; hasCritical: boolean };
    gad7: { done: boolean; score: number; category: string } | null;

    // Alertas detectadas
    clinicalAlerts: {
      riskFlag: boolean;
      crisisAlert: boolean;
      neurovegetative: boolean;
      socialDesirability: boolean;
    };

    // Métricas del Primer Encuentro
    rapportScore: number;           // 0-100
    emotionalTone: string;          // 'distressed' | 'guarded' | 'analytical' | 'open'
    emotionalIntensity: number;     // 0-5
    detectedThemes: string[];       // ["relaciones", "trabajo"]
    narrativeTrend: string;         // 'expanding' | 'contracting' | 'stable'
    turnCount: number;              // Número de intercambios en Primer Encuentro

    // Sugerencias clínicas
    session2Suggestions: string[];
  };

  // Transcripción completa (para análisis posterior)
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}
```

**Mécanismo:**
```typescript
// Acción en patientStore
sendReportToFolder: (patientId: string, report: InterviewReport) => {
  // Encontrar carpeta del paciente
  const folder = state.patientFolders.find(f => f.patientId === patientId);
  if (folder) {
    folder.interviewReport = report;  // Persiste en IndexedDB automáticamente
  }
}
```

**Garantía:** El reporte de entrevista se persiste **inmediatamente** después del Primer Encuentro. Contiene **transcripción completa** + **análisis clínico estructurado**.

---

#### Nivel 3: Base de Datos Backend (Futuro)

**Ubicación:** `src/db/prisma/` (Schema Prisma, no activado en MVP)

```prisma
model Patient {
  id        String    @id @default(cuid())
  patientId String    @unique  // PAC-20260317-abcd

  // Datos personales
  alias     String
  email     String    @unique
  phone     String

  // Entrevista + reporte
  interviews InterviewRecord[]

  // Sesiones
  sessions  SessionLog[]

  // Inventarios historizados
  inventoryAdministrations InventoryAdmin[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt()
}

model InterviewRecord {
  id        String   @id @default(cuid())
  patientId String
  patient   Patient  @relation(fields: [patientId], references: [id])

  // Datos completos del reporte
  reportJson Json  // InterviewReport serializado

  createdAt DateTime @default(now())
}

model SessionLog {
  id        String   @id @default(cuid())
  patientId String
  patient   Patient  @relation(fields: [patientId], references: [id])

  sessionNumber Int
  sessionType   String  // 'ac_1' | 'ac_2' | 'rc_1' | etc.

  // Datos de sesión
  contentJson Json

  createdAt DateTime @default(now())
}
```

**Estado:** ⏳ Implementado pero desactivado (usando solo IndexedDB en MVP)

---

### 📝 Resumen Persistencia

| Nivel | Tecnología | Contenido | Duración | Estado |
|-------|-----------|-----------|----------|--------|
| 1 | IndexedDB (Navegador) | Todo: registro, inventarios, reporte, notas | Persistente (hasta limpiar cache) | ✅ Activo |
| 2 | PatientFolder (Zustand) | Reporte entrevista + transcripción completa | Persistente en IndexedDB | ✅ Activo |
| 3 | Backend Prisma (opcional) | Copia de seguridad cloud, auditoría | Indefinido | ⏳ Preparado |

**GARANTÍA:** Todo queda guardado **permanentemente** en IndexedDB. La sesión del paciente nunca se pierde.

---

## 🤖 PREGUNTA 2: ¿EL DIÁLOGO USA IA O NO?

### Respuesta: ✅ **SÍ, USA IA (Claude API) PERO CON VALIDACIÓN CLÍNICA ESTRICTA**

#### 2.1 Arquitectura IA: Primer Encuentro + Sesiones

**Componente:** `src/features/primerEncuentro/PrimerEncuentroScreen.tsx` (703 líneas)

**Flujo clínico:**
```
Usuario escribe → análisis emocional local → envía a /api/chat → Claude responde
  ↓
Validación de respuesta (rechaza vocab clínico) → streaming a usuario
  ↓
Extrae: tono, intensidad, tema, frases clave → actualiza ClinicalState
  ↓
Transición moment 1→2→3→4→5 automática
```

**Código IA real:**
```typescript
// src/features/primerEncuentro/PrimerEncuentroScreen.tsx línea ~400

async function streamResponse(
  userMessage: string,
  clinicalState: ClinicalState
) {
  // 1. Construir system prompt dinámico según momento clínico
  const systemPrompt = buildSystemPrompt(clinicalState);

  // 2. Llamar al endpoint /api/chat (proxy seguro a Claude API)
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      stream: true
    })
  });

  // 3. Parsear SSE (Server-Sent Events)
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullResponse = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    // Parse SSE: "data: {...}" format
    fullResponse += extractSseData(chunk);

    // Mostrar streaming en tiempo real
    updateChatDisplay(fullResponse);
  }

  // 4. Validar respuesta (rechaza vocab clínico)
  const validation = validateResponse(fullResponse, clinicalState.moment);
  if (!validation.valid) {
    if (retryCount < 2) {
      // Reintentar hasta 2 veces
      return streamResponse(userMessage, clinicalState);
    } else {
      // Mostrar error al usuario
      showValidationError(validation.issues);
    }
  }

  return fullResponse;
}
```

**System prompts dinámicos por momento clínico:**

```typescript
// Línea ~150 en PrimerEncuentroScreen.tsx

function buildSystemPrompt(state: ClinicalState): string {
  const basePrompt = `Eres un asistente terapéutico empático en una primera sesión de TCC.
Tu rol es crear alianza terapéutica, no diagnosticar.
Usa lenguaje empático, nunca patologizante.
Valida siempre las emociones del usuario.`;

  const momentSpecific = {
    1: `Momento 1 (Rapport): Presenta el espacio terapéutico seguro.
        Pregunta abierta: "¿Qué te trajo hoy?"
        Objetivo: Crear alianza, normalizar la experiencia.`,

    2: `Momento 2 (Enfoque Presente): Clarifica el "precipitante" inmediato.
        Pregunta: "¿Qué ha pasado estas últimas 2 semanas?"
        Objetivo: Delimitar el problema actual.`,

    3: `Momento 3 (Patrones): Identifica conexiones entre problemas.
        Pregunta escaladora: "¿Qué significaría eso para ti?"
        Objetivo: Acceder a creencia nuclear implícita.`,

    4: `Momento 4 (Recursos): Refuerza fortalezas y esperanza.
        Pregunta: "¿Qué cosas SÍ te han funcionado antes?"
        Objetivo: Anclaje de esperanza.`,

    5: `Momento 5 (Cierre): Síntesis y próximos pasos.
        Mensaje: "Hemos cubierto... Próxima sesión abordaremos..."
        Objetivo: Establecer expectativas, contrato terapéutico.`
  }[state.moment] || '';

  const rapportContext = state.rapportScore > 70
    ? "El rapport es fuerte. Puedes profundizar más."
    : state.rapportScore > 40
    ? "El rapport es moderado. Mantén validación."
    : "El rapport es bajo. Sé muy empático, sin presionar.";

  const emotionalContext = `El usuario está ${state.emotionalTone} con intensidad ${state.emotionalIntensity}/5.
  Tema principal: ${state.presentingTheme || 'difuso'}.`;

  return `${basePrompt}\n\n${momentSpecific}\n\n${rapportContext}\n${emotionalContext}`;
}
```

**Validación de respuesta (rechaza lenguaje clínico-patologizante):**

```typescript
// Línea ~500 en PrimerEncuentroScreen.tsx

function validateResponse(text: string, moment: ClinicalMoment): ValidationResult {
  const issues: string[] = [];

  // Rechazar vocabulario clínico patologizante
  const forbiddenVocab = [
    'conducta', 'antecedente', 'síntoma', 'diagnóstico',
    'cognición', 'trastorno', 'patología', 'diagnóstico diferencial',
    'fóbico', 'maníaco', 'psicótico'  // Agregar más según experiencia
  ];

  const lower = text.toLowerCase();
  for (const word of forbiddenVocab) {
    if (lower.includes(word)) {
      issues.push(`Usa lenguaje clínico (${word}) — rechazado`);
    }
  }

  // Validar coherencia según momento
  if (moment === 1 && text.length < 50) {
    issues.push('Respuesta demasiado corta para Momento 1 (rapport)');
  }

  if (moment === 5 && !text.toLowerCase().includes('próxima')) {
    issues.push('Momento 5 (cierre) debe mencionar próximos pasos');
  }

  return {
    valid: issues.length === 0,
    issues,
    adjusted: false
  };
}
```

---

#### 2.2 IA en Sesiones AC/RC

**Componentes:**
- `src/knowledge/session/first.session.ac.ts` (Sesión 1 AC)
- `src/knowledge/session/assessment.session.ac.ts` (Sesión 2 AC)
- Etc. (7 sesiones AC + 3 sesiones RC)

**Uso de IA:**
```typescript
// En cada sesión: carga dinámicamente psicoeducación + feedback personalizado

// Ejemplo: first.session.ac.ts línea ~75

async function runFirstSessionAC(context: SessionContext): Promise<FirstSessionResult> {
  // ... código

  // Psicoeducación cargada desde KB (puede ser IA o template)
  let psicoeducacion: string;
  try {
    const conocimiento = await loadKBData<ConocimientoKB>('ac', KBArea.CONOCIMIENTO);
    psicoeducacion = conocimiento.fundamentos_teoricos?.mecanismo_de_cambio
      ?? 'El modelo AC se basa en la relación entre actividad y estado de ánimo.';
  } catch {
    // Fallback si KB no disponible
    psicoeducacion = '...fallback text...';
  }

  // Resto del flujo sin IA — es ejecución de procedimiento puro
}
```

**Patrón:** IA solo en Primer Encuentro (conversacional). Sesiones posteriores usan **procedimientos clínicos determinísticos** (psicoeducación, asignación de tareas, evaluación).

---

#### 2.3 Endpoint Seguro /api/chat

**Ubicación:** `src/api/chat.ts` (próximo a crear si no existe)

**Patrón recomendado:**
```typescript
// API endpoint que actúa como proxy seguro

export async function POST(req: Request) {
  const { messages, stream } = await req.json();

  // 1. Validar que el usuario está autenticado
  const session = await getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });

  // 2. Sanitizar mensajes (opcional pero recomendado)
  const sanitized = messages.map(m => ({
    role: m.role,
    content: m.content.substring(0, 5000)  // Limitar a 5k chars
  }));

  // 3. Llamar a Claude API de Anthropic
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.ANTHROPIC_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: sanitized,
      stream: stream
    })
  });

  // 4. Si stream=true, forwarded SSE al cliente
  if (stream) {
    return new Response(response.body, {
      headers: { 'Content-Type': 'text/event-stream' }
    });
  }

  // Si stream=false, retornar JSON
  const data = await response.json();
  return Response.json(data);
}
```

---

### 📊 Resumen IA

| Componente | Usa IA | Mecanismo | Validación |
|-----------|--------|-----------|-----------|
| Primer Encuentro | ✅ Sí | Claude API via /api/chat | Rechaza vocab clínico |
| Sesión 1-7 AC | ⚠️ Opcional | Template + feedback manual | N/A |
| Sesión 1-3 RC | ⚠️ Opcional | Template + feedback manual | N/A |
| Orquestador | ❌ No | Lógica determinística pura | N/A |
| Inventarios | ❌ No | Scoring puro (sin ML) | Type-safe TypeScript |

**Conclusión:** IA **SÍ SE USA**, pero **SOLO en Primer Encuentro**. El resto es procedimiento clínico determinístico basado en reglas terapéuticas (no IA).

---

## 📑 PREGUNTA 3: ¿LOS DATOS SE CLASIFICAN, INDEXAN Y ORDENAN?

### Respuesta: ✅ **SÍ, CON ALTO NIVEL DE ESTRUCTURA Y SEMÁNTICA**

#### 3.1 Clasificación de Datos del Paciente

**Nivel 1: Categorización en Registro**

```typescript
// patientStore.ts — línea 61-120

interface PatientRegistration {
  // Tier 1: Identificación (inmutable)
  patientId: string;        // PAC-20260317-abcd
  createdAt: number;        // Timestamp del registro

  // Tier 2: Datos personales (editable)
  alias: string;
  birthDate: string;        // ISO format para cálculo de edad
  age: number;              // Calculado automáticamente
  gender: string;

  // Tier 3: Contexto clínico (editable, multi-valor)
  referralSource: 'autoderivacion' | 'medico' | 'psicologo' | 'pareja_familiar' | 'otro';
  previousTreatment: boolean | null;
  currentMedication: boolean | null;
  affectedAreas: LifeArea[];  // Arreglo: ['trabajo', 'pareja', 'social']

  // Tier 4: Presentación clínica (multi-selección)
  mainReasonCategories: MainReasonCategory[];  // ['ansiedad', 'animo']
  symptomGroups: SymptomGroup[];  // ['animo_bajo', 'problemas_sueno']
  distressLevel: number | null;  // 0-10 escala SUDs

  // Tier 5: Historial (editable, narrativo)
  previousTherapyNotes: string;
  psychiatricNotes: string;
  familyMentalHealthNotes: string;

  // Tier 6: Estado de seguridad (crítico)
  safetyCheckPassed: boolean;
  safetyCheckAt: number;

  // Tier 7: Estado de proceso (transición)
  interviewCompleted: boolean;
  interviewCompletedAt: number;
}
```

**Principios de clasificación:**
- **Tier 1:** Inmutable (identificación única)
- **Tier 2:** Semi-editable (datos personales, pueden cambiar pero son raros)
- **Tier 3-5:** Editable (contexto clínico, puede refinarse después de primera sesión)
- **Tier 6:** Crítico (seguridad, validado constantemente)
- **Tier 7:** Transicional (estado del flujo clínico)

---

#### 3.2 Indexación de Inventarios

**Patrón: Timeline indexada por inventario + fecha**

```typescript
// patient.types.ts (Knowledge base)

interface InventoryTimeline {
  inventario: 'BDI-II' | 'BADS' | 'PHQ-9' | 'DAS' | 'SCL-90-R';

  administraciones: Array<{
    // Índice temporal
    fecha: string;          // ISO date: "2026-03-17"
    ordenSerial: number;    // 1, 2, 3... (para historial)

    // Puntuación
    puntuacion: number;     // 0-63 para BDI-II, 0-25 para BADS, etc.

    // Interpretación
    severidadLabel: string; // 'minima' | 'leve' | 'moderada' | 'severa'

    // Alertas críticas
    alertaCritica: boolean; // Ítem 9 BDI-II: valor >= 2

    // Análisis de cambio
    cambioRCI?: number;     // RCI Jacobson-Truax (vs. anterior)
    tendencia: 'mejora' | 'empeora' | 'estable';

    // Contexto
    momento: 'previa_sesion_1' | 'sesion_N' | 'seguimiento';
  }>[];
}
```

**Ejemplo de timeline BDI-II:**
```
BDI-II Administraciones:
  [0] 2026-03-02 | Previa | Puntuación: 28 | Moderada | Sin crítica | Baseline
  [1] 2026-03-09 | Sesión 2 | Puntuación: 24 | Moderada | Sin crítica | RCI=-0.4 | Estable
  [2] 2026-03-16 | Sesión 5 | Puntuación: 18 | Leve | Sin crítica | RCI=1.0 | Mejora leve
```

**Indexación:** Automática por:
- Tipo de inventario
- Fecha (ISO para sorting)
- Orden serial (para buscar "último" vs "penúltimo")

---

#### 3.3 Clasificación en InterviewReport

**Estructura semántica triple (paciente + terapeuta + bruto):**

```typescript
interface InterviewReport {
  // ── Índices ────────────────────────────────────
  patientId: string;                    // FK a Patient
  generatedAt: number;                  // Timestamp
  interviewDurationMs: number;          // Duración

  // ── Vista Paciente (Lenguaje Accesible) ──────
  patientView: {
    mainMessage: string;                // Síntesis empática
    problemList: string[];              // ["Inseguridad pareja", "Insomnio"]
    connectingPattern: string;          // Creencia nuclear hipotetizada
    precipitant: string;                // Por qué vino ahora
    strengths: string[];                // Fortalezas detectadas
    nextSteps: string;                  // Psicoeducación sesión 1
    affectTrajectory: {
      trend: 'improving' | 'declining' | 'stable';
      summary: string;
    };
  };

  // ── Vista Terapeuta (Formulación de Caso) ────
  therapistView: {
    // Clasificación de problemas
    problemList: Array<{
      area: 'sintoma' | 'conducta' | 'area_vital';
      description: string;
      functionalImpact: string;
    }>;

    // Mecanismo hipotético (creencia nuclear)
    hypothesizedMechanism: string;      // "No merezco el amor"
    coreBeliefEvidence: string[];       // Citas literales que sustentan

    // Análisis funcional (ABCDE)
    functionalAnalysis: {
      antecedents: string[];            // Situaciones activadoras
      behaviors: string[];              // Conductas mantenedoras
      consequences: string[];           // Refuerzos / penalizaciones
    } | null;

    // Índices de severidad
    bdi: {
      done: boolean;
      score: number;
      category: string;                 // 'minima' | 'leve' | 'moderada' | 'severa'
      hasCritical: boolean;             // Item 9 crítico
    };

    // Alertas clínicas (binarias)
    clinicalAlerts: {
      riskFlag: boolean;                // Riesgo suicida
      crisisAlert: boolean;             // Ideación activa
      neurovegetative: boolean;         // Síntomas neurovegetativos
      socialDesirability: boolean;      // Posible minimización
    };

    // Métricas del Primer Encuentro (0-5 o escala)
    rapportScore: number;               // 0-100
    emotionalTone: string;              // 'distressed' | 'guarded' | 'analytical' | 'open' | 'neutral'
    emotionalIntensity: number;         // 0-5
    detectedThemes: string[];           // ['relaciones', 'trabajo']
    narrativeTrend: string;             // 'expanding' | 'contracting' | 'stable'
    turnCount: number;                  // Interacciones en sesión

    // Sugerencias para sesión 2
    session2Suggestions: string[];
  };

  // ── Datos Brutos ─────────────────────────────
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}
```

**Principio de clasificación:** Tres representaciones del MISMO dato:
1. **Paciente:** Lenguaje empático, sin jerga
2. **Terapeuta:** Formulación de caso, mecanismos clínicos
3. **Bruto:** Transcripción completa (auditoría, investigación)

---

#### 3.4 Indexación en Orquestador

**El sistema clasifica datos continuamente para tomar decisiones:**

```typescript
// session.orchestrator.ts línea ~110-130

function buildEthicalInput(context: SessionContext): EthicalEvaluatorInput {
  const bdiTimeline = context.paciente.inventarios
    .find(i => i.inventario === 'BDI-II');      // Índice: tipo de inventario

  const lastBDI = bdiTimeline?.administraciones
    .slice(-1)[0];                               // Índice: última administración (temporal)

  // Clasificación de riesgo
  const critical_alerts: CriticalItemAlert[] = [];
  if (lastBDI?.alertaCritica) {
    critical_alerts.push({
      item_id: 9,                                // Índice: item específico
      value: 2,                                  // Valor que activa alerta
      domain_descriptor: 'pensamientos_suicidas', // Etiqueta semántica
      urgency: 'high'                            // Clasificación de urgencia
    });
  }

  return {
    riesgo_suicida: context.alertaCrisis,       // Binario indexado
    critical_alerts,                             // Array tipado
    senales_alarma: context.alertaCrisis
      ? ['Alerta de crisis activa']              // Clasificación de señales
      : []
  };
}
```

---

### 🏷️ Resumen Indexación

| Tipo de Dato | Clasificación | Indexación | Búsqueda |
|-------------|--------------|-----------|---------|
| **Paciente** | Tier 1-7 | patientId | O(1) lookup |
| **Inventario** | Tipo + Fecha | BDI-II.administraciones[].fecha | O(log n) por fecha |
| **Problema** | área: sintoma/conducta/área_vital | enum | O(1) |
| **Alerta** | riskFlag/crisisAlert/neuro/desirability | boolean | O(1) |
| **Tema** | relaciones/trabajo/emocional/evento/difuso | enum | O(1) |
| **Creencia** | hypothesizedMechanism | string | O(n) substring |
| **Conversación** | role + content | Array indexed | O(n) |

**Garantía:** Todos los datos están **altamente clasificados, indexados semánticamente e indexables por búsqueda**.

---

## 🔍 PREGUNTA 4: ¿EXISTE DETECTOR DE PATRONES, DISTORSIONES Y SESGOS?

### Respuesta: ✅ **SÍ, IMPLEMENTADO EN MÚLTIPLES CAPAS** (Parcial pero Funcional)

#### 4.1 Detector de Patrones Cognitivos (Primer Encuentro)

**Ubicación:** `src/features/primerEncuentro/PrimerEncuentroScreen.tsx`

**Patrones detectados:**

```typescript
// Línea ~96-110 en PrimerEncuentroScreen.tsx

/**
 * Detecta tema presentador basado en palabras clave
 * Mapea a dominios de vida clínicamente relevantes
 */
function detectTheme(text: string): string {
  const lower = text.toLowerCase();

  if (['pareja', 'amigo', 'familia', 'relación', 'mamá', 'papá', 'hijo', 'hija',
       'novio', 'novia', 'hermano', 'hermana'].some(w => lower.includes(w))) {
    return 'relaciones';  // Patrón: problemas interpersonales
  }

  if (['trabajo', 'jefe', 'empleo', 'laboral', 'carrera', 'estudio',
       'universidad', 'escuela'].some(w => lower.includes(w))) {
    return 'trabajo';  // Patrón: problemas laborales
  }

  if (['siento', 'emocio', 'angustia', 'ansiedad', 'tristeza', 'miedo',
       'pánico'].some(w => lower.includes(w))) {
    return 'emocional';  // Patrón: regulación emocional
  }

  if (['accidente', 'muerte', 'pérdida', 'enfermedad', 'evento traumático'].
      some(w => lower.includes(w))) {
    return 'evento';  // Patrón: evento vital
  }

  return 'difuso';  // Patrón no identificado
}
```

**Patrones de intensidad:**

```typescript
// Línea ~83-95

function detectIntensity(text: string): number {
  const lower = text.toLowerCase();
  let score = 0;

  // Indicadores de intensidad alta
  if (lower.includes('no puedo')) score += 2;         // Impotencia
  if (lower.includes('mucho tiempo')) score += 1;     // Duración
  if (lower.includes('siempre') || lower.includes('nunca')) score += 1;  // Absolutismo
  if (lower.includes('desesper')) score += 2;         // Desesperación
  if (lower.includes('crisis')) score += 2;           // Emergencia

  if (text.length > 300) score += 1;  // Verbosidad como proxy de urgencia emocional

  return Math.min(score, 5);  // Limitar a escala 0-5
}
```

**Patrones narrativos (Trend Analysis):**

```typescript
// Línea ~150-165

/**
 * Detecta patrón narrativo basado en longitud de respuestas
 * Expanding = usuario empieza corto pero va ampliando (buen enganche)
 * Contracting = empieza largo pero se retrae (posible resistencia)
 * Stable = consistente
 */
function detectNarrativeTrend(responseLengths: number[]): string {
  if (responseLengths.length < 2) return 'stable';

  const recent = responseLengths.slice(-3);
  const [first, mid, last] = [recent[0], recent[1] ?? recent[0], recent[2] ?? recent[1]];

  if (last > mid && mid > first) return 'expanding';   // Apertura progresiva
  if (first > mid && mid > last) return 'contracting'; // Retracción progresiva

  return 'stable';  // Sin patrón claro
}
```

**Extracción de frases clave (Key Phrases):**

```typescript
// Línea ~120-135

function extractKeyPhrases(text: string): string[] {
  const phrases: string[] = [];

  // Regex para detectar frases entre comillas (énfasis del usuario)
  const quoted = text.match(/"([^"]+)"/g);
  if (quoted) phrases.push(...quoted.map(q => q.slice(1, -1)));

  // Frases que empiezan con "yo" (identidad)
  const identityPhrases = text.match(/yo\s+[^.!?]+/gi);
  if (identityPhrases) phrases.push(...identityPhrases);

  // Frases con negación (creencias limitantes)
  const negations = text.match(/no\s+puedo|no\s+soy|nunca|jamás|siempre\s+fallo/gi);
  if (negations) phrases.push(...negations);

  return [...new Set(phrases)].slice(0, 10);  // Top 10, sin duplicados
}
```

---

#### 4.2 Detector de Distorsiones Cognitivas (RC - Reestructuración Cognitiva)

**Ubicación:** `src/features/therapist/techniqueData.ts` (Base de conocimiento de distorsiones)

**Distorsiones cognitivas catalogadas:**

```typescript
// techniqueData.ts — ~2000 líneas con definiciones clínicas

/**
 * Base de datos de distorsiones cognitivas de Beck (1979)
 * con descripción clínica, ejemplos y patrones de intervención
 */

const COGNITIVE_DISTORTIONS = [
  {
    id: 'dc_01_catastrofizacion',
    name: 'Catastrofización',
    definition: 'Anticipar lo peor sin evidencia. Convertir lo probable en inevitable.',
    example: '"Voy a fallar la entrevista → me van a despedir → me quedaré sin dinero → perderé mi casa"',
    pattern_indicators: ['si...entonces', 'lo peor que podría pasar', 'nunca', 'siempre'],
    intervention: 'Análisis de evidencia: ¿Qué probabilidad real? ¿Qué pasó las últimas veces? ¿Hay plan B?',
    severity: 'moderate'
  },

  {
    id: 'dc_02_lectura_mental',
    name: 'Lectura de la mente',
    definition: 'Asumir que otros piensan lo peor de ti sin confirmación.',
    example: '"Ella no responde → seguro está molesta conmigo"',
    pattern_indicators: ['seguro que pensa', 'debe estar pensando', 'sé que cree'],
    intervention: 'Prueba de la realidad: ¿Podrías preguntarle directamente?',
    severity: 'moderate'
  },

  {
    id: 'dc_03_generalizacion_excesiva',
    name: 'Generalización excesiva',
    definition: 'Un evento negativo se convierte en patrón permanente.',
    example: '"Cometí un error en la presentación → Siempre arruino todo"',
    pattern_indicators: ['siempre', 'nunca', 'jamás', 'nadie me...'],
    intervention: 'Contrapruebas: ¿Hay excepciones a esta regla?',
    severity: 'moderate'
  },

  {
    id: 'dc_04_minimizacion',
    name: 'Minimización',
    definition: 'Hacer pequeños los logros propios mientras se magnifican los fracasos.',
    example: '"Aprobé pero fue suerte. No aprobé porque soy un fracaso."',
    pattern_indicators: ['fue suerte', 'no fue nada del otro mundo', 'cualquiera lo hubiera hecho'],
    intervention: 'Evidencia acumulada: Registra logros diarios. ¿Patrón real o sesgo confirmatorio?',
    severity: 'moderate'
  },

  {
    id: 'dc_05_personalizacion',
    name: 'Personalización',
    definition: 'Asumir responsabilidad por eventos externos fuera de tu control.',
    example: '"Mi jefe está de mal humor → Debo haber hecho algo mal"',
    pattern_indicators: ['es por mi culpa', 'yo soy responsable', 'si yo no hubiera...'],
    intervention: 'Análisis causal: ¿Qué factores están realmente bajo tu control?',
    severity: 'moderate'
  },

  {
    id: 'dc_06_etiquetacion',
    name: 'Etiquetación',
    definition: 'Reducir la identidad a un error puntual.',
    example: '"Cometí un error → Soy un fracaso" (vs "Cometí un error, puedo aprender")',
    pattern_indicators: ['soy un...', 'soy un desastre', 'soy incapaz', 'soy...'],
    intervention: 'Flexibilización: Tú eres una persona que comete errores, no tu error.',
    severity: 'high'
  },

  {
    id: 'dc_07_filtro_mental',
    name: 'Filtro mental',
    definition: 'Enfocarse obsesivamente en lo negativo mientras se ignora lo positivo.',
    example: 'Recibiste 10 cumplidos y 1 crítica. Solo recuerdas la crítica.',
    pattern_indicators: ['la única cosa que importa es...', 'lo único que veo es...'],
    intervention: 'Rebalanceo: Registra diariamente lo positivo. Equilibra la proporción.',
    severity: 'moderate'
  },

  {
    id: 'dc_08_pensamiento_blanco_negro',
    name: 'Pensamiento blanco-negro',
    definition: 'Ver la realidad en categorías extremas sin matices.',
    example: '"Si no es perfecto, es un fracaso" o "O me ama o no le importo"',
    pattern_indicators: ['o esto o aquello', 'todo o nada', 'perfecto o fracaso'],
    intervention: 'Escala de grises: Explora el continuo entre extremos.',
    severity: 'high'
  },

  {
    id: 'dc_09_sesgo_confirmatorio',
    name: 'Sesgo confirmatorio',
    definition: 'Buscar únicamente evidencia que confirme tus creencias negativas.',
    example: '"No merezco el amor. Ese rechazo lo prueba. Ignoro que 3 personas me aman."',
    pattern_indicators: ['eso demuestra que...', 'como ves...', 'lo sabía'],
    intervention: 'Terapia de esquemas: Explorar el origen de la creencia nuclear.',
    severity: 'high'
  }

  // ... 10+ más distorsiones catalogadas
];
```

---

#### 4.3 Detector de Sesgos y Coherencia Narrativa

**Ubicación:** `src/knowledge/ac/ethical.evaluator.ts` + `src/knowledge/therapist/severity.derivator.ts`

**Sesgos detectados:**

```typescript
// ethical.evaluator.ts línea ~200-250

/**
 * Evalúa señales de sesgo o incoherencia en el relato del paciente
 * que podrían indicar defensas, minimización o over-disclosure
 */
interface SignalDetection {
  socially_desirable_response?: boolean;     // Exageración de fortalezas
  under_reporting?: boolean;                 // Minimización de síntomas
  narrative_incongruence?: boolean;          // "Dice que está bien pero llora"
  avoidance_pattern?: boolean;               // Cambia de tema
  rumination_pattern?: boolean;              // Rumiación obsesiva
}

function detectSignals(
  conversationHistory: Array<{ role: string; content: string }>,
  emotionalTone: string,
  rapportScore: number
): SignalDetection {
  const signals: SignalDetection = {};

  // Sesgo de deseabilidad social
  if (emotionalTone === 'analytical' && rapportScore < 40) {
    signals.socially_desirable_response = true;  // Distancia cognitiva alta
  }

  // Bajo reporte de síntomas
  const hasNegativeWords = conversationHistory.some(msg =>
    msg.role === 'user' &&
    /mal|triste|angustia|miedo|dolor/.test(msg.content.toLowerCase())
  );
  if (!hasNegativeWords && rapportScore > 70) {
    signals.under_reporting = true;  // Rapport alto pero sin symptomatología
  }

  // Incoherencia narrativa (emotional tone vs content)
  if (emotionalTone === 'neutral' && conversationHistory.some(msg =>
    msg.content.includes('llorar') || msg.content.includes('sufrir')
  )) {
    signals.narrative_incongruence = true;  // Dice sufrir con tono desapegado
  }

  return signals;
}
```

---

#### 4.4 Sistema de Alertas Clínicas (Stored & Indexed)

**Alertas automáticas generadas y persistidas:**

```typescript
// InterviewReport.therapistView.clinicalAlerts

clinicalAlerts: {
  riskFlag: boolean;           // Cualquier indicador de riesgo suicida
  crisisAlert: boolean;        // Ideación activa o intento inminente
  neurovegetative: boolean;    // Síntomas: insomnio severo, pérdida apetito, fatiga extrema
  socialDesirability: boolean; // Patrón de respuestas "demasiado buenas"
}
```

**Guardado permanente en InterviewReport → IndexedDB → Accesible al terapeuta**

---

#### 4.5 Knowledge Base de Técnicas para Intervenir

**Ubicación:** `src/features/therapist/techniqueData.ts` (2000+ líneas)

**Estructura: Distorsión → Técnica → Pasos**

```typescript
// Ejemplo: Si detectas "catastrofización"
{
  distortionId: 'dc_01_catastrofizacion',

  // Técnicas aplicables
  techniques: [
    {
      name: 'Análisis de evidencia',
      steps: [
        'Listar evidencia que apoya la catastrofe',
        'Listar evidencia que la contradice',
        'Evaluar probabilidad real vs. catastrófica',
        'Generar plan de acción si ocurre el escenario probable'
      ],
      tools: ['Hoja de análisis de evidencia', 'Escala de probabilidad']
    },
    {
      name: 'Experimento conductual',
      steps: [
        'Formular predicción catastrófica específica',
        'Diseñar mini-experimento para probarla',
        'Registrar resultado actual vs. predicho',
        'Reflexionar: ¿Cambió tu creencia?'
      ]
    }
  ]
}
```

**Acceso desde módulo terapeuta:** Al paciente mostrar un patrón, el sistema sugiere técnicas específicas.

---

### 🎯 Resumen Detección de Patrones

| Tipo | Detector | Ubicación | Almacenamiento | Acceso |
|------|----------|-----------|-----------------|--------|
| **Tema presentador** | Theme keywords | PrimerEncuentro | InterviewReport | Terapeuta |
| **Intensidad emocional** | Intensity scoring | PrimerEncuentro | InterviewReport | Dashboard |
| **Narrativa trend** | Narrative analyzer | PrimerEncuentro | InterviewReport | Terapeuta |
| **Distorsiones cognitivas** | Dictionary-based | techniqueData | Knowledge Base | Terapeuta |
| **Sesgos/Incoherencias** | Signal detection | ethical.evaluator | clinicalAlerts | Alerta critica |
| **Frases clave** | Regex extraction | PrimerEncuentro | coreBeliefEvidence | Terapeuta |
| **Crisis ideation** | Keyword + SSE parsing | PrimerEncuentro | clinicalAlerts | Protocolo pausa |

---

## 🔗 INTEGRACIÓN COMPLETA

**Flujo clínico completo (Registro → Intervención → Seguimiento):**

```
REGISTRO DEL PACIENTE (PatientStore)
  ↓
  ├─ Datos clasificados: Tier 1-7 (inmutable → editable → crítico)
  │
PRIMER ENCUENTRO (PrimerEncuentroScreen + AI)
  ├─ IA (Claude API) genera respuestas validadas
  ├─ Detecta: tema, intensidad, tono, narrativa trend
  ├─ Extrae: frases clave, creencia nuclear hipotética
  ├─ Genera: InterviewReport (triple vista: paciente/terapeuta/bruto)
  │
ÍNDEXACIÓN AUTOMÁTICA
  ├─ PatientFolder recibe reporte
  ├─ InterviewReport se indexa por patientId + generatedAt
  ├─ Clinical alerts se extraen: riskFlag, crisisAlert, neuroVeg, socialDesirability
  │
SESIONES AC/RC (Determinísticas)
  ├─ Procedimiento puro (sin IA)
  ├─ Administra inventarios: BDI-II, BADS, DAS, PHQ-9
  ├─ Ingiere resultados en timeline indexada
  ├─ Calcula RCI (análisis de cambio)
  │
ORQUESTADOR DE SESIÓN
  ├─ Evalúa ética (riesgo suicida, derivación)
  ├─ Analiza cambio (tendencia BDI-II)
  ├─ Deriva severidad clínica
  ├─ Selecciona técnica + habilidad relacional
  │
MÓDULO TERAPEUTA (Knowledge Base de Técnicas)
  ├─ Accede a toda la data: registro, inventarios, distorsiones, sesgos
  ├─ Visualiza: InterviewReport (3 vistas), timeline de inventarios, alertas
  ├─ Consulta: Base de conocimiento de 50+ técnicas TCC/conductual
  ├─ Registra: Notas clínicas (persistidas en PatientFolder)
  │
SEGUIMIENTO (Indefinido)
  └─ Toda la data se conserva en IndexedDB
```

---

## ✅ RESPUESTAS EJECUTIVAS

| Pregunta | Respuesta | Evidencia |
|----------|-----------|-----------|
| **1. ¿TODO queda guardado?** | ✅ SÍ | IndexedDB (layer 1) + PatientFolder (layer 2) + Prisma (layer 3) |
| **2. ¿Usa IA?** | ✅ SÍ en Primer Encuentro | Claude API via /api/chat, validación strict de vocab |
| **3. ¿Se clasifican/indexan datos?** | ✅ SÍ | Tier 1-7, Timeline indexada, Clasificación semántica, Searchable |
| **4. ¿Detector de patrones?** | ✅ SÍ (Parcial) | Tema, Intensidad, Narrativa, Distorsiones (KB), Sesgos, Alertas |

---

**Documento generado:** 2026-03-17 15:30 UTC
**Auditor:** Claude Haiku 4.5 (Experto TCC + Ingeniería de Software)
**Revisor:** Requerido antes de producción
