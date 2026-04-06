/**
 * Serviço de Integração com o Backend OTTO e Legado (OtoscopIA)
 * O ML roda isolado na fábrica (ml_pipeline), mas este frontend 
 * precisa se comunicar com o banco de dados e com a IA.
 */

// O novo padrão React Vite para Variaveis de Ambiente é usar import.meta.env
const API_URL = import.meta.env.VITE_AI_API_URL;

export interface PredictionResult {
  class: string;
  confidence: number;
}

// 1. Predição de IA (Integração Direta com Servidor PyTorch / FastAPI)
export async function predictOtoscopyImage(file: File): Promise<PredictionResult[]> {
  console.log('Enviando imagem para análise da IA REAL via FastAPI...', file);
  
  const formData = new FormData();
  formData.append('file', file);
  
  // Usamos localhost em dev, mas na nuvem hospedamos o backend Python
  const aiEndpoint = import.meta.env.VITE_AI_API_URL || 'http://127.0.0.1:8000/api/predict';
  
  // Timeout agressivo de 60 segundos para evitar spinner infinito no Frontend 
  // (Caso o Render free tier esteja acordando ou sofrendo deploy 502/Timeout)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);
  
  try {
    const response = await fetch(aiEndpoint, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Servidor AI Indisponível (HTTP ${response.status}). Pode estar reiniciando ou atualizando.`);
    }
    
    const data = await response.json();
    if (data.error) {
       throw new Error(`Erro da IA: ${data.error}`);
    }
    return data as PredictionResult[];
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error("Erro ao chamar a API do OTOSCOP-IA:", error);
    
    let errorMsg = error.toString();
    if (error.name === 'AbortError' || errorMsg.includes('abort')) {
       errorMsg = "O servidor de IA demorou muito para responder (Timeout de 60s). Ele pode estar 'acordando' da hibernação (limite do servidor gratuito). Tente novamente em 1 minuto!";
    }
    
    alert(`Atenção: Não foi possível obter o diagnóstico. Detalhes: \n\n${errorMsg}`);
    throw error;
  }
}

// 2. Envio de Feedback para Re-treinamento (Local/Render -> Cloudinary + Postgres Neon)
export async function sendFeedbackToLegacySystem(
  feedbackImage: File,
  correctDiagnosis: string,
  diagnosisCorrect: string, // "yes" ou "no"
  predictedClasses: string,
  differentialDiagnosis: string,
  clinicalCase: string
): Promise<boolean> {
  const endpoint = `${import.meta.env.VITE_AI_API_URL.replace('/predict', '')}/curadoria/feedback`;
  console.log(`Enviando imagem ${feedbackImage.name} nativamente para ${endpoint}`);
  
  const formData = new FormData();
  formData.append('feedbackImage', feedbackImage); // Arquivo (File/Blob)
  formData.append('correctDiagnosis', correctDiagnosis);
  formData.append('diagnosisCorrect', diagnosisCorrect);
  formData.append('predictedClasses', predictedClasses);
  formData.append('differentialDiagnosis', differentialDiagnosis);
  formData.append('clinicalCase', clinicalCase);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Falha no Backend Nativo. HTTP: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error('Erro de conexão com o backend Nativo', error);
    return false;
  }
}
