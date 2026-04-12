import { useState } from 'react';
import { Database, Inbox, PenTool, ShieldAlert } from 'lucide-react';
import { MLCuradoria } from './MLCuradoria';
import { SVGStudio } from './SVGStudio';
import { AtlasManagerV4 } from './AtlasManagerV4';

export function CurationHubV4() {
  const [activeTab, setActiveTab] = useState<'inbox' | 'manager' | 'studio'>('inbox');

  return (
    <div className="w-full flex flex-col min-h-[80vh] animate-in fade-in">
      <div className="bg-slate-900 w-full p-4 rounded-xl shadow-lg mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 text-white">
          <div className="p-2 bg-brand-500 rounded-lg shadow-inner border border-brand-400"><ShieldAlert className="w-6 h-6 text-white"/></div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Painel do Curador (Hub V4)</h2>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest flex items-center gap-1">
              Acesso Administrativo 
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            </p>
          </div>
        </div>
        <div className="flex bg-slate-800 p-1.5 rounded-xl shadow-inner w-full md:w-auto overflow-x-auto">
          <button 
            onClick={() => setActiveTab('inbox')}
            className={`px-4 py-2.5 font-bold text-sm rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'inbox' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
          >
            <Inbox className="w-4 h-4"/> Inbox ML
          </button>
          <button 
            onClick={() => setActiveTab('manager')}
            className={`px-4 py-2.5 font-bold text-sm rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'manager' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
          >
            <Database className="w-4 h-4"/> Atlas V4 DB
          </button>
          <button 
            onClick={() => setActiveTab('studio')}
            className={`px-4 py-2.5 font-bold text-sm rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'studio' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
          >
            <PenTool className="w-4 h-4"/> Estúdio SVG
          </button>
        </div>
      </div>

      <div className="flex-1 w-full flex flex-col">
        {activeTab === 'inbox' && <MLCuradoria />}
        {activeTab === 'manager' && <AtlasManagerV4 />}
        {activeTab === 'studio' && <SVGStudio />}
      </div>
    </div>
  );
}
