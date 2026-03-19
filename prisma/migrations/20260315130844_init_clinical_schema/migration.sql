-- CreateTable
CREATE TABLE "ClinicalProfile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "alias" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" DATETIME NOT NULL,
    "chiefComplaint" TEXT NOT NULL DEFAULT '',
    "problemOnset" TEXT NOT NULL DEFAULT '',
    "problemFrequency" TEXT NOT NULL DEFAULT 'daily',
    "problemDuration" TEXT NOT NULL DEFAULT 'months',
    "previousTreatment" BOOLEAN NOT NULL DEFAULT false,
    "previousTreatmentNotes" TEXT,
    "areasAffected" JSONB NOT NULL,
    "baselineSUDs" INTEGER,
    "baselineFunctionalImpairment" TEXT,
    "baselineCapturedAt" DATETIME,
    "currentPhase" TEXT NOT NULL DEFAULT 'intake',
    "phaseStartedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionCountByPhase" JSONB NOT NULL,
    "intakeCompleted" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "SymptomEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "description" TEXT NOT NULL,
    "emotionCategory" TEXT NOT NULL,
    "intensityAtOnset" INTEGER NOT NULL,
    "frequencyAtOnset" TEXT NOT NULL,
    "durationAtOnset" TEXT NOT NULL,
    "currentIntensity" INTEGER NOT NULL,
    "currentFrequency" TEXT NOT NULL,
    "capturedAt" DATETIME NOT NULL,
    "capturedInSessionId" INTEGER,
    "lastUpdatedAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "linkedGoalId" INTEGER,
    "updateNotes" JSONB NOT NULL
);

-- CreateTable
CREATE TABLE "Session" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "technique" TEXT,
    "startedAt" DATETIME NOT NULL,
    "endedAt" DATETIME,
    "durationMinutes" INTEGER,
    "timeOfDay" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "sudsAtStart" INTEGER,
    "sudsAtEnd" INTEGER,
    "dominantEmotionAtStart" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "sessionNote" TEXT
);

