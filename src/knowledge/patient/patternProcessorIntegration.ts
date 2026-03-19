/**
 * patternProcessorIntegration.ts
 *
 * Integración del PatternProcessor con PatientStore
 * Proporciona acciones para procesar patrones y guardarlos en la carpeta del paciente
 *
 * Se añaden estas acciones a usePatientStore():
 * - processSessionPatterns()
 * - getPatternHistory()
 * - appendPatternLog()
 */

import type { PatternAnalysisResult, PatternAnalysisLogEntry } from './patternTypes';
import { analyzeSessionPatterns, formatPatternAnalysisForFolder } from './patternProcessor';
import type { PatientFolder, InterviewReport } from '@/features/patient/patientStore';

// ============================================================================
// Extension to PatientStore
// ============================================================================

/**
 * Extiende PatientFolder con pattern analysis log
 */
export interface PatientFolderExtended extends PatientFolder {
  /** Log de análisis de patrones por sesión */
  patternAnalysisLog?: PatternAnalysisLogEntry[];
}

/**
 * Procesa patrones después de una sesión completada
 * y los guarda en la carpeta del paciente
 */
export async function processSessionPatterns(
  patientId: string,
  sessionData: {
    number: number;
    type: 'ac_1' | 'ac_2' | 'ac_3' | 'ac_4' | 'ac_5' | 'ac_6' | 'ac_7' | 'rc_1' | 'rc_2' | 'rc_3' | 'followup';
    transcript: string;
    inventoriesAdministered: Array<{ inventario: string; puntuacion: number; alertaCritica?: boolean }>;
    homework?: { assigned: string[]; completed: string[]; resistance?: string };
    rapportScore?: number;
    emotionalTone?: string;
  },
  getFolder: (id: string) => PatientFolder | undefined
): Promise<PatternAnalysisLogEntry | null> {
  try {
    const folder = getFolder(patientId);
    if (!folder?.interviewReport) {
      console.warn(`[PatternProcessor] No InterviewReport found for patient ${patientId}`);
      return null;
    }

    // Obtener BDI anterior (del log previo, si existe)
    const folderExt = folder as PatientFolderExtended;
    const previousAnalyses = folderExt.patternAnalysisLog || [];
    const previousBDI =
      previousAnalyses.length > 0
        ? previousAnalyses[previousAnalyses.length - 1].analysis.changeIndicators.bdi?.current ?? null
        : null;

    // Analizar patrones
    const analysis = await analyzeSessionPatterns(
      sessionData as any, // TypeScript bridge
      folder.interviewReport,
      previousBDI
    );

    // Formatear summary para documentación
    const summary = formatPatternAnalysisForFolder(analysis);

    // Crear entrada del log
    const logEntry: PatternAnalysisLogEntry = {
      sessionNumber: sessionData.number,
      sessionType: sessionData.type,
      analyzedAt: Date.now(),
      analysis,
      therapistActionItems: extractActionItems(analysis),
      nextSessionSuggestions: formatSuggestions(analysis.suggestions),
      reviewedByTherapist: false,
    };

    return logEntry;
  } catch (error) {
    console.error('[PatternProcessor] Error analyzing session patterns:', error);
    return null;
  }
}

/**
 * Extrae action items del resultado del análisis
 */
function extractActionItems(analysis: PatternAnalysisResult): string[] {
  const items: string[] = [];

  // Alertas críticas
  for (const alert of analysis.alerts) {
    if (alert.severity === 'critical' || alert.severity === 'high') {
      items.push(`⚠️ [${alert.type.toUpperCase()}] ${alert.recommendedAction}`);
    }
  }

  // Distorsiones de alta severidad
  for (const distortion of analysis.distortionsIdentified.filter(d => d.severity === 'high')) {
    items.push(`📌 Distorsión identificada: ${distortion.name} — requiere intervención`);
  }

  // Cambio deteriorante
  if (analysis.changeIndicators.overallTrend === 'deteriorating') {
    items.push(`📉 Deterioro detectado — revisar factores externos y necesidad de escalamiento`);
  }

  return items;
}

/**
 * Formatea sugerencias para ser legibles en la carpeta
 */
