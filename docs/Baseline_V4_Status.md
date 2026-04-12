# Baseline OTTO Atlas Gen 4.0 - Status Funcional

> [!IMPORTANT]  
> Este documento representa o **Baseline Oficial** do estado funcional e arquitetônico da plataforma OTTO Atlas (V4.1). Nenhuma alteração estrutural deve ser feita sem validação cruzada para garantir a estabilidade atual.

## 1. Arquitetura Consolidada e Desbloqueadores

O ecossistema V4 atingiu estabilidade através das seguintes implementações definitivas:

*   **Frontend (Vercel)**:
    *   Sincronizado via GitHub. O projeto oficial agora é o `otto-atlas-web`.
    *   Exclusão total do escopo de backend (Python) da esteira de compilação usando `.vercelignore` e `vercel.json`.
    *   Uso de variáveis de ambiente corretas prevenindo quebras de integração local x nuvem.
*   **Backend (Render Starter)**:
    *   O Gargalo Histórico da IA superado: O modelo ONNX (83MB) não cabia no GitHub e falhava via serviços terciários. O problema foi isolado movendo o modelo permanentemente para o **Disk Persistente do Render (`/var/data`)**. 
    *   *Lazy Loading*: A rota do FastAPI levanta incrivelmente rápida porque o modelo matemático só é instanciado na memória RAM durante a primeira requisição real do usuário.
*   **Gestão de Dados**:
    *   **NeonDB (PostgreSQL)** como Source-of-Truth dos casos clínicos.
    *   **Cloudinary** como CDN autônoma de mídia cirúrgica (substituindo caminhos estáticos por nuvem escalável).

## 2. Garantias de Manutenção 

Pilares blindados do projeto:
1.  **Tipagem Estrita (TypeScript)**: Componentes agora ativam recusa de build no caso de importações fantasma ou variáveis perdidas. Se der deploy, é porque o código é cirurgicamente seguro e rastreável.
2.  **Ambiente OS Automático**: Todas as chaves do ONNX leem o disco do Render sem chumbamento de caminho local.

---

## 3. Road-map para a Gen 5.0 (Evolução em Tempo Real Integrada OTO-WIFI)

Em virtude do patamar V4 atingido, o próximo desafio reside em quebrar a barreira estática e interagir com fluxos de vídeo em Tempo Real (Real-time Video Inference). 

> [!TIP]
> **Vértices de Evolução para o "OTOSCOP-IA Realtime" (Sumatosima Approach)**

**1. Inferência na Ponta (Edge AI via WebAssembly)** 
O modelo ONNX atual não precisa residir apenas no servidor Render. Com `ONNXRuntime-Web`, rodaremos os cálculos diretamente e offline no navegador Google Chrome / Safári do médico, absorvendo inferências frame a frame instantaneamente.

**2. Detecção Híbrida e Mapas (Bounding Boxes)**
Mapeamento em radar: a câmera encontra o Martelo, a Borda Timpânica, Mancha Luminosa e desenha a geometria (como nos testes nativos V4) visualmente na tela ao vivo, permitindo ao médico localizar estruturas com Realidade Aumentada.

**3. Integração de Hardware Universal**
Uso avançado da API Nativa de `WebRTC` (MediaDevices) para permitir que a placa do computador capture diretamente feed USB de Otoscópios Digitais padrão ou câmeras Mobile Wifi, ignorando completamente passos frustrantes de "Salvar imagem e Fazer Upload". A predição acontecerá ao vivo enquanto ele vasculha a membrana timpânica.
