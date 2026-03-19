/**
 * TherapistState - Componente para visualizar el estado clínico del terapeuta
 *
 * Este componente muestra en tiempo real el estado actual del terapeuta
 * durante una sesión de TCC, incluyendo fase, técnica, rapport, afecto
 * y indicadores de crisis. Es útil para monitoreo y debugging.
 */

import React from 'react';
import { useTherapistStore } from './therapistStore';
import { AFFECT_LABELS }     from '../interview/interviewStore';

export const TherapistState: React.FC = () => {
  const {
    phase,
    activeTechnique,
    rapportScore,
    lastAffectValence,
    crisisDetected,
    messages
  } = useTherapistStore();

  const messageCount = messages.length;
  const sessionActive = phase !== null; // Asumiendo que si hay fase, la sesión está activa

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-3">Estado del Terapeuta</h3>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="font-medium">Fase:</span>
          <span className="ml-2 text-blue-600">{phase}</span>
        </div>

        <div>
          <span className="font-medium">Técnica:</span>
          <span className="ml-2 text-green-600">{activeTechnique || 'Ninguna'}</span>
        </div>

        <div>
          <span className="font-medium">Rapport:</span>
          <span className="ml-2 text-purple-600">{rapportScore}/10</span>
        </div>

        <div>
          <span className="font-medium">Afecto:</span>
          <span className="ml-2 text-orange-600">
            {lastAffectValence != null ? AFFECT_LABELS[lastAffectValence] : 'N/A'}
          </span>
        </div>

        <div>
          <span className="font-medium">Sesión Activa:</span>
          <span className={`ml-2 ${sessionActive ? 'text-green-600' : 'text-red-600'}`}>
            {sessionActive ? 'Sí' : 'No'}
          </span>
        </div>

        <div>
          <span className="font-medium">Mensajes:</span>
          <span className="ml-2 text-gray-600">{messageCount}</span>
        </div>
      </div>

      {crisisDetected && (
        <div className="mt-4 p-2 bg-red-100 border border-red-300 rounded">
          <span className="text-red-800 font-bold">¡MODO CRISIS ACTIVADO!</span>
        </div>
      )}
    </div>
  );
};