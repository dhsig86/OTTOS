import { useState, useEffect } from 'react';
import { AtlasItem, SvgHotspot } from '../data/mockData';
import { X, Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';

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
  
  // Limpa o estado residual ao navegar para o lado
  useEffect(() => {
     setCurrentImageIdx(0);
     setHoveredHotspot(null);
  }, [item.id]);

  useEffect(() => {
    setHoveredHotspot(null);
  }, [currentImageIdx]);

  const loadedHotspots = (item.hotspots && item.hotspots[currentImageIdx]) ? item.hotspots[currentImageIdx] : [];
  const hasHotspots = loadedHotspots.length > 0;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Botões Navegação */}
      {onPrev && (
        <button 
          onClick={(e) => { e.stopPropagation(); onPrev(); }} 
          className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-white/10 hover:bg-white/30 backdrop-blur-md rounded-full text-white z-50 shadow-lg border border-white/20 transition-all hover:scale-110"
        >
          <ChevronLeft className="w-8 h-8 md:w-10 md:h-10" />
        </button>
      )}

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
        <div className="absolute top-4 right-4 flex items-center gap-2 z-30">
          {hasHotspots && (
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
        
        {/* Contêiner Quadrado Fotografia */}
        <div className="w-full aspect-square max-h-[70vh] bg-black relative flex items-center justify-center overflow-hidden rounded-t-2xl">
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

            {hasHotspots && showHotspots && (
              <svg 
                viewBox={svgViewBox} 
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full z-20 pointer-events-none"
              >
                {/* Geometrias Existentes (Com suporte nativo às cores do Studio V4) */}
                {loadedHotspots.map((spot: any) => {
                  const strokeColor = spot.color || "#ffffff";
                  return (
                  <g key={spot.id} className="pointer-events-auto">
                    <path
                      d={spot.path}
                      strokeLinecap="round" strokeLinejoin="round" fillRule="evenodd"
                      className="fill-transparent stroke-[2.5] cursor-pointer transition-all drop-shadow-md pb-hover"
                      style={{ stroke: strokeColor }}
                      onMouseEnter={(e) => {
                          setHoveredHotspot(spot);
                          e.currentTarget.style.fill = strokeColor + '40'; // opacity 40
                          e.currentTarget.style.strokeWidth = "4";
                      }}
                      onMouseLeave={(e) => {
                          setHoveredHotspot(null);
                          e.currentTarget.style.fill = 'transparent';
                          e.currentTarget.style.strokeWidth = "2.5";
                      }}
                    />
                  </g>
                )})}
              </svg>
            )}

            {hoveredHotspot && (
              <div className="absolute bottom-4 left-4 z-30 bg-slate-900/90 text-white px-4 py-2 rounded-lg text-sm font-bold backdrop-blur shadow-xl animate-in fade-in zoom-in duration-200 border flex items-center gap-3 pointer-events-auto" style={{borderColor: hoveredHotspot.color || '#3b82f6'}}>
                <div className="w-3 h-3 rounded-full shadow-inner" style={{backgroundColor: hoveredHotspot.color || '#3b82f6'}}></div>
                <span>{hoveredHotspot.label}</span>
              </div>
            )}
        </div>

        {/* Thumbnails se houverem várias */}
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
            {hasHotspots && (
              <span className="text-xs font-semibold bg-brand-100 text-brand-600 px-2 flex items-center py-1 rounded-md">
                Geometria Diagnóstica Detectada
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
