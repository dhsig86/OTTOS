# OTTO Atlas — Guia de Deploy no Render.com

## Estrutura do Serviço

| Componente | Plataforma | Origem |
|---|---|---|
| Frontend React/Vite | Vercel | `otto-atlas-web/` (raiz do repo) |
| Backend FastAPI | Render.com | `otto-atlas-web/ml_pipeline/` |
| Banco de Dados | NeonDB (PostgreSQL) | Variável de ambiente `DATABASE_URL` |
| Mídia (imagens) | Cloudinary | Variável de ambiente `CLOUDINARY_URL` |

---

## Configuração do Serviço no Render

### Tipo: **Web Service**
- **Root Directory:** `otto-atlas-web` (ou raiz, se o repo for só este diretório)
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn ml_pipeline.main:app --host 0.0.0.0 --port $PORT`

### Variáveis de Ambiente (Render Dashboard → Environment)
```
DATABASE_URL=postgresql://neondb_owner:...@ep-...neon.tech/neondb?sslmode=require
CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
```

---

## Modelo ONNX — Estratégia de Deploy

O arquivo `otto_model.onnx` (83 MB) **NÃO está no repositório Git** (excluído pelo `.gitignore`).

### Opção A — Render Disk (Recomendada para produção)
1. No Render: criar um **Disk** de 1 GB associado ao serviço
2. Montar em `/opt/render/project/src/ml_pipeline/models`
3. Fazer upload manual do `.onnx` e `vocab.txt` via Render Shell ou rsync

### Opção B — Download na Inicialização
Adicionar um script de startup que baixa o modelo de um URL seguro (Cloudinary, S3, etc.) antes de iniciar o uvicorn.

### Opção C — Git LFS (Alternativa mais simples a curto prazo)
```bash
git lfs install
git lfs track "*.onnx"
git add .gitattributes ml_pipeline/models/otto_model.onnx
git commit -m "feat: adiciona modelo via Git LFS"
git push
```
> ⚠️ Git LFS gratuito tem limite de 1 GB/mês de bandwidth.

---

## Verificação Pós-Deploy

1. `GET https://otto-atlas.onrender.com/api/cms/cases` → deve retornar `{"success": true, "cases": [...]}`
2. `POST https://otto-atlas.onrender.com/api/predict` (com imagem) → deve retornar top-3 classes
3. `GET https://otto-atlas.onrender.com/api/curadoria/pending` → deve retornar lista do feedback
4. Frontend Vercel → Acervo carrega sem erro de CORS ou URL 404

---

## Notas de Segurança
- O arquivo `.env` **nunca** vai para o Git (excluído pelo `.gitignore`)
- Variáveis de produção são configuradas **apenas no dashboard do Render/Vercel**
- O banco NeonDB usa `sslmode=require` por padrão (já configurado no código)
