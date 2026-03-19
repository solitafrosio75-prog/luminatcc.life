# 🔍 PATTERN PROCESSOR — Plan de Implementación

**Propósito:** Procesar dinámicamente patrones en cada sesión y documentar en carpeta del paciente
**Status:** DISEÑO (listo para implementación)
**Estimación:** 3-4 días de trabajo

---

## 🎯 REQUISITOS CLÍNICOS

### Inputs (desde InterviewReport + Sesión actual)

1. **Patrones iniciales** (Primer Encuentro)
   - Creencia nuclear hipotetizada
   - Tema presentador (relaciones/trabajo/emocional/evento/difuso)
   - Intensidad emocional baseline (0-5)
   - Rapport score inicial
   - Core belief evidence (frases literales)
   - Functional analysis (antecedents-behaviors-consequences)

2. **Datos de sesión actual** (AC/RC)
   - Transcripción de diálogo paciente-terapeuta
   - Inventarios administrados (BDI-II, BADS, DAS, etc.)
   - Tareas completadas (homework)
   - Resistencias / avances observados
   - Comentarios del terapeuta

### Outputs (Documentados en PatientFolder)

1. **Análisis de Coherencia**
   - ¿El patrón actual es coherente con la creencia nuclear inicial?
   - ¿Se observan cambios en el patrón?
   - Evidencia que apoya / contradice la hipótesis inicial

2. **Detección de Nuevos Patrones**
   - Distorsiones cognitivas emergentes
   - Sesgos detectados en la sesión actual
   - Incoherencias narrativas
   - Indicadores de cambio (mejora/empeora/estable)

3. **Sugerencias Dinámicas para Próxima Sesión**
   - Si se detectó rumiación → "Considerar defusión cognitiva"
   - Si se detectó evitación → "Intensificar gradualmente activación"
   - Si se detectó cambio significativo → "Reforzar con feedback"

4. **Alertas Clínicas**
   - Crisis ideation emergente
   - Resistencia terapéutica
   - Necesidad de derivación

---

## 🏗️ ARQUITECTURA

### Ubicación y Estructura

```
src/knowledge/patient/
├── patternProcessor.ts          (Motor principal — pure functions)
├── patternProcessor.test.ts     (20+ test cases)
├── patternTypes.ts              (Types compartidos)
└── patternAnalyzers/
    ├── coherenceAnalyzer.ts     (Analiza coherencia con baseline)
    ├── distortionDetector.ts    (Detecta distorsiones nuevas)
    ├── narrativeAnalyzer.ts     (Analiza narrativa sesión)
    ├── changeIndicators.ts      (Calcula RCI, tendencia)
    └── alertGenerator.ts        (Genera alertas clínicas)
```

### Integración con PatientStore

```typescript
// patientStore.ts — nueva acción

interface PatientState {
  // ... existente ...

  // PatternProcessor
  processSessionPatterns: (
    patientId: string,
    sessionData: SessionData
  ) => Promise<PatternAnalysisResult>;

  appendPatternLog: (
    patientId: string,
    analysis: PatternAnalysisResult
  ) => void;

  getPatternHistory: (patientId: string) => PatternAnalysisResult[];
}
```

### PatientFolder extendida

```typescript
interface PatientFolder {
  patientId: string;
  createdAt: number;

  // Existente
  interviewReport: InterviewReport | null;
  therapistNotes: string;
  sessionCount: number;
  lastSessionAt: number | null;

  // NUEVO: Pattern Analysis Log
  patternAnalysisLog: Array<{
    sessionNumber: number;
    sessionType: 'ac_1' | 'ac_2' | ... | 'rc_3';
    analyzedAt: number;

    // Análisis
    analysis: PatternAnalysisResult;

    // Documentación
    therapistActionItems: string[];
    nextSessionSuggestions: string[];
  }>;
}
```

---

## 🔄 FLUJO DE OPERACIÓN

### Trigger: Al finalizar cada sesión

