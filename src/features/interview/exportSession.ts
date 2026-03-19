/**
 * exportSession — Descarga la transcripción del chat como archivo de texto.
 */

import type { ChatMessage } from './interviewStore';

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Genera un string con la transcripción formateada de la sesión.
 */
function buildTranscript(messages: ChatMessage[]): string {
  const lines: string[] = [];

  lines.push('═══════════════════════════════════════════════════════');
  lines.push('  TCC-Lab · Transcripción de sesión');
  lines.push(`  Fecha: ${new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`);
  lines.push(`  Total de mensajes: ${messages.length}`);
  lines.push('═══════════════════════════════════════════════════════');
  lines.push('');

  for (const msg of messages) {
    const role = msg.role === 'sys' ? 'Terapeuta' : 'Paciente';
    const time = formatTimestamp(msg.timestamp);
    lines.push(`[${time}] ${role}:`);
    lines.push(msg.text);
    lines.push('');
  }

  lines.push('───────────────────────────────────────────────────────');
  lines.push('Fin de la transcripción.');

  return lines.join('\n');
}

/**
 * Descarga la sesión de chat como archivo .txt.
 */
export function downloadSession(messages: ChatMessage[]): void {
  if (messages.length === 0) return;

  const content = buildTranscript(messages);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const date = new Date().toISOString().slice(0, 10);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tcc-lab-sesion-${date}.txt`;
  a.click();

  URL.revokeObjectURL(url);
}
