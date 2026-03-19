# Multi-Patient Database Migration (A+C) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add `patientId` FK to `Session`, `ClinicalProfile`, and `Conversation` so the system supports multiple patients with isolated clinical data.

**Architecture:** Extend 3 Dexie interfaces with `patientId: string`, bump schema to v7, update all helpers that assumed singleton `clinicalProfile` (id=1) to accept `patientId` as parameter. Consumer files that call `.get(1)` are updated to query by `patientId`.

**Tech Stack:** Dexie.js (IndexedDB), TypeScript, React

---

### Task 1: Add `patientId` to interfaces in database.ts

**Files:**
- Modify: `src/db/database.ts:42-73` (ClinicalProfile interface)
- Modify: `src/db/database.ts:118-154` (Session interface)
- Modify: `src/db/database.ts:594-606` (Conversation interface)

**Step 1: Add `patientId` to `ClinicalProfile`**

In `src/db/database.ts`, add after `id?: number;` (line 43):

```typescript
patientId: string;            // FK to patientRecords.patientId
```

**Step 2: Add `patientId` to `Session`**

In `src/db/database.ts`, add after `id?: number;` (line 119):

```typescript
patientId: string;            // FK to patientRecords.patientId
```

**Step 3: Add `patientId` to `Conversation`**

In `src/db/database.ts`, add after `id?: number;` (line 595):

```typescript
patientId?: string;           // Optional FK to patientRecords.patientId
```

**Step 4: Verify types compile**

Run: `npx tsc --noEmit 2>&1 | head -30`
Expected: Type errors in helpers that create Session/ClinicalProfile without patientId (this is correct — we fix them in Task 2)

---

### Task 2: Bump schema to v7

**Files:**
- Modify: `src/db/database.ts:789-799` (after version 6 block)

**Step 1: Add version 7 store definition**

Add after the version 6 block (line 799):

```typescript
// Version 7: Multi-patient support — patientId FK on Session, ClinicalProfile, Conversation.
this.version(7).stores({
  clinicalProfile:
    '++id, patientId, lastActiveAt, currentPhase',
  sessions:
    '++id, patientId, startedAt, phase, type, technique, status, timeOfDay, dayOfWeek',
  conversations:
    '++id, patientId, source, startedAt, endedAt',
});
```

---

### Task 3: Update helper functions in database.ts

**Files:**
- Modify: `src/db/database.ts:813-834` (getOrCreateProfile)
- Modify: `src/db/database.ts:838-839` (touchLastActive)
- Modify: `src/db/database.ts:856-891` (createSession)

**Step 1: Rewrite `getOrCreateProfile`**

Replace lines 813-835 with:

```typescript
export async function getOrCreateProfile(patientId: string): Promise<ClinicalProfile> {
  const existing = await db.clinicalProfile.where('patientId').equals(patientId).first();
  if (existing) return existing;

  const now = new Date();
  const newProfile: ClinicalProfile = {
    patientId,
    createdAt: now,
    lastActiveAt: now,
    chiefComplaint: '',
    problemOnset: '',
    problemFrequency: 'daily',
    problemDuration: 'months',
    previousTreatment: false,
    areasAffected: [],
    currentPhase: 'intake',
    phaseStartedAt: now,
    sessionCountByPhase: {},
    intakeCompleted: false,
  };

  const id = await db.clinicalProfile.add(newProfile);
  return (await db.clinicalProfile.get(id))!;
}
```

**Step 2: Rewrite `touchLastActive`**

Replace lines 838-839 with:

```typescript
export async function touchLastActive(patientId: string): Promise<void> {
  const profile = await db.clinicalProfile.where('patientId').equals(patientId).first();
  if (profile?.id != null) {
    await db.clinicalProfile.update(profile.id, { lastActiveAt: new Date() });
  }
}
```

**Step 3: Rewrite `createSession`**

Replace lines 856-891 with:

