import { useState, useEffect } from 'react';
import { AtlasItem, SvgHotspot } from '../data/mockData';
import { X, Eye, EyeOff, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  item: AtlasItem;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

export function ImageDetailModal({ item, onClose, onNext, onPrev }: Props) {
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [showHotspots, setShowHotspots] = useState(true);
  const [hoveredHotspot, setHoveredHotspot] = useState<SvgHotspot | null>(null);
  const [svgViewBox, setSvgViewBox] = useState("0 0 1024 1024");
  
  // Mapeamento Autorativo permanentemente aberto na V4
  const [isAdminMode] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPathPoints, setCurrentPathPoints] = useState<string[]>([]);
  const [drawnHotspots, setDrawnHotspots] = useState<SvgHotspot[]>([]);

  // Limpa o estado residual ao navegar para o lado
  useEffect(() => {
     setCurrentImageIdx(0);
     setIsDrawing(false);
     setCurrentPathPoints([]);
     setDrawnHotspots([]);
     setHoveredHotspot(null);
  }, [item.id]);

  // Toda vez que muda a foto no carrossel, limpar desenhos temporários da foto antiga
  useEffect(() => {
    setDrawnHotspots([]);
    setIsDrawing(false);
    setCurrentPathPoints([]);
  }, [currentImageIdx]);

  // Tecla Delete / Backspace para apagar polígonos durante o hover
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAdminMode && hoveredHotspot && drawnHotspots.some(d => d.id === hoveredHotspot.id)) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          setDrawnHotspots(prev => prev.filter(s => s.id !== hoveredHotspot.id));
          setHoveredHotspot(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdminMode, hoveredHotspot, drawnHotspots]);

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Botão Nav Prev */}
      {onPrev && (
        <button 
          onClick={(e) => { e.stopPropagation(); onPrev(); }} 
          className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-white/10 hover:bg-white/30 backdrop-blur-md rounded-full text-white z-50 shadow-lg border border-white/20 transition-all hover:scale-110"
        >
          <ChevronLeft className="w-8 h-8 md:w-10 md:h-10" />
        </button>
      )}

      {/* Botão Nav Next */}
      {onNext && (
        <button 
          onClick={(e) => { e.stopPropagation(); onNext(); }} 
          className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-white/10 hover:bg-white/30 backdrop-blur-md rounded-full text-white z-50 shadow-lg border border-white/20 transition-all hover:scale-110"
        >
          <ChevronRight className="w-8 h-8 md:w-10 md:h-10" />
        </button>
      )}

      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden relative animate-in zoom-in-95"
        onClick={e => e.stopPropagation()}
      >
        {/* Menu do Desenho SVG ABERTO DE FATO */}
        <div className="absolute top-4 left-4 z-30 flex gap-2">
          {isAdminMode && (
            <div className="flex bg-slate-900 p-2 rounded-lg gap-2 shadow-lg items-center text-white">
              <span className="text-xs font-bold leading-none pr-2 border-r border-slate-700">Studio SVG</span>
              
              {!isDrawing ? (
                <button 
                  onClick={() => setIsDrawing(true)} 
                  className="px-3 py-1 bg-brand-500 hover:bg-brand-400 text-white rounded text-xs font-bold transition-colors shadow shadow-brand-500/30"
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

              {drawnHotspots.length > 0 && item.id.includes('v4_') && (
                <button 
                  onClick={async () => {
                     try {
                        const dbId = item.id.split('_').pop();
                        
                        const combinedLevel0 = [...loadedHotspots, ...drawnHotspots];
                        const payload = { svg_json: JSON.stringify(combinedLevel0) };
                        
                        const apiURL = import.meta.env.VITE_AI_API_URL || 'http://127.0.0.1:8000';
                        const res = await fetch(`${apiURL.replace(/\/$/, '')}/api/cms/cases/${dbId}/svg`, { 
                           method: 'PATCH', 
                           headers: { 'Content-Type': 'application/json'},
                           body: JSON.stringify(payload)
                        });
                        
                        if ((await res.json()).success) {
                           alert("🚀 Mapas Salvos e Sincronizados com a Nuvem NeonDB!");
                           setDrawnHotspots([]); // reseta porque a próxima vez que carregar, vai puxar da prop
                        } else {
                           alert("Erro de salvamento na Rota V4.");
                        }
                     } catch(e) {
                         alert(e);
                     }
                  }} 
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition-colors shadow shadow-emerald-500/20"
                >
                  Salvar na Nuvem
                </button>
              )}

              {item.id.includes('v4_') && (loadedHotspots.length > 0 || drawnHotspots.length > 0) && (
                <button 
                  onClick={async () => {
                     if (!confirm("Tem certeza que deseja apagar TODOS os marcações anatômicas desta imagem do banco de dados?")) return;
                     try {
                        const dbId = item.id.split('_').pop();
                        const payload = { svg_json: "[]" };
                        
                        const apiURL = import.meta.env.VITE_AI_API_URL || 'http://127.0.0.1:8000';
                        const res = await fetch(`${apiURL.replace(/\/$/, '')}/api/cms/cases/${dbId}/svg`, { 
                           method: 'PATCH', 
                           headers: { 'Content-Type': 'application/json'},
                           body: JSON.stringify(payload)
                        });
                        
                        if ((await res.json()).success) {
                           alert("🗑️ Desenhos apagados da Nuvem!");
                           setDrawnHotspots([]);
                           // To visual reset without reload
                           item.hotspots = []; 
                           onClose(); // easy way out
                        }
                     } catch(e) {
                         alert(e);
                     }
                  }} 
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-bold transition-colors shadow shadow-rose-500/20"
                >
                  Apagar Mapas SVG
                </button>
              )}

              {drawnHotspots.length > 0 && !item.id.includes('v4_') && (
                <button 
                  onClick={() => {
                     const codigo = JSON.stringify(drawnHotspots, null, 2);
                     navigator.clipboard.writeText(codigo);
                     alert("CÓDIGO COPIADO!\n\nComo essa é uma imagem legada, exclua a imagem nativa e faça upload pelo Mega-Estúdio.");
                  }} 
                  className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-bold transition-colors"
                >
                  Exportar Fonte Estática
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

          {item.id.includes('v4_') && (
            <button 
              onClick={async () => {
                 if (!confirm("FOGO NO PARQUINHO! Deseja apagar este Caso Mestre inteiro do BD? Isso irá tira-lo do Atlas e do Quiz imediatamente.")) return;
                 try {
                    const dbId = item.id.split('_').pop();
                    const apiURL = import.meta.env.VITE_AI_API_URL || 'http://127.0.0.1:8000';
                    const res = await fetch(`${apiURL.replace(/\/$/, '')}/api/cms/cases/${dbId}`, { method: 'DELETE' });
                    if ((await res.json()).success) {
                       alert("Arquivo Executado e Apagado do Atlas!");
                       window.location.reload(); // Simple sync trigger since we are outside contexts
                    }
                 } catch(e) { alert(e); }
              }}
              title="Apagar este Caso Clínico da Gen 4"
              className="bg-white hover:bg-rose-50 text-rose-600 p-2 rounded-full shadow-md transition-colors border border-rose-100"
            >
              <Trash2 className="w-5 h-5" />
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
                onLoad={(e) => {
                   const img = e.target as HTMLImageElement;
                   if (img.naturalWidth && img.naturalHeight) {
                      setSvgViewBox(`0 0 ${img.naturalWidth} ${img.naturalHeight}`);
                   }
                }}
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
                viewBox={svgViewBox} 
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
              <div className="absolute bottom-4 left-4 z-30 bg-slate-900/90 text-white px-3 py-1.5 rounded-lg text-sm font-medium backdrop-blur shadow-lg animate-in fade-in zoom-in duration-200 border border-brand-500/50 flex items-center gap-3 pointer-events-auto">
                <span>{hoveredHotspot.label}</span>
                {isAdminMode && drawnHotspots.some(d => d.id === hoveredHotspot.id) && (
                   <button 
                     onClick={(e) => {
                        e.stopPropagation();
                        setDrawnHotspots(prev => prev.filter(s => s.id !== hoveredHotspot.id));
                     }}
                     className="bg-rose-600 hover:bg-rose-500 rounded p-1 text-white shadow"
                     title="Excluir Polígono Desenhado na Sessão"
                   ><Trash2 size={14} /></button>
                )}
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
