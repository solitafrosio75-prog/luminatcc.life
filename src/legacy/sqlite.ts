// Persistencia clínica con better-sqlite3
// Instalación: npm install better-sqlite3

import Database from 'better-sqlite3';

const db = new Database('clinical.db');

// ──────────────────────────────────────────────────────────────────────────────
// Interfaces de row (shape plano que devuelve SQLite)
// ──────────────────────────────────────────────────────────────────────────────

interface PatientRow {
    id: string;
    nombre: string;
    apellido: string;
    fechaNacimiento: string;
    sexo: string;
    motivoConsulta: string;
    contacto: string; // JSON serializado
    fechaIngreso: string;
}

interface ClinicalHistoryRow {
    id: string;
    antecedentesPersonales: string; // JSON serializado
    antecedentesFamiliares: string; // JSON serializado
    historiaProblema: string;
    tratamientosPrevios: string;    // JSON serializado
    medicacionActual: string;       // JSON serializado
    eventosVitales: string;         // JSON serializado
    patientId: string;
}

interface SessionRecordRow {
    id: string;
    sesion: number;
    fecha: string;
    notas: string;
    tareasAsignadas: string; // JSON serializado
    patientId: string;
}

interface CaseFormulationRow {
    id: string;
    analisisFuncional: string;
    hipotesis: string;
    diagnosticoFuncional: string;
    factoresMantenimiento: string; // JSON serializado
    riesgos: string;               // JSON serializado
    patientId: string;
}

interface TreatmentPlanRow {
    id: string;
    objetivos: string;   // JSON serializado
    tecnicas: string;    // JSON serializado
    cronograma: string;  // JSON serializado
    patientId: string;
}

interface InventoryTimelineRow {
    id: string;
    inventario: string; // JSON serializado
    fecha: string;
    resultado: string;  // JSON serializado
    patientId: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Inicialización de tablas
// ──────────────────────────────────────────────────────────────────────────────

export function initClinicalDB() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS Patient (
            id TEXT PRIMARY KEY,
            nombre TEXT,
            apellido TEXT,
            fechaNacimiento TEXT,
            sexo TEXT,
            motivoConsulta TEXT,
            contacto TEXT,
            fechaIngreso TEXT
        );
        CREATE TABLE IF NOT EXISTS ClinicalHistory (
            id TEXT PRIMARY KEY,
            antecedentesPersonales TEXT,
            antecedentesFamiliares TEXT,
            historiaProblema TEXT,
            tratamientosPrevios TEXT,
            medicacionActual TEXT,
            eventosVitales TEXT,
            patientId TEXT,
            FOREIGN KEY(patientId) REFERENCES Patient(id)
        );
        CREATE TABLE IF NOT EXISTS SessionRecord (
            id TEXT PRIMARY KEY,
            sesion INTEGER,
            fecha TEXT,
            notas TEXT,
            tareasAsignadas TEXT,
            patientId TEXT,
            FOREIGN KEY(patientId) REFERENCES Patient(id)
        );
        CREATE TABLE IF NOT EXISTS CaseFormulation (
            id TEXT PRIMARY KEY,
            analisisFuncional TEXT,
            hipotesis TEXT,
            diagnosticoFuncional TEXT,
            factoresMantenimiento TEXT,
            riesgos TEXT,
            patientId TEXT,
            FOREIGN KEY(patientId) REFERENCES Patient(id)
        );
        CREATE TABLE IF NOT EXISTS TreatmentPlan (
            id TEXT PRIMARY KEY,
            objetivos TEXT,
            tecnicas TEXT,
            cronograma TEXT,
            patientId TEXT,
            FOREIGN KEY(patientId) REFERENCES Patient(id)
        );
        CREATE TABLE IF NOT EXISTS InventoryTimeline (
            id TEXT PRIMARY KEY,
            inventario TEXT,
            fecha TEXT,
            resultado TEXT,
            patientId TEXT,
            FOREIGN KEY(patientId) REFERENCES Patient(id)
        );
    `);
}

// ──────────────────────────────────────────────────────────────────────────────
// CRUD — Patient
// ──────────────────────────────────────────────────────────────────────────────

export function createPatient(patient: {
    id: string;
    nombre: string;
    apellido: string;
    fechaNacimiento: string;
    sexo: string;
    motivoConsulta: string;
    contacto?: unknown;
    fechaIngreso: string;
}) {
    const stmt = db.prepare(
        `INSERT INTO Patient (id, nombre, apellido, fechaNacimiento, sexo, motivoConsulta, contacto, fechaIngreso)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    stmt.run(
        patient.id,
        patient.nombre,
        patient.apellido,
        patient.fechaNacimiento,
        patient.sexo,
        patient.motivoConsulta,
        JSON.stringify(patient.contacto ?? {}),
        patient.fechaIngreso,
    );
}

