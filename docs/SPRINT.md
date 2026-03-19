# SPRINT TCC-LAB v2.0 — Integración Completa AC + Módulo Paciente

**Fecha inicio:** 2026-03-16
**Duración:** 3 semanas (horizonte: fin de marzo)
**Meta:** AC al 100% funcional (registro paciente → entrevista → sesiones → seguimiento)
**Status:** 🟡 En progreso

---

## 📋 RESUMEN EJECUTIVO

El informe `TCC-Lab_Informe_PatientModule.docx` documenta el estado actual del sistema:

- ✅ **PatientRegisterScreen**: Implementado, 287 tests en verde
- ✅ **Knowledge Base**: 9 técnicas (69/69 v2, 20/20 v3, 25/25 bridge)
- ✅ **Dispatcher Multi-técnica**: Funcional para AC y RC
- ✅ **Orquestador de Sesión**: Lógica ética+relacional+técnica integrada
- 🟡 **Módulo Paciente (historización)**: Parcial
- 🟡 **Flujos de Sesión (1-7)**: AC y RC con tests
- 🟠 **Módulo Terapeuta (PatientsTab)**: Listado básico, sin edición completa

---

## 🎯 OBJETIVOS POR SEMANA

### SEMANA 1: Cimientos Inventarios + AC Sesión 1
**Objetivo:** Tener AC funcional de registro → sesión 1 completa con BDI-II

#### 1.1 Integrar BDI-II Engine (Eje crítico)

| Tarea | Prioridad | Est. | Estado | Dependencias |
|-------|-----------|------|--------|--------------|
| **1.1.1** Integrar `bdi_ii.definition.ts` en KB | 🔴 | 0.5d | pendiente | — |
| **1.1.2** Implementar `bdi_ii.engine.ts` (scoring + critical items + validity) | 🔴 | 1d | pendiente | 1.1.1 |
| **1.1.3** Crear tests `bdi_ii.engine.test.ts` (casos críticos) | 🔴 | 0.5d | pendiente | 1.1.2 |
| **1.1.4** Registrar BDI-II en SharedArea (accessible desde AC) | 🔴 | 0.5d | pendiente | 1.1.2 |

**Subtareas de 1.1.2:**
- [ ] Parsear 21 ítems BDI-II (0-3 scale)
- [ ] Implementar scoring total (0-63)
- [ ] Detección de item 9 (suicidio ideación): score 2 o 3 = alert critica
- [ ] Validación: respuestas incompletas < 75% = invalid
- [ ] Integración con SharedArea.INVENTARIOS_GENERALES

---

#### 1.2 Completar Flujo Sesión 1 AC

| Tarea | Prioridad | Est. | Estado | Dependencias |
|-------|-----------|------|--------|--------------|
| **1.2.1** Implementar `first.session.ac.ts` (flujo Sesión 1 AC) | 🔴 | 1.5d | pendiente | 1.1.2 |
| **1.2.2** Integrar BDI-II admin en sesión 1 | 🔴 | 0.5d | pendiente | 1.2.1, 1.1.2 |
| **1.2.3** Implementar `first.session.ac.test.ts` (3 casos mínimo) | 🔴 | 0.5d | pendiente | 1.2.1 |

**Subtareas de 1.2.1 (sesión 1 AC):**
- [ ] Psicoeducación: modelo ABC + activación conductual
- [ ] Evaluación inicial: comportamientos evitados vs aproximación
- [ ] Asignación tarea: activity record para semana 1
- [ ] Contrato terapéutico: frecuencia sesiones + expectativas
- [ ] Salida: lista de actividades de bajo costo para próxima sesión

---

#### 1.3 Módulo Inventarios — Expansión

| Tarea | Prioridad | Est. | Estado | Dependencias |
|-------|-----------|------|--------|--------------|
| **1.3.1** Crear `bads.definition.ts` (25 ítems BADS, 4 subescalas) | 🟡 | 1d | pendiente | — |
| **1.3.2** Implementar `bads.engine.ts` | 🟡 | 1d | pendiente | 1.3.1 |
| **1.3.3** Crear `das.definition.ts` (40 ítems Actitudes Disfuncionales) | 🟡 | 1d | pendiente | — |
| **1.3.4** Implementar `das.engine.ts` | 🟡 | 1d | pendiente | 1.3.3 |

**Razonamiento:** BADS (Behavioral Activation for Depression Scale) es el complemento natural de AC. DAS (Dysfunctional Attitudes Scale) es el equivalente para RC. Ambos enriquecen la evaluación sin bloquear Sesión 1.

---

### SEMANA 2: Módulo Terapeuta (Revisión) + Sesiones 2-5 AC
**Objetivo:** Terapeuta puede ver pacientes con reportes + AC sesiones 2-5 funcionales

#### 2.1 Módulo Terapeuta — PatientsTab (Revisión y Ampliación)

