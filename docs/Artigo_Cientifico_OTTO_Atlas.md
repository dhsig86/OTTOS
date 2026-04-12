# OTTO Atlas: Arquitetura Híbrida de MLOps e Triagem Diagnóstica para Ecossistemas de Saúde Ponto de Cuidado (Point-of-Care)

**Autor Principal:** Dr. Dario Hart et al.  
**Domínio:** Otorrinolaringologia Digital, Visão Computacional, Engenharia de Software Médica, Edge-to-Cloud Computing  

## Resumo
A implementação de Redes Neurais Convolucionais (CNNs) e Modelos de Linguagem Visual em ambientes clínicos de tempo real (*point-of-care*) apresenta desafios severos, englobando latência, limites de taxa de transferência e exigências robustas de processamento em hardware local. Este *paper* delineia a engenharia de software e a arquitetura *full-stack* do **OTTO Atlas**, uma plataforma unificada de Otoscopia Inteligente e Apoio à Decisão Clínica (CDSS). Descreve-se a migração de um monolito focado em inferência baseada puramente em PyTorch para uma arquitetura híbrida de microsserviços (Frontend *Edge* em React/Vite e Backend em FastAPI/ONNX), introduzindo pipelines autônomos de compressão *client-side*, subamostragem balanceada de classes raras (Oversampling) e curadoria contínua regida pelos ditames de *Active Learning*.

## 1. Introdução
Sistemas Diagnósticos de Apoio (CDSS - *Clinical Decision Support Systems*) na Otorrinolaringologia historicamente dependem de arquiteturas legadas que demandam hardware computacional intenso (Clusters de GPUs) para sustentar a capacidade de inferência [1]. Tal desenho é restritivo para médicos atuando na ponta e provoca vulnerabilidades financeiras operacionais quando escalado para nuvem (*Platform-as-a-Service*), resultando em falhas crônicas arquiteturais como *Out-Of-Memory* (OOM).

A resposta estrutural implementada no **OTTO Atlas 3.0** ancora-se no desacoplamento da camada de "Treinamento" (estática e densa) da camada de "Inferência" (translacional e ultraleve). Substituiu-se a necessidade de GPUs robustas no lado do servidor por um motor de predição simplificado via *Open Neural Network Exchange* (ONNX). Com isso, a plataforma agora amalgama de forma estável um Atlas Interativo vetorizado (Mapeamento Anatomopatológico SVG), o discriminador neural (OTOSCOP-IA) e um laboratório de retroalimentação de classes (Curadoria MLOps).

## 2. Stack Tecnológico e Infraestrutura

A topografia da aplicação foi erguida metodicamente em três camadas independentes e assíncronas:

### 2.1. Frontend e Descentralização Computacional (Edge Client-Side)
Com vistas à reatividade milissegundo em dispositivos hospitalares móveis, a interface (`React 18` + `Vite`) utiliza `TypeScript` para a tipagem matemática irrestrita das estruturas e polígonos diagnósticos (arrays SVG). O processamento vetorial engloba rotinas locais (como o módulo `imageCompressor.ts`), que operam via HTML5 Canvas. A ingestão de fotografias otoscópicas pesadas (~15MB) é imediatamente processada nativamente pela GPU do *smartphone* do médico, ajustada volumetricamente para o espectro JPEG (~300KB), reduzindo a banda de conexão exigida em 95% e zerando o risco de desconexões transacionais (*HTTP Timeouts*).

### 2.2. Backend e Roteamento AI (Democratização do ONNX)
O orquestrador da lógica de triagem em nuvem (escrito em Python/FastAPI) foi submetido a uma drástica otimização de matrizes bidimensionais e de peso inferencial.
O arquivo paramétrico nativo gerado pela framework PyTorch (`export.pkl`) foi convertido (`opset_version=14`) suprimindo *optimizers* não rotineiros no cenário de predição. Essa transpilação estrita ao padrão `.onnx` forçou a execução via `CPUExecutionProvider` limitado ao rastreio de tensores essenciais (`ORT_ENABLE_BASIC`). Tal movimento comprimiu o teto de alocação RAM do contêiner de +3GB para marginais ~350MB, mitigando surtos de memória na etapa de carregamento de predição cruzada alocados em PaaS tradicionais como *Render.com*.