export function getPatientById(id: string): (PatientRow & { contacto: unknown }) | null {
    const stmt = db.prepare(`SELECT * FROM Patient WHERE id = ?`);
    const row = stmt.get(id) as PatientRow | undefined;
    if (!row) return null;
    return {
        ...row,
        contacto: row.contacto ? JSON.parse(row.contacto) : {},
    };
}

export function updatePatient(id: string, fields: Partial<Omit<PatientRow, 'id'>>) {
    const keys = Object.keys(fields) as Array<keyof typeof fields>;
    if (keys.length === 0) return;
    const setClause = keys.map((k) => `${k} = ?`).join(', ');
    const stmt = db.prepare(`UPDATE Patient SET ${setClause} WHERE id = ?`);
    stmt.run(...keys.map((k) => (k === 'contacto' ? JSON.stringify(fields[k]) : fields[k])), id);
}

export function deletePatient(id: string) {
    db.prepare(`DELETE FROM Patient WHERE id = ?`).run(id);
}

// ──────────────────────────────────────────────────────────────────────────────
// CRUD — ClinicalHistory
// ──────────────────────────────────────────────────────────────────────────────

export function createClinicalHistory(history: {
    id: string;
    antecedentesPersonales: unknown;
    antecedentesFamiliares: unknown;
    historiaProblema: string;
    tratamientosPrevios?: unknown;
    medicacionActual?: unknown;
    eventosVitales?: unknown;
    patientId: string;
}) {
    const stmt = db.prepare(
        `INSERT INTO ClinicalHistory
         (id, antecedentesPersonales, antecedentesFamiliares, historiaProblema, tratamientosPrevios, medicacionActual, eventosVitales, patientId)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    stmt.run(
        history.id,
        JSON.stringify(history.antecedentesPersonales),
        JSON.stringify(history.antecedentesFamiliares),
        history.historiaProblema,
        JSON.stringify(history.tratamientosPrevios ?? {}),
        JSON.stringify(history.medicacionActual ?? {}),
        JSON.stringify(history.eventosVitales ?? {}),
        history.patientId,
    );
}

export function getClinicalHistoryById(id: string): Omit<ClinicalHistoryRow, 'antecedentesPersonales' | 'antecedentesFamiliares' | 'tratamientosPrevios' | 'medicacionActual' | 'eventosVitales'> & {
    antecedentesPersonales: unknown;
    antecedentesFamiliares: unknown;
    tratamientosPrevios: unknown;
    medicacionActual: unknown;
    eventosVitales: unknown;
} | null {
    const row = db.prepare(`SELECT * FROM ClinicalHistory WHERE id = ?`).get(id) as ClinicalHistoryRow | undefined;
    if (!row) return null;
    return {
        ...row,
        antecedentesPersonales: row.antecedentesPersonales ? JSON.parse(row.antecedentesPersonales) : {},
        antecedentesFamiliares: row.antecedentesFamiliares ? JSON.parse(row.antecedentesFamiliares) : {},
        tratamientosPrevios: row.tratamientosPrevios ? JSON.parse(row.tratamientosPrevios) : {},
        medicacionActual: row.medicacionActual ? JSON.parse(row.medicacionActual) : {},
        eventosVitales: row.eventosVitales ? JSON.parse(row.eventosVitales) : {},
    };
}

export function updateClinicalHistory(id: string, fields: Partial<Omit<ClinicalHistoryRow, 'id'>>) {
    const keys = Object.keys(fields) as Array<keyof typeof fields>;
    if (keys.length === 0) return;
    const setClause = keys.map((k) => `${k} = ?`).join(', ');
    const stmt = db.prepare(`UPDATE ClinicalHistory SET ${setClause} WHERE id = ?`);
    stmt.run(...keys.map((k) => (typeof fields[k] === 'object' ? JSON.stringify(fields[k]) : fields[k])), id);
}

export function deleteClinicalHistory(id: string) {
    db.prepare(`DELETE FROM ClinicalHistory WHERE id = ?`).run(id);
}

// ──────────────────────────────────────────────────────────────────────────────
// CRUD — SessionRecord
// ──────────────────────────────────────────────────────────────────────────────

export function createSessionRecord(record: {
    id: string;
    sesion: number;
    fecha: string;
    notas: string;
    tareasAsignadas?: unknown;
    patientId: string;
}) {
    const stmt = db.prepare(
        `INSERT INTO SessionRecord (id, sesion, fecha, notas, tareasAsignadas, patientId)
         VALUES (?, ?, ?, ?, ?, ?)`,
    );
    stmt.run(
        record.id,
        record.sesion,
        record.fecha,
        record.notas,
        JSON.stringify(record.tareasAsignadas ?? {}),
        record.patientId,
    );
}

export function getSessionRecordById(id: string): (Omit<SessionRecordRow, 'tareasAsignadas'> & { tareasAsignadas: unknown }) | null {
    const row = db.prepare(`SELECT * FROM SessionRecord WHERE id = ?`).get(id) as SessionRecordRow | undefined;
    if (!row) return null;
    return {
        ...row,
        tareasAsignadas: row.tareasAsignadas ? JSON.parse(row.tareasAsignadas) : {},
    };
}

export function updateSessionRecord(id: string, fields: Partial<Omit<SessionRecordRow, 'id'>>) {
    const keys = Object.keys(fields) as Array<keyof typeof fields>;
    if (keys.length === 0) return;
    const setClause = keys.map((k) => `${k} = ?`).join(', ');
    const stmt = db.prepare(`UPDATE SessionRecord SET ${setClause} WHERE id = ?`);
    stmt.run(...keys.map((k) => (k === 'tareasAsignadas' ? JSON.stringify(fields[k]) : fields[k])), id);
}

export function deleteSessionRecord(id: string) {
    db.prepare(`DELETE FROM SessionRecord WHERE id = ?`).run(id);
}

// ──────────────────────────────────────────────────────────────────────────────
// CRUD — InventoryTimeline
// ──────────────────────────────────────────────────────────────────────────────

export function createInventoryTimeline(timeline: {
    id: string;
    inventario: unknown;
    fecha: string;
    resultado: unknown;
    patientId: string;
}) {
    const stmt = db.prepare(
        `INSERT INTO InventoryTimeline (id, inventario, fecha, resultado, patientId)
         VALUES (?, ?, ?, ?, ?)`,
    );
    stmt.run(
        timeline.id,
        JSON.stringify(timeline.inventario),
        timeline.fecha,
        JSON.stringify(timeline.resultado),
        timeline.patientId,
    );
}

export function getInventoryTimelineById(id: string): (Omit<InventoryTimelineRow, 'inventario' | 'resultado'> & { inventario: unknown; resultado: unknown }) | null {
    const row = db.prepare(`SELECT * FROM InventoryTimeline WHERE id = ?`).get(id) as InventoryTimelineRow | undefined;
    if (!row) return null;
    return {
        ...row,
        inventario: row.inventario ? JSON.parse(row.inventario) : {},
        resultado: row.resultado ? JSON.parse(row.resultado) : {},
    };
}

export function updateInventoryTimeline(id: string, fields: Partial<Omit<InventoryTimelineRow, 'id'>>) {
    const keys = Object.keys(fields) as Array<keyof typeof fields>;
    if (keys.length === 0) return;
    const setClause = keys.map((k) => `${k} = ?`).join(', ');
    const stmt = db.prepare(`UPDATE InventoryTimeline SET ${setClause} WHERE id = ?`);
    stmt.run(...keys.map((k) => (typeof fields[k] === 'object' ? JSON.stringify(fields[k]) : fields[k])), id);
}

export function deleteInventoryTimeline(id: string) {
    db.prepare(`DELETE FROM InventoryTimeline WHERE id = ?`).run(id);
}

// ──────────────────────────────────────────────────────────────────────────────
// CRUD — CaseFormulation
// ──────────────────────────────────────────────────────────────────────────────

export function createCaseFormulation(formulation: {
    id: string;
    analisisFuncional: string;
    hipotesis: string;
    diagnosticoFuncional: string;
    factoresMantenimiento?: unknown;
    riesgos?: unknown;
    patientId: string;
}) {
    const stmt = db.prepare(
        `INSERT INTO CaseFormulation (id, analisisFuncional, hipotesis, diagnosticoFuncional, factoresMantenimiento, riesgos, patientId)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
    );
    stmt.run(
        formulation.id,
        formulation.analisisFuncional,
        formulation.hipotesis,
        formulation.diagnosticoFuncional,
        JSON.stringify(formulation.factoresMantenimiento ?? {}),
        JSON.stringify(formulation.riesgos ?? {}),
        formulation.patientId,
    );
}

