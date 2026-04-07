import { useState, useRef } from 'react';
import { Upload, Activity, Check, X, Send } from 'lucide-react';
import { predictOtoscopyImage, sendFeedbackToLegacySystem, PredictionResult } from '../services/api';

export function AIAnalyzer() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [predictions, setPredictions] = useState<PredictionResult[] | null>(null);
  
  const [isSending, setIsSending] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  
  // Estados para o Form de Feedback (Heroku)
  const [correctDiagnosis, setCorrectDiagnosis] = useState('');
  const [isCorrect, setIsCorrect] = useState<'yes' | 'no' | ''>('');
  const [clinicalCase, setClinicalCase] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setPredictions(null);
      setFeedbackSent(false);
    }
  };

  const handlePredict = async () => {
    if (!imageFile) return;
    setIsAnalyzing(true);
    try {
      const results = await predictOtoscopyImage(imageFile);
      setPredictions(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const submitFeedback = async () => {
    if (!imageFile || !predictions || predictions.length === 0) return;
    setIsSending(true);
    
    // Preparar os diferenciais como string
    const mainClass = predictions[0].class;
    const diffString = predictions.slice(1).map(p => `${p.class}: ${(p.confidence * 100).toFixed(0)}%`).join(', ');

    try {
      const success = await sendFeedbackToLegacySystem(
        imageFile,
        correctDiagnosis || mainClass,
        isCorrect || 'yes',
        mainClass, 
        diffString, // Agora envia diferenciais reais!
        clinicalCase
      );
      
      if (success) {
        setFeedbackSent(true);
        // Limpar após enviar
        setTimeout(() => {
          setImageFile(null);
          setImagePreview(null);
          setPredictions(null);
          setFeedbackSent(false);
          setCorrectDiagnosis('');
          setClinicalCase('');
          setIsCorrect('');
        }, 3000);
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="w-full max-w-4xl bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in zoom-in">
      <div className="mb-6 text-center break-words">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
          <Activity className="w-6 h-6 inline-block text-brand-600 mr-2 -mt-1" />
          OTTOscop-IA
        </h2>
        <p className="text-slate-500 mt-1">Carregue uma imagem otoscópica para receber uma segunda opinião e alimentar o modelo de inteligência.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Lado Esquerdo: Upload e Preview */}
        <div className="flex flex-col gap-4">
          {!imagePreview ? (
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-64 border-2 border-dashed border-slate-300 hover:border-brand-500 hover:bg-brand-50 rounded-xl flex flex-col items-center justify-center text-slate-500 transition-colors"
            >
              <Upload className="w-10 h-10 mb-2 text-brand-400" />
              <span className="font-medium">Toque para enviar ou tirar foto</span>
            </button>
          ) : (
            <div className="relative w-full aspect-square md:aspect-video rounded-xl overflow-hidden shadow-inner bg-slate-900 group">
              <img src={imagePreview} className="w-full h-full object-contain" alt="Upload prev" />
              <button 
                onClick={() => { setImagePreview(null); setImageFile(null); setPredictions(null); }}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            accept="image/*" 
            className="hidden" 
          />

          {!predictions && imagePreview && (
            <button 
              onClick={handlePredict}
              disabled={isAnalyzing}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-transform hover:-translate-y-0.5"
            >
              {isAnalyzing ? (
                <>Processando IA...</>
              ) : (
                <><Activity className="w-5 h-5" /> Analisar com OTTO Brain</>
              )}
            </button>
          )}
        </div>

        {/* Lado Direito: Resultados e Feedback */}
        <div className="flex flex-col">
          {predictions ? (
            <div className="h-full flex flex-col gap-4">
              <div className="bg-brand-50 border border-brand-200 p-5 rounded-xl text-center shadow-sm">
                <span className="block text-brand-600 font-semibold mb-1">Diagnóstico Primário (Top 1)</span>
                <span className="block text-2xl font-black text-slate-800">{predictions[0].class}</span>
                <span className="block text-sm text-brand-500 font-medium mt-1">Confiança: {(predictions[0].confidence * 100).toFixed(1)}%</span>
                
                {/* Diferenciais */}
                {predictions.length > 1 && (
                  <div className="mt-4 pt-4 border-t border-brand-200 flex flex-col gap-2">
                    <span className="block text-xs font-semibold text-brand-700 uppercase tracking-wide">Diagnósticos Diferenciais</span>
                    <ul className="text-sm text-slate-600 flex flex-wrap justify-center gap-2">
                      {predictions.slice(1).map((p, i) => (
                        <li key={i} className="bg-white px-3 py-1 rounded-full border border-brand-100 shadow-sm">
                          {p.class} <span className="opacity-70">({(p.confidence * 100).toFixed(0)}%)</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="bg-white border text-left border-slate-200 p-5 rounded-xl shadow-sm flex-1">
                <h3 className="font-bold text-slate-700 mb-3 border-b pb-2">Validar Diagnóstico (Retreinamento)</h3>
                
                <div className="mb-3">
                  <label className="block text-sm font-medium text-slate-600 mb-1">A predição está correta?</label>
                  <select 
                    value={isCorrect} 
                    onChange={e => setIsCorrect(e.target.value as 'yes' | 'no')}
                    className="w-full border-slate-300 rounded-lg shadow-sm p-2 focus:ring-brand-500 focus:border-brand-500"
                  >
                    <option value="" disabled>Selecione...</option>
                    <option value="yes">Sim</option>
                    <option value="no">Não</option>
                  </select>
                </div>

                {isCorrect === 'no' && (
                  <div className="mb-3 animate-in fade-in slide-in-from-top-2">
                    <label className="block text-sm font-medium text-slate-600 mb-1">Qual é o diagnóstico correto?</label>
                    <input 
                      type="text" 
                      value={correctDiagnosis}
                      onChange={e => setCorrectDiagnosis(e.target.value)}
                      placeholder="Ex: Cerume Impactado"
                      className="w-full border-slate-300 rounded-lg shadow-sm p-2 focus:ring-brand-500 focus:border-brand-500"
                    />
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-600 mb-1">Notas Clínicas Breves (Opcional)</label>
                  <input 
                    type="text" 
                    value={clinicalCase}
                    onChange={e => setClinicalCase(e.target.value)}
                    placeholder="Paciente de 30 anos com dor etc..."
                    className="w-full border-slate-300 rounded-lg shadow-sm p-2 focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>

                <button 
                  onClick={submitFeedback}
                  disabled={isSending || isCorrect === '' || (isCorrect === 'no' && correctDiagnosis === '')}
                  className="w-full bg-brand-500 hover:bg-brand-600 disabled:bg-slate-300 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-transform hover:-translate-y-0.5"
                >
                  {isSending ? 'Salvando no Servidor...' : <><Send className="w-5 h-5"/> Enviar ao Banco de Dados</>}
                </button>
                
                {feedbackSent && (
                  <p className="text-green-600 text-sm font-semibold flex items-center justify-center gap-1 mt-3 animate-in bounce-in">
                    <Check className="w-4 h-4"/> Feedback enviado com sucesso para a base!
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center p-6 text-center bg-slate-50 text-slate-400">
              <p>Os resultados e o painel de treinamento do modelo aparecerão aqui após a análise da imagem.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
