// ac/index.ts — Auto-registro de la técnica Activación Conductual
import { registerTechnique } from '../registry';
import { AC_MANIFEST } from './ac.manifest';

registerTechnique(AC_MANIFEST);

export { AC_MANIFEST };