-- CreateTable
CREATE TABLE "PsychoeducationLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sessionId" INTEGER NOT NULL,
    "completedAt" DATETIME NOT NULL,
    "module" TEXT NOT NULL,
    "comprehensionRating" INTEGER NOT NULL,
    "questionAsked" TEXT,
    "personalInsight" TEXT,
    CONSTRAINT "PsychoeducationLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ABCRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sessionId" INTEGER NOT NULL,
    "capturedAt" DATETIME NOT NULL,
    "linkedSymptomId" INTEGER,
    "antecedentEmotion" TEXT NOT NULL,
    "sudsAtAntecedent" INTEGER NOT NULL,
    "behaviorType" TEXT NOT NULL,
    "consequenceType" TEXT NOT NULL,
    "antecedent" JSONB NOT NULL,
    "behavior" JSONB NOT NULL,
    "consequence" JSONB NOT NULL,
    "analysis" JSONB,
    "cognitiveDistortionsDetected" JSONB NOT NULL,
    "isAmendment" BOOLEAN NOT NULL DEFAULT false,
    "amendedFrom" INTEGER,
    CONSTRAINT "ABCRecord_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AutomaticThoughtRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sessionId" INTEGER NOT NULL,
    "capturedAt" DATETIME NOT NULL,
    "linkedABCRecordId" INTEGER,
    "thoughtText" TEXT NOT NULL,
    "situationThatTriggered" TEXT NOT NULL,
    "emotion" TEXT NOT NULL,
    "emotionIntensity" INTEGER NOT NULL,
    "detectedDistortions" JSONB NOT NULL,
    "detectionConfidence" TEXT,
    "isAmendment" BOOLEAN NOT NULL DEFAULT false,
    "amendedFrom" INTEGER,
    CONSTRAINT "AutomaticThoughtRecord_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CognitiveRestructuringRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sessionId" INTEGER NOT NULL,
    "completedAt" DATETIME NOT NULL,
    "automaticThoughtRecordId" INTEGER NOT NULL,
    "socraticDialogue" JSONB,
    "alternativeThought" TEXT NOT NULL,
    "beliefInAlternative" INTEGER NOT NULL,
    "beliefInOriginalAfter" INTEGER NOT NULL,
    "emotionAfter" TEXT NOT NULL,
    "emotionIntensityAfter" INTEGER NOT NULL,
    "distortionsAddressed" JSONB NOT NULL,
    "effectivenessRating" INTEGER NOT NULL,
    "feltBetter" BOOLEAN NOT NULL,
    "actionPlanned" TEXT,
    "actionCompleted" BOOLEAN,
    CONSTRAINT "CognitiveRestructuringRecord_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TherapeuticGoal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "goalText" TEXT NOT NULL,
    "smart" JSONB NOT NULL,
    "targetBehavior" TEXT NOT NULL,
    "linkedSymptomId" INTEGER,
    "baseline" JSONB NOT NULL,
    "target" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "achievedAt" DATETIME,
    "revisedNotes" TEXT,
    "assignedTechniques" JSONB NOT NULL,
    CONSTRAINT "TherapeuticGoal_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GoalProgressEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "goalId" INTEGER NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "measuredAt" DATETIME NOT NULL,
    "currentValue" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "userNarrative" TEXT,
    "perceivedDifficulty" INTEGER NOT NULL,
    "changeFromBaseline" REAL NOT NULL,
    "percentChangeFromBaseline" REAL NOT NULL,
    CONSTRAINT "GoalProgressEntry_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "TherapeuticGoal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GoalProgressEntry_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TechniqueExecution" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sessionId" INTEGER NOT NULL,
    "executedAt" DATETIME NOT NULL,
    "technique" TEXT NOT NULL,
    "variant" TEXT,
    "emotionAtStart" TEXT NOT NULL,
    "sudsAtStart" INTEGER NOT NULL,
    "hourOfDay" INTEGER NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL,
    "completionPercentage" INTEGER,
    "abandonedReason" TEXT,
    "sudsAtEnd" INTEGER,
    "emotionAtEnd" TEXT,
    "sudsChange" INTEGER,
    "effectivenessRating" INTEGER,
    "wouldRepeat" BOOLEAN,
    "userNote" TEXT,
    "linkedABCRecordId" INTEGER,
    "linkedThoughtRecordId" INTEGER,
    "linkedGoalId" INTEGER,
    "linkedExposureStepId" TEXT,
    CONSTRAINT "TechniqueExecution_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExposureHierarchy" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "linkedGoalId" INTEGER,
    "targetBehavior" TEXT NOT NULL,
    "rationale" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "currentStepIndex" INTEGER NOT NULL DEFAULT 0,
    "completedAt" DATETIME,
    "totalAttempts" INTEGER NOT NULL DEFAULT 0,
    "totalSuccesses" INTEGER NOT NULL DEFAULT 0,
    "averageSUDsReduction" REAL NOT NULL DEFAULT 0,
    "steps" JSONB NOT NULL,
    CONSTRAINT "ExposureHierarchy_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FollowUpEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sessionId" INTEGER NOT NULL,
    "recordedAt" DATETIME NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "currentSUDs" INTEGER NOT NULL,
    "perceivedProgress" TEXT NOT NULL,
    "baselineSUDsReference" INTEGER NOT NULL,
    "sudsChangeFromBaseline" INTEGER NOT NULL,
    "percentChangeFromBaseline" REAL NOT NULL,
    "techniquesStillUsing" JSONB NOT NULL,
    "techniqueFrequency" TEXT NOT NULL,
    "relapseRiskSigns" JSONB,
    "relapsePreventionPlan" TEXT,
    "whatIsWorkingWell" TEXT,
    "mainChallenge" TEXT,
    "nextSteps" TEXT,
    CONSTRAINT "FollowUpEntry_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TechniqueEffectivenessCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "totalExecutions" INTEGER NOT NULL DEFAULT 0,
    "completedExecutions" INTEGER NOT NULL DEFAULT 0,
    "completionRate" REAL NOT NULL DEFAULT 0,
    "averageSUDsChange" REAL NOT NULL DEFAULT 0,
    "medianSUDsChange" REAL NOT NULL DEFAULT 0,
    "stdDevSUDsChange" REAL NOT NULL DEFAULT 0,
    "averageEffectivenessRating" REAL NOT NULL DEFAULT 0,
    "percentWouldRepeat" REAL NOT NULL DEFAULT 0,
    "bestHoursOfDay" JSONB NOT NULL,
    "bestDaysOfWeek" JSONB NOT NULL,
    "mostEffectiveForEmotions" JSONB NOT NULL,
    "lastCalculatedAt" DATETIME NOT NULL,
    "basedOnExecutionCount" INTEGER NOT NULL DEFAULT 0,
    "recommendationScore" REAL NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "BaselineSnapshot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "capturedAt" DATETIME NOT NULL,
    "frozenAt" DATETIME NOT NULL,
    "metricsData" JSONB NOT NULL,
    "validityData" JSONB,
    "usableForClinicalSignificance" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "source" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "durationMs" INTEGER,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "summary" TEXT,
    "clinicalSnapshot" JSONB
);

-- CreateTable
CREATE TABLE "ConversationMessage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "conversationId" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    CONSTRAINT "ConversationMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ClinicalProfile_lastActiveAt_idx" ON "ClinicalProfile"("lastActiveAt");

-- CreateIndex
CREATE INDEX "ClinicalProfile_currentPhase_idx" ON "ClinicalProfile"("currentPhase");

