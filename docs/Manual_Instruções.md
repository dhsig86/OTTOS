Manual de Operações: OTTO Atlas e MLOps
Este documento é a referência definitiva para a manutenção diária, treinamento e execução das duas pontas do ecossistema OTTO: o Front-end React e o Motor de IA Python.

1. Comandos de Rotina e Execução (Inicialização)
Seu sistema exige que duas instâncias rodem em paralelo quando operando em ambiente de Desenvolvimento Local.

Iniciar o Aplicativo Web (React / Front-end)
Abra um terminal do PowerShell via VSCode.
Navegue até a pasta: cd C:\Users\drdhs\OneDrive\Documentos\ottoatlas\otto-atlas-web
Execute:
bash
npm run dev
O app estará em http://localhost:5173.
Iniciar o Motor de IA MLOps (FastAPI Backend)
Abra um segundo terminal do PowerShell.
Navegue até a pasta MLOps: cd C:\Users\drdhs\OneDrive\Documentos\ottoatlas\otto-atlas-web\ml_pipeline
Exija a ativação do ambiente virtual:
bash
.\venv\Scripts\Activate.ps1
Dispare o motor na porta 8000:
bash
python -m uvicorn main:app --reload --port 8000
O console exibirá: Application startup complete.
2. Como usar o Hotspot Studio (Mapeamento SVG)
O Atlas possui uma ferramenta nativa hiper-secreta de demarcação anatômica (Polígonos Geométricos).

Acesse o Atlas no Chrome (localhost:5173).
Clique na Patologia alvo (ex: OMA Viral).
No topo e canto esquerdo superior do pop-up, clique no Cadeado Cinza.
A senha mestre de acesso administrativo é: 020786da.
A caixa de ferramentas abrirá. Clique em Novo Polígono.
Conecte os cliques ao redor da estrutura patológica da foto atual. Quando chegar perto do primeiro clique, a malha se fecha. Ele pedirá o "Nome Clínico" da lesão.
O sistema prenderá isso à Foto. Ao terminar as fotos, clique no topo em Exportar Geometria.
Um código JSON será colado no seu controle do PC. Você pode mandar para a base de desenvolvimento arquivar ou adicionar nos bancos permanentemente.
TIP

Flexibilidade de Extensão: As imagens inseridas na pasta public/images/atlas_v3 suportam 
.jpg
, 
.png
 e .jpeg sem você precisar se preocupar com código!

3. Gestão e Treinamento de Inteligência Artificial
O Motor do aplicativo é mantido rigorosamente isolado na pasta interna ml_pipeline.

Operação Automática (Auto-Tagger)
Para classificar milhares de fotos recentes sem apertar nada:

Ligue a máquina MLOps FastAPI.
Execute o script cego: python auto_tagger.py.
Ele rastreará sua pasta de Otoscopio 2026/IMG e registrará predições no Banco de Dados em PostgreSQL.
No React, acesse a Rota de Curadoria Protegida para chancelar ou rejeitar as descobertas.
Treinamento Oficial Novo de Rede Neural (Retreino do ResNet18)
Sempre que possuir novas imagens definitivas validadas:

Garanta que as imagens estejam espalhadas por Pastas Clínicas (Nome das Pastas = Nome das Classes) dentro do Novo Diretório Unificado. (Ver Guia de Infraestrutura do Dataset).
Execute no PowerShell do ML:
bash
python train_model.py
O ResNet lerá as pastas, aplicará FastAI Splitter e reescreverá fisicamente o peso atualizado na raiz: models/otto_diagnostic_model.pkl.