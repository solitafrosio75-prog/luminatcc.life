# Integración API Anthropic — Node.js/Express
## Arquitectura: Frontend → Tu servidor → Anthropic

La API key NUNCA va en el frontend. El navegador llama a tu propio servidor,
tu servidor llama a Anthropic. Así la clave queda protegida.

---

## PASO 1 — Instalar dependencias

```bash
npm install express cors node-fetch dotenv
# Si ya usás fetch nativo en Node 18+, node-fetch no es necesario
```

---

## PASO 2 — Variable de entorno

Crear archivo `.env` en la raíz de tu proyecto:

```env
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxx
PORT=3000
```

**CRÍTICO:** Agregar `.env` a tu `.gitignore` para que la clave nunca llegue a GitHub.

```gitignore
.env
node_modules/
```

En tu plataforma de deployment (Railway, Render, Fly.io, etc.) configurar
la variable de entorno `ANTHROPIC_API_KEY` en el panel de configuración.

---

## PASO 3 — Endpoint proxy en tu servidor

### Opción A: Agregar a tu `server.js` / `app.js` existente

```javascript
// server.js (agregar estos bloques a tu archivo existente)

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());

// CORS: permitir solo tu dominio en producción
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? 'https://tudominio.com'   // ← cambiar por tu dominio real
    : 'http://localhost:3000'
}));

// ── PROXY ENDPOINT ──────────────────────────────────────────
// El frontend llama a este endpoint, no a Anthropic directamente
app.post('/api/chat', async (req, res) => {

  const { messages, system, max_tokens } = req.body;

  // Validaciones básicas
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages requerido' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'API key no configurada en el servidor' });
  }

  try {
    // Llamada a Anthropic con streaming
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: max_tokens || 400,
        system: system,
        messages: messages,
        stream: true
      })
    });

    if (!anthropicResponse.ok) {
      const error = await anthropicResponse.json();
      console.error('Error Anthropic:', error);
      return res.status(anthropicResponse.status).json({
        error: error.error?.message || 'Error en API de Anthropic'
      });
    }

    // Pasar el stream directamente al frontend
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    anthropicResponse.body.pipe(res);

  } catch (err) {
    console.error('Error proxy:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
```

### Opción B: Archivo separado (más ordenado)

```
tu-proyecto/
├── server.js
├── routes/
│   └── chat.js        ← nuevo archivo
├── .env
└── package.json
```

```javascript
// routes/chat.js

const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
  const { messages, system, max_tokens } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages requerido' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: max_tokens || 400,
        system: system,
        messages: messages,
        stream: true
      })
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json({ error: error.error?.message });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    response.body.pipe(res);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
```

```javascript
// En tu server.js principal, agregar:
require('dotenv').config();
const chatRouter = require('./routes/chat');
app.use('/api/chat', chatRouter);
```

---

## PASO 4 — Ajuste en el frontend (primer_encuentro_ia.html)

Reemplazar la función `callClaude` y `startSession` con esta versión
que llama a TU servidor en lugar de a Anthropic directamente.

Buscar en el HTML la función `callClaude` y reemplazarla por:

```javascript
async function callClaude(userMessage) {
  document.getElementById('stMotor').textContent = 'generando…';

  const systemPrompt = buildSystemPrompt();
  const messages = [
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ];

  try {
    // ↓ CAMBIO: apunta a tu servidor, no a Anthropic
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system: systemPrompt,
        messages: messages,
        max_tokens: 400
      })
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('Error:', err);
      document.getElementById('stMotor').textContent = 'error';
      return null;
    }

    // Streaming — igual que antes
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    const bubble = createStreamingBubble();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      for (const line of chunk.split('\n')) {
        if (line.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.delta?.text) {
              fullText += parsed.delta.text;
              updateStreamingBubble(bubble, fullText);
            }
          } catch(e) {}
        }
      }
    }

    finalizeStreamingBubble(bubble);
    document.getElementById('stMotor').textContent = 'activo';
    return fullText;

  } catch (err) {
    console.error('Error fetch:', err);
    document.getElementById('stMotor').textContent = 'error';
    return null;
  }
}
```

También reemplazar la llamada en `startSession` — buscar la línea:
```javascript
const response = await fetch('https://api.anthropic.com/v1/messages', {
```
Y cambiarla por:
```javascript
const response = await fetch('/api/chat', {
```
Y reemplazar el body de esa llamada por:
```javascript
body: JSON.stringify({
  system: systemPrompt,
  messages: [{ role: 'user', content: '[INICIO DE SESIÓN: generá el mensaje de bienvenida del terapeuta]' }],
  max_tokens: 200
})
```
(Eliminar los headers de autenticación de esa llamada también, tu servidor los maneja.)

---

## PASO 5 — También eliminar del HTML

En el HTML ya no necesitás el campo de API key ni la función `saveApiKey`.
Podés eliminar estos elementos del header:

```html
<!-- ELIMINAR estos elementos del header -->
<div class="api-setup">
  <input class="api-input" id="apiKeyInput" .../>
  <button class="api-save-btn" ...>Conectar</button>
</div>
<div class="api-status" id="apiStatus" ...></div>
```

Y en el JS eliminar:
```javascript
let apiKey = '';
function saveApiKey() { ... }
```

La variable `apiKey` en los condicionales `if (!apiKey)` reemplazarla
por `false` o eliminar esas ramas de fallback si ya no las necesitás.

---

## PASO 6 — Verificar que funciona

```bash
# Arrancar el servidor
node server.js

# En otra terminal, testear el endpoint
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"hola"}],"system":"Respondé brevemente."}'
```

Si ves texto streameado en la terminal, el proxy funciona.

---

## Resumen de la arquitectura final

```
Usuario (navegador)
        ↓  POST /api/chat  (sin API key)
Tu servidor Express
        ↓  POST api.anthropic.com/v1/messages  (con API key segura)
Anthropic
        ↓  stream de vuelta
Tu servidor (pipe directo)
        ↓  stream
Usuario (navegador)
```

La API key existe únicamente en el servidor, en una variable de entorno.
Nunca viaja al navegador, nunca aparece en el código fuente del HTML.
