# OTTO Atlas — Guia de Deploy no Render.com (Starter Plan)

## Arquitetura de Produção

| Componente | Plataforma | Plano |
|---|---|---|
| Frontend React/Vite | Vercel | Free |
| Backend FastAPI (OTTO Engine) | Render.com | **Starter ($7/mês)** |
| Banco de Dados | NeonDB (PostgreSQL) | Free (0.5 GB) |
| Mídia (imagens otoscópicas) | Cloudinary | Free (25 GB) |
| Modelo ONNX (83 MB) | Render Disk | **Incluído no Starter** |

---

## Passo a Passo: Configurar o Web Service no Render

### 1. Criar o Web Service
- Tipo: **Web Service**
- Conectar ao repositório: `ottoatlas/otto-atlas-web`
- **Root Directory:** deixar em branco (o `requirements.txt` está na raiz)
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn ml_pipeline.main:app --host 0.0.0.0 --port $PORT`
- **Region:** `US East (Ohio)` ou o mais próximo do NeonDB

### 2. Variáveis de Ambiente
No painel do serviço → **Environment** → adicionar:

```
DATABASE_URL=postgresql://neondb_owner:...@ep-...neon.tech/neondb?sslmode=require
CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
```

> ⚠️ Copie os valores exatos do arquivo `.env` local. Nunca commite o `.env` no Git.

### 3. Adicionar o Disk (Starter obrigatório)
No painel do serviço → **Disks** → **Add Disk**:

| Campo | Valor |
|---|---|
| Name | `otto-model-disk` |
| Mount Path | `/opt/otto_models` |
| Size | `1 GB` (suficiente para o ONNX + futuras versões) |

---

## Subir o Modelo ONNX para o Render Disk

Após o primeiro deploy com o Disk montado, use o **Render Shell** (Dashboard → Shell):

```bash
# No Render Shell:
# 1. Verificar o ponto de montagem
ls /opt/otto_models

# 2. Baixar o modelo do Cloudinary (upload manual primeiro)
# OU copiar via curl se você hospedar o .onnx em algum lugar temporário
curl -o /opt/otto_models/otto_model.onnx "URL_DO_SEU_ONNX"
echo "CERUME OBSTRUCAO
NAO OTOSCOPICA
NORMAL
OTITE EXTERNA AGUDA
OTITE MEDIA AGUDA
OTITE MEDIA CRONICA
OTITE MEDIA SEROSA
TIMPANOESCLEROSE
TUBO DE VENTILACAO" > /opt/otto_models/vocab.txt
```

---

## Atualizar o Caminho do Modelo no Backend

Após configurar o Disk em `/opt/otto_models`, ajustar a função `lazy_load_model()` no `main.py` para usar o Disk em produção:

```python
def lazy_load_model():
    global ort_session, vocab
    if ort_session is not None:
        return

    import onnxruntime as ort

    # Em produção (Render Disk), o modelo fica em /opt/otto_models
    # Em desenvolvimento local, fica em ml_pipeline/models/
    RENDER_DISK_PATH = "/opt/otto_models"
    LOCAL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")

    BASE_DIR = RENDER_DISK_PATH if os.path.exists(RENDER_DISK_PATH) else LOCAL_PATH
    model_path = os.path.join(BASE_DIR, "otto_model.onnx")
    vocab_path = os.path.join(BASE_DIR, "vocab.txt")
    # ... resto do código igual
```

> ✅ Esta mudança é backward-compatible: em dev local continua usando `ml_pipeline/models/`.

---

## Checklist de Verificação Pós-Deploy

```
[ ] GET  https://otto-atlas.onrender.com/               → 200 ou 404 OK (não 502)
[ ] GET  https://otto-atlas.onrender.com/api/cms/cases  → {"success": true, "cases": [...]}
[ ] POST https://otto-atlas.onrender.com/api/predict    → top-3 classes otoscópicas
[ ] POST https://otto-atlas.onrender.com/api/curadoria/donate → {"success": true}
[ ] GET  https://otto-atlas.onrender.com/api/curadoria/pending → lista de pendentes
[ ] Frontend Vercel → Acervo carrega imagens do Cloudinary sem erro CORS
```

---

## Notas Importantes

- O Disk do Render **persiste entre deploys** — você não perde o modelo ao fazer push de código
- A RAM do Starter (512 MB) é suficiente: o modelo ONNX (83 MB) + FastAPI usa ~200-300 MB com lazy load
- O Starter tem **SLA de uptime** — sem hibernação de 15 minutos como no Free tier
- Custo estimado: $7/mês (Web Service Starter) + $0.25/mês (Disk 1 GB) = **~$7.25/mês**
