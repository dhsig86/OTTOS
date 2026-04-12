/**
 * OTTO Atlas — Camada de Serviço de API
 *
 * Centraliza toda comunicação com o backend FastAPI (Render.com).
 * A variável VITE_AI_API_URL deve conter APENAS a URL base do servidor,
 * sem sufixos de rota. Ex: https://otto-atlas.onrender.com
 */

import { compressImage } from '../utils/imageCompressor';

export interface PredictionResult {
  class: string;
  confidence: number;
}

/**
 * Retorna a URL base limpa do backend, sem barra final nem sufixos de rota.
 * Funciona tanto em dev (localhost:8000) quanto em produção (Render.com).
 */
export function getApiBase(): string {
  const raw = import.meta.env.VITE_AI_API_URL || 'http://127.0.0.1:8000';
  // Remove sufixos herdados de versões antigas da env var
  return raw
    .replace(/\/api\/predict$/, '')
    .replace(/\/predict$/, '')
    .replace(/\/$/, '');
}

// ---------------------------------------------------------------------------
// 1. PREDIÇÃO DE IA — OTOSCOP-IA
// ---------------------------------------------------------------------------

export async function predictOtoscopyImage(file: File): Promise<PredictionResult[]> {
  console.log('Enviando imagem otimizada para análise do OTOSCOP-IA...');

  const optimizedFile = await compressImage(file);
  const formData = new FormData();
  formData.append('file', optimizedFile);

  const endpoint = `${getApiBase()}/api/predict`;

  // Timeout de 60s: o Render free tier pode estar "acordando" após inatividade
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(
        `Servidor IA indisponível (HTTP ${response.status}). Pode estar reiniciando.`
      );
    }

    const data = await response.json();
    if (data.error) throw new Error(`Erro da IA: ${data.error}`);

    return data as PredictionResult[];
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error('Erro ao chamar OTOSCOP-IA:', error);

    let errorMsg = error.toString();
    if (error.name === 'AbortError' || errorMsg.includes('abort')) {
      errorMsg =
        "O servidor de IA demorou muito (Timeout 60s). Pode estar 'acordando' da hibernação. Tente em 1 minuto!";
    }

    alert(`Atenção: Não foi possível obter o diagnóstico.\n\n${errorMsg}`);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// 2. FEEDBACK PARA RETREINAMENTO — OTOSCOP-IA → NeonDB + Cloudinary
// ---------------------------------------------------------------------------

export async function sendFeedbackToLegacySystem(
  feedbackImage: File,
  correctDiagnosis: string,
  diagnosisCorrect: string, // "yes" | "no"
  predictedClasses: string,
  differentialDiagnosis: string,
  clinicalCase: string
): Promise<boolean> {
  const endpoint = `${getApiBase()}/api/curadoria/feedback`;
  console.log(`Enviando feedback (${feedbackImage.name}) para ${endpoint}`);

  const optimizedFile = await compressImage(feedbackImage);
  const formData = new FormData();
  formData.append('feedbackImage', optimizedFile);
  formData.append('correctDiagnosis', correctDiagnosis);
  formData.append('diagnosisCorrect', diagnosisCorrect);
  formData.append('predictedClasses', predictedClasses);
  formData.append('differentialDiagnosis', differentialDiagnosis);
  formData.append('clinicalCase', clinicalCase);

  try {
    const response = await fetch(endpoint, { method: 'POST', body: formData });

    if (!response.ok) {
      throw new Error(`Falha no backend. HTTP: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Erro de conexão com o backend de feedback:', error);
    return false;
  }
}
