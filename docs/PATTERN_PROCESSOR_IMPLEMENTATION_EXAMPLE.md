# 🔍 PatternProcessor — Guía de Implementación y Uso

**Fecha creación:** 2026-03-17
**Status:** Listo para integración
**Archivos creados:** 3 (types + processor + integration)

---

## 📦 ARCHIVOS CREADOS

```
src/knowledge/patient/
├── patternTypes.ts                      ✅ (Types completos)
├── patternProcessor.ts                  ✅ (Motor de análisis — 400+ LOC)
└── patternProcessorIntegration.ts       ✅ (Integración con PatientStore)
```

---

## 🎯 CÓMO FUNCIONA

### Flujo Clínico Completo

```
1. PRIMERA SESIÓN (PRIMER ENCUENTRO)
   ├─ Se genera InterviewReport
   ├─ Se extrae: creencia nuclear, problema list, core belief evidence
   └─ Se guarda en PatientFolder.interviewReport

2. SESIÓN 1-7 AC / RC
   ├─ Sesión completada
   ├─ Se captura: transcript, inventarios, tareas, observaciones
   ├─ Invoca: processSessionPatterns()
   │
   └─→ ENGINE ANÁLISIS:
       ├─ Coherencia: ¿patrón mantiene creencia inicial?
       ├─ Distorsiones: ¿nuevas distorsiones cognitivas?
       ├─ Narrativa: ¿el paciente se abre o se retrae?
       ├─ Cambio: ¿RCI significativo en BDI-II?
       ├─ Alertas: ¿crisis, deterioro, resistencia?
       └─ Sugerencias: ¿qué técnica para próxima sesión?

3. RESULTADO GUARDADO
   └─ PatientFolder.patternAnalysisLog[]
      ├─ sessionNumber, sessionType, analyzedAt
      ├─ PatternAnalysisResult (estructura completa)
      ├─ therapistActionItems (para revisar)
      └─ nextSessionSuggestions (para planificar)

4. VISUALIZACIÓN EN MÓDULO TERAPEUTA
   └─ PatternAnalysisPanel
      ├─ Tabla de sesiones con métricas
      ├─ Card por sesión mostrando:
      │  ├─ Coherencia del patrón
      │  ├─ Distorsiones detectadas
      │  ├─ Indicadores de cambio
      │  ├─ Alertas críticas
      │  └─ Sugerencias para próxima sesión
      └─ Botón: "Ver resumen evolución"
```

---

## 💻 EJEMPLOS DE USO

### Ejemplo 1: Procesar una sesión completada

```typescript
// En un componente de sesión, al finalizar AC-2:

import { usePatientStore } from '@features/patient/patientStore';
import { processSessionPatterns } from '@knowledge/patient/patternProcessorIntegration';

function SessionCompleteModal() {
  const { getFolder } = usePatientStore();
  const patientId = useActivePatientId();

  const handleSessionComplete = async () => {
    // Datos de la sesión
    const sessionData = {
      number: 2,
      type: 'ac_2' as const,
      transcript: fullConversationTranscript, // TODO: capturar desde chat
      inventoriesAdministered: [
        { inventario: 'BDI-II', puntuacion: 26, alertaCritica: false }
      ],
      homework: {
        assigned: ['Activity record semanal', 'Identificar comportamientos de evitación'],
        completed: ['Activity record completado (6 días)'],
        resistance: 'Difficultad para enfrentar ansiedad en situaciones sociales'
      },
      rapportScore: 78,
      emotionalTone: 'guarded' // derivado de PrimerEncuentro
    };

    // Procesar patrones
    const patternEntry = await processSessionPatterns(
      patientId,
      sessionData,
      getFolder
    );

    if (patternEntry) {
      // Guardar en carpeta del paciente
      const folder = getFolder(patientId);
      const updatedFolder = appendPatternLogEntry(folder!, patternEntry);

      // Actualizar store
      updateFolder(patientId, updatedFolder);

      // Mostrar resumen al terapeuta
      showPatternSummary(patternEntry.analysis);
    }
  };

  return (
    <div className="session-complete-modal">
      <h3>Sesión AC-2 Completada ✓</h3>
      <button onClick={handleSessionComplete}>
        Analizar Patrones y Guardar
      </button>
    </div>
  );
}
```

### Ejemplo 2: Mostrar análisis en módulo terapeuta