function formatSuggestions(suggestions: any[]): string[] {
  return suggestions.map(s => {
    const rationaleSummary = s.rationale.substring(0, 60) + (s.rationale.length > 60 ? '...' : '');
    return `${s.technique} (prioridad: ${s.priority}) — ${rationaleSummary}`;
  });
}

/**
 * Agrega una entrada al pattern analysis log
 */
export function appendPatternLogEntry(
  folder: PatientFolder,
  entry: PatternAnalysisLogEntry
): PatientFolder {
  const folderExt = folder as PatientFolderExtended;
  return {
    ...folder,
    patternAnalysisLog: [...(folderExt.patternAnalysisLog || []), entry],
  } as PatientFolderExtended;
}

/**
 * Obtiene el historial completo de análisis de patrones
 */
export function getPatternHistory(folder: PatientFolder | undefined): PatternAnalysisLogEntry[] {
  if (!folder) return [];
  return (folder as PatientFolderExtended).patternAnalysisLog || [];
}

/**
 * Genera un reporte consolidado del patrón a través de todas las sesiones
 */
export function generatePatternSummary(
  folder: PatientFolder | undefined,
  interviewReport: InterviewReport | null
): string {
  if (!folder || !interviewReport) {
    return '## No hay datos suficientes para generar resumen de patrones';
  }

  const history = getPatternHistory(folder);
  if (history.length === 0) {
    return '## Aún no hay sesiones procesadas con análisis de patrones';
  }

  let summary = `# Evolución del Patrón Clínico — ${folder.createdAt ? new Date(folder.createdAt).toLocaleDateString('es-ES') : 'sin fecha'}

## Hipótesis inicial (Primer Encuentro)
${interviewReport.therapistView.hypothesis}

**Creencia nuclear:** ${interviewReport.therapistView.hypothesizedMechanism}

---

## Evolución por sesión

`;

  for (const entry of history) {
    summary += `
### Sesión ${entry.sessionNumber} (${entry.sessionType.toUpperCase()}) — ${new Date(entry.analyzedAt).toLocaleDateString('es-ES')}

**Coherencia:** ${entry.analysis.coherenceAnalysis.coherenceScore}/100
${entry.analysis.coherenceAnalysis.isCoherent ? '✓ Patrón se mantiene' : '✓ Signos de cambio'}

**Distorsiones:** ${
      entry.analysis.distortionsIdentified.length > 0
        ? entry.analysis.distortionsIdentified.map(d => `${d.name} (${d.severity})`).join(', ')
        : 'Ninguna'
    }

**Cambio BDI-II:** ${entry.analysis.changeIndicators.bdi?.interpretation || 'sin dato'}

**Alertas:** ${entry.analysis.alerts.length > 0 ? entry.analysis.alerts.map(a => `⚠️ ${a.type}`).join(', ') : 'ninguna'}

**Próximos pasos:**
${entry.analysis.suggestions.map(s => `- ${s.technique}: ${s.rationale}`).join('\n')}

---
`;
  }

  // Conclusión
  const lastEntry = history[history.length - 1];
  summary += `

## Conclusión Actualizada

**Última hipótesis:** ${lastEntry.analysis.updatedHypothesis}

**Indicador de progreso:**
- Inicio: ${interviewReport.therapistView.bdi.score} (BDI-II)
- Actual: ${lastEntry.analysis.changeIndicators.bdi?.current ?? '?'} (BDI-II)
- Tendencia: ${lastEntry.analysis.changeIndicators.overallTrend}

**Recomendaciones:**
${lastEntry.analysis.suggestions.map(s => `- ${s.technique} (${s.rationale})`).join('\n')}
`;

  return summary;
}

// ============================================================================
// Hook Extension (para usar en React)
// ============================================================================

/**
 * Hook para procesar patrones de una sesión
 * Uso en componente de sesión:
 *
 * const { processPatterns } = usePatternProcessor();
 * useEffect(() => {
 *   if (sessionCompleted) {
 *     processPatterns(patientId, sessionData);
 *   }
 * }, [sessionCompleted]);
 */
export function usePatternProcessor() {
  return {
    processSessionPatterns,
    getPatternHistory,
    appendPatternLogEntry,
    generatePatternSummary,
  };
}
