# 🎯 ACCIONES INMEDIATAS — 2026-03-17 14:45 UTC

**Propósito:** Identificar las acciones críticas para mantener momentum en Sprint TCC-LAB v2.0
**Contexto:** Semana 1 completada (100%), necesario bloquear Semana 2 y 3

---

## 🔴 ACCIONES CRÍTICAS (HOY)

### Acción #1: Crear PrimerEncuentroScreen.test.ts
**Duración:** 2-3 horas
**Criticidad:** 🔴 CRÍTICA (sin cobertura → riesgo de crisis no detectada)
**Responsable:** Claude (Skill: testing)

```typescript
// src/features/primerEncuentro/PrimerEncuentroScreen.test.ts

describe('PrimerEncuentroScreen - Crisis Detection', () => {
  // 5 casos: ideación suicida
  it('detecta "quiero suicidarme"', () => {});
  it('detecta "quiero dejar de vivir"', () => {});
  it('detecta "hacerme daño"', () => {});
  it('detecta "mejor no existir"', () => {});
  it('NO dispara falso positivo con "estoy cansado"', () => {});
});

describe('PrimerEncuentroScreen - Emotional Tone', () => {
  // 5 casos: tonalidad
  it('detecta tone distressed', () => {});
  it('detecta tone guarded', () => {});
  it('detecta tone analytical', () => {});
  it('detecta tone open', () => {});
  it('detecta tone neutral', () => {});
});

describe('PrimerEncuentroScreen - Intensity Scoring', () => {
  // 3 casos: intensidad 0-5
  it('score 0 para texto neutro', () => {});
  it('score 3+ para "no puedo más + desesperado"', () => {});
  it('score 5 máximo para crisis indicators', () => {});
});

describe('PrimerEncuentroScreen - State Transitions', () => {
  // Progresión moment 1→5
  it('start en moment 1', () => {});
  it('transition 1→2 después de 3 turnos', () => {});
  it('moment 5 cierra sesión', () => {});
});

describe('PrimerEncuentroScreen - API Streaming', () => {
  // Integración con /api/chat
  it('parsea SSE messages correctamente', () => {});
  it('maneja errores de red sin colgar', () => {});
  it('valida respuesta del IA (rechaza clinical vocab)', () => {});
});
```

**Checklist:**
- [ ] Crear archivo test
- [ ] Implementar 20+ test cases
- [ ] Mock de /api/chat endpoint
- [ ] Verificar npm test pase

---

### Acción #2: Ampliar Crisis Keywords en PrimerEncuentroScreen
**Duración:** 30 minutos
**Criticidad:** 🔴 CRÍTICA (incomplete detection)
**Archivo:** `src/features/primerEncuentro/PrimerEncuentroScreen.tsx` línea 77-80

```typescript
// ANTES (línea 79):
const crisisKeywords = [
  'suicid', 'hacerme daño', 'no quiero vivir', 'quitarme la vida', 'terminar con todo'
];

// DESPUÉS:
const crisisKeywords = [
  // Ideación suicida explícita
  'suicid', 'quiero morir', 'quiero dejar de vivir', 'quitarme la vida', 'terminar con todo',
  // Autolesión
  'hacerme daño', 'lastimar', 'cortarme',
  // Metafórico
  'mejor no existir', 'no tengo razón para vivir', 'carga para otros',
  'nada importa', 'sin esperanza', 'no puedo más', 'quiero desaparecer',
  // Comportamental
  'no merezco vivir', 'nadie me quiere'
];
```

**Verificar:** Tests después del cambio

---

## 🟡 ACCIONES IMPORTANTES (Mañana 2026-03-18)

### Acción #3: Completar Módulo Terapeuta (PatientsTab)
**Duración:** 3-4 horas
**Criticidad:** 🟡 MEDIA (Sprint Semana 2)
**Tareas:**

- [ ] 2.1.1 Listado pacientes con búsqueda/filtros
  - Usar usePatientStore() para obtener patientFolders
  - Filtro por alias, fecha registro, estado

- [ ] 2.1.2 Carpeta clínica (reporte + notas + sesiones)
  - Mostrar InterviewReport (patient view + therapist view)
  - Log de sesiones (placeholder para histórico)
  - Indicador visual de riesgo (si crisis alert)

- [ ] 2.1.3 Editor de notas clínicas
  - Input para therapistNotes (libre)
  - Guardar en usePatientStore().updateTherapistNotes()

- [ ] 2.1.4 Visualización de InterviewReport
  - Patient view: mainMessage, problemList, strengths, nextSteps
  - Therapist view: formulación de caso, hypothesis, clinical alerts

**Archivo esperado:** `src/features/therapist/PatientsTab.tsx` (nuevo o expandido)

---

### Acción #4: Reinstalar node_modules y Ejecutar Suite de Tests
**Duración:** 30 minutos
**Criticidad:** 🟡 MEDIA (verificación de calidad)
**Comando:**