export function getCaseFormulationById(id: string): (Omit<CaseFormulationRow, 'factoresMantenimiento' | 'riesgos'> & { factoresMantenimiento: unknown; riesgos: unknown }) | null {
    const row = db.prepare(`SELECT * FROM CaseFormulation WHERE id = ?`).get(id) as CaseFormulationRow | undefined;
    if (!row) return null;
    return {
        ...row,
        factoresMantenimiento: row.factoresMantenimiento ? JSON.parse(row.factoresMantenimiento) : {},
        riesgos: row.riesgos ? JSON.parse(row.riesgos) : {},
    };
}

export function updateCaseFormulation(id: string, fields: Partial<Omit<CaseFormulationRow, 'id'>>) {
    const keys = Object.keys(fields) as Array<keyof typeof fields>;
    if (keys.length === 0) return;
    const setClause = keys.map((k) => `${k} = ?`).join(', ');
    const stmt = db.prepare(`UPDATE CaseFormulation SET ${setClause} WHERE id = ?`);
    stmt.run(...keys.map((k) => (typeof fields[k] === 'object' ? JSON.stringify(fields[k]) : fields[k])), id);
}

export function deleteCaseFormulation(id: string) {
    db.prepare(`DELETE FROM CaseFormulation WHERE id = ?`).run(id);
}

