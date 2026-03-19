# Integración del derivador de severidad clínica en el adaptador

## Flujo técnico implementado

1. **Obtención de datos clínicos**
   - El componente `TherapeuticSkillSelector` obtiene inventarios (BDI-II, PHQ-9) y perfil clínico (`ClinicalProfile`) desde la base de datos Dexie.

2. **Derivación de severidad clínica**
   - Se utiliza la función `deriveClinicalSeverity()` de `severity.derivator.ts` para calcular:
     - Severidad clínica (`leve`, `moderada`, `grave`)
     - Confianza en la derivación
     - Trazabilidad y fuentes
     - Alertas críticas y cautela

3. **Adaptación del mensaje terapéutico**
   - El resultado de severidad se pasa a `adaptTherapeuticLanguage()` de `adaptador.comunicacion.ts`.
   - Se adapta el mensaje según tono, directividad y prefijo clínico.
   - En caso de alertas críticas, se refuerza la cautela en el mensaje.

4. **Visualización en frontend**
   - El componente muestra:
     - Severidad clínica y confianza
     - Alertas críticas
     - Mensaje adaptado (tono, directividad, prefijo)
     - Habilidad terapéutica sugerida
     - Contexto clínico

## Archivos clave

- `src/knowledge/therapist/severity.derivator.ts`: Lógica del derivador.
- `src/knowledge/therapist/adaptador.comunicacion.ts`: Adaptador de lenguaje.
- `src/components/TherapeuticSkillSelector.tsx`: Integración y visualización.

## Checklist de validación

- [x] Inventarios y perfil clínico obtenidos correctamente.
- [x] Severidad derivada con trazabilidad y confianza.
- [x] Mensaje adaptado según severidad, tono y directividad.
- [x] Alertas críticas visualizadas y cautela reforzada.
- [x] Flujo end-to-end validado en frontend.

## Reglas clínicas implementadas

- Inventarios recientes (<14 días) son fuente primaria.
- Perfil clínico puede subir la severidad, nunca bajarla.
- Alertas críticas fuerzan severidad grave.
- Sin datos → severidad moderada por precaución.

---

Para extender el flujo, puedes agregar nuevas fuentes clínicas, personalizar mapeos de tono/directividad o integrar feedback de usuario.
