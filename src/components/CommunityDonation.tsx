import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, FileImage, Send } from 'lucide-react';

export function CommunityDonation() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [diagnostic, setDiagnostic] = useState('');
  const [clinicalCase, setClinicalCase] = useState('');
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      setUploadSuccess(false);
      setErrorMsg('');
    }
  };

  const clearForm = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setDiagnostic('');
    setClinicalCase('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !diagnostic) return;
    
    setIsUploading(true);
    setErrorMsg('');
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('diagnostic', diagnostic);
      if (clinicalCase) formData.append('clinical_case', clinicalCase);
      
      // Enviando para a nossa nova rota nativa na Vercel -> Render backend
      const endpoint = `${import.meta.env.VITE_AI_API_URL.replace('/predict', '')}/curadoria/donate`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Falha de conexão com a Cloud.');
      
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      setUploadSuccess(true);
      setTimeout(clearForm, 3000); // clear after 3 seconds showing success
      
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
          <label className="text-sm font-semibold text-slate-700 mb-2">Imagem do Exame (Otoscopia)</label>
          
          <div 
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`
              relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 
              transition-all duration-300 h-64 cursor-pointer overflow-hidden
              ${isUploading ? 'opacity-50 cursor-not-allowed border-slate-300 bg-slate-50' : 'hover:border-brand-500 hover:bg-brand-50 border-slate-300'}
              ${imagePreview ? 'border-brand-500 border-solid bg-black' : ''}
            `}
          >
            {imagePreview ? (
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="absolute inset-0 w-full h-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center text-center">
                <FileImage size={40} className="text-slate-400 mb-4" />
                <p className="text-slate-600 font-medium">Clique para escolher a imagem</p>
                <p className="text-slate-400 text-xs mt-2">Formatos suportados: JPG, PNG</p>
              </div>
            )}
            
            <input 
              type="file" 
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
                disabled={!selectedFile || !diagnostic || isUploading}
                className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:hover:bg-brand-600 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:shadow-none"
              >
                {isUploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enviando Arquivo Seguro...
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
