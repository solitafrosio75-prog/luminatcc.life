# Integración del selector de habilidad terapéutica

## Estado actual

- El selector de habilidad terapéutica está implementado en el archivo [src/knowledge/therapist/relational.selector.ts](src/knowledge/therapist/relational.selector.ts).
- El componente React [src/components/TherapeuticSkillSelector.tsx](src/components/TherapeuticSkillSelector.tsx) permite mostrar la habilidad sugerida en la UI.
- El componente es completamente dinámico: acepta el contexto clínico y el mensaje como props.
- El contexto puede ser conectado a Zustand (`useAppStore`) para obtener la fase terapéutica, estado emocional y tipo de respuesta del paciente.

## Lógica clínica

- El selector prioriza siempre la validación antes de cualquier intervención (regla clínica).
- Usa el campo `cuando_usar` de `habilidades_entrevista.json` para filtrar y priorizar habilidades.
- Si no hay coincidencias, selecciona una habilidad empática o exploratoria.

## Ejemplo de uso

```jsx
<TherapeuticSkillSelector
  context={{
    fase: 'intervencion',
    estadoEmocional: 'ansiedad',
    tipoRespuesta: 'cognitiva'
  }}
  mensajeClinico="Veo que te preocupa mucho el futuro y te cuesta concentrarte."
/>
```

## Conexión con Zustand

- El componente puede recibir el contexto directamente desde el store:

```tsx
import { useAppStore } from '../shared/store';

const context = {
  fase: 'intervencion',
  estadoEmocional: useAppStore(state => state.emotionalState?.tipo || 'neutro'),
  tipoRespuesta: 'emocional', // adaptar según el flujo
};
```

## Decisiones tomadas

- Se prioriza la validación clínica en el selector.
- El componente es flexible: puede usarse con props o conectado a Zustand.
- La lógica de selección es modular y fácilmente testeable.

## Pendiente

- Integrar el selector en el flujo de sesión real.
- Validar con casos clínicos reales.
- Documentar API pública y exportar en el índice del módulo terapeuta.
