import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, FileImage, Send, X } from 'lucide-react';
import { compressImage } from '../utils/imageCompressor';

export function CommunityDonation() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [diagnostic, setDiagnostic] = useState('');
  const [clinicalCase, setClinicalCase] = useState('');
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Limita a 10 arquivos
      const newFiles = Array.from(e.target.files).slice(0, 10);
      setSelectedFiles(newFiles);
      
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setImagePreviews(newPreviews);
      
      setUploadSuccess(false);
      setErrorMsg('');
    }
  };

  const removeFile = (index: number) => {
    const updatedFiles = [...selectedFiles];
    updatedFiles.splice(index, 1);
    setSelectedFiles(updatedFiles);
    
    const updatedPreviews = [...imagePreviews];
    updatedPreviews.splice(index, 1);
    setImagePreviews(updatedPreviews);
  };

  const clearForm = () => {
    setSelectedFiles([]);
    setImagePreviews([]);
    setDiagnostic('');
    setClinicalCase('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0 || !diagnostic) return;
    
    setIsUploading(true);
    setErrorMsg('');
    
    try {
      const formData = new FormData();
      for (const file of selectedFiles) {
        const optimized = await compressImage(file);
        formData.append('files', optimized);
      }
      formData.append('diagnostic', diagnostic);
      if (clinicalCase) formData.append('clinical_case', clinicalCase);
      
      // Enviando para a nossa nova rota nativa na Vercel -> Render backend
      const baseAiUrl = import.meta.env.VITE_AI_API_URL || 'http://127.0.0.1:8000/api/predict';
      const endpoint = `${baseAiUrl.replace('/api/predict', '').replace('/predict', '')}/api/curadoria/donate`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Falha de conexão com a Cloud.');
      
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      setUploadSuccess(true);
      setTimeout(clearForm, 4000); // clear after 4 seconds showing success
      
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao processar imagem.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-16 h-16 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
          <UploadCloud size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Colaboratório do Atlas</h2>
        <p className="text-slate-500 mt-2 max-w-lg">
          Compartilhe fotos de casos de otoscopia confirmados da sua prática clínica. 
          Sua colaboração ajuda a treinar a próxima geração do Otto Atlas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Lado Esquerdo: Imagem */}
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-slate-700 mb-2">Imagens do Exame (Até 10 fotos)</label>
          
          <div 
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`
              relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6
              transition-all duration-300 min-h-[16rem] cursor-pointer overflow-hidden

              ${isUploading ? 'opacity-50 cursor-not-allowed border-slate-300 bg-slate-50' : 'hover:border-brand-500 hover:bg-brand-50 border-slate-300'}
              ${imagePreviews.length > 0 ? 'border-none p-0' : ''}
            `}
            style={imagePreviews.length > 0 ? { cursor: 'default' } : undefined}
          >
            {imagePreviews.length > 0 ? (
              <div 
                className="absolute inset-0 p-2 grid gap-2 overflow-y-auto w-full h-full bg-slate-50 border-2 border-solid border-brand-200 rounded-xl"
                style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))' }}
                onClick={(e) => e.stopPropagation()}
              >
                {imagePreviews.map((preview, i) => (
                  <div key={i} className="relative group rounded-lg bg-black overflow-hidden shadow-sm aspect-square">
                    <img
                      src={preview}
                      alt={`Preview ${i}`}
                      className="w-full h-full object-cover"
                    />
                    <button 
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute top-1.5 right-1.5 bg-red-500 hover:bg-red-600 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {imagePreviews.length < 10 && !isUploading && (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center border-2 border-dashed border-brand-300 rounded-lg aspect-square cursor-pointer hover:bg-brand-50 transition-colors text-brand-500"
                  >
                    <span className="text-3xl font-light">+</span>
                    <span className="text-xs font-semibold mt-1">Adicionar</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <FileImage size={40} className="text-slate-400 mb-4" />
                <p className="text-slate-600 font-medium">Clique para escolher as imagens</p>
                <p className="text-slate-400 text-xs mt-2">Formatos suportados: JPG, PNG</p>
              </div>
            )}
            
            <input 
              type="file" 
              multiple
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              accept="image/jpeg, image/png, image/jpg" 
              className="hidden" 
              disabled={isUploading}
            />
          </div>
        </div>

        {/* Lado Direito: Formulário */}
        <form onSubmit={handleDonate} className="flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <label htmlFor="diagnostic" className="block text-sm font-semibold text-slate-700 mb-1">
                Diagnóstico Comprovado <span className="text-red-500">*</span>
              </label>
              <input
                id="diagnostic"
                required
                type="text"
                disabled={isUploading || uploadSuccess}
                placeholder="Ex: Otite Média Aguda"
                value={diagnostic}
                onChange={(e) => setDiagnostic(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
              />
            </div>
            
            <div>
              <label htmlFor="clinicalCase" className="block text-sm font-semibold text-slate-700 mb-1">
                Breve Resumo Clínico <span className="text-slate-400 font-normal">(Opcional)</span>
              </label>
              <textarea
                id="clinicalCase"
                disabled={isUploading || uploadSuccess}
                rows={3}
                placeholder="Ex: Paciente 35 anos, dor auricular à E há 4 dias após resfriado."
                value={clinicalCase}
                onChange={(e) => setClinicalCase(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500 outline-none transition-all resize-none"
              />
            </div>
          </div>

          <div className="mt-6">
            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <p>{errorMsg}</p>
              </div>
            )}
            
            {uploadSuccess ? (
              <div className="w-full py-4 bg-emerald-50 text-emerald-700 rounded-xl font-bold flex items-center justify-center gap-2 border border-emerald-200 shadow-sm">
                <CheckCircle size={20} />
                Doação recebida pelo Atlas!
              </div>
            ) : (
              <button
                type="submit"
                disabled={selectedFiles.length === 0 || !diagnostic || isUploading}
                className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:hover:bg-brand-600 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:shadow-none"
              >
                {isUploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enviando {selectedFiles.length} Lotes Seguros...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Enviar Contribuição
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