```
1. Sesión AC/RC finaliza
   ↓
2. Sistema calcula:
   - Inventarios administrados
   - Tareas completadas
   - Transcripción de interacción
   ↓
3. Invoca PatternProcessor.analyze()
   ├─ coherenceAnalyzer: ¿Coherencia con creencia inicial?
   ├─ distortionDetector: ¿Nuevas distorsiones?
   ├─ narrativeAnalyzer: ¿Patrón narrativo?
   ├─ changeIndicators: ¿RCI? ¿Tendencia?
   └─ alertGenerator: ¿Alertas críticas?
   ↓
4. PatternAnalysisResult se guarda en:
   - patientFolder.patternAnalysisLog[] (IndexedDB)
   - Visible en Módulo Terapeuta
   ↓
5. Sugerencias alimentan al orquestador para próxima sesión
```

---

## 📋 IMPLEMENTACIÓN STEP-BY-STEP

### Step 1: Definir Types (patternTypes.ts)

```typescript
export interface PatternAnalysisResult {
  sessionNumber: number;
  sessionType: string;
  analyzedAt: number;

  // Análisis de coherencia
  coherenceAnalysis: {
    isCoherent: boolean;
    evidence: string[];
    contradictions: string[];
    coherenceScore: number; // 0-100
  };

  // Distorsiones detectadas en ESTA sesión
  distortionsIdentified: Array<{
    distortionId: string;
    name: string;
    severity: 'low' | 'moderate' | 'high';
    evidence: string[];
  }>;

  // Análisis narrativo
  narrativeAnalysis: {
    trend: 'expanding' | 'contracting' | 'stable' | 'unknown';
    emotionalTone: string;
    rapportScore: number;
    keyPhrases: string[];
  };

  // Indicadores de cambio
  changeIndicators: {
    bdi: { previous?: number; current?: number; rci?: number; direction: 'up' | 'down' | 'stable' };
    bads: { previous?: number; current?: number; direction: 'up' | 'down' | 'stable' };
    otherInventories?: Record<string, any>;
  };

  // Alertas críticas
  alerts: Array<{
    type: 'crisis' | 'resistance' | 'unexpected_deterioration' | 'referral_needed';
    severity: 'low' | 'moderate' | 'high' | 'critical';
    message: string;
  }>;

  // Sugerencias para próxima sesión
  suggestions: Array<{
    technique: string;
    rationale: string;
    priority: 'high' | 'medium' | 'low';
  }>;

  // Hipótesis actualizada
  updatedHypothesis?: string;
}
```

### Step 2: Implementar Analyzers (5 módulos pequeños)

**coherenceAnalyzer.ts:**
```typescript
export function analyzeCoherence(
  baselineBeliefs: string[],
  sessionTranscript: string,
  currentHypothesis: string
): CoherenceAnalysis {
  // Buscar evidencia de la creencia nuclear en la sesión
  // Buscar contradicciones
  // Generar score de coherencia (0-100)
}
```

**distortionDetector.ts:**
```typescript
export function detectDistortions(
  sessionTranscript: string,
  knownDistortions: CognitivDistortion[]
): DistortionIdentification[] {
  // Detectar patrones de distorsión cognitiva
  // Buscar en knowledge base
  // Retornar con evidencia (frases literales)
}
```

**changeIndicators.ts:**
```typescript
export function calculateChangeIndicators(
  previousInventories: InventoryResult[],
  currentInventories: InventoryResult[]
): ChangeIndicators {
  // Calcular RCI para cada inventario
  // Determinar direction (up/down/stable)
  // Comparar con baseline (Primer Encuentro)
}
```

### Step 3: PatternProcessor.analyze() (orquestador)

