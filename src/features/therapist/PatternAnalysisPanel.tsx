/**
 * PatternAnalysisPanel.tsx
 *
 * Panel visual para mostrar el análisis de patrones por sesión
 * en el módulo Terapeuta.
 *
 * Muestra:
 * - Timeline de sesiones con análisis
 * - Coherencia del patrón (0-100)
 * - Distorsiones cognitivas detectadas
 * - Indicadores de cambio (BDI-II RCI)
 * - Alertas críticas
 * - Sugerencias para próxima sesión
 */

import React from 'react';
import { usePatientStore } from '@/features/patient/patientStore';

interface PatternAnalysisPanelProps {
  patientId: string;
}

export function PatternAnalysisPanel({ patientId }: PatternAnalysisPanelProps) {
  const { getFolder, getPatternHistory } = usePatientStore();
  const folder = getFolder(patientId);
  const patternHistory = getPatternHistory(patientId);

  if (!folder) {
    return <div className="p-4 text-gray-500">Paciente no encontrado</div>;
  }

  if (patternHistory.length === 0) {
    return (
      <div className="p-4 text-gray-500">
        <p>Aún no hay sesiones analizadas con PatternProcessor</p>
        <p className="text-sm mt-2">El análisis comienza después de la Sesión 1</p>
      </div>
    );
  }

  return (
    <div className="pattern-analysis-panel space-y-4 p-4">
      <h3 className="text-lg font-bold">📊 Evolución de Patrones</h3>

      {/* Timeline de sesiones */}
      <div className="timeline space-y-3">
        {patternHistory.map((entry, idx) => (
          <div
            key={idx}
            className="session-card border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition"
          >
            {/* Header de sesión */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-bold text-blue-700">
                  Sesión {entry.sessionNumber} ({entry.sessionType.toUpperCase()})
                </h4>
                <p className="text-sm text-gray-500">
                  {new Date(entry.analyzedAt).toLocaleDateString('es-ES')}
                </p>
              </div>
              <div className="text-right">
                <div className="inline-block bg-blue-100 px-3 py-1 rounded text-sm font-bold text-blue-900">
                  {entry.analysis.coherenceScore}/100
                </div>
                <p className="text-xs text-gray-500 mt-1">Coherencia</p>
              </div>
            </div>

            {/* Métricas clínicas */}
            <div className="metrics-grid grid grid-cols-3 gap-2 mb-4">
              {/* Coherencia */}
              <MetricBox
                label="Coherencia"
                value={entry.analysis.coherenceScore}
                max={100}
                color={entry.analysis.coherenceScore > 70 ? 'blue' : 'green'}
              />

              {/* Distorsiones */}
              <MetricBox
                label="Distorsiones"
                value={entry.analysis.distortionsIdentified.length}
                color={
                  entry.analysis.distortionsIdentified.length === 0
                    ? 'green'
                    : entry.analysis.distortionsIdentified.some(d => d.severity === 'high')
                    ? 'red'
                    : 'orange'
                }
              />

              {/* Cambio BDI-II */}
              {entry.analysis.changeIndicators && (
                <div className="text-center text-sm">
                  <div className="font-bold">
                    {entry.analysis.changeIndicators.overallTrend === 'improving'
                      ? '📈'
                      : entry.analysis.changeIndicators.overallTrend === 'deteriorating'
                      ? '📉'
                      : '➡️'}
                  </div>
                  <p className="text-xs text-gray-600">
                    {entry.analysis.changeIndicators.overallTrend}
                  </p>
                </div>
              )}
            </div>

            {/* Distorsiones detectadas */}
            {entry.analysis.distortionsIdentified.length > 0 && (
              <div className="mb-4">
                <h5 className="text-sm font-bold text-gray-700 mb-2">Distorsiones:</h5>
                <div className="space-y-1">
                  {entry.analysis.distortionsIdentified.slice(0, 3).map((d, i) => (
                    <div
                      key={i}
                      className={`text-sm px-2 py-1 rounded ${
                        d.severity === 'high'
                          ? 'bg-red-100 text-red-800'
                          : d.severity === 'moderate'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      <strong>{d.name}</strong> ({d.severity})
                    </div>
                  ))}
                  {entry.analysis.distortionsIdentified.length > 3 && (
                    <p className="text-xs text-gray-500">
                      +{entry.analysis.distortionsIdentified.length - 3} más
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Alertas */}
            {entry.analysis.alerts.length > 0 && (
              <div className="mb-4">
                <h5 className="text-sm font-bold text-gray-700 mb-2">⚠️ Alertas:</h5>
                <div className="space-y-1">
                  {entry.analysis.alerts.map((alert, i) => (
                    <div
                      key={i}
                      className={`text-sm px-2 py-1 rounded ${
                        alert.severity === 'critical'
                          ? 'bg-red-200 text-red-900'
                          : alert.severity === 'high'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      <strong>[{alert.type}]</strong> {alert.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sugerencias para próxima sesión */}
            {entry.analysis.suggestions.length > 0 && (
              <div>
                <h5 className="text-sm font-bold text-gray-700 mb-2">💡 Próxima sesión:</h5>
                <div className="space-y-2">
                  {entry.analysis.suggestions.slice(0, 2).map((s, i) => (
                    <div key={i} className="text-sm bg-blue-50 p-2 rounded border-l-2 border-blue-400">
                      <strong className="text-blue-900">{s.technique}</strong>
                      <p className="text-xs text-gray-700 mt-1">{s.rationale}</p>
                    </div>
                  ))}
                  {entry.analysis.suggestions.length > 2 && (
                    <p className="text-xs text-gray-500">
                      +{entry.analysis.suggestions.length - 2} sugerencias más
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Resumen consolidado */}
      <details className="mt-4 p-3 bg-gray-50 rounded border">
        <summary className="cursor-pointer font-bold text-blue-700">
          📈 Ver evolución completa ({patternHistory.length} sesiones analizadas)
        </summary>
        <div className="mt-3 text-sm space-y-2">
          <p>
            <strong>Patrón inicial:</strong>{' '}
            {folder.interviewReport?.therapistView.hypothesizedMechanism ||
              'No disponible'}
          </p>
          <p>
            <strong>Sesiones analizadas:</strong> {patternHistory.length}
          </p>
          <p>
            <strong>Última actualización:</strong>{' '}
            {patternHistory.length > 0
              ? new Date(patternHistory[patternHistory.length - 1].analyzedAt).toLocaleDateString(
                  'es-ES'
                )
              : 'N/A'}
          </p>
          <div className="mt-3 p-2 bg-white rounded border">
            <p className="text-xs text-gray-600">
              Exportar análisis completo como PDF o documento para incluir en carpeta clínica
            </p>
          </div>
        </div>
      </details>
    </div>
  );
}

/**
 * Componente auxiliar para mostrar una métrica
 */
function MetricBox({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max?: number;
  color: 'red' | 'orange' | 'yellow' | 'green' | 'blue';
}): JSX.Element {
  const colorMap = {
    red: 'bg-red-100 text-red-900',
    orange: 'bg-orange-100 text-orange-900',
    yellow: 'bg-yellow-100 text-yellow-900',
    green: 'bg-green-100 text-green-900',
    blue: 'bg-blue-100 text-blue-900',
  };

  const percentage = max ? Math.round((value / max) * 100) : 0;

  return (
    <div className={`text-center p-2 rounded ${colorMap[color]}`}>
      <div className="font-bold text-lg">
        {value}
        {max ? `/${max}` : ''}
      </div>
      {max && <div className="text-xs font-semibold">{percentage}%</div>}
      <p className="text-xs mt-1">{label}</p>
    </div>
  );
}
