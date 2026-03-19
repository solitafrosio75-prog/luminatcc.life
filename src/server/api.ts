// eslint-disable-next-line @typescript-eslint/no-require-imports
const express = require('express') as typeof import('express');
import {
    SessionCreateRequestSchema,
    TechniqueCreateRequestSchema,
    HomeworkCreateRequestSchema,
} from '../knowledge/schemas/endpoints.zod';
import {
    createSession,
    getSession,
    createTechnique,
    createHomework,
    getReferences,
} from '../services/api/handlers';

const app = express();
app.use(express.json());

// POST /session
app.post('/session', (req: { body: unknown }, res: { status: (c: number) => { json: (b: unknown) => void }; json: (b: unknown) => void }) => {
    const parsed = SessionCreateRequestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.issues });
    const result = createSession(parsed.data);
    res.json(result);
});

// GET /session/:id
app.get('/session/:id', (req: { params: { id: string } }, res: { json: (b: unknown) => void }) => {
    const result = getSession(req.params.id);
    res.json(result);
});

// POST /technique
app.post('/technique', (req: { body: unknown }, res: { status: (c: number) => { json: (b: unknown) => void }; json: (b: unknown) => void }) => {
    const parsed = TechniqueCreateRequestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.issues });
    const result = createTechnique(parsed.data);
    res.json(result);
});

// POST /homework
app.post('/homework', (req: { body: unknown }, res: { status: (c: number) => { json: (b: unknown) => void }; json: (b: unknown) => void }) => {
    const parsed = HomeworkCreateRequestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.issues });
    const result = createHomework(parsed.data);
    res.json(result);
});

// GET /references
app.get('/references', (_req: unknown, res: { json: (b: unknown) => void }) => {
    const result = getReferences();
    res.json(result);
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`API clínica escuchando en puerto ${PORT}`);
});
