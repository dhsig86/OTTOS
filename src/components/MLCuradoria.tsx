import { useState, useEffect, useRef } from 'react';
import { Database, ShieldCheck, Download, Trash2, CheckCircle2 } from 'lucide-react';
import { getApiBase } from '../services/api';

// Tipagem espelhando o banco de dados Legado (Postgres)
interface CurationItem {
  id: number;
  feedback_image_url: string;
  correct_diagnosis: string;
  diagnosis_correct: boolean;
  predicted_classes: string;
  clinical_case: string;
}

export function MLCuradoria() {
  const [items, setItems] = useState<CurationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  // Controla se a caixa de texto de nova classe está ativa por ID da imagem:
  const [useCustomClass, setCustomClass] = useState<Record<number, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [oficialClasses, setOficialClasses] = useState<string[]>([
    'normal',
    'otite_media_aguda',
    'otite_media_cronica',
    'otite_externa_aguda',
    'cerume_obstrucao',
    'corpo_estranho',
    'nao_otoscopica'
  ]);

  /* 
  const handleSendToAtlasV4 = async (item: CurationItem) => {
    setIsUploading(true);
    const apiBase = getApiBase();
    try {
      let imgUrl = item.feedback_image_url;
      if (!imgUrl.startsWith('http')) {
        imgUrl = `${apiBase}${imgUrl}`;
      }
      const imgRes = await fetch(imgUrl);
      const blob = await imgRes.blob();

      const file = new File([blob], `curation_${item.id}.jpg`, { type: blob.type });
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch(`${apiBase}/api/cms/upload`, { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadData.success) throw new Error(uploadData.detail || 'Falha no upload Cloudinary');

      const finalClass = item.correct_diagnosis
        ? item.correct_diagnosis.trim()
        : item.predicted_classes
          ? item.predicted_classes.split(',')[0].trim()
          : 'Sem Classe';
      const diagFormat = finalClass.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

      const payload = {
        title: 'Diagnóstico: ' + diagFormat,
        clinical_history: item.clinical_case || 'Caso auditado via MLOps.',
        primary_diagnosis: diagFormat,
        patient_demographics: {},
        taxonomies: [],
        media_urls: [uploadData.url],
        svg_json: '[]',
      };
      const caseRes = await fetch(`${apiBase}/api/cms/cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const caseData = await caseRes.json();
      if (!caseData.success) throw new Error('Falha ao salvar no NeonDB');

      await fetch(`${apiBase}/api/curadoria/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          image_url: item.feedback_image_url,
          class_name: 'discarded_for_v4',
          is_trash: true,
        }),
      });

      setItems(prev => prev.filter(i => i.id !== item.id));
      alert(`Sucesso! Foto injetada na nuvem V4 como ${diagFormat}. O Atlas V4 a exibirá instantaneamente.`);
    } catch (err) {
      alert('Erro ao enviar para API V4: ' + err);
    } finally {
      setIsUploading(false);
    }
  };
  */

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.zip')) {
      alert('Operação bloqueada: Selecione apenas arquivos .zip contendo as pastas categorizadas.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${getApiBase()}/api/curadoria/upload-zip`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (data.error) {
        alert(`Erro de Ingestão: ${data.error}`);
      } else {
        alert(data.success);
      }
    } catch (err) {
      alert('Falha ao comunicar com o servidor PyTorch. Ele está rodando?');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch(`${getApiBase()}/api/curadoria/classes`);
        const data = await res.json();
        if (data.classes && data.classes.length > 0) {
          setOficialClasses(data.classes);
        }
      } catch (e) {
        console.warn('Could not fetch dynamic classes from backend', e);
      }
    };
    fetchClasses();
  }, []);
  useEffect(() => {
    const fetchPendingImages = async () => {
      try {
        const response = await fetch(`${getApiBase()}/api/curadoria/pending`);
        const data = await response.json();

        if (data.error) {
          console.error('Postgres Error:', data.error);
        } else {
          setItems(data);
        }
      } catch (err) {
        console.error('API Connection Error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPendingImages();
  }, []);

  const processItem = async (item: CurationItem, destinationTier: 'trash' | 'atlas' | 'quiz' | 'pure_ml') => {
    setItems(prev => prev.filter(i => i.id !== item.id));

    try {
      const finalClass = item.correct_diagnosis
        ? item.correct_diagnosis.trim()
        : item.predicted_classes.split(',')[0].trim();

      const response = await fetch(`${getApiBase()}/api/curadoria/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          image_url: item.feedback_image_url,
          class_name: finalClass,
          is_trash: destinationTier === 'trash',
          destination_tier: destinationTier,
        }),
      });
      const data = await response.json();
      if (data.error) console.error(data.error);
    } catch (err) {
      console.error('Falha ao comunicar com o servidor', err);
    }
  };

  const handleDiagnosisChange = (id: number, newClass: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, correct_diagnosis: newClass } : i));
  };

  const handleSelectChange = (id: number, value: string) => {
    if (value === 'NOVA_CLASSE') {
      setCustomClass(prev => ({ ...prev, [id]: true }));
      handleDiagnosisChange(id, ''); // Zera pra ele digitar
    } else {
      setCustomClass(prev => ({ ...prev, [id]: false }));
      handleDiagnosisChange(id, value);
    }
  };

  const handleDiscard = (item: CurationItem) => processItem(item, 'trash');
  const handleApprovePureMl = (item: CurationItem) => processItem(item, 'pure_ml');
  const handleApproveQuiz = (item: CurationItem) => processItem(item, 'quiz');
  const handleApproveAcervo = (item: CurationItem) => processItem(item, 'atlas');

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-6 animate-in fade-in">
      <div className="flex flex-col md:flex-row items-center md:justify-between gap-4 mb-8 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3 text-center md:text-left">
          <div className="p-3 bg-slate-900 text-white rounded-xl shadow-lg">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Curadoria MLOps</h2>
            <p className="text-slate-500 text-sm font-medium">Bateria de Validação de Novas Classes e Retreinamento</p>
          </div>
        </div>
        
        <div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleZipUpload} 
            accept=".zip" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-4 py-2 bg-brand-100 text-brand-700 font-bold rounded-lg hover:bg-brand-200 transition-colors disabled:opacity-50"
            title="Envie um arquivo .ZIP contendo as imagens devidamente agrupadas em Pastas."
          >
            <Download className="w-4 h-4" />
            <span>{isUploading ? "Processando Lote..." : "Upload ZIP em Lote"}</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64 text-slate-400">
          <Database className="w-8 h-8 animate-pulse" />
          <span className="ml-3 font-semibold">Conectando ao Banco de Curadoria...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center p-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
          <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-slate-700">Tudo limpo!</h3>
          <p className="text-slate-500 mt-2">Zero casos clínicos pendentes de auditoria médica.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col group">
              <div className="relative h-48 bg-slate-900 flex items-center justify-center overflow-hidden">
                <img 
                  src={item.feedback_image_url} 
                  alt="Clinical Upload" 
                  className="w-full h-full object-contain transition-transform group-hover:scale-105"
                />
              </div>
              <div className="p-5 flex flex-col flex-1">
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Classe Oficial MLOps</span>
                    {useCustomClass[item.id] && (
                      <button onClick={() => handleSelectChange(item.id, oficialClasses[0])} className="text-xs text-brand-600 font-bold hover:underline">
                        Voltar para Menu
                      </button>
                    )}
                  </div>

                  {!useCustomClass[item.id] ? (
                    <select
                      value={item.correct_diagnosis || (item.predicted_classes ? item.predicted_classes.split(',')[0].trim() : '')}
                      onChange={(e) => handleSelectChange(item.id, e.target.value)}
                      className="w-full text-base font-bold text-slate-700 bg-slate-50 border-2 border-slate-200 rounded-lg p-2 focus:border-brand-500 focus:outline-none transition-colors"
                    >
                      <option value="" disabled hidden>Selecione a Classe...</option>
                      {oficialClasses.map(cls => (
                        <option key={cls} value={cls.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}>{cls.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                      ))}
                      <option value="NOVA_CLASSE" className="font-extrabold text-brand-600">+ NOVA CLASSE/SUBCLASSE</option>
                    </select>
                  ) : (
                    <input 
                      type="text"
                      value={item.correct_diagnosis || ''}
                      onChange={(e) => handleDiagnosisChange(item.id, e.target.value)}
                      placeholder="Digite o nome da Nova Classe (ex: timpanoesclerose)"
                      className="w-full text-base font-bold text-slate-800 bg-white border-2 border-brand-300 rounded-lg p-2 shadow-inner focus:border-brand-500 focus:outline-none transition-colors"
                      autoFocus
                    />
                  )}
                </div>
                
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4 text-sm mt-2">
                  <p className="text-slate-500 mb-1"><span className="font-semibold text-slate-700">IA Previu:</span> {item.predicted_classes}</p>
                  <p className="text-slate-500 line-clamp-2"><span className="font-semibold text-slate-700">Nota:</span> {item.clinical_case}</p>
                </div>
                
                <div className="mt-auto grid grid-cols-2 md:grid-cols-4 gap-2">
                  <button 
                    onClick={() => handleDiscard(item)}
                    className="flex justify-center items-center py-2 rounded-lg font-bold text-slate-500 hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-100 text-[10px] uppercase transition-all"
                    title="Excluir (Lixo)"
                  >
                    <Trash2 className="w-3 h-3 mr-1" /> Apagar
                  </button>
                  <button 
                    onClick={() => handleApprovePureMl(item)}
                    className="flex justify-center items-center py-2 rounded-lg font-bold text-white bg-slate-800 hover:bg-slate-700 shadow-sm text-[10px] uppercase transition-all"
                    title="Apenas Kaggle"
                  >
                    🤖 Só IA
                  </button>
                  <button 
                    onClick={() => handleApproveQuiz(item)}
                    className="flex justify-center items-center py-2 rounded-lg font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm text-[10px] uppercase transition-all"
                    title="Kaggle + Quiz"
                  >
                    ❓ Pro Quiz
                  </button>
                  <button 
                    onClick={() => handleApproveAcervo(item)}
                    className="flex justify-center items-center py-2 rounded-lg font-bold text-white bg-teal-600 hover:bg-teal-500 shadow-sm text-[10px] uppercase transition-all"
                    title="Acervo + Quiz + Kaggle"
                  >
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Acervo
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
