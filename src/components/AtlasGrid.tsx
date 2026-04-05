import { atlasData, AtlasItem } from '../data/mockData';

interface Props {
  onSelectItem: (item: AtlasItem) => void;
}

export function AtlasGrid({ onSelectItem }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full mt-6">
      {atlasData.map((item) => (
        <div 
          key={item.id} 
          onClick={() => onSelectItem(item)}
          className="bg-white border focus-within:ring-2 focus-within:ring-brand-500 border-slate-200 rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all transform hover:-translate-y-1"
        >
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
  );
}