-- CreateIndex
CREATE INDEX "SymptomEntry_capturedAt_idx" ON "SymptomEntry"("capturedAt");

-- CreateIndex
CREATE INDEX "SymptomEntry_emotionCategory_idx" ON "SymptomEntry"("emotionCategory");

-- CreateIndex
CREATE INDEX "SymptomEntry_status_idx" ON "SymptomEntry"("status");

-- CreateIndex
CREATE INDEX "SymptomEntry_capturedInSessionId_idx" ON "SymptomEntry"("capturedInSessionId");

-- CreateIndex
CREATE INDEX "SymptomEntry_linkedGoalId_idx" ON "SymptomEntry"("linkedGoalId");

-- CreateIndex
CREATE INDEX "Session_startedAt_idx" ON "Session"("startedAt");

-- CreateIndex
CREATE INDEX "Session_phase_idx" ON "Session"("phase");

-- CreateIndex
CREATE INDEX "Session_type_idx" ON "Session"("type");

-- CreateIndex
CREATE INDEX "Session_technique_idx" ON "Session"("technique");

-- CreateIndex
CREATE INDEX "Session_status_idx" ON "Session"("status");

-- CreateIndex
CREATE INDEX "Session_timeOfDay_idx" ON "Session"("timeOfDay");

-- CreateIndex
CREATE INDEX "Session_dayOfWeek_idx" ON "Session"("dayOfWeek");

-- CreateIndex
CREATE INDEX "PsychoeducationLog_sessionId_idx" ON "PsychoeducationLog"("sessionId");

-- CreateIndex
CREATE INDEX "PsychoeducationLog_completedAt_idx" ON "PsychoeducationLog"("completedAt");

-- CreateIndex
CREATE INDEX "PsychoeducationLog_module_idx" ON "PsychoeducationLog"("module");

-- CreateIndex
CREATE INDEX "ABCRecord_capturedAt_idx" ON "ABCRecord"("capturedAt");

-- CreateIndex
CREATE INDEX "ABCRecord_sessionId_idx" ON "ABCRecord"("sessionId");

-- CreateIndex
CREATE INDEX "ABCRecord_linkedSymptomId_idx" ON "ABCRecord"("linkedSymptomId");

-- CreateIndex
CREATE INDEX "ABCRecord_antecedentEmotion_idx" ON "ABCRecord"("antecedentEmotion");

-- CreateIndex
CREATE INDEX "ABCRecord_sudsAtAntecedent_idx" ON "ABCRecord"("sudsAtAntecedent");

-- CreateIndex
CREATE INDEX "ABCRecord_behaviorType_idx" ON "ABCRecord"("behaviorType");

-- CreateIndex
CREATE INDEX "ABCRecord_consequenceType_idx" ON "ABCRecord"("consequenceType");

-- CreateIndex
CREATE INDEX "ABCRecord_isAmendment_idx" ON "ABCRecord"("isAmendment");

-- CreateIndex
CREATE INDEX "AutomaticThoughtRecord_capturedAt_idx" ON "AutomaticThoughtRecord"("capturedAt");

-- CreateIndex
CREATE INDEX "AutomaticThoughtRecord_sessionId_idx" ON "AutomaticThoughtRecord"("sessionId");

-- CreateIndex
CREATE INDEX "AutomaticThoughtRecord_linkedABCRecordId_idx" ON "AutomaticThoughtRecord"("linkedABCRecordId");

-- CreateIndex
CREATE INDEX "AutomaticThoughtRecord_emotion_idx" ON "AutomaticThoughtRecord"("emotion");

-- CreateIndex
CREATE INDEX "AutomaticThoughtRecord_emotionIntensity_idx" ON "AutomaticThoughtRecord"("emotionIntensity");

-- CreateIndex
CREATE INDEX "AutomaticThoughtRecord_isAmendment_idx" ON "AutomaticThoughtRecord"("isAmendment");

-- CreateIndex
CREATE INDEX "CognitiveRestructuringRecord_completedAt_idx" ON "CognitiveRestructuringRecord"("completedAt");

-- CreateIndex
CREATE INDEX "CognitiveRestructuringRecord_sessionId_idx" ON "CognitiveRestructuringRecord"("sessionId");

-- CreateIndex
CREATE INDEX "CognitiveRestructuringRecord_automaticThoughtRecordId_idx" ON "CognitiveRestructuringRecord"("automaticThoughtRecordId");

-- CreateIndex
CREATE INDEX "CognitiveRestructuringRecord_emotionIntensityAfter_idx" ON "CognitiveRestructuringRecord"("emotionIntensityAfter");

-- CreateIndex
CREATE INDEX "CognitiveRestructuringRecord_effectivenessRating_idx" ON "CognitiveRestructuringRecord"("effectivenessRating");