// ──────────────────────────────────────────────────────────────────────────────
// CRUD — TreatmentPlan
// ──────────────────────────────────────────────────────────────────────────────

export function createTreatmentPlan(plan: {
    id: string;
    objetivos: unknown;
    tecnicas: unknown;
    cronograma: unknown;
    patientId: string;
}) {
    const stmt = db.prepare(
        `INSERT INTO TreatmentPlan (id, objetivos, tecnicas, cronograma, patientId)
         VALUES (?, ?, ?, ?, ?)`,
    );
    stmt.run(
        plan.id,
        JSON.stringify(plan.objetivos),
        JSON.stringify(plan.tecnicas),
        JSON.stringify(plan.cronograma),
        plan.patientId,
    );
}

export function getTreatmentPlanById(id: string): (Omit<TreatmentPlanRow, 'objetivos' | 'tecnicas' | 'cronograma'> & { objetivos: unknown; tecnicas: unknown; cronograma: unknown }) | null {
    const row = db.prepare(`SELECT * FROM TreatmentPlan WHERE id = ?`).get(id) as TreatmentPlanRow | undefined;
    if (!row) return null;
    return {
        ...row,
        objetivos: row.objetivos ? JSON.parse(row.objetivos) : {},
        tecnicas: row.tecnicas ? JSON.parse(row.tecnicas) : {},
        cronograma: row.cronograma ? JSON.parse(row.cronograma) : {},
    };
}

export function updateTreatmentPlan(id: string, fields: Partial<Omit<TreatmentPlanRow, 'id'>>) {
    const keys = Object.keys(fields) as Array<keyof typeof fields>;
    if (keys.length === 0) return;
    const setClause = keys.map((k) => `${k} = ?`).join(', ');
    const stmt = db.prepare(`UPDATE TreatmentPlan SET ${setClause} WHERE id = ?`);
    stmt.run(...keys.map((k) => (typeof fields[k] === 'object' ? JSON.stringify(fields[k]) : fields[k])), id);
}

export function deleteTreatmentPlan(id: string) {
    db.prepare(`DELETE FROM TreatmentPlan WHERE id = ?`).run(id);
}
