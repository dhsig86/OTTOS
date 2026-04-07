import { useState, useEffect } from 'react';
import { atlasData, AtlasItem } from '../data/mockData';

interface Props {
  onSelectItem: (item: AtlasItem) => void;
}

export function AtlasGrid({ onSelectItem }: Props) {
  const [items, setItems] = useState<AtlasItem[]>(atlasData);
  const [isLoadingCloud, setIsLoadingCloud] = useState(true);

  useEffect(() => {
    const fetchCloudAtlas = async () => {
      try {
        const apiURL = import.meta.env.VITE_AI_API_URL || 'http://127.0.0.1:8000';
        const res = await fetch(`${apiURL.replace(/\/$/, '')}/api/atlas`);
        const data = await res.json();
        
        if (data.success && data.items) {
          const map = new Map<string, AtlasItem>();
          
          // 1. Injeta a base nativa no Dicionário
          atlasData.forEach(item => {
             map.set(item.pathology, { ...item, images: [...item.images], hotspots: item.hotspots ? [...item.hotspots] : [] });
          });
          
          // 2. Funde a Nuvem dinamicamente
          data.items.forEach((cloudItem: any) => {
             let parsedHotspots = [];
             try { 
                 if (cloudItem.svg_json) parsedHotspots = JSON.parse(cloudItem.svg_json); 
             } catch(e) {
                 console.warn("Falha no parse do SVG do Atlas: ", cloudItem.id);
             }
             
             if (map.has(cloudItem.pathology)) {
                 const existing = map.get(cloudItem.pathology)!;
                 existing.images.unshift(cloudItem.image_url); // Coloca a foto da nuvem primeiro
                 existing.hotspots!.unshift(parsedHotspots);
                 if (!existing.id.includes('cloud')) existing.id = `cloud_expanded_${existing.id}`;
             } else {
                 map.set(cloudItem.pathology, {
                    id: `cloud_${cloudItem.id}`,
                    pathology: cloudItem.pathology,
                    description: cloudItem.description || '',
                    images: [cloudItem.image_url],
                    hotspots: [parsedHotspots]
                 });
             }
          });
          
          setItems(Array.from(map.values()));
        }
      } catch (e) {
        console.error("Erro Crítico de Rota Nuvem (Fallback ativado):", e);
      } finally {
        setIsLoadingCloud(false);
      }
    };
    
    fetchCloudAtlas();
  }, []);

  return (
    <div className="w-full mt-6">
      {isLoadingCloud && (
        <div className="w-full text-center py-3 mb-6 bg-slate-50 border border-slate-200 text-slate-500 rounded-xl text-sm font-medium animate-pulse flex items-center justify-center gap-2">
          <span>📡 Sincronizando Cofre Cloud (NeonDB)...</span>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
        {items.map((item) => (
          <div 
            key={item.id} 
            onClick={() => onSelectItem(item)}
            className="bg-white border focus-within:ring-2 focus-within:ring-brand-500 border-slate-200 rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all transform hover:-translate-y-1 relative"
          >
            {/* Tag visual de Nuvem se vier do Cloudinary */}
            {item.id.startsWith('cloud_') && (
               <div className="absolute top-3 right-3 z-20 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md">
                 NUVEM
               </div>
            )}
            
            {/* Fundo preto com máscara circular central */}
            <div className="w-full aspect-square bg-black relative group flex items-center justify-center overflow-hidden p-2">
              <img 
                src={item.images[0]} 
                alt={item.pathology} 
                className="w-full h-full object-cover z-10 relative rounded-full" 
                style={{
                  maskImage: "radial-gradient(circle at center, black 65%, transparent 72%)",
                  WebkitMaskImage: "radial-gradient(circle at center, black 65%, transparent 72%)"
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
              <span className="text-slate-400 font-medium absolute z-0 text-sm md:text-base">Carregando Acervo...</span>
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-slate-800 text-center">{item.pathology}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
