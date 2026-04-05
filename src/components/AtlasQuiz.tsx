import { useState } from 'react';
import { quizQuestions } from '../data/quizData';
import { ArrowRight, CheckCircle, XCircle, RotateCcw } from 'lucide-react';

export function AtlasQuiz() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const question = quizQuestions[currentQuestionIndex];

  const handleSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedAnswer(index);
    setIsAnswered(true);
    if (index === question.correctOptionIndex) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
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
  };

  if (isFinished) {
    return (
      <div className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center animate-in fade-in zoom-in">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Quiz Concluído!</h2>
        <p className="text-slate-600 mb-6 flex flex-col items-center gap-2">
          <span>Você acertou</span>
          <span className="text-5xl font-black text-brand-600">{score} de {quizQuestions.length}</span>
        </p>
        <button
          onClick={restartQuiz}
          className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 mx-auto transition-transform hover:scale-105"
        >
          <RotateCcw className="w-5 h-5" /> Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <span className="text-sm font-semibold text-slate-500">
            Caso {currentQuestionIndex + 1} de {quizQuestions.length}
          </span>
        </div>
        <div className="p-6 flex-1">
          <p className="text-lg font-medium text-slate-800 leading-relaxed mb-6">
            {question.clinicalCase}
          </p>
          <div className="w-full aspect-video bg-slate-200 rounded-xl overflow-hidden relative">
             <img 
               src={question.image} 
               alt="Otoscopia" 
               className="w-full h-full object-cover"
               onError={(e) => { e.currentTarget.style.display = 'none'; }} 
             />
             <span className="text-slate-400 font-medium absolute inset-0 flex items-center justify-center -z-10">
               Imagem do Caso
             </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-xl font-bold text-slate-800 mb-2">Qual o diagnóstico mais provável?</h3>
        {question.options.map((option, index) => {
          const isSelected = selectedAnswer === index;
          const isCorrect = index === question.correctOptionIndex;
          
          let buttonClass = "w-full text-left p-4 rounded-xl border-2 transition-all font-medium text-lg flex items-center justify-between ";
          
          if (!isAnswered) {
            buttonClass += "border-slate-200 hover:border-brand-400 hover:bg-slate-50 text-slate-700 bg-white";
          } else {
            if (isCorrect) {
              buttonClass += "border-green-500 bg-green-50 text-green-800";
            } else if (isSelected && !isCorrect) {
              buttonClass += "border-red-500 bg-red-50 text-red-800";
            } else {
              buttonClass += "border-slate-200 bg-slate-50 text-slate-400 opacity-50";
            }
          }

          return (
            <button
              key={index}
              onClick={() => handleSelect(index)}
              disabled={isAnswered}
              className={buttonClass}
            >
              {option}
              {isAnswered && isCorrect && <CheckCircle className="w-6 h-6 text-green-500" />}
              {isAnswered && isSelected && !isCorrect && <XCircle className="w-6 h-6 text-red-500" />}
            </button>
          );
        })}

        {isAnswered && (
          <div className="mt-4 p-5 bg-blue-50 border border-blue-100 rounded-xl animate-in fade-in">
            <h4 className="font-bold text-blue-900 mb-2">Explicação Clínica:</h4>
            <p className="text-blue-800 text-sm">{question.explanation}</p>
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleNext}
                className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-transform hover:translate-x-1"
              >
                {currentQuestionIndex < quizQuestions.length - 1 ? 'Próximo Caso' : 'Ver Resultado'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
