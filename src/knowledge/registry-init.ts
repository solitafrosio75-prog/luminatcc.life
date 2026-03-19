/**
 * registry-init.ts — Bootstrap de registro de técnicas
 *
 * Importar este archivo UNA VEZ desde main.tsx para que todas las
 * técnicas se auto-registren en el TECHNIQUE_REGISTRY.
 *
 * Separado de registry.ts para evitar TDZ (Temporal Dead Zone):
 * si los side-effect imports vivieran en registry.ts, serían hoisted
 * ANTES de que `const TECHNIQUE_REGISTRY = new Map()` se ejecute,
 * y los index.ts de cada técnica fallarían al llamar registerTechnique().
 */

// Técnicas terapéuticas
import './ac';
import './rc';
// import './ds'; // ⚠️ Carpeta vacía — descomentar cuando tenga contenido
// import './exposicion'; // ⚠️ Carpeta vacía — descomentar cuando tenga contenido
// import './modificacion_conducta'; // ⚠️ Carpeta vacía — descomentar cuando tenga contenido
// import './dialectico_conductual'; // ⚠️ Carpeta vacía — descomentar cuando tenga contenido
// import './trec'; // ⚠️ Carpeta vacía — descomentar cuando tenga contenido
import './act';
import './mindfulness';

// Conocimiento compartido
import './shared';
