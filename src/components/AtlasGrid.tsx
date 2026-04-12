import { useState, useEffect } from 'react';
import { AtlasItem } from '../data/mockData';
import { ImageDetailModal } from './ImageDetailModal';
import { getApiBase } from '../services/api';

const CLINICAL_ORDER = [
  "NORMAL",
  "OTITE EXTERNA AGUDA LOCALIZADA",
  "OTITE EXTERNA AGUDA DIFUSA",
  "MIRINGITE BOLHOSA",
  "TIMPANOESCLEROSE",
  "TUBO DE VENTILAÇÃO",
  "OTITE MÉDIA AGUDA VIRAL / INICIAL",
  "OTITE MÉDIA AGUDA BACTERIANA",
  "OTITE MÉDIA AGUDA SUPURATIVA",
  "OTITE MÉDIA CRÔNICA SIMPLES",
  "OTITE MÉDIA CRÔNICA COM EFUSÃO",
  "OTITE MÉDIA CRÔNICA ATELECTÁSICA",
  "OTITE MÉDIA CRÔNICA COLESTEATOMATOSA"
];

const getOrderIndex = (category: string) => {
   const idx = CLINICAL_ORDER.findIndex(o => category.toUpperCase().trim() === o || category.toUpperCase().includes(o));
   return idx !== -1 ? idx : 999;
};

export function AtlasGrid() {
  const [items, setItems] = useState<AtlasItem[]>([]);
  const [isLoadingCloud, setIsLoadingCloud] = useState(true);
  const [selectedItem, setSelectedItem] = useState<AtlasItem | null>(null);

  useEffect(() => {
    const fetchV4Atlas = async () => {
      try {
        const res = await fetch(`${getApiBase()}/api/cms/cases`);
        const data = await res.json();

        if (data.success && data.cases) {
          const mappedItems: AtlasItem[] = data.cases
            .filter((c: any) => {
              const tags = c.taxonomies || [];
              return !tags.includes('ml_only') && !tags.includes('pure_ml') && !tags.includes('quiz_only');
            })
            .map((c: any) => {
              let parsedHotspots: any[] = [];
              try {
                // svg_json pode vir como string JSON, array já parseado, ou null
                if (Array.isArray(c.svg_json)) {
                  parsedHotspots = c.svg_json;
                } else if (typeof c.svg_json === 'string' && c.svg_json.trim()) {
                  parsedHotspots = JSON.parse(c.svg_json);
                }
              } catch (e) {
                parsedHotspots = [];
              }

              return {
                id: `v4_${c.id}`,
                pathology: c.primary_diagnosis || c.title,
                description: c.clinical_history || '',
                images: c.media_urls && c.media_urls.length > 0 ? c.media_urls : [],
                hotspots: parsedHotspots, // flat — sem double-array
              };
            });
          setItems(mappedItems);
        }
      } catch (e) {
        console.error('Erro Crítico de Rota V4:', e);
      } finally {
        setIsLoadingCloud(false);
      }
    };

    fetchV4Atlas();
  }, []);

  return (
    <div className="w-full mt-6">
      {isLoadingCloud ? (
        <div className="w-full text-center py-3 mb-6 bg-slate-50 border border-slate-200 text-slate-500 rounded-xl text-sm font-medium animate-pulse flex items-center justify-center gap-2">
          <span>📡 Sincronizando Acervo V4...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="w-full text-center py-12 bg-slate-50 border border-slate-200 text-slate-500 rounded-xl">
           <p className="font-bold">O Acervo V4 está vázio.</p>
           <p className="text-sm">Abra o Painel do Curador e migre o legado ou insira novos casos.</p>
        </div>
      ) : null}
      
      {Object.entries(
        items.reduce((acc, item) => {
          const category = item.pathology || "Outros";
          if (!acc[category]) acc[category] = [];
          acc[category].push(item);
          return acc;
        }, {} as Record<string, AtlasItem[]>)
      )
      .sort(([keyA], [keyB]) => {
         const idxA = getOrderIndex(keyA);
         const idxB = getOrderIndex(keyB);
         if (idxA !== idxB) return idxA - idxB;
         return keyA.localeCompare(keyB);
      })
      .map(([category, itemsInCat]) => (
        <div key={category} className="mb-10 w-full animate-in fade-in">
          <div className="flex items-center gap-3 mb-4 border-b border-brand-100 pb-2">
             <h2 className="text-xl font-bold text-slate-800">{category}</h2>
             <span className="bg-brand-100 text-brand-700 text-xs font-bold px-2 py-0.5 rounded-full">{itemsInCat.length} caso{itemsInCat.length !== 1 && 's'}</span>
          </div>
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pt-2 pb-6 px-1 scrollbar-thin scrollbar-thumb-brand-200">
            {itemsInCat.map((item) => (
              <div 
                key={item.id} 
                onClick={() => setSelectedItem(item)}
                className="bg-white border focus-within:ring-2 focus-within:ring-brand-500 border-slate-200 rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all transform hover:-translate-y-1 relative min-w-[280px] max-w-[280px] md:min-w-[320px] md:max-w-[320px] snap-center shrink-0"
              >
                {/* Tag visual de Nuvem se vier da V4 */}
                {item.id.startsWith('v4_') && (
                   <div className="absolute top-3 right-3 z-20 bg-brand-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md">
                     GEN 4.0
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
                </div>
                <div className="p-4">
                  <h3 className="text-base font-semibold text-slate-800 text-center line-clamp-2">{item.description || item.pathology}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {selectedItem && (
        <ImageDetailModal 
          item={selectedItem} 
          onClose={() => setSelectedItem(null)}
          onNext={() => {
             const currentIndex = items.findIndex(i => i.id === selectedItem.id);
             if (currentIndex !== -1) {
                setSelectedItem(items[(currentIndex + 1) % items.length]);
             }
          }}
          onPrev={() => {
             const currentIndex = items.findIndex(i => i.id === selectedItem.id);
             if (currentIndex !== -1) {
                setSelectedItem(items[(currentIndex - 1 + items.length) % items.length]);
             }
          }}
        />
      )}
    </div>
  );
}
