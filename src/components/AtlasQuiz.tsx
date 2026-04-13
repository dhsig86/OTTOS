import { useState, useEffect } from 'react';
import { quizQuestions as defaultQuiz } from '../data/quizData';
import { ArrowRight, CheckCircle, XCircle, RotateCcw, Loader2, User, Trophy, Share2, UploadCloud } from 'lucide-react';

export function AtlasQuiz() {
  const [userName, setUserName] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const apiURL = import.meta.env.VITE_AI_API_URL || 'http://127.0.0.1:8000';
        const res = await fetch(`${apiURL.replace(/\/$/, '')}/api/cms/cases`);
        const data = await res.json();
        
        if (data.success && data.cases && data.cases.length >= 4) {
             const allDiagnoses = Array.from(new Set(data.cases.map((c:any) => c.primary_diagnosis || c.title).filter(Boolean))) as string[];
             
             if (allDiagnoses.length >= 4) {
                 const dynamicQuestions = data.cases
                     .filter((c:any) => {
                         const tags = c.taxonomies || [];
                         // Ignora taxonomias que bloqueiam uso em Quiz (ex: "Só IA")
                         if (tags.includes('ml_only') || tags.includes('ia_only') || tags.includes('pure_ml')) return false;
                         return c.media_urls && c.media_urls.length > 0 && (c.primary_diagnosis || c.title);
                     })
                     .sort(() => 0.5 - Math.random()) 
                     .slice(0, 40) // Permite até 40 questões, conforme roadmap V2
                     .map((c: any) => {
                         const correct = c.primary_diagnosis || c.title;
                         const wrongs = allDiagnoses.filter(d => d !== correct).sort(() => 0.5 - Math.random()).slice(0, 3);
                         const options = [correct, ...wrongs].sort(() => 0.5 - Math.random());
                         return {
                             id: c.id,
                             clinicalCase: (c.clinical_history && c.clinical_history.trim().length > 10) 
                                ? c.clinical_history 
                                : `Com base na visualização fotográfica estrutural, qual o diagnóstico otoscópico mais provável para este quadro?`,
                             image: c.media_urls[0],
                             options: options,
                             correctOptionIndex: options.indexOf(correct),
                             explanation: `Caso certificado e validado no Acervo Gen 4 sob a classe: ${correct}.`
                         };
                     });
                 
                 if (dynamicQuestions.length > 0) {
                     setQuestions(dynamicQuestions);
                     setIsLoading(false);
                     return;
                 }
             }
        }
      } catch(e) { console.error("Erro no Quiz Dinâmico:", e); }
      
      // Fallback: Randomiza também o embaralhamento base
      setQuestions(defaultQuiz.sort(() => 0.5 - Math.random()));
      setIsLoading(false);
    };
    fetchQuestions();
  }, []);

  const handleStart = () => {
     if (userName.trim().length >= 2) {
         setHasStarted(true);
     }
  };

  const question = questions[currentQuestionIndex];

  const handleSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedAnswer(index);
    setIsAnswered(true);
    if (index === question.correctOptionIndex) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setScore(0);
    setIsFinished(false);
    setIsSaved(false);
    setQuestions([...questions].sort(() => 0.5 - Math.random()));
  };
  
  const handleShareWhatsApp = () => {
      const percentage = Math.round((score / questions.length) * 100);
      let text = `⚕️ *Benchmarking Clínico finalizado!*\n\nEu, *${userName}*, acertei *${score}/${questions.length}* (${percentage}%) das questões reais de triagem de ouvidos na plataforma *HART's OTTO Atlas*.\n\nVenha se desafiar também: atlas.drdariohart.com`;
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (!hasStarted) {
      return (
          <div className="w-full max-w-xl bg-white p-10 rounded-2xl shadow-lg border border-slate-200 text-center animate-in fade-in zoom-in mx-auto mt-10">
              <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-6">
                 <User className="w-8 h-8 text-brand-600" />
              </div>
              <h2 className="text-3xl font-bold text-slate-800 mb-4">Bem-vindo ao Benchmarking</h2>
              <p className="text-slate-600 mb-8 leading-relaxed">
                 O Módulo de Quiz sorteará radiografias otoscópicas validadas em tempo real do nosso acervo na nuvem para testar sua proficiência diagnóstica.
              </p>
              
              <div className="mb-8 text-left">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Identificação do Profissional / Sistema:</label>
                  <input 
                      type="text" 
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Ex: Dr. Antônio, Residente Camila, OTTOSCOP-IA..."
                      className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50 transition-all font-medium text-slate-800"
                  />
                  <p className="text-xs text-slate-400 mt-2">Dica: Se estiver realizando auditoria logarítmica para o estudo da v4, insira 'OTTOSCOP-IA'.</p>
              </div>

              <button
                 onClick={handleStart}
                 disabled={userName.trim().length < 2 || isLoading}
                 className="w-full bg-brand-600 disabled:bg-slate-300 disabled:cursor-not-allowed hover:bg-brand-700 text-white px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform hover:-translate-y-1 shadow-md hover:shadow-xl"
              >
                 {isLoading ? (
                     <><Loader2 className="w-5 h-5 animate-spin" /> Carregando Nuvem...</>
                 ) : (
                     <><Trophy className="w-5 h-5" /> Iniciar Avaliação Aleatória</>
                 )}
              </button>
          </div>
      );
  }

  if (isFinished) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="w-full max-w-2xl bg-white p-10 rounded-2xl shadow-xl border border-slate-200 text-center animate-in fade-in zoom-in mx-auto mt-10 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-50 rounded-full blur-3xl opacity-50 z-0"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-50 rounded-full blur-3xl opacity-50 z-0"></div>
        
        <div className="relative z-10">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Avaliação Concluída!</h2>
            <p className="text-lg font-medium text-slate-500 mb-8">{userName}, este é o seu Score Clínico:</p>
            
            <div className="bg-slate-50 border border-slate-200 p-8 rounded-2xl mb-8 flex justify-center divide-x divide-slate-200 shadow-inner">
                <div className="px-5 md:px-8 flex flex-col">
                    <span className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Acertos</span>
                    <span className="text-4xl md:text-5xl font-black text-brand-600">{score}</span>
                </div>
                <div className="px-5 md:px-8 flex flex-col">
                    <span className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Total</span>
                    <span className="text-4xl md:text-5xl font-black text-slate-800">{questions.length}</span>
                </div>
                <div className="px-5 md:px-8 flex flex-col">
                    <span className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Eficiência</span>
                    <span className={`text-4xl md:text-5xl font-black ${percentage >= 70 ? 'text-green-500' : 'text-orange-500'}`}>{percentage}%</span>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                onClick={() => setIsSaved(true)}
                disabled={isSaved}
                className="bg-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed hover:bg-slate-900 text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-transform hover:-translate-y-1"
                >
                <UploadCloud className="w-5 h-5" /> {isSaved ? 'Placar Gravado' : 'Enviar ao Scoreboard'}
                </button>
                <button
                onClick={handleShareWhatsApp}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-transform hover:-translate-y-1"
                >
                <Share2 className="w-5 h-5" /> Desafiar no WhatsApp
                </button>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-100">
                <button onClick={restartQuiz} className="text-slate-500 hover:text-brand-600 font-bold text-sm tracking-wide flex items-center justify-center gap-2 mx-auto">
                    <RotateCcw className="w-4 h-4" /> RETORNAR PARA REFAZER TESTE
                </button>
            </div>
        </div>
      </div>
    );
  }

  if (!question) return null;

  return (
    <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 mx-auto mt-4">
      <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden flex flex-col relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-slate-100">
            <div className="h-full bg-brand-500 transition-all duration-300" style={{ width: `${((currentQuestionIndex) / questions.length) * 100}%` }}></div>
        </div>
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center mt-1">
          <span className="text-sm font-bold text-slate-500">
            Questão {currentQuestionIndex + 1} de {questions.length}
          </span>
          <div className="flex gap-2 items-center">
              <span className="text-xs font-bold bg-brand-100 text-brand-700 px-2 py-1 rounded shadow-sm">Benchmarking</span>
              {question.id && <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 flex items-center gap-1 rounded shadow-sm"><Loader2 className="w-3 h-3" /> API V4</span>}
          </div>
        </div>
        <div className="p-6 flex-1 flex flex-col">
          <p className="text-base font-semibold text-slate-800 leading-relaxed mb-6 italic border-l-4 border-brand-300 pl-4 bg-brand-50 p-3 rounded-r-lg">
            "{question.clinicalCase}"
          </p>
          <div className="w-full flex-1 min-h-[250px] bg-black rounded-xl overflow-hidden relative shadow-inner group flex justify-center items-center p-2">
             <img 
               src={question.image} 
               alt="Exame Otoscópico" 
               className="w-full h-full object-contain"
               onError={(e) => { e.currentTarget.style.display = 'none'; }} 
             />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 justify-center">
        <h3 className="text-lg font-black text-slate-800 mb-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">Selecione o diagnóstico assertivo:</h3>
        {question.options.map((option: string, index: number) => {
          const isSelected = selectedAnswer === index;
          const isCorrect = index === question.correctOptionIndex;
          
          let buttonClass = "w-full text-left p-4 rounded-xl border-2 transition-all font-semibold text-sm md:text-base flex items-center justify-between shadow-sm ";
          
          if (!isAnswered) {
            buttonClass += "border-slate-200 hover:border-brand-400 hover:bg-brand-50 text-slate-700 bg-white hover:shadow-md transform hover:-translate-y-0.5";
          } else {
            if (isCorrect) {
              buttonClass += "border-green-500 bg-green-50 text-green-900 shadow-green-100";
            } else if (isSelected && !isCorrect) {
              buttonClass += "border-red-500 bg-red-50 text-red-900 shadow-red-100";
            } else {
              buttonClass += "border-slate-200 bg-slate-50 text-slate-400 opacity-60";
            }
          }

          return (
            <button
              key={index}
              onClick={() => handleSelect(index)}
              disabled={isAnswered}
              className={buttonClass}
            >
              <span className="pr-4 leading-snug">{option}</span>
              {isAnswered && isCorrect && <CheckCircle className="w-6 h-6 shrink-0 text-green-500" />}
              {isAnswered && isSelected && !isCorrect && <XCircle className="w-6 h-6 shrink-0 text-red-500" />}
            </button>
          );
        })}

        {isAnswered && (
          <div className="mt-4 p-5 bg-blue-50 border border-blue-200 rounded-xl shadow-sm animate-in fade-in slide-in-from-bottom-2">
            <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2"><CheckCircle className="w-4 h-4"/> Curadoria OTTO:</h4>
            <p className="text-blue-800 text-sm font-medium">{question.explanation}</p>
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleNext}
                className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-transform hover:translate-x-1 shadow-md hover:shadow-lg"
              >
                {currentQuestionIndex < questions.length - 1 ? 'Avançar Caso' : 'Finalizar e Ver Placar'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