```typescript
export async function analyzeSessionPatterns(
  session: SessionData,
  interviewReport: InterviewReport,
  previousAnalyses: PatternAnalysisResult[]
): Promise<PatternAnalysisResult> {
  // 1. Coherencia
  const coherence = analyzeCoherence(
    interviewReport.therapistView.coreBeliefEvidence,
    session.transcript,
    interviewReport.therapistView.hypothesis
  );

  // 2. Distorsiones nuevas
  const distortions = detectDistortions(
    session.transcript,
    COGNITIVE_DISTORTIONS
  );

  // 3. Narrativa
  const narrative = analyzeNarrative(session.transcript);

  // 4. Cambio (RCI)
  const changes = calculateChangeIndicators(
    interviewReport.therapistView.bdi,
    session.currentBDI
  );

  // 5. Alertas
  const alerts = generateAlerts(coherence, distortions, changes);

  // 6. Sugerencias
  const suggestions = generateSuggestions(
    coherence,
    distortions,
    changes,
    alerts
  );

  return {
    sessionNumber: session.number,
    sessionType: session.type,
    analyzedAt: Date.now(),
    coherenceAnalysis: coherence,
    distortionsIdentified: distortions,
    narrativeAnalysis: narrative,
    changeIndicators: changes,
    alerts,
    suggestions
  };
}
```

### Step 4: Integración con PatientStore

```typescript
// En usePatientStore

processSessionPatterns: async (patientId, sessionData) => {
  const folder = get().patientFolders.find(f => f.patientId === patientId);
  if (!folder?.interviewReport) return;

  const previousAnalyses = folder.patternAnalysisLog || [];

  const analysis = await analyzeSessionPatterns(
    sessionData,
    folder.interviewReport,
    previousAnalyses
  );

  // Guardar en folder
  folder.patternAnalysisLog = [
    ...(folder.patternAnalysisLog || []),
    {
      sessionNumber: sessionData.number,
      sessionType: sessionData.type,
      analyzedAt: Date.now(),
      analysis,
      therapistActionItems: extractActionItems(analysis),
      nextSessionSuggestions: formatSuggestions(analysis.suggestions)
    }
  ];
};
```

### Step 5: UI en Módulo Terapeuta

**PatternAnalysisPanel.tsx (nuevo componente):**
```typescript
export function PatternAnalysisPanel({ patientId }: Props) {
  const { getFolder } = usePatientStore();
  const folder = getFolder(patientId);
  const patternLog = folder?.patternAnalysisLog || [];

  return (
    <div className="pattern-analysis">
      <h3>📊 Análisis de Patrones por Sesión</h3>

      {patternLog.map((entry, idx) => (
        <SessionPatternCard key={idx} entry={entry}>
          <CoherenceSection analysis={entry.analysis.coherenceAnalysis} />
          <DistortionsSection distortions={entry.analysis.distortionsIdentified} />
          <ChangeIndicatorsSection changes={entry.analysis.changeIndicators} />
          <AlertsSection alerts={entry.analysis.alerts} />
          <SuggestionsSection suggestions={entry.nextSessionSuggestions} />
        </SessionPatternCard>
      ))}
    </div>
  );
}
```

---

## 📊 EJEMPLO CONCRETO: Sesión 2 AC

### Input
```
InterviewReport (Primer Encuentro):
  - Creencia nuclear: "No merezco el amor"
  - Tema: relaciones
  - Rapport: 75/100
  - Core evidence: ["nunca estaré bien solo", "todos me abandonan"]

Sesión 2 AC Transcript:
  Paciente: "Intenté pasar tiempo con mi pareja pero me sentí tan ansioso que me fui"
  Terapeuta: "¿Qué pensaste en ese momento?"
  Paciente: "Que la estaba aburriendo. Que es mejor que me vaya"
  ... [más diálogo]

Inventarios Sesión 2:
  - BDI-II anterior: 28 (moderada)
  - BDI-II actual: 26 (moderada)
  - RCI: -0.2 (estable)
```

### Output (PatternAnalysisResult)

