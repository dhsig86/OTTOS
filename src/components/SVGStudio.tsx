import React, { useState, useRef, useEffect } from 'react';
import { Cloud, Trash2, Undo2, CheckCircle2, RefreshCw, PenTool, Edit3, X } from 'lucide-react';

interface Point { x: number; y: number }
interface SvgHotspot { id: string; label: string; path: string; color?: string; }

const COLORS = [
  { val: '#10b981', name: 'Neon Green', desc: 'Contraste com Tecido Inflamado' },
  { val: '#06b6d4', name: 'Bright Cyan', desc: 'Destaque de Ossículos' },
  { val: '#8b5cf6', name: 'Electric Violet', desc: 'Destaque de Perfurações' },
  { val: '#eab308', name: 'Lemon Yellow', desc: 'Marcação de Exsudato' },
];

export function SVGStudio() {
  const [activeTab, setActiveTab] = useState<'edit_v4' | 'upload'>('edit_v4');
  
  // V4 Cloud Cases State
  const [cloudItems, setCloudItems] = useState<any[]>([]);
  const [isLoadingManage, setIsLoadingManage] = useState(false);
  const [editingCase, setEditingCase] = useState<any>(null); // Se não for null, abre a Mesa de Edição SVG
  
  // Mesa de Edição SVG State
  const [points, setPoints] = useState<Point[]>([]);
  const [savedPolygons, setSavedPolygons] = useState<SvgHotspot[]>([]);
  const [activeColor, setActiveColor] = useState(COLORS[0].val);
  const [svgViewBox, setSvgViewBox] = useState("0 0 1024 1024");
  const [isSavingCloud, setIsSavingCloud] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  // ---------- FETCH V4 CASES ----------
  const fetchV4Cases = async () => {
      setIsLoadingManage(true);
      try {
         const apiURL = import.meta.env.VITE_AI_API_URL || 'http://127.0.0.1:8000';
         const res = await fetch(`${apiURL.replace(/\/$/, '')}/api/cms/cases`);
         const data = await res.json();
         if(data.success && data.cases) {
             setCloudItems(data.cases);
         }
      } catch(e) {
         console.error(e);
      } finally {
         setIsLoadingManage(false);
      }
  };

  useEffect(() => {
     if (activeTab === 'edit_v4') fetchV4Cases();
  }, [activeTab]);

  // ---------- ABRIR CURADORIA EM CASO ----------
  const openEditor = (item: any) => {
      let parsedSpots: SvgHotspot[] = [];
      try {
          if (Array.isArray(item.svg_json)) parsedSpots = item.svg_json;
          else if (typeof item.svg_json === 'string') parsedSpots = JSON.parse(item.svg_json);
      } catch (e) { parsedSpots = []; }
      
      setSavedPolygons(Array.isArray(parsedSpots) ? parsedSpots : []);
      setPoints([]);
      setEditingCase(item);
  };

  const closeEditor = () => {
      setEditingCase(null);
      setSavedPolygons([]);
      setPoints([]);
      fetchV4Cases(); // Atualiza a galeria
  };

  // ---------- LÓGICA DO SVG SUAVE (Bézier Quadrática) ----------
  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!imageRef.current) return;
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const loc = pt.matrixTransform(ctm.inverse());
    setPoints([...points, { x: Math.round(loc.x), y: Math.round(loc.y) }]);
  };

  // Transforma os cliques com arestas num caminho curvilíneo e orgânico
  const generateSmoothPath = (pts: Point[]) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x},${pts[0].y} m -8,0 a 8,8 0 1,0 16,0 a 8,8 0 1,0 -16,0`;
    
    let path = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
        const p1 = pts[i - 1];
        const p2 = pts[i];
        const xc = (p1.x + p2.x) / 2;
        const yc = (p1.y + p2.y) / 2;
        path += ` Q ${p1.x},${p1.y} ${xc},${yc}`;
    }
    path += ` L ${pts[pts.length - 1].x},${pts[pts.length - 1].y} Z`;
    return path;
  };

  const handleFinishPolygon = () => {
    if (points.length === 0) return;
    const label = prompt("⚕️ Etiqueta de Segmentação (ex: 'Cabo do Martelo', 'Abaulamento Cístico'):") || "Estrutura";
    setSavedPolygons([...savedPolygons, { 
        id: `spot_${Date.now()}`, 
        label, 
        path: generateSmoothPath(points), 
        color: activeColor 
    }]);
    setPoints([]);
  };

  const deleteSavedPolygon = (id: string) => {
    if(!confirm("Remover esta estrutura visual?")) return;
    setSavedPolygons(savedPolygons.filter((s) => s.id !== id));
  };

  // ---------- PATCH NO NEON DB ----------
  const patchToV4Cloud = async () => {
      if (!editingCase) return;
      setIsSavingCloud(true);
      try {
          const payload = { svg_json: JSON.stringify(savedPolygons) };
          const apiURL = import.meta.env.VITE_AI_API_URL || 'http://127.0.0.1:8000';
          const res = await fetch(`${apiURL.replace(/\/$/, '')}/api/cms/cases/${editingCase.id}`, { 
               method: 'PATCH', 
               headers: { 'Content-Type': 'application/json'},
               body: JSON.stringify(payload)
          });
          
          const data = await res.json();
          if (data.success) {
              alert("🚀 Metadados SVG perfeitamente salvos no Acervo NeonDB!");
              closeEditor();
          } else {
              throw new Error("Falha no Endpoint V4");
          }
      } catch (e:any) {
          alert("Ocorreu um erro ao salvar o SVG na nuvem: " + e.message);
      } finally {
          setIsSavingCloud(false);
      }
  };

  return (
    <div className="bg-slate-900 rounded-2xl shadow-2xl overflow-hidden mt-6 animate-in fade-in w-full max-w-7xl mx-auto border border-slate-700">
      
      {/* SE MODO EDITOR ESTIVER FECHADO, MOSTRA HEADER E MENU */}
      {!editingCase && (
        <div className="bg-slate-800 border-b border-slate-700 p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-md z-10 relative">
            <div className="flex items-center gap-4 text-white">
                <div className="bg-slate-700 p-3 rounded-xl border border-slate-600 shadow-inner"><PenTool className="w-6 h-6 text-brand-400" /></div>
                <div>
                <h2 className="text-xl font-black flex items-center gap-2">Mega-Estúdio SVG <span className="bg-brand-500 text-[10px] px-2 py-0.5 rounded-full uppercase">Gen 4.0</span></h2>
                <p className="text-sm text-slate-400 font-medium">Plataforma clínica para desenhar perímetros orgânicos no Acervo V4.</p>
                </div>
            </div>
            <div className="flex gap-2 bg-slate-900 p-1.5 rounded-xl shadow-inner border border-slate-700">
                <button onClick={()=>setActiveTab('edit_v4')} className={`px-4 py-2 font-bold text-sm rounded-lg transition-transform hover:scale-105 ${activeTab === 'edit_v4' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>Visualizar Acervo V4</button>
            </div>
        </div>
      )}

      {/* --- MESA DE EDIÇÃO ATIVA --- */}
      {editingCase && (
          <div className="flex flex-col h-[85vh] bg-slate-950 animate-in slide-in-from-right-8 relative">
              {/* HEADER DO EDITOR */}
              <div className="flex justify-between items-center bg-slate-900 border-b border-slate-800 p-4 shrink-0">
                  <div className="flex items-center gap-3">
                      <button onClick={closeEditor} className="p-2 bg-slate-800 hover:bg-rose-900 hover:text-rose-400 text-slate-400 rounded-lg transition"><X className="w-5 h-5"/></button>
                      <h3 className="text-slate-200 font-bold hidden md:block">Editando: <span className="text-brand-400">{editingCase.primary_diagnosis || editingCase.title}</span></h3>
                  </div>
                  
                  <div className="flex gap-3">
                      <button onClick={() => setPoints(points.slice(0, -1))} disabled={points.length === 0} className="text-slate-400 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 p-2 rounded-lg transition"><Undo2 className="w-5 h-5" /></button>
                      <button onClick={() => setPoints([])} disabled={points.length === 0} className="text-rose-400 bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-30 p-2 rounded-lg transition"><Trash2 className="w-5 h-5" /></button>
                      <button onClick={handleFinishPolygon} disabled={points.length === 0} className="bg-brand-500 hover:bg-brand-400 text-white font-bold px-4 py-2 rounded-lg disabled:opacity-50 transition flex items-center gap-2 shadow-lg"><CheckCircle2 className="w-5 h-5" /> Fechar Polígono</button>
                  </div>
              </div>

              {/* ÁREA DE DESENHO E SIDEBAR */}
              <div className="flex flex-1 overflow-hidden">
                  
                  {/* CANVAS SVG (Centro) */}
                  <div className="flex-1 bg-black relative flex justify-center items-center overflow-hidden group">
                     {editingCase.media_urls && editingCase.media_urls.length > 0 ? (
                         <>
                            <img 
                                ref={imageRef} 
                                src={editingCase.media_urls[0]} 
                                alt="Caso" 
                                onLoad={(e) => setSvgViewBox(`0 0 ${e.currentTarget.naturalWidth} ${e.currentTarget.naturalHeight}`)}
                                className="w-full h-full object-contain pointer-events-none" 
                            />
                            {/* SVG Camada Integrada */}
                            <svg 
                                viewBox={svgViewBox} 
                                preserveAspectRatio="xMidYMid meet"
                                className="absolute inset-0 w-full h-full cursor-crosshair z-10"
                                onClick={handleCanvasClick}
                            >
                                {/* Shapes Salvos */}
                                {savedPolygons.map((sp) => {
                                    const pathColor = sp.color || '#ffffff';
                                    return (
                                        <g key={sp.id} className="pointer-events-auto group/spot">
                                            <path 
                                                d={sp.path} 
                                                fillRule="evenodd"
                                                className="fill-transparent stroke-[3] transition-all hover:stroke-[5] drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]" 
                                                style={{ stroke: pathColor }}
                                            />
                                        </g>
                                    );
                                })}

                                {/* Desenho Ativo (Rascunho) */}
                                {points.length > 0 && (
                                    <path 
                                        d={generateSmoothPath(points)} 
                                        fill="transparent" 
                                        stroke={activeColor} 
                                        strokeWidth="4" 
                                        strokeDasharray="6 6" 
                                        className="drop-shadow-lg"
                                    />
                                )}

                                {/* Nós Ativos */}
                                {points.map((p, idx) => ( 
                                    <circle key={idx} cx={p.x} cy={p.y} r="8" fill={activeColor} stroke="#000" strokeWidth="2" /> 
                                ))}
                            </svg>
                         </>
                     ) : (
                         <div className="text-slate-500">Imagem não carregada.</div>
                     )}
                  </div>

                  {/* SIDEBAR DE EDIÇÃO (Direita) */}
                  <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 overflow-y-auto hidden lg:flex">
                     
                     <div className="p-5 border-b border-slate-800">
                         <p className="text-xs text-slate-400 font-black uppercase tracking-wider mb-4">1. Paleta de Semântica</p>
                         <div className="grid grid-cols-2 gap-3">
                             {COLORS.map((col) => (
                                 <button 
                                     key={col.val}
                                     onClick={()=>setActiveColor(col.val)}
                                     title={col.desc}
                                     className={`p-3 rounded-xl border-2 transition-all flex flex-col gap-1 items-start shadow-inner ${activeColor === col.val ? 'border-white bg-slate-800 scale-105' : 'border-slate-700/50 bg-slate-900 opacity-60 hover:opacity-100 hover:border-slate-500'}`}
                                 >
                                     <div className="w-full h-8 rounded-md shadow-inner" style={{backgroundColor: col.val}}></div>
                                     <span className="text-[10px] text-slate-300 font-bold uppercase truncate w-full pt-1">{col.name}</span>
                                 </button>
                             ))}
                         </div>
                     </div>

                     <div className="p-5 flex-1 flex flex-col">
                         <p className="text-xs text-slate-400 font-black uppercase tracking-wider mb-4">2. Mapas Arquivados ({savedPolygons.length})</p>
                         <div className="space-y-3 mb-6 flex-1">
                            {savedPolygons.length === 0 && <p className="text-slate-600 text-sm italic">Nenhum polígono desenhado.</p>}
                            {savedPolygons.map((sp) => (
                                <div key={sp.id} className="bg-slate-800 border border-slate-700 p-3 rounded-xl flex items-center justify-between group/card shadow-sm hover:border-slate-500 transition">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-4 h-4 rounded-full min-w-[16px] shadow-sm border border-slate-600" style={{backgroundColor: sp.color || '#fff'}}></div>
                                        <span className="text-sm font-semibold text-slate-200 truncate">{sp.label}</span>
                                    </div>
                                    <button onClick={()=>deleteSavedPolygon(sp.id)} className="text-rose-500 bg-slate-900 border border-slate-700 hover:bg-rose-500 hover:text-white p-1.5 rounded-lg transition shadow">
                                        <Trash2 size={14}/>
                                    </button>
                                </div>
                            ))}
                         </div>

                         <div className="pt-4 border-t border-slate-800">
                            <button 
                              onClick={patchToV4Cloud} 
                              disabled={isSavingCloud} 
                              className="w-full bg-blue-600 border border-blue-500 text-white rounded-xl px-4 py-4 shadow-lg shadow-blue-900/50 hover:shadow-blue-900 text-sm font-black hover:bg-blue-500 transition flex items-center justify-center gap-2 uppercase tracking-wide disabled:opacity-50"
                            >
                              {isSavingCloud ? <><RefreshCw className="animate-spin w-5 h-5" /> Aplicando PATCH...</> : <><Cloud className="w-5 h-5" /> Salvar Tudo Acervo V4</>}
                            </button>
                         </div>
                     </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- ABA ACERVO V4 --- */}
      {!editingCase && activeTab === 'edit_v4' && (
         <div className="p-6">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-lg font-bold text-slate-300 flex items-center gap-2"><Edit3 className="w-5 h-5 text-brand-500" /> Selecione o Caso para Pintar</h3>
               <button onClick={fetchV4Cases} className="flex items-center gap-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 text-sm font-semibold py-2 px-4 rounded-lg transition">
                  <RefreshCw size={16} className={isLoadingManage ? "animate-spin" : ""} /> Recarregar Acervo
               </button>
            </div>
            
            {cloudItems.length === 0 && !isLoadingManage && (
                <div className="text-center py-20 bg-slate-800/50 rounded-2xl border border-slate-800 border-dashed">
                    <p className="text-slate-400 font-medium">Não há casos cadastrados no Acervo Cloudinary/Neon.</p>
                </div>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
               {cloudItems.map(item => {
                   let spCount = 0;
                   try {
                     const sp = typeof item.svg_json === 'string' ? JSON.parse(item.svg_json) : item.svg_json;
                     if(Array.isArray(sp)) spCount = sp.length;
                   } catch(e) {}

                   return (
                   <div 
                      key={item.id} 
                      onClick={() => openEditor(item)}
                      className="group cursor-pointer bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-brand-500 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-brand-500/10 relative"
                   >
                       <div className="aspect-square bg-black w-full overflow-hidden relative">
                           {item.media_urls && item.media_urls.length > 0 ? (
                               <img src={item.media_urls[0]} alt={item.primary_diagnosis} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition" />
                           ) : (
                               <div className="w-full h-full flex justify-center items-center bg-slate-900 text-slate-600">Sem Foto</div>
                           )}
                           
                           {spCount > 0 && (
                               <div className="absolute top-2 right-2 bg-brand-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md border border-brand-400">
                                   {spCount} Shape{spCount !== 1 && 's'}
                               </div>
                           )}
                       </div>
                       
                       <div className="p-3">
                           <h4 className="text-slate-200 font-bold text-xs truncate mb-1">{item.primary_diagnosis || item.title || "Sem Classe"}</h4>
                           <p className="text-brand-500 text-[10px] font-black uppercase tracking-wider group-hover:underline">Abrir Mesa de Edição</p>
                       </div>
                   </div>
               )})}
            </div>
         </div>
      )}
    </div>
  );
}
