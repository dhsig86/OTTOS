import { useState, useEffect } from 'react';
import { AtlasItem, SvgHotspot } from '../data/mockData';
import { X, Eye, EyeOff, Lock } from 'lucide-react';

interface Props {
  item: AtlasItem;
  onClose: () => void;
}

export function ImageDetailModal({ item, onClose }: Props) {
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [showHotspots, setShowHotspots] = useState(true);
  const [hoveredHotspot, setHoveredHotspot] = useState<SvgHotspot | null>(null);

  // Mapeamento Autorativo Controlado
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPathPoints, setCurrentPathPoints] = useState<string[]>([]);
  const [drawnHotspots, setDrawnHotspots] = useState<SvgHotspot[]>([]);

  // Toda vez que muda a foto no carrossel, limpar desenhos temporários da foto antiga
  useEffect(() => {
    setDrawnHotspots([]);
    setIsDrawing(false);
    setCurrentPathPoints([]);
  }, [currentImageIdx]);

  // Restringe a visualização do Mapeamento Anatômico ao Índice da Foto atual para permitir edição flexível.
  const loadedHotspots = (item.hotspots && item.hotspots[currentImageIdx]) ? item.hotspots[currentImageIdx] : [];
  const allHotspots = [...loadedHotspots, ...drawnHotspots];
  const hasHotspots = allHotspots.length > 0;

  const currentPathStr = currentPathPoints.length > 0  
    ? `M ${currentPathPoints[0]} ` + currentPathPoints.slice(1).map(p => `L ${p}`).join(' ') 
    : '';

  const getMouseCoords = (evt: React.MouseEvent<SVGSVGElement>) => {
    const svg = evt.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const loc = pt.matrixTransform(ctm.inverse());
    return { x: Math.round(loc.x), y: Math.round(loc.y) };
  };

  const handleSvgClick = (evt: React.MouseEvent<SVGSVGElement>) => {
    if (!isAdminMode || !isDrawing) return;
    const { x, y } = getMouseCoords(evt);
    setCurrentPathPoints(prev => [...prev, `${x},${y}`]);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Admin Secret Lock Button */}
        <div className="absolute top-4 left-4 z-30 flex gap-2">
          {!isAdminMode ? (
            <button 
              onClick={() => {
                const pass = prompt("Código MLOps de Autoria:");
                if (pass === "020786da") setIsAdminMode(true);
              }}
              className="bg-slate-900/50 hover:bg-slate-900 text-white/50 hover:text-white p-2 rounded-full transition-all border outline-none"
              title="Desbloquear Edição Gráfica"
            >
              <Lock className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex bg-slate-900 p-2 rounded-lg gap-2 shadow-lg items-center text-white">
              <span className="text-xs font-bold leading-none pr-2 border-r border-slate-700">Studio SVG</span>
              
              {!isDrawing ? (
                <button 
                  onClick={() => setIsDrawing(true)} 
                  className="px-3 py-1 bg-brand-500 hover:bg-brand-400 text-white rounded text-xs font-bold transition-colors"
                >
                  Novo Polígono
                </button>
              ) : (
                <button 
                  onClick={() => {
                    const finalPath = currentPathStr + " Z";
                    const label = prompt("Pato-Anatomia Focada (ex: Cone de Luz):");
                    if (label) {
                       const newS = { id: `spot_${Date.now()}`, label, path: finalPath };
                       setDrawnHotspots(prev => [...prev, newS]);
                    }
                    setIsDrawing(false);
                    setCurrentPathPoints([]);
                  }} 
                  className="px-3 py-1 bg-green-500 hover:bg-green-400 text-white rounded text-xs font-bold transition-colors"
                >
                  Fechar Desenho
                </button>
              )}

              {drawnHotspots.length > 0 && (
                <button 
                  onClick={() => {
                     const codigo = JSON.stringify(drawnHotspots, null, 2);
                     navigator.clipboard.writeText(codigo);
                     alert("Código SVG Vetorial Copiado! Cole no chat do Assistente AI.");
                  }} 
                  className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-bold transition-colors"
                >
                  Copiar Código Export
                </button>
              )}
            </div>
          )}
        </div>

        <div className="absolute top-4 right-4 flex items-center gap-2 z-30">
          {(hasHotspots || drawnHotspots.length > 0) && (
            <button 
              onClick={() => setShowHotspots(!showHotspots)}
              title={showHotspots ? "Ocultar Estruturas" : "Mostrar Estruturas"}
              className="bg-white hover:bg-slate-100 text-brand-600 p-2 rounded-full shadow-md transition-colors border"
            >
              {showHotspots ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          )}
          <button 
            onClick={onClose}
            className="bg-white hover:bg-slate-100 text-slate-800 p-2 rounded-full shadow-md transition-colors border"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Contêiner Quadrado para amarrar estruturalmente o SVG à Foto e evitar distorções no zoom */}
        <div className={`w-full aspect-square max-h-[70vh] bg-black relative flex items-center justify-center overflow-hidden rounded-t-2xl ${isDrawing ? 'ring-4 ring-inset ring-brand-500' : ''}`}>
            {/* Lente Circular Nativa do Otoscópio Expandida (Menos Zoom Artificial) */}
            <div className="absolute inset-0 z-10 w-full h-full flex items-center justify-center p-1 md:p-2">
              <img 
                src={item.images[currentImageIdx]} 
                alt={`${item.pathology} - Image ${currentImageIdx + 1}`} 
                className="w-full h-full object-contain" 
                style={{
                  maskImage: "radial-gradient(circle at center, black 80%, transparent 95%)",
                  WebkitMaskImage: "radial-gradient(circle at center, black 80%, transparent 95%)"
                }}
                onError={(e) => {
                   const img = e.target as HTMLImageElement;
                   if (img.src.includes('.jpg')) {
                      img.src = img.src.replace('.jpg', '.png');
                   } else if (img.src.includes('.png')) {
                      img.src = img.src.replace('.png', '.jpeg');
                   } else {
                      img.style.opacity = '0';
                   }
                }} 
              />
            </div>

            <span className="text-slate-400 font-medium absolute z-0 pointer-events-none flex flex-col items-center">
               <span className="loader mb-2">Processando Fotografia...</span>
            </span>

            {/* O SVG Overlay fica perfeitamente colado na imagem via aspect-square bind */}
           {(hasHotspots || isDrawing) && showHotspots && (
              <svg 
                viewBox="0 0 1024 1024" 
                preserveAspectRatio="xMidYMid meet"
                className={`absolute inset-0 w-full h-full z-20 ${isDrawing ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'}`}
                onClick={handleSvgClick}
              >
                {/* Geometrias Existentes ou Recém-criadas na Sessão */}
                {allHotspots.map((spot) => (
                  <g key={spot.id} className={!isDrawing ? "pointer-events-auto" : "pointer-events-none"}>
                    <path
                      d={spot.path}
                      strokeLinecap="round" strokeLinejoin="round"
                      className="fill-transparent stroke-white/80 stroke-[2] cursor-pointer transition-all hover:fill-white/10 hover:stroke-white drop-shadow-sm blur-[0.3px] hover:blur-none"
                      onMouseEnter={() => setHoveredHotspot(spot)}
                      onMouseLeave={() => setHoveredHotspot(null)}
                    />
                  </g>
                ))}

                {/* Traço Sendo Criado */}
                {isDrawing && currentPathPoints.length > 0 && (
                  <path 
                    d={currentPathStr} 
                    className="fill-transparent stroke-yellow-400 stroke-[4] stroke-dasharray-[8,8]" 
                  />
                )}
                
                {/* Nós (Vertices) do Rascunho */}
                {isDrawing && currentPathPoints.map((pt, i) => {
                  const [x, y] = pt.split(',');
                  return <circle key={i} cx={x} cy={y} r="8" className="fill-yellow-400" />
                })}
              </svg>
            )}

            {hoveredHotspot && !isDrawing && (
              <div className="absolute bottom-4 left-4 z-30 bg-slate-900/90 text-white px-3 py-1.5 rounded-lg text-sm font-medium backdrop-blur shadow-lg animate-in fade-in zoom-in duration-200 border border-brand-500/50">
                {hoveredHotspot.label}
              </div>
            )}
        </div>

        {/* Thumbnails if multiple images exist */}
        {item.images.length > 1 && (
          <div className="flex justify-center gap-2 mt-4 px-6 bg-white shrink-0 pb-2 z-30 relative top-[-10px]">
            {item.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImageIdx(idx)}
                className={`w-14 h-14 rounded-md overflow-hidden border-2 transition-all ${
                  idx === currentImageIdx ? 'border-brand-500 scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img 
                  src={img} 
                  alt={`Exemplo ${idx + 1}`} 
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                     const el = e.target as HTMLImageElement;
                     if (el.src.includes('.jpg')) {
                        el.src = el.src.replace('.jpg', '.png');
                     } else if (el.src.includes('.png')) {
                        el.src = el.src.replace('.png', '.jpeg');
                     }
                  }}
                />
              </button>
            ))}
          </div>
        )}

        <div className="p-6 bg-white pt-2">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-slate-800">{item.pathology}</h2>
            {allHotspots.length > 0 && (
              <span className="text-xs font-semibold bg-brand-100 text-brand-600 px-2 flex items-center py-1 rounded-md">
                Mapa Anatômico Disponível (Exemplo {currentImageIdx + 1})
              </span>
            )}
          </div>
          <p className="text-slate-600 leading-relaxed">
            {item.description}
          </p>
        </div>
      </div>
    </div>
  );
}