```typescript
export async function createSession(
  patientId: string,
  type: Session['type'],
  phase: ProtocolPhase,
  options?: {
    technique?: TCCTechnique;
    sudsAtStart?: SUDs;
    dominantEmotionAtStart?: ClinicalEmotion;
  }
): Promise<Session & { id: number }> {
  const now = new Date();
  const session: Session = {
    patientId,
    type,
    phase,
    technique: options?.technique,
    startedAt: now,
    timeOfDay: getCurrentTimeOfDay(),
    dayOfWeek: now.getDay() as Session['dayOfWeek'],
    sudsAtStart: options?.sudsAtStart,
    dominantEmotionAtStart: options?.dominantEmotionAtStart,
    status: 'active',
  };

  const id = await db.sessions.add(session);

  const profile = await db.clinicalProfile.where('patientId').equals(patientId).first();
  if (profile?.id != null) {
    const counts = { ...profile.sessionCountByPhase };
    counts[phase] = (counts[phase] ?? 0) + 1;
    await db.clinicalProfile.update(profile.id, {
      sessionCountByPhase: counts,
      lastActiveAt: now,
    });
  }

  return { ...session, id: id as number };
}
```

**Step 4: Verify types compile**

Run: `npx tsc --noEmit 2>&1 | head -30`
Expected: Errors only in consumer files (getLatestClinicalMessage.ts, TherapeuticSkillSelector.tsx) — fixed in Task 4.

---

### Task 4: Update consumer files

**Files:**
- Modify: `src/db/getLatestClinicalMessage.ts:7-28`
- Modify: `src/components/TherapeuticSkillSelector.tsx:52`

**Step 1: Update `getLatestClinicalMessage`**

The function currently takes no arguments and uses `.get(1)`. Change signature to accept `patientId` and query by it:

Replace the entire function (lines 7-28):

```typescript
export async function getLatestClinicalMessage(patientId?: string): Promise<string> {
    // 1. Última sesión completada (filtered by patient if provided)
    let sessionsQuery = db.sessions.orderBy('startedAt').reverse().filter(s => s.status === 'completed');
    if (patientId) {
        sessionsQuery = db.sessions.where('patientId').equals(patientId).reverse().filter(s => s.status === 'completed');
    }
    const lastSession = await sessionsQuery.first();
    if (lastSession && lastSession.sessionNote) {
        return lastSession.sessionNote;
    }

    // 2. Último síntoma activo
    const lastSymptom = await db.symptomEntries.orderBy('lastUpdatedAt').reverse().filter(s => s.status === 'active').first();
    if (lastSymptom && lastSymptom.description) {
        return `Síntoma actual: ${lastSymptom.description}`;
    }

    // 3. Motivo de consulta
    if (patientId) {
        const profile = await db.clinicalProfile.where('patientId').equals(patientId).first();
        if (profile && profile.chiefComplaint) {
            return `Motivo de consulta: ${profile.chiefComplaint}`;
        }
    }

    // 4. Fallback
    return 'No hay registro clínico reciente.';
}
```

**Step 2: Update `TherapeuticSkillSelector.tsx`**

At line 52, replace:
```typescript
db.clinicalProfile.get(1).then(profile => {
```

With:
```typescript
db.clinicalProfile.toCollection().first().then(profile => {
```

Note: This component doesn't have patient context yet. Using `.first()` is a safe interim — it gets whatever profile exists. When this component is wired into a patient-aware route, it should receive `patientId` as prop and use `.where('patientId').equals(patientId).first()`.

**Step 3: Full type check**

Run: `npx tsc --noEmit`
Expected: 0 errors

---

### Task 5: Commit

**Step 1: Stage and commit**

```bash
git add src/db/database.ts src/db/getLatestClinicalMessage.ts src/components/TherapeuticSkillSelector.tsx
git commit -m "feat(db): add patientId FK to Session, ClinicalProfile, Conversation (v7)

Multi-patient support: sessions and clinical profiles are now
attributed to specific patients via patientId. Helpers updated
to accept patientId parameter instead of assuming singleton id=1."
```
