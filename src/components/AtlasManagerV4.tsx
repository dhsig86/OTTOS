import { useState, useEffect } from 'react';
import { ServerCrash, Loader2, Plus, Trash2, Edit, RefreshCw, X, BarChart } from 'lucide-react';
import { atlasData } from '../data/mockData';
import { quizQuestions } from '../data/quizData';
import { getApiBase } from '../services/api';

interface ClinicalCase {
  id: number;
  title: string;
  clinical_history: string;
  primary_diagnosis: string;
  taxonomies: any[];
  media_urls: string[];
  isMlOnly?: boolean;
}

export function AtlasManagerV4() {
  const [cases, setCases] = useState<ClinicalCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);
  const [editingCase, setEditingCase] = useState<ClinicalCase | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Filtros UI
  const [activeTab, setActiveTab] = useState<'all' | 'public' | 'quiz' | 'ml' | 'audit'>('public');
  const [searchQuery, setSearchQuery] = useState('');

  // Create New Case States
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newCaseImage, setNewCaseImage] = useState<File | null>(null);
  const [newCaseData, setNewCaseData] = useState({ title: '', primary_diagnosis: '', clinical_history: '', isMlOnly: false });

  const dataURLtoFile = (dataurl: string, filename: string) => {
    let arr = dataurl.split(','), mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) return null;
    let mime = mimeMatch[1];
    let bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){ u8arr[n] = bstr.charCodeAt(n); }
    return new File([u8arr], filename, {type:mime});
  };

  const handleMigrate = async () => {
    if (!confirm('Isso enviará TUDO (Atlas + Quiz antigos) para o sistema V4. Continuar?')) return;
    setIsMigrating(true);
    let count = 0;
    try {
      const apiBase = getApiBase();
      
      // 1. MIGRAR ATLAS
      for (const item of atlasData) {
        const finalUrls = [];
        for (let i = 0; i < item.images.length; i++) {
          let imgData = item.images[i];
          if (imgData.startsWith('data:')) {
            const file = dataURLtoFile(imgData, `migrate_atlas_${item.id}_${i}.jpg`);
            if (file) {
              const fd = new FormData();
              fd.append('file', file);
              const upRes = await fetch(`${apiBase}/api/cms/upload`, { method: 'POST', body: fd });
              const upData = await upRes.json();
              finalUrls.push(upData.success ? upData.url : imgData);
            }
          } else {
            finalUrls.push(imgData);
          }
        }

        const payload = {
          title: item.pathology.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          clinical_history: item.description,
          primary_diagnosis: item.pathology.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          patient_demographics: {},
          taxonomies: [],
          media_urls: finalUrls,
          svg_json: JSON.stringify(item.hotspots ? item.hotspots[0] || [] : []),
        };
        const caseRes = await fetch(`${apiBase}/api/cms/cases`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (caseRes.ok) count++;
      }

      // 2. MIGRAR QUIZ
      for (const qItem of quizQuestions) {
         let imgUrl = qItem.image;
         if (imgUrl.startsWith('data:')) {
            const file = dataURLtoFile(imgUrl, `migrate_quiz_${qItem.id}.jpg`);
            if (file) {
               const fd = new FormData();
               fd.append('file', file);
               const upRes = await fetch(`${apiBase}/api/cms/upload`, { method: 'POST', body: fd });
               const upData = await upRes.json();
               if(upData.success) imgUrl = upData.url;
            }
         }
         const diagText = qItem.options[qItem.correctOptionIndex]?.split(' - ')[0] || "Diagnóstico Oculto (Quiz)";
         const titleRef = `[Quiz Legado] ${diagText.substring(0, 30)}`;

         const payload2 = {
            title: titleRef,
            clinical_history: qItem.clinicalCase + `\n\n[Resposta Oficial]: ` + qItem.explanation,
            primary_diagnosis: diagText,
            taxonomies: ['quiz_only'],
            media_urls: [imgUrl],
            svg_json: '[]'
         };
         
         const qRes = await fetch(`${apiBase}/api/cms/cases`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload2),
         });
         if (qRes.ok) count++;
      }

      alert(`Migração concluída! ${count} casos (Atlas + Quiz) inseridos na V4.`);
      fetchCases();
    } catch (e) {
      alert('Erro na migração: ' + e);
    } finally {
      setIsMigrating(false);
    }
  };

  const fetchCases = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/api/cms/cases`);
      const data = await res.json();
      if (data.success) {
        const mappedCases = data.cases.map((c: any) => ({
          ...c,
          isMlOnly: (c.taxonomies || []).includes('ml_only'),
        }));
        setCases(mappedCases);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja apagar este caso da V4?')) return;
    try {
      const res = await fetch(`${getApiBase()}/api/cms/cases/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchCases();
      } else {
        alert(data.detail || data.error);
      }
    } catch (e) {
      alert('Erro de comunicação com API CMS.');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingCase) return;
    setIsSaving(true);
    const apiBase = getApiBase();
    try {
      const payload = {
        title: editingCase.title,
        primary_diagnosis: editingCase.primary_diagnosis,
        clinical_history: editingCase.clinical_history,
        patient_demographics: {},
        taxonomies: editingCase.isMlOnly ? ['ml_only'] : [],
        media_urls: editingCase.media_urls,
        svg_json: '[]',
      };

      // Preservar svg_json original
      const origRes = await fetch(`${apiBase}/api/cms/cases/${editingCase.id}`);
      const origData = await origRes.json();
      if (origData.success) payload.svg_json = origData.case.svg_json;

      const res = await fetch(`${apiBase}/api/cms/cases/${editingCase.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setEditingCase(null);
        fetchCases();
        alert('Edição salva e sincronizada na nuvem!');
      } else {
        alert(typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail));
      }
    } catch (e) {
      alert('Erro ao salvar edição: ' + e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNew = async () => {
    if (!newCaseData.title || !newCaseData.primary_diagnosis || !newCaseImage) {
      alert('Precisa preencher Título, Diagnóstico e selecionar uma Imagem.');
      return;
    }
    setIsSaving(true);
    const apiBase = getApiBase();
    try {
      const fd = new FormData();
      fd.append('file', newCaseImage);
      const upRes = await fetch(`${apiBase}/api/cms/upload`, { method: 'POST', body: fd });
      const upData = await upRes.json();

      if (!upData.success) {
        alert('Erro no upload da imagem na Nuvem.');
        setIsSaving(false);
        return;
      }

      const payload = {
        title: newCaseData.title,
        clinical_history: newCaseData.clinical_history,
        primary_diagnosis: newCaseData.primary_diagnosis,
        patient_demographics: {},
        taxonomies: newCaseData.isMlOnly ? ['ml_only'] : [],
        media_urls: [upData.url],
        svg_json: '[]',
      };
      const caseRes = await fetch(`${apiBase}/api/cms/cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const caseData = await caseRes.json();

      if (caseData.success) {
        setIsCreatingNew(false);
        setNewCaseImage(null);
        setNewCaseData({ title: '', primary_diagnosis: '', clinical_history: '', isMlOnly: false });
        fetchCases();
        alert('Novo caso criado com sucesso na Gen 4!');
      } else {
        alert(caseData.detail || caseData.error);
      }
    } catch (e) {
      alert('Erro na comunicação com a API: ' + e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 animate-in fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Atlas Gen 4.0 Database</h2>
          <p className="text-slate-500 font-medium">Controle Oficial da Tabela de Casos Clínicos</p>
        </div>
        <div className="flex gap-2">
          {cases.length === 0 && (
              <button 
                onClick={handleMigrate}
                disabled={isMigrating}
                className="bg-amber-500 text-white flex items-center gap-2 px-4 py-2 font-bold rounded-lg shadow hover:bg-amber-600 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${isMigrating ? 'animate-spin' : ''}`}/> 
                {isMigrating ? "Migrando Cloundinary..." : "Migrar Legado"}
              </button>
          )}
          <button 
             onClick={() => setIsCreatingNew(true)}
             className="bg-brand-600 text-white flex items-center gap-2 px-4 py-2 font-bold rounded-lg shadow hover:bg-brand-700 transition"
          >
            <Plus className="w-5 h-5"/> Novo Caso V4
          </button>
        </div>
      </div>

      {/* PAINEL DE CONTROLE DE VISUALIZAÇÃO E FILTROS */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 font-medium flex flex-col md:flex-row md:items-center justify-between gap-4">
         {/* TABS TRINARIAS */}
         <div className="flex flex-wrap bg-slate-100 p-1 rounded-lg gap-1">
            <button 
               onClick={() => setActiveTab('public')}
               className={`px-3 py-1.5 rounded-md text-sm font-bold transition flex items-center gap-1.5 ${activeTab === 'public' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
               title="Só Acervo"
            >
               🌟 Acervo
               <span className="bg-teal-100 text-teal-700 text-[10px] px-1.5 py-0.5 rounded-full">
                  {cases.filter(c => !c.taxonomies?.includes('pure_ml') && !c.taxonomies?.includes('quiz_only')).length}
               </span>
            </button>
            <button 
               onClick={() => setActiveTab('quiz')}
               className={`px-3 py-1.5 rounded-md text-sm font-bold transition flex items-center gap-1.5 ${activeTab === 'quiz' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
               title="Só Simulador Quiz"
            >
               ❓ Quiz
               <span className="bg-indigo-400 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {cases.filter(c => c.taxonomies?.includes('quiz_only')).length}
               </span>
            </button>
            <button 
               onClick={() => setActiveTab('ml')}
               className={`px-3 py-1.5 rounded-md text-sm font-bold transition flex items-center gap-1.5 ${activeTab === 'ml' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
               title="Só Treino Sujo Kaggle"
            >
               🤖 Datalake (ML)
               <span className="bg-slate-600 text-slate-200 text-[10px] px-1.5 py-0.5 rounded-full">
                  {cases.filter(c => c.taxonomies?.includes('pure_ml') || c.isMlOnly).length}
               </span>
            </button>
            <button 
               onClick={() => setActiveTab('all')}
               className={`px-3 py-1.5 rounded-md text-sm font-bold transition flex items-center gap-1.5 ${activeTab === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
               🗂️ Todos
            </button>
            <button 
               onClick={() => setActiveTab('audit')}
               className={`px-3 py-1.5 rounded-md text-sm font-bold transition flex items-center gap-1.5 ml-auto border-l border-slate-200 pl-4 ${activeTab === 'audit' ? 'bg-amber-100 text-amber-800 shadow-sm' : 'text-amber-600 hover:bg-amber-50'}`}
            >
               <BarChart className="w-4 h-4" /> Estatísticas MLOps
            </button>
         </div>

         {/* SEARCH BAR */}
         <div className="relative w-full md:w-72">
            <input 
               type="text" 
               placeholder="Buscar classe ou título..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full text-sm border-2 border-slate-200 rounded-lg py-2 pl-3 pr-10 focus:border-brand-500 focus:outline-none bg-slate-50 focus:bg-white"
            />
            {searchQuery && (
               <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                 <X className="w-4 h-4"/>
               </button>
            )}
         </div>
      </div>

      {loading ? (
         <div className="flex justify-center items-center h-40 text-brand-600">
            <Loader2 className="w-8 h-8 animate-spin" />
         </div>
      ) : cases.length === 0 ? (
        <div className="text-center p-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 text-slate-500">
           <ServerCrash className="w-12 h-12 mx-auto mb-3 opacity-20" />
           <p className="font-bold text-lg text-slate-700">Nenhum caso na V4</p>
           <p>Você pode migrar ou importar novos via SVG Studio e conectá-los.</p>
        </div>
      ) : activeTab === 'audit' ? (
        <div className="bg-white rounded-xl shadow border border-slate-200 p-6 animate-in fade-in zoom-in-95" style={{ animationDuration: '0.3s' }}>
           <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><BarChart className="w-6 h-6"/></div>
              <h3 className="text-xl font-bold text-slate-800 border-b-2 border-transparent">Radiografia do Dataset (Auditoria de Viés)</h3>
           </div>
           <p className="text-sm text-slate-500 mb-8 max-w-3xl">Volume bruto de amostras coletadas por patologia. Avalie se as subclasses finas possuem volume suficiente para treinar IAs (Verde), se podem causar Overfitting (Amarelo) ou se devem ser agrupadas silenciosamente via Script do Kaggle (Vermelho).</p>
           
           {(() => {
               const counts: Record<string, number> = {};
               cases.forEach(c => {
                   const diag = (c.primary_diagnosis || "Sem Diagnóstico Definido").toUpperCase().trim();
                   counts[diag] = (counts[diag] || 0) + 1;
               });
               const sorted = Object.entries(counts).sort((a,b) => a[1] - b[1]);

               return (
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                       {sorted.map(([diag, count]) => {
                           const isCritical = count < 10;
                           const isWarning = count >= 10 && count < 30;
                           return (
                               <div key={diag} className={`p-4 rounded-xl border-2 flex items-center justify-between transition-transform hover:-translate-y-1 ${isCritical ? 'bg-rose-50 border-rose-200 shadow-sm' : isWarning ? 'bg-amber-50 border-amber-200 shadow-sm' : 'bg-green-50 border-emerald-200 shadow-sm'}`}>
                                   <div className="py-1">
                                      <h4 className={`font-bold text-sm tracking-tight ${isCritical ? 'text-rose-900' : isWarning ? 'text-amber-900' : 'text-emerald-900'}`}>{diag}</h4>
                                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 mt-1.5 inline-block rounded border ${isCritical ? 'bg-rose-100 text-rose-700 border-rose-300' : isWarning ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-emerald-100 text-emerald-700 border-emerald-300'}`}>
                                         {isCritical ? 'Kaggle Crash (Requer Group Patch)' : isWarning ? 'Risco de Viés' : 'Robusto para ML'}
                                      </span>
                                   </div>
                                   <div className={`text-4xl font-black tabular-nums tracking-tighter ml-2 ${isCritical ? 'text-rose-600/80' : isWarning ? 'text-amber-600/80' : 'text-emerald-500/80'}`}>
                                      {count}
                                   </div>
                               </div>
                           );
                       })}
                   </div>
               )
           })()}
        </div>
      ) : (() => {
        const filteredCases = cases.filter(c => {
           const hasPureMl = c.taxonomies?.includes('pure_ml') || c.isMlOnly;
           const hasQuizOnly = c.taxonomies?.includes('quiz_only');
           
           if (activeTab === 'public' && (hasPureMl || hasQuizOnly)) return false;
           if (activeTab === 'quiz' && !hasQuizOnly) return false;
           if (activeTab === 'ml' && !hasPureMl) return false;
           
           if (searchQuery) {
              const query = searchQuery.toLowerCase();
              const diag = (c.primary_diagnosis || '').toLowerCase();
              const title = (c.title || '').toLowerCase();
              return diag.includes(query) || title.includes(query);
           }
           return true;
        });

        if (filteredCases.length === 0) {
           return (
              <div className="text-center py-12 text-slate-500 border border-slate-200 rounded-xl bg-slate-50">
                 Nenhum caso encontrado para este filtro.
              </div>
           );
        }

        return (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCases.map((c) => (
                 <div key={c.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow transition group relative">
                    {/* Visual Tag para indicar Oculto no modo Todos */}
                    {activeTab === 'all' && (
                        <>
                           {(c.taxonomies?.includes('pure_ml') || c.isMlOnly) && (
                               <div className="absolute top-2 right-2 bg-slate-800 text-white text-[10px] uppercase font-bold px-2 py-1 rounded shadow z-10">
                                  🤖 ML
                               </div>
                           )}
                           {c.taxonomies?.includes('quiz_only') && (
                               <div className="absolute top-2 right-2 bg-indigo-600 text-white text-[10px] uppercase font-bold px-2 py-1 rounded shadow z-10">
                                  ❓ QUIZ
                               </div>
                           )}
                        </>
                    )}
                    <div className="aspect-video bg-slate-900 overflow-hidden relative">
                       {c.media_urls && c.media_urls.length > 0 ? (
                          <img src={c.media_urls[0]} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                       ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-700 text-xs font-bold uppercase">Sem Mídia</div>
                       )}
                </div>
                <div className="p-4">
                   <h3 className="font-bold text-slate-800 mb-1">{c.title || "Caso Sem Título"}</h3>
                   <p className="text-brand-600 text-xs font-bold uppercase mb-3">{c.primary_diagnosis || "S/ Diagnóstico Principal"}</p>
                   
                   <p className="text-xs text-slate-500 line-clamp-2 mb-4">{c.clinical_history || "Sem histórico provido."}</p>
                   
                   <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div className="flex gap-2">
                         <button onClick={() => handleDelete(c.id)} className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded transition"><Trash2 className="w-4 h-4"/></button>
                         <button onClick={() => setEditingCase(c)} className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded transition"><Edit className="w-4 h-4"/></button>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">ID #{c.id}</span>
                   </div>
                </div>
             </div>
          ))}
        </div>
      );
    })()}

    {/* MODAL DE EDIÇÃO */}
      {editingCase && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Edit className="w-5 h-5 text-brand-600"/> Editar Caso V4 #{editingCase.id}</h3>
              <button onClick={() => setEditingCase(null)} className="text-slate-400 hover:bg-slate-200 p-1 rounded-lg transition"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Título do Caso</label>
                <input 
                  type="text" 
                  value={editingCase.title || ''} 
                  onChange={(e) => setEditingCase({...editingCase, title: e.target.value})}
                  className="w-full text-sm font-medium border-2 border-slate-200 rounded-lg p-2.5 focus:border-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Diagnóstico Oficial</label>
                <input 
                  type="text" 
                  value={editingCase.primary_diagnosis || ''} 
                  onChange={(e) => setEditingCase({...editingCase, primary_diagnosis: e.target.value})}
                  className="w-full text-sm font-medium border-2 border-slate-200 rounded-lg p-2.5 focus:border-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Histórico Clínico (Usado no Quiz)</label>
                <textarea 
                  rows={4}
                  value={editingCase.clinical_history || ''} 
                  onChange={(e) => setEditingCase({...editingCase, clinical_history: e.target.value})}
                  className="w-full text-sm font-medium border-2 border-slate-200 rounded-lg p-3 focus:border-brand-500 outline-none resize-none leading-relaxed"
                />
              </div>
              <div className="flex items-center gap-3 bg-brand-50 p-4 rounded-lg border border-brand-100 mt-2">
                <input 
                  type="checkbox" 
                  id="editMlOnly"
                  checked={editingCase.isMlOnly || false}
                  onChange={(e) => setEditingCase({...editingCase, isMlOnly: e.target.checked})}
                  className="w-5 h-5 text-brand-600 rounded focus:ring-brand-500 border-gray-300"
                />
                <label htmlFor="editMlOnly" className="text-sm font-bold text-brand-900 cursor-pointer">
                  Exclusivo para Treinamento de IA (Ocultar da Estante Pública)
                </label>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setEditingCase(null)} className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-200 rounded-lg transition">Cancelar</button>
              <button onClick={handleSaveEdit} disabled={isSaving} className="px-5 py-2 font-bold bg-brand-600 text-white hover:bg-brand-700 rounded-lg shadow transition flex items-center gap-2">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : null} 
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CRIAÇÃO NOVO CASO V4 */}
      {isCreatingNew && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-brand-50">
              <h3 className="font-bold text-lg text-brand-900 flex items-center gap-2"><Plus className="w-5 h-5 text-brand-600"/> Inserção Direta: Novo Caso Gen 4</h3>
              <button onClick={() => { setIsCreatingNew(false); setNewCaseImage(null); }} className="text-slate-400 hover:bg-brand-200 p-1 rounded-lg transition"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Upload da Foto de Base</label>
                <input 
                  type="file" 
                  accept="image/jpeg, image/png, image/webp"
                  onChange={(e) => {
                     if (e.target.files && e.target.files.length > 0) {
                         setNewCaseImage(e.target.files[0]);
                     }
                  }}
                  className="w-full text-sm font-medium border-2 border-dashed border-slate-300 rounded-lg p-4 bg-slate-50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-100 file:text-brand-700 hover:file:bg-brand-200 cursor-pointer"
                />
                {newCaseImage && <p className="text-xs text-brand-600 font-bold mt-2 truncate">Arquivo selecionado: {newCaseImage.name}</p>}
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Título do Caso</label>
                <input 
                  type="text" 
                  placeholder="Ex: Otite Externa (Fase Inicial)..."
                  value={newCaseData.title} 
                  onChange={(e) => setNewCaseData({...newCaseData, title: e.target.value})}
                  className="w-full text-sm font-medium border-2 border-slate-200 rounded-lg p-2.5 focus:border-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Diagnóstico Oficial</label>
                <input 
                  type="text" 
                  placeholder="Ex: Cerume Impactado"
                  value={newCaseData.primary_diagnosis} 
                  onChange={(e) => setNewCaseData({...newCaseData, primary_diagnosis: e.target.value})}
                  className="w-full text-sm font-medium border-2 border-slate-200 rounded-lg p-2.5 focus:border-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Histórico Clínico</label>
                <textarea 
                  rows={3}
                  placeholder="Descreva a queixa do paciente... (Usado no Quiz)"
                  value={newCaseData.clinical_history} 
                  onChange={(e) => setNewCaseData({...newCaseData, clinical_history: e.target.value})}
                  className="w-full text-sm font-medium border-2 border-slate-200 rounded-lg p-3 focus:border-brand-500 outline-none resize-none leading-relaxed"
                />
              </div>
              <div className="flex items-center gap-3 bg-brand-50 p-4 rounded-lg border border-brand-100 mt-2">
                <input 
                  type="checkbox" 
                  id="createMlOnly"
                  checked={newCaseData.isMlOnly}
                  onChange={(e) => setNewCaseData({...newCaseData, isMlOnly: e.target.checked})}
                  className="w-5 h-5 text-brand-600 rounded focus:ring-brand-500 border-gray-300"
                />
                <label htmlFor="createMlOnly" className="text-sm font-bold text-brand-900 cursor-pointer">
                  Exclusivo para Treinamento de IA (Ocultar da Estante Pública)
                </label>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => { setIsCreatingNew(false); setNewCaseImage(null); }} className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-200 rounded-lg transition">Cancelar</button>
              <button 
                 onClick={handleCreateNew} 
                 disabled={isSaving || !newCaseImage || !newCaseData.title || !newCaseData.primary_diagnosis} 
                 className="px-5 py-2 font-bold bg-brand-600 text-white hover:bg-brand-700 rounded-lg shadow transition flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : null} 
                Salvar na Nuvem (V4)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