| Tarea | Prioridad | Est. | Estado | Dependencias |
|-------|-----------|------|--------|--------------|
| **2.1.1** Implementar listado de pacientes con búsqueda/filtros | 🔴 | 1d | pendiente | — |
| **2.1.2** Carpeta clínica por paciente (reporte + notas + sesiones) | 🔴 | 1d | pendiente | 2.1.1 |
| **2.1.3** Editor de notas clínicas (therapistNotes) | 🟡 | 0.5d | pendiente | 2.1.2 |
| **2.1.4** Visualización de InterviewReport (pacientView + therapistView) | 🟡 | 1d | pendiente | 2.1.2 |

**Subtareas de 2.1.2 (carpeta clínica):**
- [ ] Datos demográficos del paciente (alias, edad, género, fecha registro)
- [ ] Reporte de entrevista (2 vistas)
- [ ] Log de sesiones (histórico de avance)
- [ ] Indicador visual de riesgo clínico (si existe alert critica)

---

#### 2.2 Sesiones AC (2-5) — Implementación

| Tarea | Prioridad | Est. | Estado | Dependencias |
|-------|-----------|------|--------|--------------|
| **2.2.1** Implementar `psychoeducation.session.ac.ts` (sesión 2 AC) | 🔴 | 1d | pendiente | 1.2.1 |
| **2.2.2** Implementar `goals.session.ac.ts` (sesión 4 AC — objetivos SMART) | 🔴 | 1d | pendiente | 1.2.1 |
| **2.2.3** Implementar `intermediate.session.ac.ts` (sesión 3 AC — revisión) | 🟡 | 1d | pendiente | 2.2.1 |
| **2.2.4** Implementar `evaluation.session.ac.ts` (sesión 6 AC — progreso) | 🟡 | 1d | pendiente | 2.2.2 |
| **2.2.5** Implementar `followup.session.ac.ts` (sesión 7 AC — cierre) | 🟡 | 0.5d | pendiente | 2.2.4 |

**Estructura de cada sesión:**
- Input: contexto paciente (Patient) + datos fase anterior
- Output: evaluación (score 0-100) + recomendación clínica + homework
- Tests: 3 casos por sesión (feliz, parcial, riesgo)

---

#### 2.3 Tests de Integración Sesión 1-3

| Tarea | Prioridad | Est. | Estado | Dependencias |
|-------|-----------|------|--------|--------------|
| **2.3.1** Tests integración: Sesión 1 + Sesión 2 (continuidad de datos) | 🟡 | 0.5d | pendiente | 2.2.1 |
| **2.3.2** Tests integración: Sesión 2 + Sesión 3 (análisis de cambio) | 🟡 | 0.5d | pendiente | 2.3.1 |
| **2.3.3** Verificar que todos los tests sigen en verde después de cambios | 🟡 | 0.5d | pendiente | 2.3.2 |

---

### SEMANA 3: RC Sesiones 1-3 + Documentación + Validación
**Objetivo:** RC funcional mínimo (sesiones 1-3) + documentación completa + auditoría final

#### 3.1 Sesiones RC (1-3) — Implementación Paralela a AC

| Tarea | Prioridad | Est. | Estado | Dependencias |
|-------|-----------|------|--------|--------------|
| **3.1.1** Implementar `assessment.session.rc.ts` (sesión 2 RC — distorsiones cognitivas) | 🟡 | 1d | pendiente | — |
| **3.1.2** Implementar `psychoeducation.session.rc.ts` (sesión 3 RC) | 🟡 | 1d | pendiente | 3.1.1 |
| **3.1.3** Implementar `goals.session.rc.ts` (sesión 4 RC — creencias objetivo) | 🟡 | 1d | pendiente | 3.1.1 |
| **3.1.4** Tests RC sesiones 1-3 | 🟡 | 1d | pendiente | 3.1.3 |

**Diferencia RC vs AC en dispatcher:**
```
AC:  baselineIntensity (SUDs 0-10) → comportamientos evitados
RC:  baselineIntensity × 10 → beliefConviction + cognitiveDistortions
```

---

#### 3.2 Documentación Completa

| Tarea | Prioridad | Est. | Estado | Dependencias |
|-------|-----------|------|--------|--------------|
| **3.2.1** Actualizar `PLAN.md` con arquitectura final v2+v3 | 🟢 | 0.5d | pendiente | — |
| **3.2.2** Generar `API.md` con ejemplos de uso por módulo | 🟢 | 1d | pendiente | — |
| **3.2.3** Generar `CHANGELOG.md` (versión 1.0.0 → 2.0.0) | 🟢 | 0.5d | pendiente | — |
| **3.2.4** Actualizar `INFORME_KNOWLEDGE_Y_TRABAJO.md` con Semana 3 | 🟢 | 0.5d | pendiente | 3.2.1 |

---

#### 3.3 Auditoría Final y Validación

