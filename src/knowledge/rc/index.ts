// rc/index.ts — Auto-registro de la técnica Reestructuración Cognitiva
import { registerTechnique } from '../registry';
import { RC_MANIFEST } from './rc.manifest';

registerTechnique(RC_MANIFEST);

export { RC_MANIFEST };