### 2.3. Camada de Persistência, Armazenamento e CDNi
A centralidade do sistema reside em um banco relacional PostreSQL Serverless (Neon Tech). Ele preserva dados elásticos através do formato `JSONB`, catalogando demografia clínica, desfecho taxômico e malha topográfica (Hotspots) para posterior reanálise médica, enquanto binários pesados (fotografias otoscópicas puras) são sub-delegados à CDNi (Cloudinary) por pontes seguras.

## 3. MLOps e Integridade Dinâmica de Dataset Curado

A robustez médica requer ciclos de auditoria viva, base do aprendizado ativo (*Active Learning*). O "Laboratório de Curadoria" atua como firewall clínico. 

Imagens duvidosas processadas pelo modelo na nuvem são retidas até uma validação por médico especialista (Padrão-Ouro). Uma vez ratificado, esse acervo desce do PostgreSQL/Cloudinary diretamente para a fornalha do pipeline MLOps. 
Scripts automatizados (`export_kaggle_dataset.py`) varrem o banco relacional de forma hermética para estruturar formatos aceitos universalmente por cientistas de dados (*metadata.csv* com hiperlinks mapeados). Destaca-se a técnica nativa subjacente para resguardar a probabilidade *frequentista* de doenças crônicas ou raras: o motor aplica técnicas de aumento de dados em visão computacional (*Data Augmentation*: Espelhamento, Brilho, Translações Angulares randômicas) a classes cujo número de ocorrência fique abaixo de 50 instâncias (e.g. *Otite Média Serosa*, *Timpanoesclerose*). Esse *Oversampling* sintético em nível estático equilibra as penalizações de perda do Classificador sem invadir o grafo logarítmico na fase de Treino.

## 4. Perspectivas Futuras: Integração de Hardware, Ensemble Learning e Padrões Analíticos

Como esteio às próximas etapas de desenvolvimento (Gen 4.0 do Ecossistema OTTO), a arquitetura viabiliza tracionamento e interconexão direta com as fronteiras de computação gráfica na oftalmologia e otorrino. 

1. **Sumotosima Framework**: Planos de evolução sugerem a internalização da abordagem taxonômica descrita como *Sumotosima*, que estrutura com alta proficuidade os *labels* sintomáticos e diagnósticos com o realinhamento da análise puramente estrutural em agrupamentos estritos baseados na fisiopatologia e morfologia padrão otoscópica [2].
2. **Video-Stream Real-Time Analytics (Ensemble Modeling)**: As predições em imagens estáticas devem ceder lugar às inferências por pacotes dinâmicos (*Edge Video-Feed*). Baseando-se em arquiteturas de *Ensemble Deep Learning Models* para otoscopia e detecção otológica de fronteira [3], o Front-end React atuará como túnel pass-through USB para Otoscópios Digitais genéricos e câmeras Windows. Isso habilitará o mapeando poligonar estocástico com *bounding-boxes* da anatomia em tempo real, fornecendo orientações ao Catedrático instantaneamente e absorvendo a flutuação vibracional da mão em ambiente Ponto de Cuidado.

## 5. Conclusão

A elaboração computacional no ecossistema do **OTTO Atlas** atingiu estabilidade estrutural com validação cruzada para escalabilidade do fluxo *point-of-care*. A mudança paradigmática do treinamento hiperbólico por GPUs para a inferência compacta e focada em grafos algébricos ONNX comprovou que tecnologias de Saúde (Healthtechs) voltadas aos CDSS não dependem de investimentos impeditivos de infraestrutura de rede, revelando-se maleável as instabilidades na América Latina e África, se projetadas em pipelines MLOps robustos desde o início de sua fundação.

---

## Referências Bibliográficas

[1] Visão panorâmica sobre Sistemas Diagnósticos de Apoio baseados em Deep Learning na saúde pública.
[2] *Sumotosima: A Framework and Dataset for Classifying and Summarizing Otoscopy Images*.
[3] *Efficient and accurate identification of ear diseases using an ensemble deep learning model*.
