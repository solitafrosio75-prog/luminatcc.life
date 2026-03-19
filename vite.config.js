var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import dotenv from 'dotenv';
// Cargar variables de entorno — override:true fuerza los valores del .env
// sobre cualquier variable ya definida en el entorno del sistema (ej: VS Code).
dotenv.config({ override: true });
// ---------------------------------------------------------------------------
// Vite dev-server middleware — proxies /api/empathy to Anthropic so the API
// key is NEVER part of the client bundle.  In production, replace this with
// a serverless function (see api/empathy.ts).
// ---------------------------------------------------------------------------
/** Forced server-side model for /api/empathy (non-streaming). */
var DEV_ALLOWED_MODEL = 'claude-3-5-haiku-20241022';
/** Model for /api/chat (streaming clinical session). */
var DEV_CHAT_MODEL = 'claude-sonnet-4-20250514';
/** Hard cap on tokens to prevent API credit abuse during development. */
var DEV_MAX_TOKENS_LIMIT = 300;
/** Maximum request body size accepted by the dev proxy (64 KB). */
var DEV_MAX_BODY_BYTES = 64 * 1024;
/** Maximum number of messages allowed per request. */
var DEV_MAX_MESSAGES = 10;
/** Maximum character length of a single message content. */
var DEV_MAX_CONTENT_LENGTH = 2000;
/** Only these roles may appear in messages forwarded to the API. */
var DEV_ALLOWED_ROLES = new Set(['user', 'assistant']);
// ---------------------------------------------------------------------------
// Rate limiting configuration — prevents API credit abuse
// ----------------------------------------------------------------------------
var RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
var MAX_REQUESTS_PER_WINDOW = 10; // Max requests per window
var requestTimestamps = new Map();
/**
 * Check if request is allowed under rate limits.
 * Returns true if allowed, false if rate limit exceeded.
 */
