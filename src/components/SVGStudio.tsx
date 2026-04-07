import React, { useState, useRef } from 'react';
import { MousePointer2, Copy, Trash2, Undo2, CheckCircle2 } from 'lucide-react';

interface Point { x: number; y: number }
interface SavedPolygon { label: string; path: string; }

export function SVGStudio() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [savedPolygons, setSavedPolygons] = useState<SavedPolygon[]>([]);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
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
      // Transformar um único ponto em um círculo visível de 8px de raio puro em SVG!
      const { x, y } = pts[0];
      return `M ${x},${y} m -8,0 a 8,8 0 1,0 16,0 a 8,8 0 1,0 -16,0`;
    }
    const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
    const p0 = pts[0];
    return `${path} L ${p0.x},${p0.y} Z`;
  };

  const handleFinishPolygon = () => {
    if (points.length === 0) return;
    const label = prompt("Qual o nome desta Estrutura/Patologia mapeada?") || "Nova Estrutura";
    setSavedPolygons([...savedPolygons, { label, path: generateSVGPath(points) }]);
    setPoints([]);
  };

  const deleteSavedPolygon = (index: number) => {
    setSavedPolygons(savedPolygons.filter((_, i) => i !== index));
  };

  const generateFinalJSON = () => {
    return JSON.stringify(savedPolygons.map((sp, i) => ({
      id: `spot_${Date.now()}_${i}`,
      label: sp.label,
      path: sp.path
    })), null, 2);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateFinalJSON());
    alert('Array Final (com todos os polígonos) copiado com sucesso! Pode colar no seu mockData.ts');
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden mt-6 p-6 border border-brand-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-brand-50 p-2 rounded-lg"><MousePointer2 className="w-6 h-6 text-brand-600" /></div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Estúdio Vetorial (SVG Mapper Gen 2.0)</h2>
          <p className="text-sm text-slate-500">Ferramenta Offline: Mapeie múltiplas estruturas, corrija erros e gere polígonos complexos ou marcações de um único clique (pontilhados).</p>
        </div>
      </div>

      <div className="space-y-4">
        <input type="file" accept="image/*" onChange={handleImageUpload} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100" />

        {imageSrc && (
          <div className="flex flex-col md:flex-row gap-6">
            <div className="relative border-2 border-dashed border-slate-300 rounded-lg overflow-hidden cursor-crosshair inline-block bg-black">
              <img ref={imageRef} src={imageSrc} onClick={handleCanvasClick} alt="Mapeamento" className="max-w-[500px] h-auto pointer-events-auto select-none" draggable={false} />
              <svg className="absolute inset-0 pointer-events-none" viewBox={imageRef.current ? `0 0 ${imageRef.current.naturalWidth} ${imageRef.current.naturalHeight}` : "0 0 100 100"}>
                
                {/* Polígonos Salvos na memória */}
                {savedPolygons.map((sp, idx) => (
                   <path key={`saved_${idx}`} d={sp.path} fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" strokeWidth="3" />
                ))}

                {/* Polígono Atual Sendo Desenhado */}
                {points.length > 0 && (
                  <path d={generateSVGPath(points)} fill="rgba(8, 145, 178, 0.4)" stroke="#0891b2" strokeWidth="3" strokeDasharray="6,6" />
                )}
                {points.map((p, idx) => (
                  <circle key={idx} cx={p.x} cy={p.y} r="6" fill="#0284c7" />
                ))}
              </svg>
            </div>
            
            <div className="flex flex-col gap-3 flex-1 min-w-[300px]">
              
              {/* Controles de Desenho Vivo */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-brand-600 font-bold uppercase">Traço Atual ({points.length} pontos)</p>
                  <div className="flex gap-2">
                    <button onClick={() => setPoints(points.slice(0, -1))} disabled={points.length === 0} className="text-amber-600 hover:text-amber-800 disabled:opacity-30" title="Desfazer Último Ponto"><Undo2 size={16} /></button>
                    <button onClick={() => setPoints([])} disabled={points.length === 0} className="text-rose-600 hover:text-rose-800 disabled:opacity-30" title="Descartar Traço"><Trash2 size={16} /></button>
                  </div>
                </div>
                
                <button 
                  onClick={handleFinishPolygon} 
                  disabled={points.length === 0} 
                  className="w-full bg-brand-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-brand-700 flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                >
                  <CheckCircle2 size={16} /> Salvar Estrutura Atual
                </button>
              </div>

              {/* Lista Múltipla */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex-1 flex flex-col">
                 <p className="text-xs text-emerald-600 font-bold mb-2 uppercase">Estruturas Salvas ({savedPolygons.length})</p>
                 <div className="space-y-2 mb-4 flex-1">
                    {savedPolygons.length === 0 && <p className="text-xs text-slate-400">Nenhum polígono concluído ainda.</p>}
                    {savedPolygons.map((sp, idx) => (
                       <div key={idx} className="flex items-center justify-between bg-white border border-slate-200 p-2 rounded text-xs gap-2">
                         <span className="font-semibold text-slate-700 truncate">{sp.label}</span>
                         <button onClick={() => deleteSavedPolygon(idx)} className="text-rose-500 hover:bg-rose-50 p-1 rounded"><Trash2 size={14}/></button>
                       </div>
                    ))}
                 </div>

                 <button 
                   onClick={copyToClipboard} 
                   disabled={savedPolygons.length === 0} 
                   className="w-full bg-emerald-600 text-white rounded-lg px-4 py-3 text-sm font-bold hover:bg-emerald-700 flex items-center justify-center gap-2 disabled:opacity-50"
                 >
                   <Copy size={18} /> Copiar Array Final JS (Hotspots)
                 </button>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