```typescript
// PatternAnalysisPanel.tsx (nuevo componente)

import { getPatternHistory, generatePatternSummary } from '@knowledge/patient/patternProcessorIntegration';
import { usePatientStore } from '@features/patient/patientStore';

export function PatternAnalysisPanel({ patientId }: Props) {
  const { getFolder } = usePatientStore();
  const folder = getFolder(patientId);
  const history = getPatternHistory(folder);

  return (
    <div className="pattern-analysis-panel">
      <h3>📊 Evolución de Patrones</h3>

      {history.length === 0 ? (
        <p className="text-gray-500">Aún no hay sesiones procesadas</p>
      ) : (
        <>
          {/* Resumen visual */}
          <div className="evolution-timeline">
            {history.map((entry, idx) => (
              <div key={idx} className="session-card">
                <div className="session-header">
                  <h4>Sesión {entry.sessionNumber} ({entry.sessionType})</h4>
                  <span className="date">{new Date(entry.analyzedAt).toLocaleDateString('es-ES')}</span>
                </div>

                <div className="metrics-grid">
                  {/* Coherencia */}
                  <MetricBox
                    label="Coherencia del patrón"
                    value={entry.analysis.coherenceAnalysis.coherenceScore}
                    max={100}
                    color={entry.analysis.coherenceAnalysis.isCoherent ? 'blue' : 'green'}
                  />

                  {/* BDI-II Change */}
                  {entry.analysis.changeIndicators.bdi && (
                    <MetricBox
                      label="BDI-II"
                      value={entry.analysis.changeIndicators.bdi.current}
                      previous={entry.analysis.changeIndicators.bdi.previous}
                      color={
                        entry.analysis.changeIndicators.bdi.direction === 'down'
                          ? 'green'
                          : entry.analysis.changeIndicators.bdi.direction === 'up'
                          ? 'red'
                          : 'gray'
                      }
                    />
                  )}

                  {/* Distortions Count */}
                  <MetricBox
                    label="Distorsiones detectadas"
                    value={entry.analysis.distortionsIdentified.length}
                    color={
                      entry.analysis.distortionsIdentified.length === 0
                        ? 'green'
                        : entry.analysis.distortionsIdentified.some(d => d.severity === 'high')
                        ? 'red'
                        : 'orange'
                    }
                  />
                </div>

                {/* Distorsiones detalladas */}
                {entry.analysis.distortionsIdentified.length > 0 && (
                  <div className="distortions-section">
                    <h5>Distorsiones identificadas:</h5>
                    {entry.analysis.distortionsIdentified.map((d, i) => (
                      <div key={i} className={`distortion-item severity-${d.severity}`}>
                        <strong>{d.name}</strong>
                        <p className="evidence">{d.evidence[0]}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Alertas */}
                {entry.analysis.alerts.length > 0 && (
                  <div className="alerts-section">
                    <h5>⚠️ Alertas:</h5>
                    {entry.analysis.alerts.map((a, i) => (
                      <div key={i} className={`alert severity-${a.severity}`}>
                        <strong>[{a.type}]</strong> {a.message}
                        <p className="action">{a.recommendedAction}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Sugerencias para próxima sesión */}
                <div className="suggestions-section">
                  <h5>💡 Próxima sesión:</h5>
                  {entry.analysis.suggestions.map((s, i) => (
                    <div key={i} className={`suggestion priority-${s.priority}`}>
                      <strong>{s.technique}</strong>
                      <p>{s.rationale}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Resumen consolidado */}
          <details className="pattern-summary">
            <summary>📈 Ver resumen completo de evolución</summary>
            <div className="markdown-content">
              {generatePatternSummary(folder, folder?.interviewReport || null)}
            </div>
          </details>
        </>
      )}
    </div>
  );
}
```

### Ejemplo 3: Acciones sobre sugerencias

```typescript
// El terapeuta puede usar las sugerencias para planificar

const handleApplySuggestion = (suggestion: SessionSuggestion) => {
  // 1. Agregar a notas de la próxima sesión
  updateTherapistNotes(patientId,
    `\n\n[De patrón AC-2] Aplicar: ${suggestion.technique}\nRazón: ${suggestion.rationale}`
  );

  // 2. Actualizar plan de tratamiento
  updateSessionPlan(patientId, {
    nextTechnique: suggestion.technique,
    rationale: suggestion.rationale,
    steps: suggestion.steps || [],
  });

  // 3. Marcar como adoptada
  // TODO: agregar tracking de sugerencias adoptadas vs ignoradas
};
```

---

## 📊 EJEMPLO REAL: Sesión 2 AC

### Input

