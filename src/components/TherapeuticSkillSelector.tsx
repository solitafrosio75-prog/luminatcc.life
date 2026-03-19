
import React, { useEffect, useState } from 'react';
import { generateTherapeuticResponse, type SelectorContext } from '../knowledge/therapist/relational.selector';
import { adaptTherapeuticLanguage, type AdaptedMessage } from '../knowledge/therapist/adaptador.comunicacion';
import { deriveClinicalSeverity, snapshotFromClinicalProfile, type InventorySnapshot, type SeverityDerivation } from '../knowledge/therapist/severity.derivator';
import { getLatestClinicalMessage } from '../db/getLatestClinicalMessage';
import { db } from '../db/database';
import { usePatientStore } from '../features/patient/patientStore';
import type { TherapeuticResponse } from '../knowledge/therapist/relational.types';

type TherapeuticSkillSelectorProps = {
    context?: SelectorContext;
    mensajeClinico?: string;
    /** Snapshots de inventarios, si ya están disponibles externamente */
    inventorySnapshots?: InventorySnapshot[];
};

const defaultContext: SelectorContext = {
    fase: 'exploracion',
    estadoEmocional: 'desesperanza',
    tipoRespuesta: 'emocional',
};

const defaultMensaje = 'Entiendo que te sientes agotado y que levantarte parece imposible ahora mismo.';

export const TherapeuticSkillSelector: React.FC<TherapeuticSkillSelectorProps> = ({
    context,
    mensajeClinico,
    inventorySnapshots = [],
}) => {
    const [respuesta, setRespuesta] = useState<TherapeuticResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [autoMensaje, setAutoMensaje] = useState<string>(defaultMensaje);
    const [severityInfo, setSeverityInfo] = useState<SeverityDerivation | null>(null);
    const [adapted, setAdapted] = useState<AdaptedMessage | null>(null);

    const ctx = context ?? defaultContext;
    const mensaje = mensajeClinico ?? autoMensaje;
    const activePatientId = usePatientStore(s => s.activePatient?.patientId);

    // Paso 1: Obtener mensaje clínico automáticamente si no se proporcionó
    useEffect(() => {
        if (mensajeClinico) return;
        let cancelled = false;
        getLatestClinicalMessage().then(msg => {
            if (!cancelled) setAutoMensaje(msg || defaultMensaje);
        });
        return () => { cancelled = true; };
    }, [mensajeClinico]);

    // Paso 2: Derivar severidad desde inventarios + perfil clínico
    useEffect(() => {
        let cancelled = false;
        const getData = async () => {
            let patientRecord;
            if (activePatientId) {
                patientRecord = await db.patientRecords.where('patientId').equals(activePatientId).first();
                if (patientRecord?.id) {
                    const profile = await db.clinicalProfile.where('patientRecordId').equals(patientRecord.id).first();
                    return { profile, patientRecord };
                }
            }
            const profile = await db.clinicalProfile.toCollection().first();
            return { profile, patientRecord };
        };
        getData().then(({ profile, patientRecord }) => {
            if (cancelled) return;
            const profileSnapshot = profile
                ? snapshotFromClinicalProfile(profile, patientRecord)
                : undefined;
            const derivation = deriveClinicalSeverity(inventorySnapshots, profileSnapshot);
            setSeverityInfo(derivation);
        });
        return () => { cancelled = true; };
    }, [inventorySnapshots, activePatientId]);

    // Paso 3: Generar respuesta terapéutica + adaptar mensaje
    useEffect(() => {
        if (!severityInfo) return;
        let cancelled = false;
        setLoading(true);
        generateTherapeuticResponse(ctx, mensaje).then(res => {
            if (cancelled) return;
            setRespuesta(res);
            const adaptedMsg = adaptTherapeuticLanguage(mensaje, ctx, severityInfo);
            setAdapted(adaptedMsg);
            setLoading(false);
        });
        return () => { cancelled = true; };
    }, [ctx, mensaje, severityInfo]);

    if (loading) return <div>Cargando habilidad terapéutica...</div>;
    if (!respuesta) return <div>No se encontró habilidad adecuada.</div>;

    return (
        <div className="p-4 border rounded bg-white shadow">
            <h2 className="text-lg font-bold mb-2">Habilidad terapéutica sugerida</h2>

            {severityInfo && (
                <div className={`mb-3 p-2 rounded text-sm ${severityInfo.severidad === 'grave' ? 'bg-red-50 text-red-800' : severityInfo.severidad === 'moderada' ? 'bg-amber-50 text-amber-800' : 'bg-green-50 text-green-800'}`}>
                    <strong>Severidad:</strong> {severityInfo.severidad} (confianza: {severityInfo.confianza})
                    {severityInfo.alertasCriticas && <span className="ml-2 font-bold text-red-600">⚠ Alertas críticas</span>}
                    <div className="text-xs mt-1 opacity-75">{severityInfo.detalle}</div>
                </div>
            )}

            <div className="mb-2">
                <strong>Mensaje adaptado:</strong> {adapted?.mensaje ?? respuesta.mensaje}
            </div>
            {adapted && (
                <div className="mb-2 text-xs text-gray-500">
                    Tono: {adapted.tono} | Directividad: {adapted.directividad}
                </div>
            )}
            <div className="mb-2">
                <strong>Estilo:</strong> {respuesta.estilo}
            </div>
            <div className="mb-2">
                <strong>Nivel de validación:</strong> {respuesta.validacion}
            </div>
            <div className="mb-2">
                <strong>Habilidad:</strong> {respuesta.habilidad?.nombre}
            </div>
            <div className="mb-2">
                <strong>Descripción:</strong> {respuesta.habilidad?.descripcion}
            </div>
            <div className="mb-2">
                <strong>Contexto:</strong> {respuesta.contexto}
            </div>
        </div>
    );
};
