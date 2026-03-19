# Documentación de integración clínica TCC-Lab

## Endpoints implementados

- **POST /session**: Crear nueva sesión clínica.
- **GET /session/{id}**: Consultar sesión clínica por id.
- **POST /technique**: Registrar aplicación de técnica.
- **POST /homework**: Asignar tarea clínica.
- **GET /references**: Listar bibliografía centralizada.

## Contratos y esquemas

- Contratos TypeScript: [src/services/api/contracts.ts](src/services/api/contracts.ts)
- Esquemas Zod: [src/knowledge/schemas/endpoints.zod.ts](src/knowledge/schemas/endpoints.zod.ts)

## Handlers mock

- Lógica simulada para cada endpoint en [src/services/api/handlers.ts](src/services/api/handlers.ts)
- Validación de datos con Zod.
- Integración directa con references.json para trazabilidad clínica.

## Tests unitarios

- Cobertura de todos los endpoints en [src/services/api/handlers.test.ts](src/services/api/handlers.test.ts)
- Validación de datos correctos e incorrectos.
- Respuesta mock y trazabilidad.

## Integración frontend

- Funciones de llamada a endpoints mock en [src/services/api/integration.ts](src/services/api/integration.ts)
- Listas para usar en componentes React/Vite.
- Plantilla para migrar a backend real (fetch/axios).

## Flujo recomendado

1. Validar datos clínicos y referencias antes de enviar.
2. Usar funciones de integración en componentes.
3. Ejecutar tests unitarios para asegurar la lógica.
4. Migrar a backend real si se requiere persistencia.
5. Documentar cada flujo clínico y bibliográfico.

## Checklist de cierre

- [x] Endpoints definidos y documentados.
- [x] Contratos y esquemas validados.
- [x] Handlers mock implementados.
- [x] Tests unitarios cubiertos.
- [x] Integración frontend lista.
- [ ] Migración a backend real (opcional).
- [ ] Actualización de documentación clínica y técnica.

---

Para cualquier flujo, consulta la documentación técnica y los contratos para asegurar trazabilidad y evidencia clínica.
