// shared/index.ts — Auto-registro del manifest shared
import { registerSharedManifest } from '../registry';
import { SHARED_MANIFEST } from './shared.manifest';

registerSharedManifest(SHARED_MANIFEST);

export { SHARED_MANIFEST };
