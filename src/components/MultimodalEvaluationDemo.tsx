/**
 * MultimodalEvaluationDemo - Componente demostrativo del sistema de evaluación multimodal
 * Muestra el proceso completo de TCC desde intake hasta evaluación
 */

import React, { useState, useEffect } from 'react';
import { multimodalEvaluationService, SessionData } from '../services/MultimodalEvaluationService';
import { 
  FileText, 
  Users, 
  TrendingUp, 
  Target, 
  Calendar,
  Brain,
  Activity,
  CheckCircle,
  AlertCircle,
  Clock,
  BarChart3
} from 'lucide-react';

export const MultimodalEvaluationDemo: React.FC = () => {
  const [currentPhase, setCurrentPhase] = useState<string>('intake');
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);
  const [caseFormulation, setCaseFormulation] = useState<any>(null);
  const [evaluationMetrics, setEvaluationMetrics] = useState<any>(null);

  // Simular progreso del sistema
  useEffect(() => {
    const simulateProgress = async () => {
      // Fase 1: Intake
      const intakeSession = await multimodalEvaluationService.conductIntakeSession(
        'demo-user',
        ['text', 'voice', 'video', 'behavioral'],
        { age: 35, gender: 'femenino', occupation: 'profesional' },
        'Ansiedad social y síntomas depresivos'
      );
      setSessionHistory([intakeSession]);
      setCurrentPhase('intake');

      // Fases 2-4: Assessment (simular 3 sesiones)
      setTimeout(async () => {
        setCurrentPhase('assessment');
        const assessmentSessions = await multimodalEvaluationService.conductAssessmentSessions('demo-user', 3);
        setSessionHistory(prev => [...prev, ...assessmentSessions]);
        
        // Fase 5: Case Formulation
        setTimeout(async () => {
          setCurrentPhase('formulation');
          const formulation = await multimodalEvaluationService.constructCaseFormulation('demo-user', assessmentSessions);
          setCaseFormulation(formulation);
          
          // Fase 6: Goals
          setTimeout(async () => {
            setCurrentPhase('goals');
            const goals = await multimodalEvaluationService.defineTherapeuticGoals('demo-user', formulation);
            
            // Fase 7: Evaluation
            setTimeout(async () => {
              setCurrentPhase('evaluation');
              const interventionSessions: SessionData[] = [
                { sessionId: 'int_1', phase: 'intervention', duration: 45, modalities: ['text', 'voice'], date: new Date() },
                { sessionId: 'int_2', phase: 'intervention', duration: 50, modalities: ['video', 'behavioral'], date: new Date() },
                { sessionId: 'int_3', phase: 'intervention', duration: 40, modalities: ['text'], date: new Date() }
              ];
              
              const metrics = await multimodalEvaluationService.conductPeriodicEvaluation('demo-user', interventionSessions);
              setEvaluationMetrics(metrics);
              setCurrentPhase('completed');
            }, 2000);
          }, 2000);
        }, 2000);
      }, 2000);
    };

    simulateProgress();
  }, []);

  const getPhaseColor = (phase: string): string => {
    const colors: Record<string, string> = {
      intake: 'bg-blue-500',
      assessment: 'bg-yellow-500',
      formulation: 'bg-purple-500',
      goals: 'bg-green-500',
      evaluation: 'bg-red-500',
      completed: 'bg-gray-500'
    };
    return colors[phase] || 'bg-gray-400';
  };

  const getPhaseIcon = (phase: string) => {
    const icons: Record<string, React.ReactNode> = {
      intake: <Users className="w-5 h-5" />,
      assessment: <FileText className="w-5 h-5" />,
      formulation: <Brain className="w-5 h-5" />,
      goals: <Target className="w-5 h-5" />,
      evaluation: <BarChart3 className="w-5 h-5" />,
      completed: <CheckCircle className="w-5 h-5" />
    };
    return icons[phase] || <AlertCircle className="w-5 h-5" />;
  };

  const getPhaseDescription = (phase: string): string => {
    const descriptions: Record<string, string> = {
      intake: 'Establecer vínculo terapéutico y recoger datos básicos',
      assessment: 'Evaluación multimodal completa (3 sesiones)',
      formulation: 'Construcción de formulación de caso E-O-R-K-C',
      goals: 'Definición de metas terapéuticas SMART',
      evaluation: 'Evaluación periódica y ajuste del plan',
      completed: 'Proceso completado exitosamente'
    };
    return descriptions[phase] || 'Fase desconocida';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-600" />
            Sistema de Evaluación Multimodal TCC
          </h1>
          <p className="text-gray-600 mt-2">
            Protocolo estructurado terapeuta-paciente con evaluación multimodal
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Progreso del Protocolo</h2>
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Fase Actual:</span>
              <span className="text-lg font-medium text-gray-900 capitalize">{currentPhase}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>Simulación en progreso...</span>
            </div>
          </div>

          {/* Phase Timeline */}
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              {['intake', 'assessment', 'formulation', 'goals', 'evaluation', 'completed'].map((phase, index) => (
                <div key={phase} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full ${getPhaseColor(phase)} flex items-center justify-center text-white`}>
                    {getPhaseIcon(phase)}
                  </div>
                  {index < 5 && (
                    <div className="flex-1 h-1 bg-gray-300"></div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">{getPhaseDescription(currentPhase)}</h3>
              
              {/* Phase-specific content */}
              {currentPhase === 'intake' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Vínculo terapéutico establecido</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Datos sociodemográficos recopilados</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Tareas de automonitoreo asignadas</span>
                  </div>
                </div>
              )}

              {currentPhase === 'assessment' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span>Inventarios BDI/BAI aplicados</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span>Patrones conductuales identificados</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span>Distorsiones cognitivas detectadas</span>
                  </div>
                </div>
              )}

              {currentPhase === 'formulation' && caseFormulation && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-500" />
                    <span>Modelo E-O-R-K-C construido</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Antecedentes</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {caseFormulation.antecedents?.slice(0, 3).map((ant: any, i: number) => (
                          <li key={i}>{ant.description}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Conductas Problema</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {caseFormulation.behaviors?.slice(0, 3).map((beh: any, i: number) => (
                          <li key={i}>{beh.description}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {currentPhase === 'goals' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-green-500" />
                    <span>Metas SMART definidas</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p className="mb-2">Metas terapéuticas establecidas:</p>
                    <ul className="space-y-1">
                      {caseFormulation.goals?.slice(0, 4).map((goal: any, i: number) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="font-medium">{goal.description}</span>
                          <span className="text-gray-500">(Progreso: {goal.progress}%)</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {currentPhase === 'evaluation' && evaluationMetrics && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-red-500" />
                    <span>Evaluación completada</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Métricas Clínicas</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Significancia Clínica:</span>
                          <span className={`font-medium ${
                            evaluationMetrics.clinicalSignificance > 0.5 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {(evaluationMetrics.clinicalSignificance * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Índice de Fiabilidad:</span>
                          <span className={`font-medium ${
                            evaluationMetrics.reliabilityIndex > 0.7 ? 'text-green-600' : 'text-yellow-600'
                          }`}>
                            {(evaluationMetrics.reliabilityIndex * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tasa de Progreso:</span>
                          <span className="font-medium text-blue-600">
                            {(evaluationMetrics.progressRate * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Obstáculos y Recursos</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-600">Obstáculos identificados:</span>
                          <ul className="mt-1 space-y-1">
                            <li>Falta de adherencia a tareas</li>
                            <li>Resistencia emocional a la exposición</li>
                            <li>Pensamientos automáticos persistentes</li>
                          </ul>
                        </div>
                        <div>
                          <span className="text-gray-600">Recursos necesarios:</span>
                          <ul className="mt-1 space-y-1">
                            <li>Recordatorios digitales</li>
                            <li>Técnicas de relajación</li>
                            <li>Red de apoyo social</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentPhase === 'completed' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Protocolo TCC completado exitosamente</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>El sistema ha completado exitosamente todas las fases del protocolo:</p>
                    <ul className="mt-2 space-y-1">
                      <li>✅ Vínculo terapéutico establecido</li>
                      <li>✅ Evaluación multimodal completa</li>
                      <li>✅ Formulación de caso construida</li>
                      <li>✅ Metas SMART definidas</li>
                      <li>✅ Evaluación periódica realizada</li>
                      <li>✅ Plan de tratamiento ajustado</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Session History */}
        {sessionHistory.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Historial de Sesiones</h2>
            <div className="space-y-3">
              {sessionHistory.slice(-5).map((session: any, index) => (
                <div key={session.sessionId} className="border-l border-gray-200 pl-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">
                      Sesión {session.sessionId} - {session.phase}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(session.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Duración: {session.duration} minutos</p>
                    <p>Modalidades: {session.modalities?.join(', ')}</p>
                    {session.behavioralData && (
                      <p>Intensidad conductual: {session.behavioralData.intensity}/10</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
