import { useState } from 'react'
import { Lock } from 'lucide-react'
import { AtlasGrid } from './components/AtlasGrid'
import { ImageDetailModal } from './components/ImageDetailModal'
import { AtlasQuiz } from './components/AtlasQuiz'
import { AIAnalyzer } from './components/AIAnalyzer'
import { MLCuradoria } from './components/MLCuradoria'
import { OtoscopyInstructionsModal } from './components/OtoscopyInstructionsModal'
import { AtlasItem } from './data/mockData'

function App() {
  const [selectedItem, setSelectedItem] = useState<AtlasItem | null>(null)
  const [viewMode, setViewMode] = useState<'atlas' | 'quiz' | 'ia' | 'curadoria'>('atlas')
  const [showInstructions, setShowInstructions] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center font-sans pb-10">
      <header className="w-full bg-brand-600 text-white p-6 shadow-md mb-6 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">OTTO Atlas</h1>
            <p className="text-brand-100 text-sm mt-1">Guia Clínico de Otoscopia interativo</p>
          </div>
          <nav className="flex gap-2">
            <button 
              onClick={() => setViewMode('atlas')}
              className={`px-3 py-2 rounded-lg text-sm md:text-base font-medium transition-colors ${viewMode === 'atlas' ? 'bg-white text-brand-600 shadow-sm' : 'text-brand-100 hover:bg-brand-500'}`}
            >
              Acervo
            </button>
            <button 
              onClick={() => setViewMode('quiz')}
              className={`px-3 py-2 rounded-lg text-sm md:text-base font-medium transition-colors ${viewMode === 'quiz' ? 'bg-white text-brand-600 shadow-sm' : 'text-brand-100 hover:bg-brand-500'}`}
            >
              Quiz Case
            </button>
            <button 
              onClick={() => setViewMode('ia')}
              className={`px-3 py-2 rounded-lg text-sm md:text-base font-bold transition-colors ${viewMode === 'ia' ? 'bg-yellow-400 text-brand-900 shadow-sm' : 'bg-brand-500 hover:bg-yellow-400 hover:text-brand-900 text-white shadow'}`}
            >
              OTOSCOP-IA
            </button>
            <button
              onClick={() => {
                const pass = prompt("Sessão Administrativa MLOps. Insira a senha mestre:");
                if (pass === "020786da") {
                  setViewMode('curadoria');
                } else if (pass !== null) {
                  alert("Senha incorreta.");
                }
              }}
              className={`p-2 rounded-lg hidden md:flex lg:flex items-center justify-center transition-colors ${viewMode === 'curadoria' ? 'bg-slate-900 text-white' : 'bg-brand-600 text-brand-200 hover:bg-slate-800'}`}
              title="Acesso Restrito - Curadoria MLOps"
            >
              <Lock className="w-5 h-5" />
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl px-4 md:px-6 flex flex-col items-center">
        {viewMode === 'atlas' && (
          <>
            <div className="w-full text-left mb-2 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">Acervo de Imagens</h2>
                <p className="text-slate-500 text-sm">Selecione uma imagem para ver os detalhes e marcações.</p>
              </div>
              <button 
                onClick={() => setShowInstructions(true)}
                className="bg-brand-50 hover:bg-brand-100 text-brand-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 border border-brand-200"
              >
                Instruções do Exame
              </button>
            </div>
            
            <AtlasGrid onSelectItem={setSelectedItem} />
            
            {selectedItem && (
              <ImageDetailModal 
                item={selectedItem} 
                onClose={() => setSelectedItem(null)} 
              />
            )}
          </>
        )}

        {viewMode === 'quiz' && <AtlasQuiz />}
        {viewMode === 'ia' && <AIAnalyzer />}
        {viewMode === 'curadoria' && <MLCuradoria />}
      </main>

      {showInstructions && (
        <OtoscopyInstructionsModal onClose={() => setShowInstructions(false)} />
      )}
    </div>
  )
}

export default App
