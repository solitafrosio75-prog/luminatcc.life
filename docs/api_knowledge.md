# API pública — knowledge/

## Exports principales

- **Módulo Paciente**
  - patient.types.ts: Tipos clínicos (PatientProfile, ClinicalHistory, etc.)
  - patient.store.ts: Store Zustand (CRUD, registro, análisis de cambio)
  - change.analysis.ts: Análisis Jacobson-Truax, tendencia, comparación

- **Orquestador de sesión**
  - session.orchestrator.ts: Flujo priorizado (Ético > Automonitoreo > Relacional > resto)

- **Flujos clínicos**
  - first.session.ac.ts: Flujo de primera sesión (evaluación, inventario, psicoeducación, tarea, feedback)
  - intermediate.session.ac.ts: Flujo de sesión intermedia (revisión, comparación, TRAPs/TRACs, barreras)

- **Exports públicos**
  - Todos los módulos anteriores están disponibles vía knowledge/index.ts
  - Ejemplo:

    ```ts
    import { Patient, usePatientStore, analyzeChangeBDI, orchestrateSession, runFirstSessionAC, runIntermediateSessionAC } from 'knowledge';
    ```

## Contrato de comunicación entre módulos

- El orquestador recibe un contexto clínico (SessionContext) y devuelve una salida priorizada (SessionOutput)
- Los flujos de sesión usan el orquestador y el análisis de cambio para adaptar decisiones y tareas
- El store del paciente permite persistencia, consulta y actualización de datos clínicos
- El análisis de cambio se integra automáticamente en el store y los flujos

## Integración

- Los módulos pueden usarse en cualquier componente, handler o servicio
- Los tests de integración validan la interoperabilidad y la lógica clínica

---
Actualizado: 14 de marzo de 2026