```bash
cd /sessions/loving-epic-brahmagupta/mnt/tcc-lab

# Limpiar
rm -rf node_modules .next dist

# Reinstalar
npm install --legacy-peer-deps

# Tests
npm test 2>&1 | tail -200  # Esperado: ≥98 tests green

# Type-check
npx tsc --noEmit  # Esperado: 0 errores

# KB Audit (si es posible)
npm run kb:audit  # Esperado: verde
```

**Observación:** Si sigue habiendo permisos, documentar el issue

---

## 🟢 ACCIONES SECUNDARIAS (Semana 2)

### Acción #5: Generar Documentación API.md
**Duración:** 2-3 horas
**Criticidad:** 🟢 BAJA (documentación)
**Contenido:**

```markdown
# API Reference — TCC-LAB v2.0

## Inventories

### BDI-II
```typescript
import { bdiIIEngine, BDI_II_DEFINITION } from '@knowledge/inventories';

const result = bdiIIEngine.score(administration);
// → InventoryResult { score, severity_label, critical_items_alerts, insights }
```

### Sesiones AC
```typescript
import { runFirstSessionAC } from '@knowledge/session/first.session.ac';

const output = await runFirstSessionAC(context);
// → FirstSessionResult { presentacion, bdiAdmin, psicoeducacion, ... }
```
```

---

### Acción #6: Crear CHANGELOG.md (v1.0 → v2.0)
**Duración:** 1 hora
**Formato:**

```markdown
# CHANGELOG

## [2.0.0] — 2026-03-17

### Added
- BDI-II with RCI analysis (Jacobson-Truax)
- AC Sessions 1-7 complete
- RC Sessions 1-3 complete
- Emotional analysis in Primer Encuentro
- Crisis detection + protocol pause
- Multi-technique dispatcher

### Changed
- Refactor inventories to pure engines
- Nuevo patient module con Zustand + IndexedDB

### Fixed
- Crisis keywords incomplete (v1.9)
- No tests in PrimerEncuentro (added v2.0)

### Security
- Patient data encrypted at rest (IndexedDB)
- API endpoint proxy (/api/chat) required for Claude integration
```

---

## 📊 RESUMEN DE DEPENDENCIAS

```
Acción #1 (Tests)           ← BLOQUEADOR de Acción #2
  ↓
Acción #2 (Crisis keywords)
  ↓
Acción #4 (npm test) ← Valida Acción #1 + #2
  ↓
Acción #3 (Terapeuta)  ← Independiente, puede paralelizarse
  ↓
Acción #5-6 (Docs) ← Última semana
```

---

## ⏰ TIMELINE RECOMENDADO

| Fecha | Acción | Duración | Estado |
|-------|--------|----------|--------|
| **Hoy (2026-03-17)** | #1 Tests + #2 Keywords | 2-3h | 🔴 Crítico |
| **2026-03-18** | #3 Terapeuta + #4 Tests | 3-4h | 🟡 Important |
| **2026-03-19-20** | #5 API docs + #6 Changelog | 3h | 🟢 Secondary |
| **2026-03-21-23** | RC validación + integración final | 2-3d | 🟡 End of week |
| **2026-03-24-31** | Semana 2: Módulo Terapeuta + validación | 5-7d | 🟡 Full sprint |
| **2026-03-31-04-07** | Semana 3: Docs + auditoría final | 3-5d | 🟢 Wrap-up |

---

## 📌 INDICADORES DE ÉXITO

**Hoy (2026-03-17):**
- ✅ PrimerEncuentroScreen.test.ts existe con 20+ casos
- ✅ Crisis keywords expandidas (15+ términos)
- ✅ npm test pasa para Primer Encuentro

**Mañana (2026-03-18):**
- ✅ Módulo Terapeuta básico funcional
- ✅ Todos los tests verdes (≥98)
- ✅ Type-check: 0 errores

**Fin de Semana 1 (2026-03-23):**
- ✅ 100% Sprint Semana 1 completado
- ✅ 70% Sprint Semana 2 completado
- ✅ Documentación base (API.md, CHANGELOG.md)

---

## 🚀 LISTO PARA ACCIÓN

**Archivos a crear/modificar:**
1. `src/features/primerEncuentro/PrimerEncuentroScreen.test.ts` (nuevo)
2. `src/features/primerEncuentro/PrimerEncuentroScreen.tsx` (línea 79-80)
3. `src/features/therapist/PatientsTab.tsx` (expandir)
4. `docs/API.md` (nuevo)
5. `CHANGELOG.md` (nuevo)

**Comandos a ejecutar:**
```bash
npm test
npx tsc --noEmit
npm run kb:audit
```

---

**Próxima revisión:** 2026-03-18 09:00 UTC
**Punto de escalación:** Si npm test falla → revisar node_modules

---

**Auditor:** Claude Haiku 4.5
**Generado:** 2026-03-17 14:45 UTC