```json
{
  "sessionNumber": 2,
  "sessionType": "ac_2",
  "coherenceAnalysis": {
    "isCoherent": true,
    "coherenceScore": 85,
    "evidence": [
      "Paciente reafirma 'es mejor que me vaya' → coherente con 'no merezco'",
      "Evitación conductual (se fue) → mantiene creencia"
    ],
    "contradictions": [
      "PERO intentó interacción (vs patrón total evitación) → signo positivo"
    ]
  },
  "distortionsIdentified": [
    {
      "distortionId": "dc_02_lectura_mental",
      "name": "Lectura de la mente",
      "severity": "high",
      "evidence": ["'la estaba aburriendo' sin confirmación"]
    },
    {
      "distortionId": "dc_09_sesgo_confirmatorio",
      "name": "Sesgo confirmatorio",
      "severity": "high",
      "evidence": ["Interpreta ansiedad como confirmación de 'no merezco'"]
    }
  ],
  "changeIndicators": {
    "bdi": {
      "previous": 28,
      "current": 26,
      "rci": -0.2,
      "direction": "stable"
    }
  },
  "alerts": [
    {
      "type": "resistance",
      "severity": "moderate",
      "message": "Evitación conductual activa — paciente escapa ante ansiedad. Reforzar exposición gradual."
    }
  ],
  "suggestions": [
    {
      "technique": "Behavioral Activation + Exposure",
      "rationale": "Lectura mental + sesgo confirmatorio mantenido por evitación. Necesario aumentar tiempo con pareja de forma gradual.",
      "priority": "high"
    },
    {
      "technique": "Thought Record 5 Columnas",
      "rationale": "Registrar pensamiento 'la estaba aburriendo' y buscar evidencia real",
      "priority": "high"
    }
  ],
  "updatedHypothesis": "Creencia 'no merezco amor' mantenida por: (1) lectura mental, (2) evitación conductual, (3) sesgo confirmatorio. La ansiedad social actúa como trigger. Intervención: exposición + cognitive restructuring."
}
```

### Documentado en PatientFolder.patternAnalysisLog[1]

```
📌 SESIÓN 2 AC — Análisis de Patrones
Fecha: 2026-03-23
Coherencia: 85/100 ✓ (patrón consistente pero con signos positivos)

🔴 Distorsiones Identificadas:
- Lectura de la mente (alta): "la estaba aburriendo"
- Sesgo confirmatorio (alta): ansiedad = "no merezco"

📊 Cambio:
- BDI-II: 28 → 26 (RCI: -0.2, estable — esperado en sesión 2)

⚠️ Alerta:
- Evitación conductual activa — paciente escapa

💡 Próxima Sesión (AC-3):
1. Intensificar exposición gradual con pareja
2. Introducir Thought Record para lectura mental
3. Validar: "La ansiedad es normal. Tu valor no depende de ella."
```

---

## 🧪 Testing Strategy

**patternProcessor.test.ts:**
```typescript
describe('PatternProcessor', () => {
  describe('analyzeCoherence', () => {
    it('detecta coherencia alta cuando creencia se mantiene', () => {});
    it('detecta coherencia baja cuando emerge patrón opuesto', () => {});
    it('identifica signos positivos (contradictions) en patrón', () => {});
  });

  describe('detectDistortions', () => {
    it('detecta lectura mental con evidencia literal', () => {});
    it('detecta sesgo confirmatorio en transcripción', () => {});
    it('NO dispara falsos positivos con lenguaje empático', () => {});
  });

  describe('calculateChangeIndicators', () => {
    it('calcula RCI correctamente', () => {});
    it('determina direction (up/down/stable)', () => {});
  });

  describe('Integration', () => {
    it('sesión completa: entrada → análisis → sugerencias', () => {});
  });
});
```

---

## 📅 TIMELINE ESTIMADO

| Tarea | Duración | Depende de |
|-------|----------|-----------|
| Step 1: patternTypes.ts | 0.5d | — |
| Step 2: Analyzers (5 módulos) | 1.5d | Step 1 |
| Step 3: PatternProcessor core | 0.5d | Step 2 |
| Step 4: PatientStore integration | 0.5d | Step 3 |
| Step 5: UI PatternAnalysisPanel | 1d | Step 4 |
| Tests (20+ casos) | 1d | All steps |
| **TOTAL** | **~5 días** | — |

---

## 🎯 BENEFICIOS CLÍNICOS

✅ **Documentación continua:** Cada sesión deja huella analítica
✅ **Retroalimentación dinámica:** Orquestador sabe qué patrones están activos
✅ **Transparencia:** Terapeuta ve evolución de patrones sesión por sesión
✅ **Escalabilidad:** Sistema aprende qué sugerencias funcionan
✅ **Seguridad:** Alertas críticas emergen dinámicamente, no se pierden

---

**¿Proceder con implementación?**
