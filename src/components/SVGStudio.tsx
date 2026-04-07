import React, { useState, useRef } from 'react';
import { MousePointer2, Cloud, Trash2, Undo2, CheckCircle2 } from 'lucide-react';

interface Point { x: number; y: number }
interface SavedPolygon { label: string; path: string; }

export function SVGStudio() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [savedPolygons, setSavedPolygons] = useState<SavedPolygon[]>([]);
  
  // Cloudinary + Neon Form Data
  const [pathology, setPathology] = useState("");
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const imageRef = useRef<HTMLImageElement>(null);

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
      // Círculo matemático dinâmico para 1 clique
      const { x, y } = pts[0];
      return `M ${x},${y} m -8,0 a 8,8 0 1,0 16,0 a 8,8 0 1,0 -16,0`;
    }
    const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
    const p0 = pts[0];
    return `${path} L ${p0.x},${p0.y} Z`;
  };

  const handleFinishPolygon = () => {
    if (points.length === 0) return;
    const label = prompt("Qual o nome desta Estrutura/Patologia mapeada?") || "Estrutura";
    setSavedPolygons([...savedPolygons, { label, path: generateSVGPath(points) }]);
    setPoints([]);
  };

  const deleteSavedPolygon = (index: number) => {
    setSavedPolygons(savedPolygons.filter((_, i) => i !== index));
  };

  const saveToAtlasCloud = async () => {
    if (!selectedFile) {
        alert("Ops, não encontramos o arquivo nativo. Verifique o upload.");
        return;
    }
    
    // Força feitura do ultimo poligono se ficou esquecido
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

      // Usando localhost primariamente, e fallback pra cloud se buildado.
      const apiURL = import.meta.env.VITE_AI_API_URL || 'http://127.0.0.1:8000';
      const endpoint = `${apiURL.replace(/\/$/, '')}/api/admin/atlas`;

      console.log("✈️ POST Atlas Admin Endpoint:", endpoint);
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });
      
      const textRaw = await response.text();
      let data;
      try { data = JSON.parse(textRaw); } catch(e) { throw new Error("Erro Crítico de Rota (CORS ou Rota Ausente): "+textRaw.substring(0,50)); }
      
      if (!response.ok || data.error) throw new Error(data.error || "HTTP Erro");

      alert("🚀 SUCESSO ABSOLUTO!\nA Imagem oficial, o Histórico Clínico e os Mapas (SVGs) foram injetados no Cofre NeonDB da Nuvem!");
      
      // Limpar estúdio
      setImageSrc(null);
      setSelectedFile(null);
      setSavedPolygons([]);
      setPoints([]);
      setPathology("");
      setDescription("");

    } catch (err: any) {
      alert("❌ Falha no Upload Administrativo:\n" + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden mt-6 p-6 border border-brand-100 animate-in fade-in zoom-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-brand-50 p-2 rounded-lg"><MousePointer2 className="w-6 h-6 text-brand-600" /></div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">Mega-Estúdio Atlas CMS <Cloud className="w-5 h-5 text-blue-500" /></h2>
          <p className="text-sm text-slate-500">Ferramenta Global 3.0: Mapeie estruturas, cadastre sintomas e injete casos raros diretamente no banco de imagens oficial na nuvem.</p>
        </div>
      </div>

      <div className="space-y-4">
        <input type="file" accept="image/*" onChange={handleImageUpload} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 transition cursor-pointer" />

        {imageSrc && (
          <div className="flex flex-col xl:flex-row gap-6">
            
            {/* Lado Esquerdo - Mapa Visual */}
            <div className="relative border-2 border-dashed border-slate-300 rounded-lg overflow-hidden cursor-crosshair inline-block bg-black shadow-inner">
              <img ref={imageRef} src={imageSrc} onClick={handleCanvasClick} alt="Mapeamento" className="max-w-[500px] h-auto pointer-events-auto select-none" draggable={false} />
              <svg className="absolute inset-0 pointer-events-none" viewBox={imageRef.current ? `0 0 ${imageRef.current.naturalWidth} ${imageRef.current.naturalHeight}` : "0 0 100 100"}>
                {savedPolygons.map((sp, idx) => (
                   <path key={`saved_${idx}`} d={sp.path} fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" strokeWidth="3" />
                ))}
                {points.length > 0 && (
                  <path d={generateSVGPath(points)} fill="rgba(8, 145, 178, 0.4)" stroke="#0891b2" strokeWidth="3" strokeDasharray="6,6" />
                )}
                {points.map((p, idx) => (
                  <circle key={idx} cx={p.x} cy={p.y} r="6" fill="#0284c7" />
                ))}
              </svg>
            </div>
            
            {/* Lado Direito - Controles e Textos */}
            <div className="flex flex-col gap-3 flex-1 min-w-[300px]">
              
              <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-3 border-b border-slate-200 bg-white">
                  <p className="text-xs font-bold text-slate-500 uppercase">Ficha Clínica do Atlas</p>
                </div>
                <div className="p-4 space-y-3">
                    <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block">Classe / Patologia</label>
                        <input 
                            type="text" 
                            className="w-full rounded-md border-slate-300 text-sm focus:border-brand-500 focus:ring-brand-500 shadow-sm" 
                            placeholder="Ex: Otite Média Serosa"
                            value={pathology}
                            onChange={(e) => setPathology(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block">O que o clínico deve observar?</label>
                        <textarea 
                            className="w-full rounded-md border-slate-300 text-sm focus:border-brand-500 focus:ring-brand-500 shadow-sm min-h-[80px]" 
                            placeholder="Descrição completa do que está acontecendo na foto (usada nas legendas do Atlas)."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                </div>
              </div>


              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-brand-600 font-bold uppercase">Polígono Ativo ({points.length} pts)</p>
                  <div className="flex gap-2">
                    <button onClick={() => setPoints(points.slice(0, -1))} disabled={points.length === 0} className="text-amber-600 hover:text-amber-800 disabled:opacity-30" title="Desfazer Último Ponto"><Undo2 size={16} /></button>
                    <button onClick={() => setPoints([])} disabled={points.length === 0} className="text-rose-600 hover:text-rose-800 disabled:opacity-30" title="Apagar Polígono"><Trash2 size={16} /></button>
                  </div>
                </div>
                <button 
                  onClick={handleFinishPolygon} 
                  disabled={points.length === 0} 
                  className="w-full bg-slate-800 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-900 flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                >
                  <CheckCircle2 size={16} /> Finalizar Marcação
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex-1 flex flex-col justify-between">
                 <div>
                    <p className="text-xs text-emerald-600 font-bold mb-2 uppercase">Máscaras Salvas ({savedPolygons.length})</p>
                    <div className="space-y-2 mb-4">
                        {savedPolygons.length === 0 && <p className="text-xs text-slate-400">Nenhuma máscara concluída.</p>}
                        {savedPolygons.map((sp, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white border border-slate-200 p-2 rounded text-xs gap-2">
                            <span className="font-semibold text-slate-700 truncate">{sp.label}</span>
                            <button onClick={() => deleteSavedPolygon(idx)} className="text-rose-500 hover:bg-rose-50 p-1 rounded"><Trash2 size={14}/></button>
                        </div>
                        ))}
                    </div>
                 </div>

                 <button 
                   onClick={saveToAtlasCloud} 
                   disabled={isUploading || (!selectedFile)} 
                   className="w-full bg-blue-600 text-white rounded-lg px-4 py-3 shadow-lg text-sm font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                 >
                   {isUploading ? (
                     <span className="animate-pulse flex items-center gap-2"><Cloud className="animate-bounce" /> Sincronizando com Banco...</span>
                   ) : (
                     <><Cloud size={18} /> Salvar no Atlas Cloud Definivo</>
                   )}
                 </button>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
