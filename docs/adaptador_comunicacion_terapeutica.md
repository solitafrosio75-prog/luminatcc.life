# Adaptador de comunicación terapéutica

## Estado actual — Completado (tarea 2.2.3)

El adaptador de comunicación está implementado con derivación automática de severidad desde **dos fuentes**:

1. **Inventarios estandarizados** (BDI-II, PHQ-9) — fuente primaria
2. **Perfil clínico** (ClinicalProfile de Dexie) — modulador que eleva pero nunca baja severidad

### Archivos implementados

| Archivo | Responsabilidad |
|---------|----------------|
| `src/knowledge/therapist/severity.derivator.ts` | Derivador de severidad clínica desde inventarios + perfil |
| `src/knowledge/therapist/adaptador.comunicacion.ts` | Adaptador de lenguaje, tono y directividad |
| `src/components/TherapeuticSkillSelector.tsx` | Componente React que integra todo el flujo |
| `src/test/severity.derivator.test.ts` | 19 tests unitarios del derivador |
| `src/test/adaptador.comunicacion.test.ts` | 9 tests unitarios del adaptador |

## Flujo completo

```
┌─────────────────┐     ┌──────────────────┐
│   Inventarios   │     │  Perfil Clínico  │
│  BDI-II / PHQ-9 │     │   (Dexie DB)     │
└────────┬────────┘     └────────┬─────────┘
         │                       │
         └───────┬───────────────┘
                 ▼
    ┌────────────────────────┐
    │  deriveClinicalSeverity │  ← severidad + confianza + trazabilidad
    └────────────┬───────────┘
                 ▼
    ┌────────────────────────────┐
    │  adaptTherapeuticLanguage  │  ← tono + directividad + prefijo
    └────────────┬───────────────┘
                 ▼
    ┌────────────────────────────┐
    │  TherapeuticSkillSelector  │  ← componente React
    └────────────────────────────┘
```

## Reglas clínicas del derivador de severidad

1. **Inventarios recientes (<14 días)** son fuente primaria
2. **Perfil clínico** puede SUBIR la severidad, nunca bajarla
3. **Alertas críticas** (ítem 9 BDI-II/PHQ-9 ≥ 2) fuerzan severidad grave automáticamente
4. **Sin datos** → severidad moderada (precaución clínica), confianza baja

### Mapeo de severidad

| BDI-II (Sanz, 2003) | Severidad |
|---|---|
| 0-13 (mínima) | leve |
| 14-19 (leve) | leve |
| 20-28 (moderada) | moderada |
| 29-63 (grave) | grave |

| PHQ-9 (Kroenke, 2001) | Severidad |
|---|---|
| 0-4 (mínima) | leve |
| 5-9 (leve) | leve |
| 10-14 (moderada) | moderada |
| 15-19 (moderadamente grave) | grave |
| 20-27 (grave) | grave |

### Modulación por perfil clínico

- **Impairment funcional**: minimal/mild → leve, moderate → moderada, severe/very_severe → grave
- **Cronicidad**: years/lifelong → al menos moderada
- **Frecuencia**: daily → al menos moderada
- **Áreas afectadas**: ≥4 → al menos moderada, ≥6 → grave

## Adaptación de comunicación

| Parámetro | Fuente | Valores |
|---|---|---|
| **Tono** | Estado emocional | cauteloso/calmante/empático/contenedor/normalizador/activo/neutral |
| **Directividad** | Fase terapéutica | acogedor/no-directivo/directivo/motivacional |
| **Prefijo** | Severidad | (vacío) / [Intervención adaptada] / [Intervención cautelosa] / [⚠ CAUTELA MÁXIMA] |

## Ejemplo de uso

```tsx
// Uso básico — severidad derivada automáticamente
<TherapeuticSkillSelector context={context} />

// Con inventarios disponibles externamente
<TherapeuticSkillSelector
    context={context}
    inventorySnapshots={[snapshotFromBDIII(24, 'Depresión moderada', Date.now())]}
/>
```

## Pendiente

- Conectar con store Zustand de inventarios cuando se implemente (tarea 1.1.7)
- Validar el flujo con casos clínicos reales (tarea 3.3.1)
- Integrar con el orquestador de sesión (tarea 3.2.1)

---

**Archivo generado automáticamente por GitHub Copilot (GPT-4.1) — 14/03/2026**
