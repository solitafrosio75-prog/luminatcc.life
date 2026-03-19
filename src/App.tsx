/**
 * TCC Lab — App Entry
 *
 * Flujo TCC estructurado: 7 fases del protocolo real
 * terapeuta-paciente adaptado a formato digital experimental.
 *
 * Intencionalmente minimal: sin dashboard, sin gamificación,
 * sin navegación libre. Solo el loop terapéutico puro.
 */
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtocolLayout } from './features/session/ProtocolLayout';
import { IntakeScreen } from './features/session/phases/IntakeScreen';
import { AssessmentScreen } from './features/session/phases/AssessmentScreen';
// Update the path below if the file is named differently or located elsewhere
import { PsychoeducationScreen } from './features/session/phases/PsychoeducationScreen'; // <-- Update this path if needed
import { GoalsScreen } from './features/session/phases/GoalsScreen';
import { InterventionScreen } from './features/session/phases/InterventionScreen';
import { EvaluationScreen } from './features/session/phases/EvaluationScreen';
import { FollowUpScreen } from './features/session/phases/FollowUpScreen';
import { SessionStartScreen } from './features/session/SessionStartScreen';
import { EmotionalChatInterface } from './components/EmotionalChatInterface';
import { EmotionalDashboard } from './components/EmotionalDashboard';
import { MultimodalEvaluationDemo } from './components/MultimodalEvaluationDemo';
import { InterviewScreen } from './features/interview/InterviewScreen';
import { TherapistProfile } from './features/therapist/TherapistProfile';
import { TherapistScreen } from './features/therapist/TherapistScreen';
import { KnowledgeControlPanel } from './features/therapist/KnowledgeControlPanel';
import { PatientRegisterScreen} from './features/patient/PatientRegisterScreen';
import { PatientSelectScreen } from './features/patient/PatientSelectScreen';
import { PatientDashboardterapisth } from './features/therapist/PatientDashboardterapisth';
import { PatientDashboard } from './features/patient/PatientDashboard';
import { LandingScreen } from './features/landing/LandingScreen';
/** Lazy-loaded modules */
const DevToolsLayout = lazy(() => import('./features/devtools/DevToolsLayout'));

export default function App() {
  return (
    <Routes>
      {/* Landing pública — primera impresión */}
      <Route path="/" element={<LandingScreen />} />
      {/* Hub de sesión — requiere paciente */}
      <Route path="/home" element={<SessionStartScreen />} />

      {/* Emotional Connection System Demo Routes */}

      <Route path="/emotional-chat" element={<EmotionalChatInterface />} />
      <Route path="/emotional-dashboard" element={<EmotionalDashboard />} />
      <Route path="/multimodal-evaluation" element={<MultimodalEvaluationDemo />} />
      <Route path="/patient/register" element={<PatientRegisterScreen />} />
      <Route path="/patient/login" element={<PatientSelectScreen />} />
      <Route path="/patient/patient-dashboard" element = {<PatientDashboard/>} />
      <Route path="/therapist/patient-dashboard"element = {<PatientDashboardterapisth />}
        
        
        />  

      <Route path="/interview" element={<InterviewScreen />} />
      <Route path="/therapist" element={<TherapistProfile />} />
      <Route path="/therapist-screen" element={<TherapistScreen />} />
      <Route path="/therapist/knowledge" element={<KnowledgeControlPanel />} />

      {/* DevTools — solo para desarrollo, cargado lazy */}
      <Route
        path="/dev"
        element={
          <Suspense
            fallback={
              <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
                Cargando DevTools…
              </div>
            }
          >
            <DevToolsLayout />
          </Suspense>
        }
      />

      {/* Protocolo TCC — 7 fases dentro del layout con barra de progreso */}
      <Route path="/session" element={<ProtocolLayout />}>
        <Route index element={<Navigate to="/session/intake" replace />} />
        <Route path="intake" element={<IntakeScreen />} />
        <Route path="assessment" element={<AssessmentScreen />} />
        <Route path="psychoeducation" element={<PsychoeducationScreen />} />
        <Route path="goals" element={<GoalsScreen />} />
        <Route path="intervention" element={<InterventionScreen />} />
        <Route path="evaluation" element={<EvaluationScreen />} />
        <Route path="followup" element={<FollowUpScreen />} />
        <Route path="protocol-layout" element={<ProtocolLayout />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
