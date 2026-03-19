/**
 * DevToolsLayout — Shell principal del Developer Dashboard
 *
 * Sidebar con 4 tabs + zona de contenido.
 * Ruta: /dev (lazy-loaded, code-split)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KBNavigatorTab } from './tabs/KBNavigatorTab';
import { InventoryViewerTab } from './tabs/InventoryViewerTab';
import { TemplateDigitizerTab } from './tabs/TemplateDigitizerTab';
import { KBStatusTab } from './tabs/KBStatusTab';

type DevTab = 'navigator' | 'inventories' | 'templates' | 'status';

const TABS: { id: DevTab; label: string; icon: string; desc: string }[] = [
  { id: 'navigator',   label: 'Navegador KB',   icon: '📚', desc: '9 tecnicas x 13 areas' },
  { id: 'inventories', label: 'Inventarios',     icon: '📋', desc: 'Instrumentos clinicos' },
  { id: 'templates',   label: 'Digitalizador',   icon: '📝', desc: 'Plantillas y formularios' },
  { id: 'status',      label: 'Estado KB',        icon: '📊', desc: 'Cobertura y validacion' },
];

export default function DevToolsLayout() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DevTab>('navigator');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-slate-800 flex flex-col bg-slate-950">
        {/* Header */}
        <div className="p-4 border-b border-slate-800">
          <button
            onClick={() => navigate('/')}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors mb-2 flex items-center gap-1"
          >
            <span>&larr;</span> Volver al inicio
          </button>
          <h1 className="text-sm font-bold text-slate-200 tracking-wide">
            DevTools
          </h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">
            Base de Conocimiento
          </p>
        </div>

        {/* Tab navigation */}
        <nav className="flex-1 p-2 space-y-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-950/50 border border-blue-800 text-blue-200'
                  : 'border border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{tab.icon}</span>
                <div>
                  <div className="text-sm font-medium">{tab.label}</div>
                  <div className="text-[10px] text-slate-500">{tab.desc}</div>
                </div>
              </div>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 text-[10px] text-slate-600 space-y-0.5">
          <div>TCC-Lab Knowledge System</div>
          <div>121 JSON files / 9 tecnicas</div>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6">
        {activeTab === 'navigator' && <KBNavigatorTab />}
        {activeTab === 'inventories' && <InventoryViewerTab />}
        {activeTab === 'templates' && <TemplateDigitizerTab />}
        {activeTab === 'status' && <KBStatusTab />}
      </main>
    </div>
  );
}