function checkRateLimit(endpoint, clientIp) {
    var key = "".concat(endpoint, ":").concat(clientIp);
    var now = Date.now();
    var timestamps = requestTimestamps.get(key) || [];
    // Filter out timestamps outside the window
    var recentTimestamps = timestamps.filter(function (t) { return now - t < RATE_LIMIT_WINDOW_MS; });
    if (recentTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
        return false;
    }
    // Add current timestamp
    recentTimestamps.push(now);
    requestTimestamps.set(key, recentTimestamps);
    return true;
}
function empathyProxyPlugin() {
    return {
        name: 'empathy-proxy',
        configureServer: function (server) {
            var _this = this;
            server.middlewares.use('/api/empathy', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var clientIp, chunks, totalBytes, chunk, e_1_1, rawBody, incoming, invalidMsg, safeBody, apiKey, upstream, data, text, normalized, err_1;
                var _a, req_1, req_1_1;
                var _b, e_1, _c, _d;
                var _e, _f, _g, _h, _j;
                return __generator(this, function (_k) {
                    switch (_k.label) {
                        case 0:
                            if (req.method !== 'POST') {
                                res.writeHead(405, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ error: 'Method not allowed' }));
                                return [2 /*return*/];
                            }
                            clientIp = req.socket.remoteAddress || 'unknown';
                            if (!checkRateLimit('/api/empathy', clientIp)) {
                                res.writeHead(429, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }));
                                return [2 /*return*/];
                            }
                            chunks = [];
                            totalBytes = 0;
                            _k.label = 1;
                        case 1:
                            _k.trys.push([1, 6, 7, 12]);
                            _a = true, req_1 = __asyncValues(req);
                            _k.label = 2;
                        case 2: return [4 /*yield*/, req_1.next()];
                        case 3:
                            if (!(req_1_1 = _k.sent(), _b = req_1_1.done, !_b)) return [3 /*break*/, 5];
                            _d = req_1_1.value;
                            _a = false;
                            chunk = _d;
                            totalBytes += chunk.length;
                            if (totalBytes > DEV_MAX_BODY_BYTES) {
                                res.writeHead(413, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ error: 'Request body too large' }));
                                return [2 /*return*/];
                            }
                            chunks.push(chunk);
                            _k.label = 4;
                        case 4:
                            _a = true;
                            return [3 /*break*/, 2];
                        case 5: return [3 /*break*/, 12];
                        case 6:
                            e_1_1 = _k.sent();
                            e_1 = { error: e_1_1 };
                            return [3 /*break*/, 12];
                        case 7:
                            _k.trys.push([7, , 10, 11]);
                            if (!(!_a && !_b && (_c = req_1.return))) return [3 /*break*/, 9];
                            return [4 /*yield*/, _c.call(req_1)];
                        case 8:
                            _k.sent();
                            _k.label = 9;
                        case 9: return [3 /*break*/, 11];
                        case 10:
                            if (e_1) throw e_1.error;
                            return [7 /*endfinally*/];
                        case 11: return [7 /*endfinally*/];
                        case 12:
                            try {
                                rawBody = JSON.parse(Buffer.concat(chunks).toString());
                            }
                            catch (_l) {
                                res.writeHead(400, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ error: 'Invalid JSON body' }));
                                return [2 /*return*/];
                            }
                            // ---------------------------------------------------------------
                            // Validate and sanitise — never forward the raw payload directly.
                            // ---------------------------------------------------------------
                            if (rawBody == null ||
                                typeof rawBody !== 'object' ||
                                !('messages' in rawBody) ||
                                !Array.isArray(rawBody.messages) ||
                                rawBody.messages.length === 0) {
                                res.writeHead(400, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ error: 'messages must be a non-empty array' }));
                                return [2 /*return*/];
                            }
                            incoming = rawBody;
                            // Enforce message count limit.
                            if (incoming.messages.length > DEV_MAX_MESSAGES) {
                                res.writeHead(400, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ error: "messages array must not exceed ".concat(DEV_MAX_MESSAGES, " entries") }));
                                return [2 /*return*/];
                            }
                            invalidMsg = incoming.messages.find(function (m) {
                                return m == null ||
                                    typeof m !== 'object' ||
                                    !DEV_ALLOWED_ROLES.has(m.role) ||
                                    typeof m.content !== 'string' ||
                                    m.content.trim().length === 0 ||
                                    m.content.length > DEV_MAX_CONTENT_LENGTH;
                            });
                            if (invalidMsg !== undefined) {
                                res.writeHead(400, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({
                                    error: "Each message must have role ('user'|'assistant') and non-empty content \u2264 ".concat(DEV_MAX_CONTENT_LENGTH, " chars"),
                                }));
                                return [2 /*return*/];
                            }
                            safeBody = {
                                model: DEV_ALLOWED_MODEL,
                                messages: incoming.messages,
                                max_tokens: Math.min(typeof incoming.max_tokens === 'number' && incoming.max_tokens > 0
                                    ? incoming.max_tokens
                                    : 150, DEV_MAX_TOKENS_LIMIT),
                                temperature: typeof incoming.temperature === 'number' &&
                                    incoming.temperature >= 0 &&
                                    incoming.temperature <= 2
                                    ? incoming.temperature
                                    : 0.7,
                            };
                            apiKey = process.env.ANTHROPIC_API_KEY;
                            if (!apiKey) {
                                res.writeHead(503, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured on server' }));
                                return [2 /*return*/];
                            }
                            _k.label = 13;
                        case 13:
                            _k.trys.push([13, 16, , 17]);
                            return [4 /*yield*/, fetch('https://api.anthropic.com/v1/messages', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'x-api-key': apiKey,
                                        'anthropic-version': '2023-06-01',
                                    },
                                    body: JSON.stringify(safeBody),
                                })];
                        case 14:
                            upstream = _k.sent();
                            return [4 /*yield*/, upstream.json()];
                        case 15:
                            data = _k.sent();
                            if (!upstream.ok) {
                                res.writeHead(upstream.status, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ error: (_f = (_e = data.error) === null || _e === void 0 ? void 0 : _e.message) !== null && _f !== void 0 ? _f : 'Upstream error' }));
                                return [2 /*return*/];
                            }
                            text = (_j = (_h = (_g = data.content) === null || _g === void 0 ? void 0 : _g.find(function (b) { return b.type === 'text'; })) === null || _h === void 0 ? void 0 : _h.text) !== null && _j !== void 0 ? _j : '';
                            normalized = { choices: [{ message: { content: text } }] };
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify(normalized));
                            return [3 /*break*/, 17];
                        case 16:
                            err_1 = _k.sent();
                            console.error('[empathy-proxy] upstream error:', err_1);
                            res.writeHead(502, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: 'Upstream request failed' }));
                            return [3 /*break*/, 17];
                        case 17: return [2 /*return*/];
                    }
                });
            }); });
            // -----------------------------------------------------------------------
            // /api/chat — streaming endpoint for the Primer Encuentro clinical chat.
            // Proxies to Anthropic with stream:true and pipes SSE back to the client.
            // -----------------------------------------------------------------------
            server.middlewares.use('/api/chat', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var clientIp, chunks, totalBytes, chunk, e_2_1, rawBody, incoming, invalidMsg, apiKey, chatBody, upstream, errData, reader, _a, done, value, err_2;
                var _b, req_2, req_2_1;
                var _c, e_2, _d, _e;
                var _f, _g;
                return __generator(this, function (_h) {
                    switch (_h.label) {
                        case 0:
                            if (req.method !== 'POST') {
                                res.writeHead(405, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ error: 'Method not allowed' }));
                                return [2 /*return*/];
                            }
                            clientIp = req.socket.remoteAddress || 'unknown';
                            if (!checkRateLimit('/api/chat', clientIp)) {
                                res.writeHead(429, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }));
                                return [2 /*return*/];
                            }
                            chunks = [];
                            totalBytes = 0;
                            _h.label = 1;
                        case 1:
                            _h.trys.push([1, 6, 7, 12]);
                            _b = true, req_2 = __asyncValues(req);
                            _h.label = 2;
                        case 2: return [4 /*yield*/, req_2.next()];
                        case 3:
                            if (!(req_2_1 = _h.sent(), _c = req_2_1.done, !_c)) return [3 /*break*/, 5];
                            _e = req_2_1.value;
                            _b = false;
                            chunk = _e;
                            totalBytes += chunk.length;
                            if (totalBytes > DEV_MAX_BODY_BYTES) {
                                res.writeHead(413, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ error: 'Request body too large' }));
                                return [2 /*return*/];
                            }
                            chunks.push(chunk);
                            _h.label = 4;
                        case 4:
                            _b = true;
                            return [3 /*break*/, 2];
                        case 5: return [3 /*break*/, 12];
                        case 6:
                            e_2_1 = _h.sent();
                            e_2 = { error: e_2_1 };
                            return [3 /*break*/, 12];
                        case 7:
                            _h.trys.push([7, , 10, 11]);
                            if (!(!_b && !_c && (_d = req_2.return))) return [3 /*break*/, 9];
                            return [4 /*yield*/, _d.call(req_2)];
                        case 8:
                            _h.sent();
                            _h.label = 9;
                        case 9: return [3 /*break*/, 11];
                        case 10:
                            if (e_2) throw e_2.error;
                            return [7 /*endfinally*/];
                        case 11: return [7 /*endfinally*/];
                        case 12:
                            try {
                                rawBody = JSON.parse(Buffer.concat(chunks).toString());
                            }
                            catch (_j) {
                                res.writeHead(400, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ error: 'Invalid JSON body' }));
                                return [2 /*return*/];
                            }
                            if (rawBody == null ||
                                typeof rawBody !== 'object' ||
                                !('messages' in rawBody) ||
                                !Array.isArray(rawBody.messages) ||
                                rawBody.messages.length === 0) {
                                res.writeHead(400, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ error: 'messages must be a non-empty array' }));
                                return [2 /*return*/];
                            }
                            incoming = rawBody;
                            if (incoming.messages.length > DEV_MAX_MESSAGES) {
                                res.writeHead(400, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ error: "messages array must not exceed ".concat(DEV_MAX_MESSAGES, " entries") }));
                                return [2 /*return*/];
                            }
                            invalidMsg = incoming.messages.find(function (m) {
                                return m == null ||
                                    typeof m !== 'object' ||
                                    !DEV_ALLOWED_ROLES.has(m.role) ||
                                    typeof m.content !== 'string' ||
                                    m.content.trim().length === 0 ||
                                    m.content.length > DEV_MAX_CONTENT_LENGTH;
                            });
                            if (invalidMsg !== undefined) {
                                res.writeHead(400, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ error: 'Invalid message in array' }));
                                return [2 /*return*/];
                            }
                            apiKey = process.env.ANTHROPIC_API_KEY;
                            if (!apiKey) {
                                res.writeHead(503, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured on server' }));
                                return [2 /*return*/];
                            }
                            chatBody = {
                                model: DEV_CHAT_MODEL,
                                max_tokens: Math.min(typeof incoming.max_tokens === 'number' && incoming.max_tokens > 0
                                    ? incoming.max_tokens
                                    : 300, 600),
                                messages: incoming.messages,
                                stream: true,
                            };
                            if (typeof incoming.system === 'string' && incoming.system.trim().length > 0) {
                                chatBody.system = incoming.system;
                            }
                            _h.label = 13;
                        case 13:
                            _h.trys.push([13, 23, , 24]);
                            return [4 /*yield*/, fetch('https://api.anthropic.com/v1/messages', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'x-api-key': apiKey,
                                        'anthropic-version': '2023-06-01',
                                    },
                                    body: JSON.stringify(chatBody),
                                })];
                        case 14:
                            upstream = _h.sent();
                            if (!!upstream.ok) return [3 /*break*/, 16];
                            return [4 /*yield*/, upstream.json()];
                        case 15:
                            errData = _h.sent();
                            res.writeHead(upstream.status, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: (_g = (_f = errData.error) === null || _f === void 0 ? void 0 : _f.message) !== null && _g !== void 0 ? _g : 'Upstream error' }));
                            return [2 /*return*/];
                        case 16:
                            // Pipe the SSE stream from Anthropic straight to the client.
                            res.writeHead(200, {
                                'Content-Type': 'text/event-stream',
                                'Cache-Control': 'no-cache',
                                'Connection': 'keep-alive',
                            });
                            reader = upstream.body.getReader();
                            _h.label = 17;
                        case 17:
                            _h.trys.push([17, , 21, 22]);
                            _h.label = 18;
                        case 18:
                            if (!true) return [3 /*break*/, 20];
                            return [4 /*yield*/, reader.read()];
                        case 19:
                            _a = _h.sent(), done = _a.done, value = _a.value;
                            if (done)
                                return [3 /*break*/, 20];
                            res.write(value);
                            return [3 /*break*/, 18];
                        case 20: return [3 /*break*/, 22];
                        case 21:
                            reader.releaseLock();
                            return [7 /*endfinally*/];
                        case 22:
                            res.end();
                            return [3 /*break*/, 24];
                        case 23:
                            err_2 = _h.sent();
                            console.error('[chat-proxy] upstream error:', err_2);
                            if (!res.headersSent) {
                                res.writeHead(502, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ error: 'Upstream request failed' }));
                            }
                            return [3 /*break*/, 24];
                        case 24: return [2 /*return*/];
                    }
                });
            }); });
        },
    };
}
export default defineConfig({
    plugins: [react(), empathyProxyPlugin()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
