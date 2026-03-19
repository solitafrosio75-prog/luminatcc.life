# 🔌 GUÍA DE INTEGRACIÓN — PatternProcessor en Sesiones AC/RC

**Fecha:** 2026-03-17
**Status:** ✅ LISTO PARA INTEGRACIÓN
**Archivos creados:** 5
**Archivos modificados:** 2

---

## ✅ COMPLETADO

### 1. Archivos TypeScript (3)
- ✅ `patternTypes.ts` — 180 LOC (tipos)
- ✅ `patternProcessor.ts` — 450 LOC (motor)
- ✅ `patternProcessorIntegration.ts` — 200 LOC (integración)

### 2. Extensión PatientStore
- ✅ `PatientFolder.patternAnalysisLog` — nuevo campo
- ✅ 3 nuevas acciones: `processSessionPatterns()`, `appendPatternLogEntry()`, `getPatternHistory()`

### 3. UI Component
- ✅ `PatternAnalysisPanel.tsx` — panel visual en módulo Terapeuta

---

## 🔧 PRÓXIMOS PASOS DE INTEGRACIÓN

### PASO 1: Importar PatternProcessor en sesiones AC/RC

**Ubicación:** Cada archivo de sesión (ej: `first.session.ac.ts`, `psychoeducation.session.ac.ts`, etc.)

**Agregar al inicio del archivo:**

```typescript
import { analyzeSessionPatterns, formatPatternAnalysisForFolder } from '@knowledge/patient/patternProcessor';
import { usePatientStore } from '@features/patient/patientStore';
```

### PASO 2: Al finalizar CADA sesión, agregar 1 línea

**Ubicación:** Al final de la función principal de sesión (ej: `runFirstSessionAC()`)

**Antes (actual):**
```typescript
export async function runFirstSessionAC(context: SessionContext): Promise<FirstSessionResult> {
  // ... código de sesión ...

  return {
    presentacion,
    motivoConsulta,
    bdiAdmin,
    psicoeducacion,
    tareaAsignada,
    feedback,
    salida,
  };
}
```

**Después (con PatternProcessor):**
```typescript
export async function runFirstSessionAC(context: SessionContext): Promise<FirstSessionResult> {
  const { appendPatternLogEntry, getFolder } = usePatientStore();

  // ... código de sesión ...

  // AL FINALIZAR: Procesar patrones (1 línea extra)
  const sessionData = {
    number: 1,
    type: 'ac_1' as const,
    transcript: conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n'),
    inventoriesAdministered: [{
      inventario: 'BDI-II',
      puntuacion: bdiScore,
      alertaCritica: hasCritical
    }],
    rapportScore: context.rapportScore,
    emotionalTone: context.estadoEmocional
  };

  const analysis = await analyzeSessionPatterns(
    sessionData,
    getFolder(context.paciente.patientId)?.interviewReport!,
    previousBDI
  );

  const logEntry = {
    sessionNumber: 1,
    sessionType: 'ac_1',
    analyzedAt: Date.now(),
    analysis,
    therapistActionItems: extractActionItems(analysis),
    nextSessionSuggestions: formatSuggestions(analysis.suggestions)
  };

  appendPatternLogEntry(context.paciente.patientId, logEntry);

  return {
    presentacion,
    motivoConsulta,
    bdiAdmin,
    psicoeducacion,
    tareaAsignada,
    feedback,
    salida,
  };
}
```

### PASO 3: Agregar PatternAnalysisPanel en módulo Terapeuta

**Ubicación:** `src/features/therapist/PatientsTab.tsx` o donde se muestran las carpetas del paciente

**Agregar:**

```typescript
import { PatternAnalysisPanel } from './PatternAnalysisPanel';

// En el render de carpeta del paciente:
<PatternAnalysisPanel patientId={selectedPatientId} />
```

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### Sesiones AC a actualizar (7 archivos)

- [ ] `src/knowledge/session/first.session.ac.ts` (Sesión 1)
- [ ] `src/knowledge/session/psychoeducation.session.ac.ts` (Sesión 2)
- [ ] `src/knowledge/session/assessment.session.ac.ts` (Sesión 3)
- [ ] `src/knowledge/session/goals.session.ac.ts` (Sesión 4)
- [ ] `src/knowledge/session/evaluation.session.ac.ts` (Sesión 5)
- [ ] `src/knowledge/session/intermediate.session.ac.ts` (Sesión 6)
- [ ] `src/knowledge/session/followup.session.ac.ts` (Sesión 7)

### Sesiones RC a actualizar (3 archivos)

- [ ] `src/knowledge/session/first.session.rc.ts` (Sesión 1)
- [ ] `src/knowledge/session/assessment.session.rc.ts` (Sesión 2)
- [ ] `src/knowledge/session/psychoeducation.session.rc.ts` (Sesión 3)

### UI a actualizar (1 archivo)

- [ ] `src/features/therapist/PatientsTab.tsx` — Agregar `<PatternAnalysisPanel />`

### Tests a crear (1 archivo)

- [ ] `src/knowledge/patient/patternProcessor.test.ts` — 20+ casos

---

## 🧪 EJEMPLO CONCRETO: Sesión 1 AC

**Archivo:** `src/knowledge/session/first.session.ac.ts`

**Cambios necesarios:**

