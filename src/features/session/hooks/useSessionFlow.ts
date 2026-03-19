/**
 * useSessionFlow — Hook React para ejecutar flujos clínicos AC
 *
 * Separa la lógica pura (session flows) de React (lifecycle).
 * Gestiona estados de carga, error, y resultado del flujo.
 *
 * Uso:
 *   const { result, isProcessing, error, execute } = useSessionFlow(runAssessmentSessionAC);
 *   // En handleNext:
 *   const output = await execute(context, input);
 */

import { useState, useCallback } from 'react';

export interface UseSessionFlowResult<T> {
    result: T | null;
    isProcessing: boolean;
    error: string | null;
    execute: (...args: unknown[]) => Promise<T | null>;
}

export function useSessionFlow<T>(
    flowFn: (...args: unknown[]) => Promise<T>,
): UseSessionFlowResult<T> {
    const [result, setResult] = useState<T | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const execute = useCallback(async (...args: unknown[]) => {
        setIsProcessing(true);
        setError(null);
        try {
            const output = await flowFn(...args);
            setResult(output);
            return output;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error procesando sesión';
            setError(message);
            console.error('[useSessionFlow]', message);
            return null;
        } finally {
            setIsProcessing(false);
        }
    }, [flowFn]);

    return { result, isProcessing, error, execute };
}