-- CreateIndex
CREATE INDEX "TherapeuticGoal_createdAt_idx" ON "TherapeuticGoal"("createdAt");

-- CreateIndex
CREATE INDEX "TherapeuticGoal_sessionId_idx" ON "TherapeuticGoal"("sessionId");

-- CreateIndex
CREATE INDEX "TherapeuticGoal_status_idx" ON "TherapeuticGoal"("status");

-- CreateIndex
CREATE INDEX "TherapeuticGoal_linkedSymptomId_idx" ON "TherapeuticGoal"("linkedSymptomId");

-- CreateIndex
CREATE INDEX "GoalProgressEntry_measuredAt_idx" ON "GoalProgressEntry"("measuredAt");

-- CreateIndex
CREATE INDEX "GoalProgressEntry_goalId_idx" ON "GoalProgressEntry"("goalId");

-- CreateIndex
CREATE INDEX "GoalProgressEntry_sessionId_idx" ON "GoalProgressEntry"("sessionId");

-- CreateIndex
CREATE INDEX "TechniqueExecution_executedAt_idx" ON "TechniqueExecution"("executedAt");

-- CreateIndex
CREATE INDEX "TechniqueExecution_sessionId_idx" ON "TechniqueExecution"("sessionId");

-- CreateIndex
CREATE INDEX "TechniqueExecution_technique_idx" ON "TechniqueExecution"("technique");

-- CreateIndex
CREATE INDEX "TechniqueExecution_emotionAtStart_idx" ON "TechniqueExecution"("emotionAtStart");

-- CreateIndex
CREATE INDEX "TechniqueExecution_sudsAtStart_idx" ON "TechniqueExecution"("sudsAtStart");

-- CreateIndex
CREATE INDEX "TechniqueExecution_sudsChange_idx" ON "TechniqueExecution"("sudsChange");

-- CreateIndex
CREATE INDEX "TechniqueExecution_completed_idx" ON "TechniqueExecution"("completed");

-- CreateIndex
CREATE INDEX "TechniqueExecution_hourOfDay_idx" ON "TechniqueExecution"("hourOfDay");

-- CreateIndex
CREATE INDEX "TechniqueExecution_dayOfWeek_idx" ON "TechniqueExecution"("dayOfWeek");

-- CreateIndex
CREATE INDEX "ExposureHierarchy_createdAt_idx" ON "ExposureHierarchy"("createdAt");

-- CreateIndex
CREATE INDEX "ExposureHierarchy_sessionId_idx" ON "ExposureHierarchy"("sessionId");

-- CreateIndex
CREATE INDEX "ExposureHierarchy_linkedGoalId_idx" ON "ExposureHierarchy"("linkedGoalId");

-- CreateIndex
CREATE INDEX "ExposureHierarchy_status_idx" ON "ExposureHierarchy"("status");

-- CreateIndex
CREATE INDEX "FollowUpEntry_recordedAt_idx" ON "FollowUpEntry"("recordedAt");

-- CreateIndex
CREATE INDEX "FollowUpEntry_sessionId_idx" ON "FollowUpEntry"("sessionId");

-- CreateIndex
CREATE INDEX "FollowUpEntry_weekNumber_idx" ON "FollowUpEntry"("weekNumber");

-- CreateIndex
CREATE INDEX "FollowUpEntry_currentSUDs_idx" ON "FollowUpEntry"("currentSUDs");

-- CreateIndex
CREATE INDEX "FollowUpEntry_perceivedProgress_idx" ON "FollowUpEntry"("perceivedProgress");

-- CreateIndex
CREATE INDEX "TechniqueEffectivenessCache_recommendationScore_idx" ON "TechniqueEffectivenessCache"("recommendationScore");

-- CreateIndex
CREATE INDEX "TechniqueEffectivenessCache_lastCalculatedAt_idx" ON "TechniqueEffectivenessCache"("lastCalculatedAt");

-- CreateIndex
CREATE INDEX "BaselineSnapshot_capturedAt_idx" ON "BaselineSnapshot"("capturedAt");

-- CreateIndex
CREATE INDEX "BaselineSnapshot_usableForClinicalSignificance_idx" ON "BaselineSnapshot"("usableForClinicalSignificance");

-- CreateIndex
CREATE INDEX "Conversation_source_idx" ON "Conversation"("source");

-- CreateIndex
CREATE INDEX "Conversation_startedAt_idx" ON "Conversation"("startedAt");

-- CreateIndex
CREATE INDEX "Conversation_endedAt_idx" ON "Conversation"("endedAt");

-- CreateIndex
CREATE INDEX "ConversationMessage_conversationId_idx" ON "ConversationMessage"("conversationId");

-- CreateIndex
CREATE INDEX "ConversationMessage_timestamp_idx" ON "ConversationMessage"("timestamp");
