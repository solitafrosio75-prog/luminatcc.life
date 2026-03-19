# Fix: Persistencia dual desconectada — PatientRecord ↔ PatientRegistration

**Fecha:** 2026-03-18  
**Archivo modificado:** `src/features/patient/patientStore.ts`

---

## Problema detectado

Dos sistemas de persistencia almacenaban los datos del paciente de forma independiente:

| Sistema | Almacenamiento | Tipo | Clave |
|---|---|---|---|
| Zustand + `persist` middleware | `localStorage` (`homeflow-patients-v1`) | `PatientRegistration` | `patientId` (string) |
| Dexie.js | `IndexedDB` (tabla `patientRecords`) | `PatientRecord` | `id` (autoincrement) + `patientId` (string) |

### Flujo antes del fix

```
REGISTRO (PatientRegisterScreen.tsx)
  ├─ registerPatient()  →  Zustand/localStorage  ✅
  └─ db.patientRecords.add()  →  IndexedDB       ✅   ← ambos en sync

ACTUALIZACIÓN (PatientsTab.tsx, markInterviewComplete, sendReportToFolder)
  └─ updatePatient()  →  Zustand/localStorage     ✅
                       →  IndexedDB                ❌   ← NUNCA se propagaba

RECARGA como paciente existente (PatientSelectScreen.tsx)
  └─ db.patientRecords.orderBy().toArray()  →  lee IndexedDB  →  datos VIEJOS
```

**Resultado:** Si el terapeuta editaba datos del paciente (alias, género, notas de derivación, áreas afectadas, etc.) desde `PatientsTab`, o si se marcaba la entrevista como completada, esos cambios solo existían en `localStorage`. Al recargar la app y seleccionar el paciente desde `PatientSelectScreen`, se leían los datos originales de IndexedDB — sin las actualizaciones.

---

## Solución implementada

### 1. Nueva función `persistToIndexedDB()`

```ts
function persistToIndexedDB(
  patientId: string,
  updates: Partial<PatientRegistration>,
): void {
  const mapped: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(updates)) {
    // Convertir epoch (ms) → Date para campos temporales
    if ((key === 'lastUpdatedAt' || key === 'createdAt') && typeof value === 'number') {
      mapped[key] = new Date(value);
    } else if ((key === 'interviewCompletedAt' || key === 'safetyCheckAt') && typeof value === 'number') {
      mapped[key] = new Date(value);
    } else if (key === 'interviewReportSentAt') {
      continue; // Solo existe en Zustand, no en PatientRecord
    } else {
      mapped[key] = value;
    }
  }
  mapped.lastUpdatedAt = new Date();

  db.patientRecords
    .where('patientId').equals(patientId)
    .modify(mapped)
    .catch((err) => console.error('[patientStore] Error syncing to IndexedDB:', err));
}
```

**Decisiones de diseño:**
- **Fire-and-forget:** La escritura a IndexedDB es asíncrona y no bloquea la UI. Si falla, se loguea pero la app sigue funcionando.
- **Conversión de tipos:** `PatientRegistration` usa `number` (epoch ms) para fechas; `PatientRecord` usa `Date`. La función convierte automáticamente.
- **Filtrado de campos exclusivos:** `interviewReportSentAt` solo existe en el store Zustand y se omite al escribir a IndexedDB.

### 2. Acciones del store modificadas

| Acción | Qué propagaba antes | Qué propaga ahora |
|---|---|---|
| `updatePatient(id, updates)` | Solo Zustand | Zustand + `db.patientRecords.modify(updates)` |
| `markInterviewComplete(id)` | Solo Zustand | Zustand + `db.patientRecords.modify({ interviewCompleted, interviewCompletedAt })` |
| `sendReportToFolder(id, report)` | Solo Zustand | Zustand + `db.patientRecords.modify({ lastUpdatedAt })` |

### 3. Flujo después del fix

```
REGISTRO (PatientRegisterScreen.tsx)
  ├─ registerPatient()          →  Zustand/localStorage  ✅
  └─ db.patientRecords.add()    →  IndexedDB             ✅

ACTUALIZACIÓN (cualquier acción)
  ├─ updatePatient()            →  Zustand/localStorage   ✅
  └─ persistToIndexedDB()       →  IndexedDB              ✅  ← NUEVO

RECARGA como paciente existente (PatientSelectScreen.tsx)
  └─ db.patientRecords.toArray()  →  lee IndexedDB  →  datos ACTUALIZADOS ✅
```

---

## Archivos involucrados (referencia)

- `src/features/patient/patientStore.ts` — **modificado** (import de `db`, `persistToIndexedDB()`, 3 acciones actualizadas)
- `src/features/patient/PatientRegisterScreen.tsx` — sin cambios (ya escribía a ambos)
- `src/features/patient/PatientSelectScreen.tsx` — sin cambios (ya leía de IndexedDB)
- `src/features/therapist/PatientsTab.tsx` — sin cambios (llama `updatePatient()` que ahora propaga)
- `src/db/database.ts` — sin cambios (define `PatientRecord` y la tabla)