```typescript
const sessionData = {
  number: 2,
  type: 'ac_2',
  transcript: `
    Terapeuta: ¿Qué tal la semana? ¿Pudiste registrar tus actividades?
    Paciente: Sí, lo hice 6 días. Pero el fin de semana, cuando fui a ver a mi pareja,
              sentí tanta ansiedad que me fui a casa. Pensé que la estaba aburriendo.
    Terapeuta: ¿Qué evidencia tienes de que la estabas aburriendo?
    Paciente: Bueno... ninguna en realidad. Pero es mejor así, solo me causan más ansiedad.
  `,
  inventoriesAdministered: [
    { inventario: 'BDI-II', puntuacion: 26 }
  ],
  homework: {
    assigned: ['Activity record', 'Aproximación: tiempo con pareja'],
    completed: ['6/7 days activity record completado'],
    resistance: 'Evitación ante ansiedad social'
  },
  rapportScore: 78,
  emotionalTone: 'guarded'
};

// Primer Encuentro data:
const interviewReport = {
  therapistView: {
    hypothesizedMechanism: 'No merezco el amor',
    coreBeliefEvidence: ['nunca estaré bien solo', 'todos me abandonan'],
    hypothesis: 'Creencia "no merezco amor" mantenida por evitación conductual y lectura mental'
  }
};
```

### Output (PatternAnalysisResult)

```json
{
  "sessionNumber": 2,
  "sessionType": "ac_2",
  "analyzedAt": 1711276800000,
  "coherenceAnalysis": {
    "isCoherent": true,
    "coherenceScore": 85,
    "evidence": [
      "Reafirmación: patrón de evitación mantiene creencia",
      "Patrón de evitación: 'me fui a casa' → comportamiento mantiene creencia"
    ],
    "contradictions": [
      "Signo positivo: 'fui a ver a mi pareja' → comportamiento contradice creencia total"
    ],
    "clinicalNote": "Patrón coherente pero con signos iniciales de acción. El paciente está intentando aproximarse a pesar de la ansiedad."
  },
  "distortionsIdentified": [
    {
      "distortionId": "dc_02_lectura_mental",
      "name": "Lectura de la mente",
      "severity": "high",
      "evidence": [
        "Pensé que la estaba aburriendo (sin evidencia)"
      ],
      "pattern": "Asumir que otros piensan lo peor sin confirmación"
    },
    {
      "distortionId": "dc_09_sesgo_confirmatorio",
      "name": "Sesgo confirmatorio",
      "severity": "high",
      "evidence": [
        "Usa ansiedad como prueba de que 'no merezco' (confirma creencia negativa)"
      ],
      "pattern": "Buscar evidencia solo que confirme creencias negativas"
    }
  ],
  "changeIndicators": {
    "bdi": {
      "previous": 28,
      "current": 26,
      "change": -2,
      "rci": -0.2,
      "direction": "down",
      "interpretation": "Sin cambio clínicamente significativo (esperado en sesión 2). Pero dirección es positiva."
    },
    "overallTrend": "stable"
  },
  "alerts": [
    {
      "type": "therapeutic_resistance",
      "severity": "moderate",
      "message": "Evitación conductual activa: paciente escapa ante ansiedad",
      "evidence": ["'me fui a casa' cuando sintió ansiedad"],
      "recommendedAction": "Validar resistencia, aumentar exposición gradual, reforzar que ansiedad ↓ con exposición"
    }
  ],
  "suggestions": [
    {
      "technique": "Behavioral Activation + Exposición Gradual",
      "rationale": "La evitación es el mecanismo que mantiene 'no merezco amor'. Necesario aumentar gradualmenteriesgo.",
      "priority": "high",
      "steps": [
        "Registrar: ¿qué actividades con pareja causaron menos ansiedad?",
        "Establecer duración mínima: próxima semana 30 min mínimo",
        "Monitoreo: ¿bajó la ansiedad con exposición? (psicoeducación)",
        "Refuerzo positivo: 'Lograste aproximarte a pesar del miedo'"
      ]
    },
    {
      "technique": "Thought Record 5 Columnas",
      "rationale": "Lectura mental + sesgo confirmatorio activos. Registrar 'la estaba aburriendo' y buscar evidencia real.",
      "priority": "high",
      "steps": [
        "Situación: 'Estoy con pareja'",
        "Pensamiento: 'La estoy aburriendo'",
        "Evidencia que apoya / contradice",
        "Pensamiento alternativo: 'No hay evidencia. Ella quiso pasar tiempo conmigo.'",
        "Resultado: ¿bajó la ansiedad?"
      ]
    }
  ],
  "updatedHypothesis": "Creencia 'no merezco amor' mantenida por (1) lectura mental ('la estoy aburriendo'), (2) sesgo confirmatorio (ansiedad = 'no merezco'), (3) evitación conductual (escapa de ansiedad). SESIÓN 2: Primer intento de aproximación (signo positivo). Intervención: aumentar exposición + cognitive restructuring."
}
```

### En PatientFolder.therapistNotes (generado automáticamente)

