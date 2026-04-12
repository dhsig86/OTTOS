import { useState } from 'react'
import { Lock, Globe } from 'lucide-react'
import { AtlasGrid } from './components/AtlasGrid'
import { AtlasQuiz } from './components/AtlasQuiz'
import { AIAnalyzer } from './components/AIAnalyzer'
import { CurationHubV4 } from './components/CurationHubV4'
import { OtoscopyInstructionsModal } from './components/OtoscopyInstructionsModal'
import { CommunityDonation } from './components/CommunityDonation'

function App() {
  const [viewMode, setViewMode] = useState<'atlas' | 'quiz' | 'ia' | 'hub' | 'donation'>('atlas')
  const [showInstructions, setShowInstructions] = useState(false)

  // Interruptor de Desenvolvimento: Coloque 'true' para pular checagem de senhas durante testes.
  const DEV_MODE_AUTH = false;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center font-sans pb-10">
      <header className="w-full bg-brand-600 text-white p-6 shadow-md mb-6 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex gap-4 items-center">
            <div className="w-12 h-12 bg-white rounded-xl shadow-inner flex items-center justify-center p-2 transform rotate-3">
              <Globe className="w-8 h-8 text-brand-600" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight drop-shadow-md">HARTS OTTO ATLAS</h1>
              <p className="text-brand-100 font-medium text-sm tracking-wide">Guia Clínico de Otoscopia Interativo</p>
            </div>
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
              onClick={() => setViewMode('donation')}
              className={`px-3 py-2 rounded-lg text-sm md:text-base font-medium transition-colors ${viewMode === 'donation' ? 'bg-white text-brand-600 shadow-sm' : 'text-brand-100 hover:bg-brand-500'}`}
            >
              Colaborar
            </button>
            <button 
              onClick={() => setViewMode('ia')}
              className={`px-3 py-2 rounded-lg text-sm md:text-base font-bold transition-colors ${viewMode === 'ia' ? 'bg-yellow-400 text-brand-900 shadow-sm' : 'bg-brand-500 hover:bg-yellow-400 hover:text-brand-900 text-white shadow'}`}
            >
              OTOSCOP-IA
            </button>
            <button
              onClick={() => {
                if (DEV_MODE_AUTH) {
                  setViewMode('hub');
                } else {
                  const pass = prompt("Sessão Administrativa. Insira a senha mestre:");
                  if (pass === "020786da") {
                    setViewMode('hub');
                  } else if (pass !== null) {
                    alert("Acesso Negado.");
                  }
                }
              }}
              className={`p-2 rounded-lg hidden md:flex lg:flex items-center justify-center transition-colors ${(viewMode === 'hub') ? 'bg-slate-900 text-white shadow-inner' : 'bg-brand-600 text-brand-200 hover:bg-slate-800'}`}
              title="Acesso Restrito - Hub Administrativo e Curadoria V4"
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
            <AtlasGrid />
          </>
        )}

        {viewMode === 'quiz' && <AtlasQuiz />}
        {viewMode === 'ia' && <AIAnalyzer />}
        {viewMode === 'hub' && <CurationHubV4 />}
        {viewMode === 'donation' && (
          <div className="w-full flex items-center justify-center mt-6">
            <CommunityDonation />
          </div>
        )}
      </main>

      {showInstructions && (
        <OtoscopyInstructionsModal onClose={() => setShowInstructions(false)} />
      )}
    </div>
  )
}

export default App