```typescript
// 1. Agregar imports
import { analyzeSessionPatterns, formatPatternAnalysisForFolder } from '@knowledge/patient/patternProcessor';
import { usePatientStore } from '@features/patient/patientStore';

// 2. Al inicio de la función
export async function runFirstSessionAC(context: SessionContext): Promise<FirstSessionResult> {
  const { appendPatternLogEntry, getFolder } = usePatientStore();

  // ... código existente de sesión ...

  // 3. AL FINALIZAR, antes del return:
  const folder = getFolder(context.paciente.patientId);
  if (folder?.interviewReport) {
    const previousBDI = folder.interviewReport.therapistView.bdi.score;

    const sessionData = {
      number: 1,
      type: 'ac_1' as const,
      transcript: conversationHistory
        .map(m => `${m.role === 'user' ? 'Paciente' : 'Terapeuta'}: ${m.content}`)
        .join('\n'),
      inventoriesAdministered: [{
        inventario: 'BDI-II',
        puntuacion: bdiScore || 0
      }],
      rapportScore: context.rapportScore,
      emotionalTone: context.estadoEmocional
    };

    const analysis = await analyzeSessionPatterns(
      sessionData,
      folder.interviewReport,
      previousBDI
    );

    const logEntry = {
      sessionNumber: 1,
      sessionType: 'ac_1',
      analyzedAt: Date.now(),
      analysis,
      therapistActionItems: [
        ...analysis.alerts
          .filter(a => a.severity === 'critical' || a.severity === 'high')
          .map(a => `⚠️ ${a.recommendedAction}`),
      ],
      nextSessionSuggestions: analysis.suggestions
        .map(s => `${s.technique} (${s.priority})`)
    };

    appendPatternLogEntry(context.paciente.patientId, logEntry);
  }

  // 4. Retornar como siempre
  return {
    presentacion,
    motivoConsulta,
    bdiAdmin,
    psicoeducacion,
    tareaAsignada,
    feedback,
    salida,
  };
}
```

---

## 📊 RESULTADO EN MÓDULO TERAPEUTA

Después de implementar, el terapeuta verá:

**En PatientsTab:**
```
Paciente: Juan García
├─ Reporte de entrevista
├─ Notas clínicas
├─ 📊 EVOLUCIÓN DE PATRONES  ← NUEVO
│  ├─ Sesión 1 (AC-1)
│  │  ├─ Coherencia: 85/100
│  │  ├─ Distorsiones: Lectura mental, Sesgo confirmatorio
│  │  ├─ BDI-II: 28→26 (dirección positiva)
│  │  ├─ ⚠️ Alertas: Evitación conductual activa
│  │  └─ 💡 Próxima: Behavioral Activation + Thought Record
│  │
│  ├─ Sesión 2 (AC-2)
│  │  ├─ Coherencia: 78/100
│  │  ├─ Distorsiones: Lectura mental (SIGUE activa)
│  │  ├─ BDI-II: 26→23 (mejora leve, RCI=0.3)
│  │  └─ 💡 Próxima: Intensificar exposición
│  │
│  └─ [Sesiones 3-7 siguiendo el patrón]
```

---

## ⏱️ TIEMPO DE INTEGRACIÓN

| Tarea | Tiempo | Notas |
|-------|--------|-------|
| Actualizar sesiones AC (7 archivos) | 2h | Copy-paste del ejemplo, ajustar por sesión |
| Actualizar sesiones RC (3 archivos) | 1h | Similar a AC |
| Integrar PatternAnalysisPanel | 30 min | Agregar 1 componente en PatientsTab |
| Tests PatternProcessor | 2-3h | 20+ casos, seguir patrón de tests existentes |
| **TOTAL** | **5.5-6.5h** | Puede paralelizarse |

---

## 🚀 ORDEN RECOMENDADO

1. **Sesiones AC (1-7)** → 2h (máxima prioridad)
2. **PatternAnalysisPanel** → 30 min (UI)
3. **Sesiones RC (1-3)** → 1h (complementario)
4. **Tests PatternProcessor** → 2-3h (cuando todo funcione)

---

## ✅ VALIDACIÓN POST-INTEGRACIÓN

```bash
# 1. Type-check
npx tsc --noEmit

# 2. Tests
npm test

# 3. Visual: Abrir módulo terapeuta y verificar PatternAnalysisPanel
```

---

## 📝 NOTAS IMPORTANTES

1. **Imports dinámicos:** `usePatientStore()` debe usarse dentro de componentes/funciones que tengan acceso a React Context
2. **Conversación completa:** El `transcript` debe incluir TODA la interacción sesión (usuario + IA)
3. **BDI anterior:** Se obtiene del `InterviewReport` inicial (Primer Encuentro)
4. **Error handling:** Envolver en try-catch en caso de que falle el análisis

---

## 🎯 IMPACTO ESPERADO

✅ **Terapeuta tiene retroalimentación dinámica después de cada sesión**
✅ **Patrones se documentan automáticamente en carpeta del paciente**
✅ **Sugerencias específicas para próxima sesión**
✅ **Alertas críticas nunca se pierden**
✅ **Auditoría completa de evolución clínica**

---

**¿Listo para integración? Este documento puede servir como referencia mientras actualizas los 10 archivos de sesión.**
