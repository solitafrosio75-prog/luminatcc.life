# Migración Multi-Paciente — 18 de marzo de 2026

## Resumen

Sesión de trabajo que implementa soporte multi-paciente completo en tcc-lab.
Dos subsistemas afectados: **Dexie/IndexedDB** (capa browser) y **Prisma/SQLite** (capa Node/tests).

---

## 1. Prisma — Migración versión 7

### Cambio en `prisma/schema.prisma`

Se añadió el campo `patientId` al modelo `Session`:

```prisma
model Session {
  id        Int  @id @default(autoincrement())
  patientId Int?  // ID del paciente — FK implícita a PatientRecord.id
  ...
}
```

### Migración SQL generada

Archivo: `prisma/migrations/20260318XXXXXX_add_patient_id_to_session/migration.sql`

```sql
ALTER TABLE "Session" ADD COLUMN "patientId" INTEGER;
```

---

## 2. Dexie — Versión 7 con upgrade

### Cambios en `src/db/database.ts`

#### 2.1 Interfaz `ClinicalProfile`

```diff
- patientId: string;   // FK to patientRecords.patientId
+ patientRecordId: number;  // FK to patientRecords.id (numérico)
```

#### 2.2 Interfaz `Session`

```diff
- patientId: string;   // FK to patientRecords.patientId
+ patientId: number;   // FK to patientRecords.id (numérico)
```

#### 2.3 Bloque `version(7)` en el constructor

```typescript
this.version(7).stores({
  sessions: '++id, patientId, startedAt, phase, type, technique, status, timeOfDay, dayOfWeek',
  clinicalProfile: '++id, patientRecordId, lastActiveAt, currentPhase',
}).upgrade(tx => {
  // Sesiones legacy → paciente 1
  tx.table('sessions').toCollection().modify(s => {
    if (!s.patientId) s.patientId = 1;
  });
  // ClinicalProfile legacy → vinculado al primer PatientRecord
  tx.table('clinicalProfile').toCollection().modify(p => {
    if (!p.patientRecordId) p.patientRecordId = 1;
  });
});
```

La versión anterior (v7 sin upgrade) indexaba `&patientId` con unique constraint y expornía `patientId` como string, lo cual fue reemplazado íntegramente.

#### 2.4 Funciones helper actualizadas

Todas las funciones que antes buscaban por `patientId` (string) ahora resuelven primero el `PatientRecord.id` numérico:

| Función | Antes | Después |
|---|---|---|
| `getOrCreateProfile` | `.where('patientId').equals(patientId)` | resuelve `patientRecord.id` → `.where('patientRecordId').equals(id)` |
| `touchLastActive` | `.where('patientId').equals(patientId)` | resuelve `patientRecord.id` → `.where('patientRecordId').equals(id)` |
| `createSession` | `session.patientId = patientId` (string) | resuelve `patientRecord.id` → `session.patientId = id` (number) |

#### 2.5 Eliminación de interfaz duplicada

Se eliminó el bloque de código pegado al final del archivo que redeclaraba `ClinicalProfile` e `PatientRecord` como stubs incompletos, causando el error `TS2687: All declarations of 'patientRecordId' must have identical modifiers`.

---

## 3. `src/db/getLatestClinicalMessage.ts`

La función `getLatestClinicalMessage(patientId?: string)` fue actualizada para:

1. Resolver `PatientRecord.id` numérico desde el `patientId` (string) recibido.
2. Filtrar sesiones por `patientId` numérico.
3. Buscar perfil por `patientRecordId` numérico.

```typescript
// Antes
db.sessions.where('patientId').equals(patientId)   // patientId = string
db.clinicalProfile.where('patientId').equals(patientId)

// Después
const patientRecord = await db.patientRecords.where('patientId').equals(patientId).first();
const patientRecordId = patientRecord?.id;
db.sessions.where('patientId').equals(patientRecordId)      // number
db.clinicalProfile.where('patientRecordId').equals(patientRecordId)  // number
```

---

## 4. Módulos eliminados

Tres archivos muertos (`0` importadores en el codebase) fueron removidos:

| Archivo | Motivo de eliminación |
|---|---|
| `src/knowledge/therapist/relational.selector.example.ts` | Archivo demo/ejemplo, import con extensión `.ts` explícita (inválido en Vite), sin referencias externas |
| `src/services/api/integration.ts` | Wrapper thin sobre `handlers.ts` que no añadía lógica y no era importado por nadie |
| `src/services/api/contracts.ts` | Interfaces TypeScript (`SessionCreateRequest`, etc.) solo importadas por `integration.ts` (ya eliminado) |

Los módulos **conservados** del mismo directorio (`server/api.ts`, `services/api/handlers.ts`, `knowledge/schemas/endpoints.zod.ts`) forman la capa Express backend y tienen dependencias cruzadas válidas entre ellos.

---

## 5. Árbol de dependencias multi-paciente resultante

```
PatientRecord.id  ──→  ClinicalProfile.patientRecordId
                  ──→  Session.patientId  (number)
                               ↓
                   ABCRecord.sessionId
                   AutomaticThoughtRecord.sessionId
                   CognitiveRestructuringRecord.sessionId
                   TherapeuticGoal.sessionId
                   GoalProgressEntry.sessionId
                   TechniqueExecution.sessionId
                   ExposureHierarchy.sessionId
                   FollowUpEntry.sessionId
```

---

## 6. Errores de compilación

### Errores eliminados en esta sesión
- `TS2687: All declarations of 'patientRecordId' must have identical modifiers` — causado por el bloque duplicado al final de `database.ts`.

### Errores preexistentes (no relacionados, pendientes)
- `PatternAnalysisPanel.tsx` — parámetros implícitos `any` en callbacks (TS7006)
- `patternProcessor.ts` — tipo `InventoryChange` incompatible, propiedad `id` faltante (TS2322, TS2339)
- `patternProcessorIntegration.ts` — interfaz `PatientFolderExtended` (TS2430)
- `assessment.session.ac.ts` / `assessment.session.rc.ts` — propiedad `patientId` y `rapportScore` faltantes en tipos (TS2339)
