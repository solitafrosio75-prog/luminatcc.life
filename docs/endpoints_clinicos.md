# Documentación de endpoints clínicos TCC-Lab

## POST /session

- Crear nueva sesión clínica.
- Request: SessionCreateRequest
- Response: SessionCreateResponse
- Esquema: SessionCreateRequestSchema

## GET /session/{id}

- Consultar sesión clínica por id.
- Response: SessionGetResponse
- Esquema: SessionGetResponseSchema

## POST /technique

- Registrar aplicación de técnica.
- Request: TechniqueCreateRequest
- Response: TechniqueCreateResponse
- Esquema: TechniqueCreateRequestSchema

## POST /homework

- Asignar tarea clínica.
- Request: HomeworkCreateRequest
- Response: HomeworkCreateResponse
- Esquema: HomeworkCreateRequestSchema

## GET /references

- Listar bibliografía centralizada.
- Response: ReferencesGetResponse
- Esquema: ReferencesGetResponseSchema

---

Cada endpoint valida y vincula los datos clínicos con referencias centralizadas (references.json).
La integración permite trazabilidad, evidencia y auditoría clínica.
