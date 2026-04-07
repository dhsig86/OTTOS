import { X, BookOpen } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export function OtoscopyInstructionsModal({ onClose }: Props) {
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden relative flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="bg-brand-100 p-2 rounded-lg">
              <BookOpen className="w-6 h-6 text-brand-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Semiologia Otológica</h2>
              <p className="text-sm text-slate-500">Fundamentos da Otoscopia (Rotinas em ORL)</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 text-slate-500 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto w-full text-slate-700 leading-relaxed text-sm md:text-base space-y-6">
          <section>
             <h3 className="text-lg font-semibold text-brand-700 mb-2">A Ferramenta Otoscópica</h3>
             <p>A presença de um canal auditivo externo e de uma fronteira semitransparente (a membrana timpânica) entre a orelha externa e média transforma o uso de iluminação em um grande diferencial diagnóstico. Para reconhecer as diversas patologias que afetam a orelha, o treinamento inicial baseia-se na consolidação do <strong>padrão de normalidade</strong>.</p>
          </section>

          <section>
             <h3 className="text-lg font-semibold text-brand-700 mb-3">5 Características Fundamentais (Fig. 1.7)</h3>
             <ul className="space-y-4">
                <li className="flex gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                   <div className="bg-white text-brand-600 font-bold w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-slate-200">1</div>
                   <div>
                      <strong className="text-slate-800 block">Integridade</strong>
                      <span>A membrana deve estar íntegra (sem perfurações). Patologias como OMC (Otite Média Crônica) geram perfuração franca com ou sem supuração.</span>
                   </div>
                </li>
                <li className="flex gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                   <div className="bg-white text-brand-600 font-bold w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-slate-200">2</div>
                   <div>
                      <strong className="text-slate-800 block">Transparência</strong>
                      <span>Na verdade, é semitransparente. Quadros infecciosos espessam a membrana, diminuindo sua transparência e ocultando as estruturas intra-timpânicas.</span>
                   </div>
                </li>
                <li className="flex gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                   <div className="bg-white text-brand-600 font-bold w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-slate-200">3</div>
                   <div>
                      <strong className="text-slate-800 block">Coloração</strong>
                      <span>O padrão âmbar-neutro (pérola cinzenta) sinaliza normalidade. Em quadros de Otite Média Aguda, a hiperemia (vermelhidão vascular) altera drasticamente esta cor. Num derrame, o líquido purulento por trás da MT muda o padrão.</span>
                   </div>
                </li>
                <li className="flex gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                   <div className="bg-white text-brand-600 font-bold w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-slate-200">4</div>
                   <div>
                      <strong className="text-slate-800 block">Posição</strong>
                      <span>Naturalmente levemente côncava, com depressão máxima no umbigo do martelo. Em Otites Médias Agudas efusivas graves, ocorre abaulamento severo (empurrando-a para fora). Em disfunções tubárias crônicas o aspecto é retraído.</span>
                   </div>
                </li>
                <li className="flex gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                   <div className="bg-white text-brand-600 font-bold w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-slate-200">5</div>
                   <div>
                      <strong className="text-slate-800 block">Mobilidade</strong>
                      <span>Pode ser aferida pela otoscopia pneumática. Rigidez ou diminuição da mobilidade tanto com pressão negativa ou positiva denota patologia subjacente (como líquido ou aderência na orelha média).</span>
                   </div>
                </li>
             </ul>
          </section>

          <section className="bg-brand-50 p-4 rounded-xl border border-brand-100">
             <h3 className="text-lg font-semibold text-brand-800 mb-3 flex items-center gap-2">
               <BookOpen className="w-5 h-5" />
               Qualidade da Captura Fotográfica
             </h3>
             <p className="text-sm text-slate-600 mb-4">
               Para garantir uma predição algorítmica assertiva e evitar falsos diagnósticos da IA, a qualidade da sua otoscopia fotográfica é <strong>crítica</strong>. Imagens borradas, com cerume difuso bloqueando a visão total, ou ofuscadas por luz estourada reduzem drasticamente a precisão.
             </p>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-3 border border-red-200">
                   <div className="flex justify-between items-center mb-2">
                     <span className="font-semibold text-red-600 text-sm">❌ Imagem Ruim</span>
                     <span className="text-xs text-slate-400">Pouco foco e Desalinhada</span>
                   </div>
                   <img src="/src/assets/otoscopia_ruim.jpg" alt="Exemplo ruim" className="w-full aspect-square object-cover rounded shadow-sm opacity-90 border border-slate-100" />
                </div>
                <div className="bg-white rounded-lg p-3 border border-emerald-200">
                   <div className="flex justify-between items-center mb-2">
                     <span className="font-semibold text-emerald-600 text-sm">✅ Imagem Boa</span>
                     <span className="text-xs text-slate-400">Iluminação e Foco Perfeitos</span>
                   </div>
                   <img src="/src/assets/otoscopia_boa.jpg" alt="Exemplo bom" className="w-full aspect-square object-cover rounded shadow-sm border border-slate-100" />
                </div>
             </div>
           </section>
        </div>
      </div>
    </div>
  );
}
