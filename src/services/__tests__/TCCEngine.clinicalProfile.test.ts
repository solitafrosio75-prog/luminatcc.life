/**
 * TCCEngine.clinicalProfile.test.ts — Tests del 7.º componente de scoring
 *
 * Verifica que calculateClinicalProfileScore() y SCORING_WEIGHTS
 * integran correctamente el perfil clínico BDI-II en la selección de técnicas.
 */

import { describe, it, expect } from 'vitest';
import {
    calculateClinicalProfileScore,
    SCORING_WEIGHTS,
    type UserContext,
} from '../TCCEngine';

// ============================================================================
// Helpers
// ============================================================================

type ClinicalProfile = NonNullable<UserContext['clinicalProfile']>;

const RC_PROFILE: ClinicalProfile = {
    primaryTechnique: 'rc',
    profile: 'cognitive',
    rationale: 'Perfil cognitivo predominante, anhedonia baja. Priorizar RC (Cuijpers et al., 2019).',
};

const AC_PROFILE: ClinicalProfile = {
    primaryTechnique: 'ac',
    profile: 'behavioral',
    rationale: 'Anhedonia marcada (ítems 4+12 ≥ 4). Priorizar AC (Dimidjian et al., 2006).',
};

const MIXED_PROFILE: ClinicalProfile = {
    primaryTechnique: 'ac',
    profile: 'mixed',
    rationale: 'Perfil mixto sin dominancia clara. AC como primera línea.',
};

const NEUROVEGETATIVE_PROFILE: ClinicalProfile = {
    primaryTechnique: 'ac',
    profile: 'neurovegetative',
    rationale: 'Perfil neurovegetativo predominante. AC con microtareas + interconsulta psiquiátrica.',
};

// ============================================================================
// Tests: calculateClinicalProfileScore
// ============================================================================

describe('calculateClinicalProfileScore', () => {
    it('Sin perfil → 5 (neutral)', () => {
        expect(calculateClinicalProfileScore('behavioral_activation', undefined)).toBe(5);
        expect(calculateClinicalProfileScore('cognitive_restructuring', undefined)).toBe(5);
        expect(calculateClinicalProfileScore('relaxation', undefined)).toBe(5);
    });

    describe('Perfil cognitivo (RC)', () => {
        it('Técnica RC (cognitive_restructuring) → 9 (boost)', () => {
            expect(calculateClinicalProfileScore('cognitive_restructuring', RC_PROFILE)).toBe(9);
        });

        it('Técnica AC (behavioral_activation) → 3 (penalización leve)', () => {
            expect(calculateClinicalProfileScore('behavioral_activation', RC_PROFILE)).toBe(3);
        });

        it('Técnica AC (activity_scheduling) → 3 (penalización leve)', () => {
            expect(calculateClinicalProfileScore('activity_scheduling', RC_PROFILE)).toBe(3);
        });

        it('Técnica AC (micro_tasks) → 3 (penalización leve)', () => {
            expect(calculateClinicalProfileScore('micro_tasks', RC_PROFILE)).toBe(3);
        });

        it('Técnica neutra (mindful_breathing) → 5', () => {
            expect(calculateClinicalProfileScore('mindful_breathing', RC_PROFILE)).toBe(5);
        });

        it('Técnica neutra (self_compassion) → 5', () => {
            expect(calculateClinicalProfileScore('self_compassion', RC_PROFILE)).toBe(5);
        });
    });

    describe('Perfil conductual (AC)', () => {
        it('Técnica AC (behavioral_activation) → 9 (boost)', () => {
            expect(calculateClinicalProfileScore('behavioral_activation', AC_PROFILE)).toBe(9);
        });

        it('Técnica AC (micro_tasks) → 9 (boost)', () => {
            expect(calculateClinicalProfileScore('micro_tasks', AC_PROFILE)).toBe(9);
        });

        it('Técnica RC (cognitive_restructuring) → 4 (penalización suave)', () => {
            expect(calculateClinicalProfileScore('cognitive_restructuring', AC_PROFILE)).toBe(4);
        });

        it('Técnica neutra (relaxation) → 5', () => {
            expect(calculateClinicalProfileScore('relaxation', AC_PROFILE)).toBe(5);
        });
    });

    describe('Asimetría intencional RC→AC vs AC→RC', () => {
        it('RC penaliza AC (3) más que AC penaliza RC (4)', () => {
            const rcPenalizesAC = calculateClinicalProfileScore('behavioral_activation', RC_PROFILE);
            const acPenalizesRC = calculateClinicalProfileScore('cognitive_restructuring', AC_PROFILE);
            expect(rcPenalizesAC).toBe(3);
            expect(acPenalizesRC).toBe(4);
            expect(rcPenalizesAC).toBeLessThan(acPenalizesRC);
        });
    });

    describe('Perfil mixto y neurovegetativo (ambos AC)', () => {
        it('Perfil mixto boostea AC como conductual', () => {
            expect(calculateClinicalProfileScore('behavioral_activation', MIXED_PROFILE)).toBe(9);
            expect(calculateClinicalProfileScore('cognitive_restructuring', MIXED_PROFILE)).toBe(4);
        });

        it('Perfil neurovegetativo boostea AC como conductual', () => {
            expect(calculateClinicalProfileScore('behavioral_activation', NEUROVEGETATIVE_PROFILE)).toBe(9);
            expect(calculateClinicalProfileScore('micro_tasks', NEUROVEGETATIVE_PROFILE)).toBe(9);
        });
    });
});

