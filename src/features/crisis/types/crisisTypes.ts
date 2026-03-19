// ═══════════════════════════════════════════════════════════════════
// crisisTypes.ts — Tipos para el Sistema de Intervención en Crisis
// ═══════════════════════════════════════════════════════════════════

export type CrisisSeverity = 'mild' | 'moderate' | 'severe' | 'imminent';

export type CrisisPhase =
  | 'detection'           // Detección inicial
  | 'grounding'          // Técnicas de grounding activas
  | 'assessment'         // Evaluación de seguridad
  | 'safety_planning'    // Construcción de plan de seguridad
  | 'resource_connection' // Conexión con recursos
  | 'stabilized'         // Usuario estabilizado
  | 'escalated';         // Escalado a emergencias

export interface CrisisDetection {
  timestamp: Date;
  severity: CrisisSeverity;
  triggers: string[]; // Keywords que dispararon la detección
  context?: {
    recentActivity?: string;
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    isolated: boolean; // ¿Usuario lleva mucho sin interactuar?
  };
}

export interface GroundingExerciseResult {
  exerciseType: '5-4-3-2-1' | 'breathing' | 'body_scan' | 'ice_water';
  completed: boolean;
  durationSeconds: number;
  userEngagement: 'high' | 'medium' | 'low' | 'none';
  reportedDistress: number; // 1-10 scale, antes y después
}

export interface SafetyAssessment {
  timestamp: Date;
  hasImmediatePlan: boolean; // ¿Tiene plan concreto de hacerse daño?
  hasAccessToMeans: boolean; // ¿Tiene acceso a medios letales?
  hasProtectiveFactors: boolean; // ¿Hay razones para vivir identificadas?
  willingToStaySafe: boolean; // ¿Acepta compromiso de seguridad?
  overallRisk: 'low' | 'moderate' | 'high' | 'imminent';
}

export interface SafetyPlan {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;

  // Paso 1: Señales de advertencia personales
  warningSignsInternal: string[]; // "Pensamientos de desesperanza"
  warningSignsExternal: string[]; // "Aislamiento social"

  // Paso 2: Estrategias de afrontamiento internas (sin contacto)
  copingStrategiesInternal: string[]; // "Escuchar música", "Caminar"

  // Paso 3: Personas/lugares como distracción social
  socialDistractions: Array<{
    name: string;
    relationship: string;
    contactInfo?: string;
  }>;

  // Paso 4: Contactos de apoyo para buscar ayuda
  supportContacts: Array<{
    name: string;
    relationship: string;
    phone: string;
    available?: string; // "Lunes-Viernes 9am-5pm"
  }>;

  // Paso 5: Profesionales o agencias
  professionalContacts: Array<{
    name: string;
    type: 'therapist' | 'psychiatrist' | 'crisis_line' | 'emergency';
    phone: string;
    available: string;
  }>;

  // Paso 6: Hacer el ambiente seguro
  environmentSafety: {
    removedMeans: string[]; // "Arma de fuego guardada en casa de familiar"
    safeLocation?: string; // "Sala de estar con familia"
  };

  // Razones para vivir (crucial)
  reasonsForLiving: string[];
}

export interface CrisisSession {
  id: string;
  userId: string;
  startedAt: Date;
  endedAt?: Date;

  detection: CrisisDetection;
  phases: Array<{
    phase: CrisisPhase;
    enteredAt: Date;
    exitedAt?: Date;
    data?: any;
  }>;

  groundingExercises: GroundingExerciseResult[];
  safetyAssessment?: SafetyAssessment;
  safetyPlan?: SafetyPlan;

  outcome: 'stabilized' | 'referred_emergency' | 'user_disconnected';
  emergencyServicesContacted: boolean;

  // Seguimiento
  followUpScheduled?: Date;
  clinicianNotified: boolean;
}

export interface EmergencyResource {
  id: string;
  name: string;
  type: 'hotline' | 'text_line' | 'chat' | 'emergency_services';
  phone?: string;
  textNumber?: string;
  url?: string;
  available: '24/7' | 'business_hours' | string;
  description: string;
  specialization?: string; // "LGBTQ+", "Veterans", "Spanish"
}

// ═══════════════════════════════════════════════════════════════════
// CRISIS ANALYTICS - Para mejora del sistema de detección
// ═══════════════════════════════════════════════════════════════════

export type CrisisEventType =
  | 'detection'              // Detección disparada
  | 'false_positive'         // Usuario indica que fue falso positivo
  | 'intervention_started'   // Usuario aceptó intervención
  | 'intervention_completed' // Completó protocolo de crisis
  | 'intervention_abandoned' // Salió antes de completar
  | 'emergency_exit';        // Presionó botón de emergencia

export interface CrisisAnalyticsEvent {
  id: string;
  userId: string;
  eventType: CrisisEventType;
  timestamp: Date;

  // Metadata específica del evento
  metadata?: {
    // Para detecciones
    severity?: CrisisSeverity;
    triggers?: string[];
    interventionTriggered?: boolean;

    // Para sesiones
    sessionId?: string;
    sessionDuration?: number; // segundos
    outcome?: 'stabilized' | 'referred_emergency' | 'user_disconnected';

    // Contexto
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
    sourceComponent?: string; // "ThoughtRecordSheet", "ProblemSolvingFlow"
  };
}
