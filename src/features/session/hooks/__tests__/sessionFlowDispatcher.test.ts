/**
 * sessionFlowDispatcher.test.ts — Tests del dispatcher multi-técnica
 *
 * Verifica que:
 * 1. getActiveTechnique() resuelve correctamente AC/RC desde clinicalProfile
 * 2. Cada dispatcher llama la función de flujo correcta (AC o RC)
 * 3. Los input adapters transforman escalas correctamente (SUDs→Conviction)
 * 4. buildSessionContext genera techniqueId desde clinicalProfile
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { BDIProfileAnalysis } from '../../../../knowledge/inventories/engines/bdi_ii.engine';
import type { SessionContext } from '../../../../knowledge/session/session.orchestrator';

// ── Mock de todos los flujos AC ──────────────────────────────────────────────
vi.mock('../../../../knowledge/session/assessment.session.ac', () => ({
    runAssessmentSessionAC: vi.fn().mockResolvedValue({ _type: 'ac_assessment' }),
}));
vi.mock('../../../../knowledge/session/psychoeducation.session.ac', () => ({
    runPsychoeducationSessionAC: vi.fn().mockResolvedValue({ _type: 'ac_psychoeducation' }),
}));
vi.mock('../../../../knowledge/session/goals.session.ac', () => ({
    runGoalsSessionAC: vi.fn().mockResolvedValue({ _type: 'ac_goals' }),
}));
vi.mock('../../../../knowledge/session/evaluation.session.ac', () => ({
    runEvaluationSessionAC: vi.fn().mockResolvedValue({ _type: 'ac_evaluation' }),
}));
vi.mock('../../../../knowledge/session/followup.session.ac', () => ({
    runFollowUpSessionAC: vi.fn().mockResolvedValue({ _type: 'ac_followup' }),
}));

// ── Mock de todos los flujos RC ──────────────────────────────────────────────
vi.mock('../../../../knowledge/session/assessment.session.rc', () => ({
    runAssessmentSessionRC: vi.fn().mockResolvedValue({ _type: 'rc_assessment' }),
}));
vi.mock('../../../../knowledge/session/psychoeducation.session.rc', () => ({
    runPsychoeducationSessionRC: vi.fn().mockResolvedValue({ _type: 'rc_psychoeducation' }),
}));
vi.mock('../../../../knowledge/session/goals.session.rc', () => ({
    runGoalsSessionRC: vi.fn().mockResolvedValue({ _type: 'rc_goals' }),
}));
vi.mock('../../../../knowledge/session/evaluation.session.rc', () => ({
    runEvaluationSessionRC: vi.fn().mockResolvedValue({ _type: 'rc_evaluation' }),
}));
vi.mock('../../../../knowledge/session/followup.session.rc', () => ({
    runFollowUpSessionRC: vi.fn().mockResolvedValue({ _type: 'rc_followup' }),
}));

// ── Import después de mocks (hoisting de vi.mock) ───────────────────────────
import {
    getActiveTechnique,
    dispatchAssessmentFlow,
    dispatchPsychoeducationFlow,
    dispatchGoalsFlow,
    dispatchEvaluationFlow,
    dispatchFollowUpFlow,
} from '../sessionFlowDispatcher';

import { runAssessmentSessionAC } from '../../../../knowledge/session/assessment.session.ac';
import { runAssessmentSessionRC } from '../../../../knowledge/session/assessment.session.rc';
import { runPsychoeducationSessionAC } from '../../../../knowledge/session/psychoeducation.session.ac';
import { runPsychoeducationSessionRC } from '../../../../knowledge/session/psychoeducation.session.rc';
import { runGoalsSessionAC } from '../../../../knowledge/session/goals.session.ac';
import { runGoalsSessionRC } from '../../../../knowledge/session/goals.session.rc';
import { runEvaluationSessionAC } from '../../../../knowledge/session/evaluation.session.ac';
import { runEvaluationSessionRC } from '../../../../knowledge/session/evaluation.session.rc';
import { runFollowUpSessionAC } from '../../../../knowledge/session/followup.session.ac';
import { runFollowUpSessionRC } from '../../../../knowledge/session/followup.session.rc';

import { buildSessionContext } from '../buildSessionContext';

// ============================================================================
// Helpers
// ============================================================================

const RC_PROFILE: BDIProfileAnalysis = {
    profile: 'cognitive',
    cognitiveScore: 18,
    cognitiveMax: 24,
    anhedoniaScore: 2,
    neurovegetativeRatio: 0.3,
    primaryTechnique: 'rc',
    rationale: 'Perfil cognitivo predominante',
};

const AC_PROFILE: BDIProfileAnalysis = {
    profile: 'behavioral',
    cognitiveScore: 8,
    cognitiveMax: 24,
    anhedoniaScore: 7,
    neurovegetativeRatio: 0.5,
    primaryTechnique: 'ac',
    rationale: 'Anhedonia marcada',
};

const MOCK_CONTEXT: SessionContext = {
    paciente: {
        profile: {
            id: 'test-user',
            nombre: 'Test',
            apellido: 'User',
            fechaNacimiento: '1990-01-01',
            sexo: 'otro',
            motivoConsulta: 'Test',
            fechaIngreso: '2026-03-15',
        },
        history: {
            antecedentesPersonales: [],
            antecedentesFamiliares: [],
            historiaProblema: '',
        },
        formulation: {
            analisisFuncional: '',
            hipotesis: '',
            diagnosticoFuncional: '',
        },
        plan: { objetivos: [], tecnicas: [], cronograma: [] },
        sesiones: [],
        inventarios: [],
    },
    ultimaSesion: 1,
    estadoEmocional: 'neutro',
    fase: 'inicio',
    inventarios: [],
    alertaCrisis: false,
};

// ============================================================================
// getActiveTechnique
// ============================================================================

describe('getActiveTechnique', () => {
    it('devuelve "ac" cuando clinicalProfile es null', () => {
        expect(getActiveTechnique(null)).toBe('ac');
    });

    it('devuelve "ac" cuando primaryTechnique es "ac"', () => {
        expect(getActiveTechnique(AC_PROFILE)).toBe('ac');
    });

    it('devuelve "rc" cuando primaryTechnique es "rc"', () => {
        expect(getActiveTechnique(RC_PROFILE)).toBe('rc');
    });
});

// ============================================================================
// dispatchAssessmentFlow
// ============================================================================

describe('dispatchAssessmentFlow', () => {
    const COMMON_INPUT = {
        situationContext: 'Reunión de trabajo',
        automaticThought: 'Van a pensar que soy incompetente',
        behavioralResponse: 'Evité hablar',
        consequences: 'Me sentí peor',
        cognitivePatterns: ['catastrophizing', 'mind_reading'],
        avoidanceBehaviors: [],
        functionalImpact: 'Afecta mi rendimiento',
        baselineIntensity: 7,
        emotionCategory: 'anxiety',
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('llama runAssessmentSessionAC sin perfil clínico (default)', async () => {
        const result = await dispatchAssessmentFlow(MOCK_CONTEXT, COMMON_INPUT, null);
        expect(runAssessmentSessionAC).toHaveBeenCalledTimes(1);
        expect(runAssessmentSessionRC).not.toHaveBeenCalled();
        expect((result as unknown as { _type: string })._type).toBe('ac_assessment');
    });

    it('llama runAssessmentSessionAC con perfil conductual', async () => {
        await dispatchAssessmentFlow(MOCK_CONTEXT, COMMON_INPUT, AC_PROFILE);
        expect(runAssessmentSessionAC).toHaveBeenCalledTimes(1);
        expect(runAssessmentSessionRC).not.toHaveBeenCalled();
    });

    it('llama runAssessmentSessionRC con perfil cognitivo', async () => {
        const result = await dispatchAssessmentFlow(MOCK_CONTEXT, COMMON_INPUT, RC_PROFILE);
        expect(runAssessmentSessionRC).toHaveBeenCalledTimes(1);
        expect(runAssessmentSessionAC).not.toHaveBeenCalled();
        expect((result as unknown as { _type: string })._type).toBe('rc_assessment');
    });

    it('transforma intensidad 0-10 → 0-100 para RC (emotionIntensity, beliefConviction)', async () => {
        await dispatchAssessmentFlow(MOCK_CONTEXT, COMMON_INPUT, RC_PROFILE);

        const rcCall = vi.mocked(runAssessmentSessionRC).mock.calls[0];
        const rcInput = rcCall[1];

        expect(rcInput.emotionIntensity).toBe(70); // 7 * 10
        expect(rcInput.beliefConviction).toBe(70);  // 7 * 10
    });

    it('mapea cognitivePatterns → cognitiveDistortions para RC', async () => {
        await dispatchAssessmentFlow(MOCK_CONTEXT, COMMON_INPUT, RC_PROFILE);

        const rcInput = vi.mocked(runAssessmentSessionRC).mock.calls[0][1];
        expect(rcInput.cognitiveDistortions).toEqual(['catastrophizing', 'mind_reading']);
    });

    it('mapea emotionCategory → emotionalResponse para RC', async () => {
        await dispatchAssessmentFlow(MOCK_CONTEXT, COMMON_INPUT, RC_PROFILE);

        const rcInput = vi.mocked(runAssessmentSessionRC).mock.calls[0][1];
        expect(rcInput.emotionalResponse).toBe('anxiety');
    });

    it('usa "malestar" como emotionalResponse por defecto en RC si no hay emotionCategory', async () => {
        const inputSinEmocion = { ...COMMON_INPUT, emotionCategory: undefined };
        await dispatchAssessmentFlow(MOCK_CONTEXT, inputSinEmocion, RC_PROFILE);

        const rcInput = vi.mocked(runAssessmentSessionRC).mock.calls[0][1];
        expect(rcInput.emotionalResponse).toBe('malestar');
    });
});

// ============================================================================
// dispatchPsychoeducationFlow
// ============================================================================

describe('dispatchPsychoeducationFlow', () => {
    const COMMON_INPUT = {
        modelExplained: true,
        connectionMade: true,
        patientReaction: 'Lo veo claro',
        abcData: {
            antecedent: 'Reunión',
            behavior: 'Evité hablar',
            consequence: 'Me sentí peor',
        },
    };

    beforeEach(() => vi.clearAllMocks());

    it('llama AC sin perfil clínico', async () => {
        await dispatchPsychoeducationFlow(MOCK_CONTEXT, COMMON_INPUT, null);
        expect(runPsychoeducationSessionAC).toHaveBeenCalledTimes(1);
        expect(runPsychoeducationSessionRC).not.toHaveBeenCalled();
    });

    it('llama RC con perfil cognitivo', async () => {
        await dispatchPsychoeducationFlow(MOCK_CONTEXT, COMMON_INPUT, RC_PROFILE);
        expect(runPsychoeducationSessionRC).toHaveBeenCalledTimes(1);
        expect(runPsychoeducationSessionAC).not.toHaveBeenCalled();
    });

    it('transforma abcData → cognitiveData para RC', async () => {
        await dispatchPsychoeducationFlow(MOCK_CONTEXT, COMMON_INPUT, RC_PROFILE);

        const rcInput = vi.mocked(runPsychoeducationSessionRC).mock.calls[0][1];
        expect(rcInput.cognitiveData).toEqual({
            automaticThought: 'Reunión',
            emotion: 'Me sentí peor',
            distortion: 'Evité hablar',
        });
    });

    it('pasa cognitiveData undefined si no hay abcData', async () => {
        const inputSinAbc = { ...COMMON_INPUT, abcData: undefined };
        await dispatchPsychoeducationFlow(MOCK_CONTEXT, inputSinAbc, RC_PROFILE);

        const rcInput = vi.mocked(runPsychoeducationSessionRC).mock.calls[0][1];
        expect(rcInput.cognitiveData).toBeUndefined();
    });
});

// ============================================================================
// dispatchGoalsFlow
// ============================================================================

describe('dispatchGoalsFlow', () => {
    const COMMON_INPUT = {
        primaryObjective: 'Poder hablar en reuniones sin ansiedad',
        shortTermGoals: ['Levantar la mano 1 vez', 'Hacer una pregunta'],
        measurableIndicator: 'Hablar 3 veces por reunión',
        startIntensity: 7,
        targetIntensity: 3,
    };

    beforeEach(() => vi.clearAllMocks());

    it('llama AC sin perfil clínico', async () => {
        await dispatchGoalsFlow(MOCK_CONTEXT, COMMON_INPUT, null);
        expect(runGoalsSessionAC).toHaveBeenCalledTimes(1);
        expect(runGoalsSessionRC).not.toHaveBeenCalled();
    });

    it('llama RC con perfil cognitivo y convierte escalas', async () => {
        await dispatchGoalsFlow(MOCK_CONTEXT, COMMON_INPUT, RC_PROFILE, ['catastrophizing']);

        expect(runGoalsSessionRC).toHaveBeenCalledTimes(1);
        const rcInput = vi.mocked(runGoalsSessionRC).mock.calls[0][1];

        expect(rcInput.startConviction).toBe(70);   // 7 * 10
        expect(rcInput.targetConviction).toBe(30);   // 3 * 10
        expect(rcInput.targetedDistortions).toEqual(['catastrophizing']);
    });

    it('pasa targetedDistortions vacío si no se proporcionan cognitivePatterns', async () => {
        await dispatchGoalsFlow(MOCK_CONTEXT, COMMON_INPUT, RC_PROFILE);

        const rcInput = vi.mocked(runGoalsSessionRC).mock.calls[0][1];
        expect(rcInput.targetedDistortions).toEqual([]);
    });
});

// ============================================================================
// dispatchEvaluationFlow
// ============================================================================

describe('dispatchEvaluationFlow', () => {
    const COMMON_INPUT = {
        baselineIntensity: 7,
        currentIntensity: 4,
        whatChanged: 'Me siento más tranquilo',
        obstaclesFound: 'Distracciones',
        wantsToRepeat: true as boolean | null,
        selectedTechnique: 'cognitive_restructuring',
    };

    beforeEach(() => vi.clearAllMocks());

    it('llama AC sin perfil clínico', async () => {
        await dispatchEvaluationFlow(MOCK_CONTEXT, COMMON_INPUT, null);
        expect(runEvaluationSessionAC).toHaveBeenCalledTimes(1);
        expect(runEvaluationSessionRC).not.toHaveBeenCalled();
    });

    it('llama RC con perfil cognitivo y añade campos conviction', async () => {
        await dispatchEvaluationFlow(MOCK_CONTEXT, COMMON_INPUT, RC_PROFILE);

        expect(runEvaluationSessionRC).toHaveBeenCalledTimes(1);
        const rcInput = vi.mocked(runEvaluationSessionRC).mock.calls[0][1];

        expect(rcInput.baselineConviction).toBe(70);  // 7 * 10
        expect(rcInput.currentConviction).toBe(40);    // 4 * 10
        // RC mantiene también los campos SUDs originales
        expect(rcInput.baselineIntensity).toBe(7);
        expect(rcInput.currentIntensity).toBe(4);
    });
});

// ============================================================================
// dispatchFollowUpFlow
// ============================================================================

describe('dispatchFollowUpFlow', () => {
    const COMMON_INPUT = {
        sessionSummary: {
            mainComplaint: 'Ansiedad en reuniones',
            baselineIntensity: 7,
            currentIntensity: 4,
            selectedTechnique: 'cognitive restructuring',
            primaryObjective: 'Hablar en reuniones',
            trapsIdentified: 3,
            comprehensionLevel: 'strong',
        },
    };

    beforeEach(() => vi.clearAllMocks());

    it('llama AC sin perfil clínico', async () => {
        await dispatchFollowUpFlow(MOCK_CONTEXT, COMMON_INPUT, null);
        expect(runFollowUpSessionAC).toHaveBeenCalledTimes(1);
        expect(runFollowUpSessionRC).not.toHaveBeenCalled();
    });

    it('llama RC con perfil cognitivo', async () => {
        await dispatchFollowUpFlow(MOCK_CONTEXT, COMMON_INPUT, RC_PROFILE, ['catastrophizing', 'mind_reading']);
        expect(runFollowUpSessionRC).toHaveBeenCalledTimes(1);
        expect(runFollowUpSessionAC).not.toHaveBeenCalled();
    });

    it('transforma summary para RC: conviction + distortionsIdentified', async () => {
        const patterns = ['catastrophizing', 'mind_reading'];
        await dispatchFollowUpFlow(MOCK_CONTEXT, COMMON_INPUT, RC_PROFILE, patterns);

        const rcInput = vi.mocked(runFollowUpSessionRC).mock.calls[0][1];
        expect(rcInput.sessionSummary.baselineConviction).toBe(70);  // 7 * 10
        expect(rcInput.sessionSummary.currentConviction).toBe(40);   // 4 * 10
        expect(rcInput.sessionSummary.distortionsIdentified).toBe(2); // patterns.length
        // Mantiene campos SUDs originales
        expect(rcInput.sessionSummary.baselineIntensity).toBe(7);
        expect(rcInput.sessionSummary.currentIntensity).toBe(4);
    });

    it('usa trapsIdentified como fallback para distortionsIdentified si no hay patterns', async () => {
        await dispatchFollowUpFlow(MOCK_CONTEXT, COMMON_INPUT, RC_PROFILE);

        const rcInput = vi.mocked(runFollowUpSessionRC).mock.calls[0][1];
        expect(rcInput.sessionSummary.distortionsIdentified).toBe(3); // trapsIdentified fallback
    });
});

// ============================================================================
// buildSessionContext con clinicalProfile
// ============================================================================

describe('buildSessionContext — techniqueId derivation', () => {
    const BASE_STATE = {
        userId: 'test-user',
        currentPhase: 'assessment' as const,
        intake: { intensityNow: 5, emotionCategory: 'anxiety' as const },
        assessment: {},
    };

    it('genera techniqueId "ac" cuando clinicalProfile es null', () => {
        const ctx = buildSessionContext({ ...BASE_STATE, clinicalProfile: null });
        expect(ctx.techniqueId).toBe('ac');
    });

    it('genera techniqueId "ac" cuando primaryTechnique es "ac"', () => {
        const ctx = buildSessionContext({ ...BASE_STATE, clinicalProfile: AC_PROFILE });
        expect(ctx.techniqueId).toBe('ac');
    });

    it('genera techniqueId "rc" cuando primaryTechnique es "rc"', () => {
        const ctx = buildSessionContext({ ...BASE_STATE, clinicalProfile: RC_PROFILE });
        expect(ctx.techniqueId).toBe('rc');
    });
});