| Tarea | Prioridad | Est. | Estado | Dependencias |
|-------|-----------|------|--------|--------------|
| **3.3.1** Ejecutar `npm run kb:audit` — meta: 100% verde | 🟢 | 0.5d | pendiente | 3.1.4 |
| **3.3.2** Ejecutar `npm test` — meta: ≥300 tests, todos verdes | 🟢 | 0.5d | pendiente | 3.3.1 |
| **3.3.3** Type-check: `npx tsc --noEmit` — meta: 0 errores | 🟢 | 0.5d | pendiente | 3.3.2 |
| **3.3.4** Auditoría de deuda técnica: @ts-ignore, TODO, FIXME | 🟢 | 0.5d | pendiente | 3.3.3 |

---

## 🔴 RUTA CRÍTICA

```
1.1.1 → 1.1.2 → 1.1.3 → 1.1.4
                  ↓
1.2.1 → 1.2.2 → 1.2.3
                  ↓
2.2.1 → 2.2.3 → 2.3.1 → 2.3.2 → 2.3.3
          ↓
2.2.2 → 2.2.4 → 2.2.5
                  ↓
3.1.1 → 3.1.4 → 3.3.1 → 3.3.2 → 3.3.3 → 3.3.4
```

**Camino más corto:** ~16 días de trabajo intensivo (4 días/semana × 3 semanas)

---

## 📊 MÉTRICAS DE ÉXITO

| Métrica | Meta Semana 1 | Meta Semana 2 | Meta Semana 3 |
|---------|---------------|---------------|---------------|
| Tests verdes | ≥200 | ≥250 | ≥300 |
| Técnicas funcionales | AC solo (Ses 1) | AC (Ses 1-7) | AC + RC (Ses 1-3) |
| Type errors | 0 | 0 | 0 |
| KB audit | 69/69 v2 | + BADS, DAS | 100% verde |
| Módulo Terapeuta | — | Listado básico | Carpeta + edición |
| Documentación | — | Plan.md v2 | API.md + CHANGELOG |

---

## 🎬 INSTRUCCIONES PARA EJECUCIÓN

### Inicio de Semana
1. Revisar la tabla de tareas de la semana
2. Usar skill `tcc-sprint-tracker` para ver estado actualizado
3. Ejecutar `npm run kb:audit` para baseline

### Durante Tarea
1. Crear branch: `git checkout -b feature/tarea-ID`
2. Implementar + tests (mínimo 3 casos por función)
3. Verificar: `npm test -- [archivo]`
4. Actualizar este SPRINT.md con estado real

### Fin de Tarea
1. `npm run kb:audit` — debe pasar
2. `npm test` — debe pasar
3. Commit: `git commit -m "feat(ID): descripción [Semana N]"`
4. Marcar tarea como ✅ en tabla

### Fin de Semana
1. Generar informe de progreso
2. Identificar bloqueadores
3. Reprioritizar Semana N+1 si es necesario

---

## 🚨 RIESGOS Y MITIGACIÓN

| Riesgo | Impacto | Mitigación |
|--------|---------|-----------|
| BDI-II con item 9 ambiguo | Alto | Usar score 2-3 como strict alert; validar con literatura |
| Proxy SUDs→Conviction imperfecto | Medio | Documentar; anotar como "laboratorio"; RC será reemplazado |
| Sesiones AC complejas (7 fases) | Medio | Dividir en micro-tests; usar pattern de flujos existentes |
| RC antes de completar AC | Bajo | Mantener orden ruta crítica; RC puede esperar a Semana 3 |

---

## 📁 ARCHIVOS CLAVE

**Generados en esta sesión:**
- ✅ `docs/TCC-Lab_Informe_PatientModule.docx` (10 secciones, 176KB)
- 📋 `SPRINT.md` (este archivo)

**Que se crearán:**
- `src/knowledge/inventories/engines/bdi_ii.engine.ts` + tests
- `src/knowledge/inventories/engines/bads.engine.ts` + tests
- `src/knowledge/inventories/engines/das.engine.ts` + tests
- `src/knowledge/session/first.session.ac.ts` + tests
- `src/knowledge/session/psychoeducation.session.ac.ts` + tests
- `src/knowledge/session/goals.session.ac.ts` + tests
- `src/knowledge/session/intermediate.session.ac.ts` + tests
- `src/knowledge/session/evaluation.session.ac.ts` + tests
- `src/knowledge/session/followup.session.ac.ts` + tests
- `src/knowledge/session/assessment.session.rc.ts` + tests
- `src/knowledge/session/psychoeducation.session.rc.ts` + tests
- `src/knowledge/session/goals.session.rc.ts` + tests
- `docs/API.md` (ejemplos de uso)
- `docs/CHANGELOG.md` (v1.0 → v2.0)

---

## 🎯 COMANDOS ÚTILES

```bash
# Auditoría completa
npm run kb:audit

# Tests específicos (durante desarrollo)
npm test -- src/knowledge/inventories/engines/bdi_ii.engine.test.ts

# Type-check
npx tsc --noEmit

# Ver todos los TODOs del proyecto
grep -r "TODO\|FIXME\|@ts-ignore" src/ --include="*.ts" --include="*.tsx"
```

---

**Generado:** 2026-03-16
**Última actualización:** 2026-03-16
**Próxima revisión:** Fin de Semana 1 (2026-03-23)
