# Roadmap Estratégico: OTTO Atlas Gen 4.0

## Visão Geral
O objetivo da Geração 4.0 do OTTO Atlas é evoluir a plataforma para um **CMS CMS (Content Management System) Dinâmico e Escalável** voltado para educação médica avançada e otorrinolaringologia. 

A arquitetura manterá o *freeze* das rotas atuais de inferência de IA, focando os esforços em criar uma interface administrativa robusta, curadoria de alta qualidade, mapeamento interativo por SVG e armazenamento eficiente e persistente via banco de dados relacional e serviços de mídia em nuvem.

## 1. Arquitetura e Integrações
- **Frontend / Painel Administrativo:** Evolução da interface atual (Vercel, React/TypeScript) para oferecer um painel administrativo profissional de alto desempenho.
- **Banco de Dados (Neon DB / PostgreSQL):** Migração/Integração para gerenciar de forma estruturada os casos clínicos, agrupamentos taxonômicos e ontologias diagnósticas.
- **Storage de Mídia (Cloudinary / Supabase):** Otimização do upload, compressão e entrega de assets (imagens otoscópicas e vídeos) com alta fidelidade clínica e metadados FORL.
- **Inference Engine (Render):** Manutenção das rotas FastAPI de inferência em estado de *code freeze* para garantir total estabilidade clínica.

## 2. Principais Frentes e Entregáveis

### Fase 1: Fundação do CMS (Data & Storage)
- [ ] Modelagem do banco de dados (Neon DB) para a entidade `ClinicalCase`.
- [ ] Configuração do pipeline de upload e gerenciamento de mídia via Cloudinary.
- [ ] Criação das APIs CRUD no backend (segregadas das rotas de inferência) para alimentar o CMS.

### Fase 2: Painel Administrativo (Curation Hub)
- [ ] Interface para especialistas realizarem upload em massa, anotação e curadoria de exames.
- [ ] Implementação de ferramentas de revisão: aprovação/rejeição de laudos gerados, definição de ground-truth.
- [ ] Segurança e Autenticação robusta (RBAC) para diferentes perfis (Admin, Médico Validador, Residente).

### Fase 3: Interatividade e Mapeamento
- [ ] Desenvolvimento de um visualizador avançado com mapeamento e segmentação via SVG.
- [ ] Funcionalidade de marcação de achados clínicos interativos diretos na imagem/otomicroscopia.
- [ ] Integração com os modelos paramétricos visuais (OTTOSIM Vivo).

## 3. Regras e Restrições de Engenharia
- Aderência estrita à Regra Global: **"Backend (IA) em freeze por padrão"**. Transformações não alteram os core contracts.
- Frontend Clínico: PWA-safe, responsivo, e segurança operacional.
- Cada nova feature deverá ser acompanhada por um "Resumo Executivo" e validações de QA/QC clínicos.

---

*Nota: Esse é um documento vivo que será atualizado conforme avançamos nos ciclos de sprints do projeto.*