```markdown
## 📊 Sesión 2 (AC-2) — Análisis de Patrones

**Fecha:** 2026-03-23

### Coherencia del patrón: 85/100
✓ Patrón coherente pero con signos iniciales de cambio
- Reafirmación: patrón de evitación mantiene creencia
- PERO: Signo positivo → intentó aproximarse a pareja

### Distorsiones identificadas
- **Lectura de la mente (ALTA):** "Pensé que la estaba aburriendo"
- **Sesgo confirmatorio (ALTA):** Usa ansiedad como prueba de "no merezco"

### Cambio en BDI-II
- Anterior: 28
- Actual: 26
- RCI: -0.2 (sin cambio significativo, pero dirección positiva)

### ⚠️ Alerta
**Tipo:** Evitación conductual activa
**Severidad:** Media
**Acción:** Validar resistencia, aumentar exposición gradual

### 💡 Próxima sesión (AC-3)
1. **Behavioral Activation:** Aumentar exposición gradual (30 min mínimo con pareja)
2. **Thought Record:** Registrar "la estaba aburriendo" y buscar evidencia
3. **Refuerzo:** Validar que el miedo ↓ con exposición

---
```

---

## 🔌 INTEGRACIÓN CON SESIONES AC/RC

### En `first.session.ac.ts` (y otras sesiones)

```typescript
// Al finalizar sesión

export async function runFirstSessionAC(
  context: SessionContext
): Promise<FirstSessionResult> {
  // ... código de sesión ...

  // AL FINALIZAR: Procesar patrones
  const sessionData = {
    number: 1,
    type: 'ac_1' as const,
    transcript: conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n'),
    inventoriesAdministered: [{
      inventario: 'BDI-II',
      puntuacion: bdiScore,
      alertaCritica: hasCritical
    }],
    homework: {
      assigned: ['Activity record para la semana'],
      completed: [],
      resistance: undefined
    },
    rapportScore: getRapportScore(context),
    emotionalTone: getEmotionalTone(context)
  };

  // Procesar patrones
  const { processSessionPatterns, appendPatternLogEntry } = usePatternProcessor();
  const patternEntry = await processSessionPatterns(
    context.patientId,
    sessionData,
    getFolder
  );

  if (patternEntry) {
    const folder = getFolder(context.patientId);
    const updatedFolder = appendPatternLogEntry(folder!, patternEntry);
    updateFolder(context.patientId, updatedFolder);
  }

  return {
    // ... salida normal ...
  };
}
```

---

## 🧪 TESTING

```typescript
// patternProcessor.test.ts

describe('PatternProcessor', () => {
  describe('analyzeCoherence', () => {
    it('detecta coherencia alta cuando patrón se mantiene', () => {
      const result = analyzeCoherence(
        ['nunca estaré bien solo'],
        ['nunca estaré bien solo'],
        'Me sentí mal pensando que nunca estaré bien solo',
        'Creencia de abandono'
      );
      expect(result.isCoherent).toBe(true);
      expect(result.coherenceScore).toBeGreaterThan(70);
    });

    it('detecta signos positivos (contradictions) en evitación', () => {
      const result = analyzeCoherence(
        [],
        [],
        'Intenté aproximarme a mi pareja',
        ''
      );
      expect(result.contradictions.length).toBeGreaterThan(0);
      expect(result.coherenceScore).toBeLessThan(60);
    });
  });

  describe('detectDistortions', () => {
    it('detecta lectura mental', () => {
      const distortions = detectDistortions(
        'Seguro que está molesta conmigo sin haber preguntado',
        COGNITIVE_DISTORTIONS
      );
      expect(distortions.some(d => d.name === 'Lectura de la mente')).toBe(true);
    });

    it('NO dispara falsos positivos', () => {
      const distortions = detectDistortions(
        'Preguntaré si está molesta',
        COGNITIVE_DISTORTIONS
      );
      expect(distortions.filter(d => d.name === 'Lectura de la mente').length).toBe(0);
    });
  });

  // ... más tests ...
});
```

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

- [ ] Copiar `patternTypes.ts` a proyecto
- [ ] Copiar `patternProcessor.ts` a proyecto
- [ ] Copiar `patternProcessorIntegration.ts` a proyecto
- [ ] Crear `PatternAnalysisPanel.tsx` en módulo terapeuta
- [ ] Integrar con `PatientFolder` (agregar `patternAnalysisLog?`)
- [ ] Integrar con sesiones AC/RC (llamar a `processSessionPatterns`)
- [ ] Crear tests (20+ casos)
- [ ] Documentar en guía de usuario terapeuta

---

## 🎯 BENEFICIOS FINALES

✅ **Documentación continua:** Cada sesión genera análisis persistente
✅ **Retroalimentación dinámica:** Terapeuta ve patrones evolucionar
✅ **Sugerencias basadas en datos:** No son genéricas, son específicas del caso
✅ **Seguridad:** Alertas críticas nunca se pierden
✅ **Escalabilidad:** El sistema aprende qué funciona para este paciente

---

**¿Listo para integrar?**
