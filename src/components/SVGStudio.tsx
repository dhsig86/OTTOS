import React, { useState, useRef, useEffect } from 'react';
import { MousePointer2, Cloud, Trash2, Undo2, CheckCircle2, List, RefreshCw } from 'lucide-react';
import { atlasData } from '../data/mockData';

interface Point { x: number; y: number }
interface SavedPolygon { label: string; path: string; }

export function SVGStudio() {
  const [activeTab, setActiveTab] = useState<'upload' | 'manage'>('upload');
  
  // Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [savedPolygons, setSavedPolygons] = useState<SavedPolygon[]>([]);
  const [pathology, setPathology] = useState("");
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  // Manage State
  const [cloudItems, setCloudItems] = useState<any[]>([]);
  const [trashItems, setTrashItems] = useState<any[]>([]);
  const [isLoadingManage, setIsLoadingManage] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setImageSrc(url);
      setPoints([]);
      setSavedPolygons([]);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const scaleX = imageRef.current.naturalWidth / rect.width;
    const scaleY = imageRef.current.naturalHeight / rect.height;

    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);
    
    setPoints([...points, { x, y }]);
  };

  const generateSVGPath = (pts: Point[]) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) {
      const { x, y } = pts[0];
      return `M ${x},${y} m -8,0 a 8,8 0 1,0 16,0 a 8,8 0 1,0 -16,0`;
    }
    const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
    const p0 = pts[0];
    return `${path} L ${p0.x},${p0.y} Z`;
  };

  const handleFinishPolygon = () => {
    if (points.length === 0) return;
    const label = prompt("Qual o nome desta Estrutura mapeada?") || "Estrutura";
    setSavedPolygons([...savedPolygons, { label, path: generateSVGPath(points) }]);
    setPoints([]);
  };

  const deleteSavedPolygon = (index: number) => {
    setSavedPolygons(savedPolygons.filter((_, i) => i !== index));
  };

  const saveToAtlasCloud = async () => {
    if (!selectedFile) return;
    let finalArray = [...savedPolygons];
    if (points.length > 0) {
        finalArray.push({ label: "Estrutura não nomeada", path: generateSVGPath(points) });
        setPoints([]);
    }

    const jsonHotspots = JSON.stringify(finalArray.map((sp, i) => ({
      id: `spot_${Date.now()}_${i}`,
      label: sp.label,
      path: sp.path
    })));

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('pathology', pathology || 'Caso Genérico');
      formData.append('description', description || '');
      formData.append('svg_json', jsonHotspots);

      const apiURL = import.meta.env.VITE_AI_API_URL || 'http://127.0.0.1:8000';
      const endpoint = `${apiURL.replace(/\/$/, '')}/api/admin/atlas`;

      const response = await fetch(endpoint, { method: 'POST', body: formData });
      const data = await response.json();
      
      if (!response.ok || data.error) throw new Error(data.error || "HTTP Erro");

      alert("🚀 Sucesso! Arquivado no Atlas Cloud!");
      setImageSrc(null); setSelectedFile(null); setSavedPolygons([]); setPoints([]); 
      setPathology(""); setDescription("");

    } catch (err: any) {
      alert("❌ Falha no Upload Administrativo:\n" + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // --- GERENCIAMENTO NUVEM ---
  const fetchManageData = async () => {
      setIsLoadingManage(true);
      try {
         const apiURL = import.meta.env.VITE_AI_API_URL || 'http://127.0.0.1:8000';
         const [resAtlas, resTrash] = await Promise.all([
             fetch(`${apiURL.replace(/\/$/, '')}/api/atlas`),
             fetch(`${apiURL.replace(/\/$/, '')}/api/admin/atlas/trash`)
         ]);
         const [dataAtlas, dataTrash] = await Promise.all([resAtlas.json(), resTrash.json()]);
         if(dataAtlas.success) setCloudItems(dataAtlas.items);
         if(dataTrash.success) setTrashItems(dataTrash.items);
      } catch(e) {
         console.error(e);
      } finally {
         setIsLoadingManage(false);
      }
  };

  useEffect(() => {
     if (activeTab === 'manage') fetchManageData();
  }, [activeTab]);

  const handleSoftDelete = async (id: string) => {
      if(!confirm("Mover foto para a lixeira?")) return;
      try {
         const apiURL = import.meta.env.VITE_AI_API_URL || 'http://127.0.0.1:8000';
         const res = await fetch(`${apiURL.replace(/\/$/, '')}/api/admin/atlas/${id}`, { method: 'DELETE' });
         const data = await res.json();
         if(data.success) fetchManageData();
         else alert(data.error);
      } catch(e) { alert(e); }
  };

  const handleRestore = async (id: string) => {
      try {
         const apiURL = import.meta.env.VITE_AI_API_URL || 'http://127.0.0.1:8000';
         const res = await fetch(`${apiURL.replace(/\/$/, '')}/api/admin/atlas/${id}/restore`, { method: 'POST' });
         const data = await res.json();
         if(data.success) fetchManageData();
         else alert(data.error);
      } catch(e) { alert(e); }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden mt-6 border border-brand-100 animate-in fade-in zoom-in w-full max-w-5xl mx-auto">
      {/* HEADER E TABS */}
      <div className="bg-slate-50 border-b border-slate-200 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
            <div className="bg-brand-50 p-2 rounded-lg"><MousePointer2 className="w-6 h-6 text-brand-600" /></div>
            <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">Mega-Estúdio Atlas CMS <Cloud className="w-5 h-5 text-blue-500" /></h2>
            <p className="text-sm text-slate-500">Mapeie patologias ou gerencie o banco Nuvem Oficial.</p>
            </div>
        </div>
        <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
            <button onClick={()=>setActiveTab('upload')} className={`px-4 py-2 font-bold text-sm rounded-lg transition ${activeTab === 'upload' ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>Upload Novo</button>
            <button onClick={()=>setActiveTab('manage')} className={`px-4 py-2 font-bold text-sm rounded-lg transition ${activeTab === 'manage' ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>Gerenciar Nuvem</button>
        </div>
      </div>

      <div className="p-6">
        {/* ABA UPLOAD */}
        {activeTab === 'upload' && (
            <div className="space-y-4">
                <input type="file" accept="image/*" onChange={handleImageUpload} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 transition cursor-pointer" />

                {imageSrc && (
                <div className="flex flex-col xl:flex-row gap-6">
                    <div className="relative border-2 border-dashed border-slate-300 rounded-lg overflow-hidden cursor-crosshair inline-block bg-black shadow-inner">
                    <img ref={imageRef} src={imageSrc} onClick={handleCanvasClick} alt="Mapeamento" className="max-w-[500px] h-auto pointer-events-auto select-none" draggable={false} />
                    <svg className="absolute inset-0 pointer-events-none" viewBox={imageRef.current ? `0 0 ${imageRef.current.naturalWidth} ${imageRef.current.naturalHeight}` : "0 0 100 100"}>
                        {savedPolygons.map((sp, idx) => ( <path key={`saved_${idx}`} d={sp.path} fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" strokeWidth="3" /> ))}
                        {points.length > 0 && ( <path d={generateSVGPath(points)} fill="rgba(8, 145, 178, 0.4)" stroke="#0891b2" strokeWidth="3" strokeDasharray="6,6" /> )}
                        {points.map((p, idx) => ( <circle key={idx} cx={p.x} cy={p.y} r="6" fill="#0284c7" /> ))}
                    </svg>
                    </div>
                    
                    <div className="flex flex-col gap-3 flex-1 min-w-[300px]">
                    <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                        <div className="p-3 border-b border-slate-200 bg-white"><p className="text-xs font-bold text-slate-500 uppercase">Ficha Clínica do Atlas</p></div>
                        <div className="p-4 space-y-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1 block">Classe / Patologia (Selecione ou Digite)</label>
                                <input 
                                    type="text" 
                                    list="pathology-options"
                                    className="w-full rounded-md border-slate-300 text-sm focus:border-brand-500 focus:ring-brand-500 shadow-sm" 
                                    placeholder="Ex: Otite Média Serosa"
                                    value={pathology}
                                    onChange={(e) => setPathology(e.target.value)}
                                />
                                <datalist id="pathology-options">
                                    {atlasData.map(d => <option key={d.id} value={d.pathology} />)}
                                </datalist>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1 block">O que o clínico deve observar?</label>
                                <textarea 
                                    className="w-full rounded-md border-slate-300 text-sm focus:border-brand-500 focus:ring-brand-500 shadow-sm min-h-[80px]" 
                                    placeholder="Descrição completa para legendas do Atlas."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-brand-600 font-bold uppercase">Polígono ({points.length} pts)</p>
                        <div className="flex gap-2">
                            <button onClick={() => setPoints(points.slice(0, -1))} disabled={points.length === 0} className="text-amber-600 hover:text-amber-800 disabled:opacity-30"><Undo2 size={16} /></button>
                            <button onClick={() => setPoints([])} disabled={points.length === 0} className="text-rose-600 hover:text-rose-800 disabled:opacity-30"><Trash2 size={16} /></button>
                        </div>
                        </div>
                        <button onClick={handleFinishPolygon} disabled={points.length === 0} className="w-full bg-slate-800 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-900 flex justify-center gap-2 disabled:opacity-50 mt-2"><CheckCircle2 size={16} /> Finalizar Marcação</button>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex-1 flex flex-col justify-between">
                        <div>
                            <p className="text-xs text-emerald-600 font-bold mb-2 uppercase">Máscaras Salvas ({savedPolygons.length})</p>
                            <div className="space-y-2 mb-4">
                                {savedPolygons.map((sp, idx) => (
                                <div key={idx} className="flex justify-between bg-white border border-slate-200 p-2 rounded text-xs gap-2">
                                    <span className="font-semibold text-slate-700 truncate">{sp.label}</span>
                                    <button onClick={() => deleteSavedPolygon(idx)} className="text-rose-500 hover:bg-rose-50 p-1 rounded"><Trash2 size={14}/></button>
                                </div>
                                ))}
                            </div>
                        </div>
                        <button onClick={saveToAtlasCloud} disabled={isUploading || !selectedFile} className="w-full bg-blue-600 text-white rounded-lg px-4 py-3 shadow-lg text-sm font-bold hover:bg-blue-700 transition flex justify-center gap-2 disabled:opacity-50 mt-4">
                        {isUploading ? <><Cloud className="animate-bounce" /> Enviando...</> : <><Cloud size={18} /> Publicar na Nuvem</>}
                        </button>
                    </div>

                    </div>
                </div>
                )}
            </div>
        )}

        {/* ABA GERENCIAR */}
        {activeTab === 'manage' && (
             <div className="animate-in fade-in slide-in-from-right-4">
                 <div className="flex justify-between mb-4 items-center">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2"><List size={18} /> Fotos Ativas na Nuvem</h3>
                    <button onClick={fetchManageData} className="text-sm bg-slate-100 text-slate-600 px-3 py-1 rounded hover:bg-slate-200 flex gap-2 items-center"><RefreshCw size={14} className={isLoadingManage?"animate-spin":""} /> Atualizar</button>
                 </div>
                 
                 {cloudItems.length === 0 && !isLoadingManage && <p className="text-slate-500 text-sm mb-6">Nenhuma foto adicionada na nuvem.</p>}
                 
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                     {cloudItems.map(item => (
                         <div key={item.id} className="relative bg-slate-100 rounded-lg overflow-hidden border border-slate-200 group">
                             <img src={item.image_url} alt={item.pathology} className="w-full aspect-square object-cover" />
                             <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col justify-center items-center p-2 text-center gap-2">
                                 <span className="text-white font-bold text-xs">{item.pathology}</span>
                                 <button onClick={()=>handleSoftDelete(item.id)} className="bg-rose-600 text-white text-xs px-2 py-1 rounded hover:bg-rose-700 flex items-center gap-1"><Trash2 size={12}/> Excluir</button>
                             </div>
                         </div>
                     ))}
                 </div>

                 {/* LIXEIRA */}
                 <div className="border-t border-rose-100 pt-6">
                    <h3 className="font-bold text-rose-800 flex items-center gap-2 mb-4"><Trash2 size={18}/> Lixeira de Recuperação (Últimas 5)</h3>
                    {trashItems.length === 0 && !isLoadingManage && <p className="text-rose-400 text-sm">A lixeira está vazia.</p>}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {trashItems.map(item => (
                            <div key={item.id} className="relative bg-rose-50 rounded-lg overflow-hidden border border-rose-200 group opacity-75 hover:opacity-100">
                                <img src={item.image_url} className="w-full aspect-square object-cover grayscale" />
                                <div className="absolute inset-0 flex flex-col justify-center items-center p-2 text-center bg-black/40">
                                    <button onClick={()=>handleRestore(item.id)} className="bg-emerald-600 text-white text-[10px] uppercase font-bold px-2 py-1 rounded hover:bg-emerald-700 flex items-center gap-1"><Undo2 size={12}/> Restaurar</button>
                                </div>
                            </div>
                        ))}
                    </div>
                 </div>
             </div>
        )}
      </div>
    </div>
  );
}
