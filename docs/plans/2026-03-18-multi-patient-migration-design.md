# Design: Multi-Patient Database Migration (A+C)

**Date**: 2026-03-18
**Status**: Approved

## Problem

The database was designed as single-user (comment in database.ts: "Un solo usuario, local, experimental"). Layer 6 (`patientRecords`) was added later to support multiple patients, but Layers 1-2 have no `patientId` FK — creating an inconsistency where sessions and clinical profiles can't be attributed to specific patients.

## Solution

### Option A: `patientId` in `Session`

Add `patientId: string` to the `Session` interface. All clinical records (Layer 3) already reference `sessionId`, so the chain becomes:

```
patientRecords.patientId → sessions.patientId → abcRecords.sessionId
```

### Option C: `clinicalProfile` per-patient

Remove the singleton assumption (`id=1`). Add `patientId: string` to `ClinicalProfile`. Each patient gets their own clinical profile with baseline, current phase, and session counts.

### Additionally: `patientId` in `Conversation`

Add optional `patientId?: string` to `Conversation` for traceability.

## Schema Changes (v7)

```typescript
// Session — add patientId
export interface Session {
  patientId: string;  // FK to patientRecords.patientId
  // ... existing fields unchanged ...
}

// ClinicalProfile — add patientId, remove singleton
export interface ClinicalProfile {
  id?: number;        // Auto-increment, no longer fixed at 1
  patientId: string;  // FK to patientRecords.patientId
  // ... existing fields unchanged ...
}

// Conversation — add optional patientId
export interface Conversation {
  patientId?: string; // Optional for backward compat
  // ... existing fields unchanged ...
}

// Dexie v7
this.version(7).stores({
  clinicalProfile: '++id, patientId, lastActiveAt, currentPhase',
  sessions: '++id, patientId, startedAt, phase, type, technique, status, timeOfDay, dayOfWeek',
  conversations: '++id, patientId, source, startedAt, endedAt',
});
```

## Helper Changes

| Function | Before | After |
|----------|--------|-------|
| `getOrCreateProfile()` | Always returns `id=1` | `getOrCreateProfile(patientId)` — finds by patientId |
| `touchLastActive()` | Updates `id=1` | `touchLastActive(patientId)` — updates by patientId |
| `createSession(type, phase, options)` | No patient context | `createSession(patientId, type, phase, options)` |

## Files Affected

| File | Change |
|------|--------|
| `src/db/database.ts` | Interfaces + helpers + v7 schema |
| `src/db/getLatestClinicalMessage.ts` | `.get(1)` → `.where('patientId')` |
| `src/components/TherapeuticSkillSelector.tsx` | `.get(1)` → `.where('patientId')` |

## What We Don't Touch (YAGNI)

- No `patientId` on Layer 3 tables (ABCRecord, etc.) — resolved via sessionId join
- No data migration — experimental, no production data
- No changes to `sessionStore.ts` — UI state, not DB