// ============================================================================
// Tests: SCORING_WEIGHTS
// ============================================================================

describe('SCORING_WEIGHTS', () => {
    it('Los 7 componentes suman exactamente 1.0', () => {
        const total =
            SCORING_WEIGHTS.barriers +
            SCORING_WEIGHTS.emotion +
            SCORING_WEIGHTS.clinicalProfile +
            SCORING_WEIGHTS.historical +
            SCORING_WEIGHTS.context +
            SCORING_WEIGHTS.approachStyle +
            SCORING_WEIGHTS.temporal;

        expect(total).toBeCloseTo(1.0, 10);
    });

    it('clinicalProfile tiene peso 0.15', () => {
        expect(SCORING_WEIGHTS.clinicalProfile).toBe(0.15);
    });

    it('barriers sigue siendo el factor más importante', () => {
        const weights = Object.values(SCORING_WEIGHTS);
        const maxWeight = Math.max(...weights);
        expect(SCORING_WEIGHTS.barriers).toBe(maxWeight);
    });

    it('Todos los pesos son positivos', () => {
        for (const [key, value] of Object.entries(SCORING_WEIGHTS)) {
            expect(value, `${key} debe ser > 0`).toBeGreaterThan(0);
        }
    });
});

// ============================================================================
// Tests: Impacto en scoring final
// ============================================================================

describe('Impacto del perfil clínico en scoring diferencial', () => {
    it('La diferencia de score entre RC-boost y AC-penalización es significativa', () => {
        // Con perfil RC:
        //   cognitive_restructuring → 9 * 0.15 = 1.35
        //   behavioral_activation  → 3 * 0.15 = 0.45
        //   Δ = 0.90 puntos en score final (significativo para decisiones)
        const rcBoost = calculateClinicalProfileScore('cognitive_restructuring', RC_PROFILE) * SCORING_WEIGHTS.clinicalProfile;
        const rcPenalty = calculateClinicalProfileScore('behavioral_activation', RC_PROFILE) * SCORING_WEIGHTS.clinicalProfile;
        const delta = rcBoost - rcPenalty;

        expect(delta).toBeCloseTo(0.90, 2);
        expect(delta).toBeGreaterThan(0.5); // Suficiente para romper empates
    });

    it('Sin perfil, la contribución es neutral y no altera el ranking', () => {
        const neutralScore = calculateClinicalProfileScore('behavioral_activation', undefined);
        const neutralContribution = neutralScore * SCORING_WEIGHTS.clinicalProfile;

        // 5 * 0.15 = 0.75 — idéntico para todas las técnicas
        expect(neutralContribution).toBeCloseTo(0.75, 2);

        // Verificar que todas las técnicas reciben la misma contribución sin perfil
        const techniques = ['behavioral_activation', 'cognitive_restructuring', 'relaxation', 'self_compassion'] as const;
        const contributions = techniques.map(t =>
            calculateClinicalProfileScore(t, undefined) * SCORING_WEIGHTS.clinicalProfile
        );
        expect(new Set(contributions).size).toBe(1); // Todos iguales
    });
});
