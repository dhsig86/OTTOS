import React, { useState, useRef } from 'react';
import { MousePointer2, Copy, Trash2, Undo2 } from 'lucide-react';

interface Point { x: number; y: number }

export function SVGStudio() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setImageSrc(url);
      setPoints([]);
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

  const generateSVGPath = () => {
    if (points.length === 0) return '';
    const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
    return `${path} Z`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateSVGPath());
    alert('Código SVG Vector copiado para a área de transferência!');
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden mt-6 p-6 border border-brand-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-brand-50 p-2 rounded-lg"><MousePointer2 className="w-6 h-6 text-brand-600" /></div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Estúdio Vetorial (SVG Mapper)</h2>
          <p className="text-sm text-slate-500">Desenhe os polígonos clicando na imagem para mapear o Atlas automaticamente.</p>
        </div>
      </div>

      <div className="space-y-4">
        <input type="file" accept="image/*" onChange={handleImageUpload} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100" />

        {imageSrc && (
          <div className="flex flex-col md:flex-row gap-6">
            <div className="relative inline-block border-2 border-dashed border-slate-300 rounded-lg overflow-hidden cursor-crosshair">
              <img ref={imageRef} src={imageSrc} onClick={handleCanvasClick} alt="Mapeamento" className="max-w-[500px] h-auto pointer-events-auto select-none" draggable={false} />
              <svg className="absolute inset-0 pointer-events-none" viewBox={imageRef.current ? `0 0 ${imageRef.current.naturalWidth} ${imageRef.current.naturalHeight}` : "0 0 100 100"}>
                {points.length > 0 && (
                  <path d={generateSVGPath()} fill="rgba(8, 145, 178, 0.4)" stroke="#0891b2" strokeWidth="3" />
                )}
                {points.map((p, idx) => (
                  <circle key={idx} cx={p.x} cy={p.y} r="6" fill="#0284c7" />
                ))}
              </svg>
            </div>
            
            <div className="flex flex-col gap-3 min-w-[300px]">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="text-xs text-brand-600 font-bold mb-2 uppercase">Coordenadas Vivas</p>
                <code className="text-xs text-slate-700 break-all bg-white p-2 block border border-slate-100 rounded">
                  {generateSVGPath() || "Nenhum clique registrado."}
                </code>
              </div>
              <div className="flex gap-2">
                <button onClick={copyToClipboard} disabled={points.length === 0} className="flex-1 bg-brand-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-brand-700 flex items-center justify-center gap-2 disabled:opacity-50">
                  <Copy size={16} /> Copiar Path
                </button>
                <button onClick={() => setPoints(points.slice(0, -1))} disabled={points.length === 0} className="bg-amber-100 text-amber-700 rounded-lg px-3 py-2 text-sm font-medium hover:bg-amber-200 disabled:opacity-50">
                  <Undo2 size={16} />
                </button>
                <button onClick={() => setPoints([])} disabled={points.length === 0} className="bg-rose-100 text-rose-700 rounded-lg px-3 py-2 text-sm font-medium hover:bg-rose-200 disabled:opacity-50">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
