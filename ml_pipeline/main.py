from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
import os
import pathlib
import cloudinary
import cloudinary.uploader
import onnxruntime as ort
import numpy as np
from PIL import Image
import io

def get_database_url():
    env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            for line in f:
                if line.startswith("DATABASE_URL="):
                    return line.strip().split("=", 1)[1]
    return os.environ.get("DATABASE_URL")

def setup_cloudinary():
    env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
    c_url = os.environ.get("CLOUDINARY_URL")
    if not c_url and os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.startswith("CLOUDINARY_URL="):
                    c_url = line.strip().split("=", 1)[1]
                    break
    if c_url:
        os.environ["CLOUDINARY_URL"] = c_url
        try:
            url_no_prefix = c_url.replace("cloudinary://", "")
            api_key, rest = url_no_prefix.split(":", 1)
            api_secret, cloud_name = rest.split("@", 1)
            cloudinary.config(cloud_name=cloud_name, api_key=api_key, api_secret=api_secret)
            return True
        except Exception:
            return False
    return False

app = FastAPI(title="OTOSCOP-IA Engine", description="FastAPI Backend for ONNX Runtime")

# Permitir o Frontend React (localhost:5173 e Prod)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Variaveis de Memória Ultraleves (Apenas ONNX Session e Array de Strings)
ort_session = None
vocab = []

@app.on_event("startup")
async def load_model():
    global ort_session, vocab
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(BASE_DIR, "models", "otto_model.onnx")
    vocab_path = os.path.join(BASE_DIR, "models", "vocab.txt")
    print("Iniciando motor híbrido ultraleve ONNX...")
    
    if os.path.exists(model_path) and os.path.exists(vocab_path):
        try:
            with open(vocab_path, "r", encoding="utf-8") as f:
                vocab = [line.strip() for line in f if line.strip()]
            
            # Carrega a Sessão de Inferência ONNX (Evapora 95% do uso de RAM do PyTorch) 
            ort_session = ort.InferenceSession(model_path, providers=['CPUExecutionProvider'])
            print(f"Sucesso Crítico! Cérebro ONNX Carregado. Vocabulário: {vocab}")
        except Exception as e:
            print(f"Erro Fatal ONNX: {e}")
    else:
        print(f"Alerta: Arquivos ONNX ou Vocab não encontrados.")

@app.post("/api/predict")
async def predict_image(file: UploadFile = File(...)):
    if not ort_session or not vocab:
        return {"error": "O cérebro ONNX não está carregado. Verifique os logs do servidor."}
    
    contents = await file.read()
    
    try:
        # Pre-processamento rigoroso de imagens matriciais ao estilo FastAI (3x224x224 RGB)
        img = Image.open(io.BytesIO(contents)).convert("RGB")
        img = img.resize((224, 224), Image.Resampling.BILINEAR)
        
        # Desmontando Imagem para Tensores Float Baseados em [0..1]
        img_arr = np.array(img).astype(np.float32) / 255.0
        
        # ImageNet Normalization Padrão do PyTorch
        mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
        img_arr = (img_arr - mean) / std
        
        # O PyTorch Treinou como [Channels, Height, Width]! Então o eixo da Imagem precisa virar
        img_arr = np.transpose(img_arr, (2, 0, 1))
        # Fabricar Lote [Batch(=1), Channels(=3), Height(=224), Width(=224)]
        input_tensor = np.expand_dims(img_arr, axis=0)
        
        # Roda inferência de C++ Nativo (Milissegundos)
        inputs = {ort_session.get_inputs()[0].name: input_tensor}
        logits = ort_session.run(None, inputs)[0][0]
        
        # Calibragem matemática Softmax (Distribuição Probabilística de 0 a 1)
        exp_L = np.exp(logits - np.max(logits))
        probs = exp_L / np.sum(exp_L)
        
        def clean_name(name):
            return name.replace("-samples", "").replace("_", " ").title() if name.islower() else name.replace("-samples", "").replace("_", " ")
        
        # Combina classes com probabilidades e ordena
        predictions = [{"class": clean_name(str(v)), "confidence": float(p)} for v, p in zip(vocab, probs)]
        predictions.sort(key=lambda x: x["confidence"], reverse=True)
        
        return predictions[:3]
        
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return {"error": f"Falha na inferência estrutural ONNX: {str(e)}"}

@app.get("/api/curadoria/pending")
def get_pending_feedback():
    db_url = get_database_url()
    if not db_url:
        return {"error": "Database URL not found"}
    
    try:
        conn = psycopg2.connect(db_url, sslmode='require')
        cur = conn.cursor()
        cur.execute("""
            SELECT id, feedback_image_url, correct_diagnosis, diagnosis_correct, predicted_classes, clinical_case
            FROM feedback
            ORDER BY id DESC LIMIT 50
        """)
        rows = cur.fetchall()
        
        results = []
        for r in rows:
            results.append({
                "id": r[0],
                "feedback_image_url": r[1],
                "correct_diagnosis": r[2],
                "diagnosis_correct": r[3],
                "predicted_classes": r[4],
                "clinical_case": r[5]
            })
            
        cur.close()
        conn.close()
        return results
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/curadoria/upload-zip")
async def process_zip_upload(file: UploadFile = File(...)):
    import zipfile
    import shutil
    import time
    import unicodedata
    import re
    
    def normalize_class_name(name: str) -> str:
        # Remove acentos
        n = ''.join(c for c in unicodedata.normalize('NFD', name) if unicodedata.category(c) != 'Mn')
        # Remove caracteres especiais, exceto underline
        n = re.sub(r'[^a-zA-Z0-9\s_]', '', n)
        # Força padrão snake_case ("Otite Media Serosa" -> "otite_media_serosa")
        return '_'.join(n.lower().split())

    if not file.filename.lower().endswith('.zip'):
        return {"error": "Por segurança, a rota de ingestão bulk aceita exclusivamente formato .zip."}
    
    # 1. Salvar na memória temporária para processamento
    temp_zip = f"temp_ingest_{int(time.time())}.zip"
    with open(temp_zip, "wb") as f:
        f.write(await file.read())
        
    try:
        # Aponte fixo para a raiz mestre de curadoria bruta
        base_dir = r"C:\Users\drdhs\OneDrive\Documentos\ottoatlas\OTTO_ML_Dataset_Raw"
        processed_count = 0
        new_classes = set()
        
        with zipfile.ZipFile(temp_zip, 'r') as zip_ref:
            # Navegar pelas entranhas do Zip file buscando imagens soltas nas sub-pastas
            for member in zip_ref.namelist():
                # Proteção contra diretórios fantasmas (Mac/Linux hooks)
                if member.endswith('/') or '__MACOSX' in member or '.DS_Store' in member:
                    continue
                
                parts = member.split('/')
                # A imagem tem que vir dentro de pelo menos uma "Pasta / Imagem"
                if len(parts) >= 2:
                    raw_class_name = parts[-2].strip()
                    file_name = parts[-1].strip()
                    
                    if not file_name: continue
                    
                    class_name = normalize_class_name(raw_class_name)
                    class_dir = os.path.join(base_dir, class_name)
                    if not os.path.exists(class_dir):
                        os.makedirs(class_dir, exist_ok=True)
                        new_classes.add(class_name)
                    
                    dest_file = os.path.join(class_dir, file_name)
                    
                    # Estratégia Anti-Colisão (Overwrite protection)
                    if os.path.exists(dest_file):
                        name, ext = os.path.splitext(file_name)
                        dest_file = os.path.join(class_dir, f"{name}_auto_{int(time.time()*1000)}{ext}")
                    
                    with zip_ref.open(member) as source, open(dest_file, "wb") as target:
                        shutil.copyfileobj(source, target)
                        processed_count += 1
                        
        os.remove(temp_zip)
        
        msg = f"Sucesso Crítico! {processed_count} imagens integradas ao HD."
        if new_classes:
            msg += f" O Modelo ganhou classes inéditas: {', '.join(new_classes)}."
            
        return {"success": msg}
        
    except Exception as e:
        if os.path.exists(temp_zip):
            os.remove(temp_zip)
        return {"error": f"Falha catastrófica ao processar lote: {str(e)}"}

@app.get("/api/curadoria/classes")
def get_dynamic_classes():
    """
    Rastreia dinamicamente o Vocabulário Oficial do Modelo + Quaisquer Pastas Novas 
    criadas via Front-End que ainda não foram treinadas. Retorna a lista integral!
    """
    raw_dir = r"C:\Users\drdhs\OneDrive\Documentos\ottoatlas\OTTO_ML_Dataset_Raw"
    train_dir = r"C:\Users\drdhs\OneDrive\Documentos\ottoatlas\OTTO_ML_Dataset\TRAIN"
    
    classes = set()
    global vocab
    if vocab:
        classes.update(vocab)
        
    if os.path.exists(raw_dir):
        for d in os.listdir(raw_dir):
            if os.path.isdir(os.path.join(raw_dir, d)):
                classes.add(d)
                
    if os.path.exists(train_dir):
        for d in os.listdir(train_dir):
            if os.path.isdir(os.path.join(train_dir, d)):
                classes.add(d)
                
    return {"classes": sorted(list(classes))}

@app.post("/api/curadoria/approve")
async def approve_image(payload: dict):
    '''
    Recebe imagem da aba de Curadoria, Remove do Banco (marcando como visto),
    e se aprovada, Baixa do Cloudinary direto pra pasta de Treino e Normaliza.
    '''
    import requests
    import time
    import unicodedata
    import re
    import shutil
    
    def normalize_class_name(name: str) -> str:
        n = ''.join(c for c in unicodedata.normalize('NFD', name) if unicodedata.category(c) != 'Mn')
        n = re.sub(r'[^a-zA-Z0-9\s_]', '', n)
        return '_'.join(n.lower().split())
        
    try:
        record_id = payload.get("id")
        image_url = payload.get("image_url")
        class_name = payload.get("class_name")
        is_trash = payload.get("is_trash", False)
        
        # 1. Apagar da fila de Pendentes no PostgreSQL Legado
        db_url = get_database_url()
        if db_url and record_id:
            conn = psycopg2.connect(db_url, sslmode='require')
            cur = conn.cursor()
            # Deletamos pra não poluir mais a caixa de entrada da curadoria
            cur.execute("DELETE FROM feedback WHERE id = %s", (record_id,))
            conn.commit()
            cur.close()
            conn.close()
            
        if is_trash:
            return {"success": "Caso Lixo descartado da base."}
            
        # 2. Se Aprovado: Fazer Download físico do Cloudinary para o Cérebro OU mover arquivo Local
        norm_class = normalize_class_name(class_name) if class_name else "Unknown"
        base_dir = r"C:\Users\drdhs\OneDrive\Documentos\ottoatlas\OTTO_ML_Dataset_Raw"
        class_dir = os.path.join(base_dir, norm_class)
        os.makedirs(class_dir, exist_ok=True)
        
        if image_url.startswith("/"):
            # É um arquivo local gerado pelo auto_tagger.py
            src_file = os.path.join(os.path.dirname(__file__), "..", "public", image_url.lstrip("/"))
            if os.path.exists(src_file):
                dest_file = os.path.join(class_dir, f"curada_local_{int(time.time()*1000)}.jpg")
                shutil.copy2(src_file, dest_file)
                try:
                    os.remove(src_file) # Limpa a caixa de entrada
                except:
                    pass
                return {"success": f"Local Imagem salva no Acervo: {norm_class}"}
            else:
                return {"error": "A imagem local não foi encontrada no disco."}
        else:
            # É uma URL oficial do Cloudinary
            response = requests.get(image_url)
            if response.status_code == 200:
                dest_file = os.path.join(class_dir, f"curada_{int(time.time()*1000)}.jpg")
                with open(dest_file, "wb") as f:
                    f.write(response.content)
                return {"success": f"Cloud Imagem salva no Acervo: {norm_class}"}
            else:
                return {"error": "Falha ao baixar do Cloudinary."}
            
    except Exception as e:
        return {"error": str(e)}

from fastapi import Request
from typing import List, Optional

@app.post("/api/curadoria/donate")
async def donate_image(request: Request):
    form = await request.form()
    files = form.getlist("files")
    if not files:
        # Fallback agressivo para clientes com cache antigo rodando offline via SW
        files = form.getlist("file")
        
    diagnostic = form.get("diagnostic", "Desconhecido")
    clinical_case = form.get("clinical_case", "")
    
    if not files:
        return {"error": "Nenhum arquivo de imagem foi enviado ou reconhecido pelo servidor."}
    if not setup_cloudinary():
        return {"error": "Credenciais do Cloudinary malformadas."}
        
    db_url = get_database_url()
    
    if not db_url:
        return {"error": "Banco de Dados não configurado no Servidor."}
        
    try:
        conn = psycopg2.connect(db_url, sslmode='require')
        cur = conn.cursor()
        import json
        
        uploaded_urls = []
        for file in files:
            contents = await file.read()
            
            upload_result = cloudinary.uploader.upload(
                contents,
                folder="otoscopia_colaboracao_externa",
                resource_type="image"
            )
            
            secure_url = upload_result.get("secure_url")
            if not secure_url:
                continue
                
            uploaded_urls.append(secure_url)
            case_info = f"[DOAÇÃO COMUNITÁRIA LOTE] {clinical_case}".strip()
            
            insert_query = """
            INSERT INTO feedback (feedback_image_url, correct_diagnosis, diagnosis_correct, predicted_classes, clinical_case)
            VALUES (%s, %s, %s, %s, %s)
            """
            cur.execute(insert_query, (secure_url, diagnostic, True, json.dumps(""), case_info))
            
        conn.commit()
        cur.close()
        conn.close()
        
        return {"success": True, "urls": uploaded_urls, "message": f"{len(uploaded_urls)} Imagens recebidas na nuvem com sucesso!"}
        
    except Exception as e:
        return {"error": f"Erro interno da rota Donate: {str(e)}"}

@app.post("/api/curadoria/feedback")
@app.post("/api/feedback")
async def feedback_image(request: Request):
    """
    Ponto de entrada nativo central pra as predições do OTOSCOP-IA! 
    Substitui integralmente o antigo Backend do Heroku.
    """
    form = await request.form()
    feedbackImage = form.get("feedbackImage")
    correctDiagnosis = form.get("correctDiagnosis", "")
    diagnosisCorrect = form.get("diagnosisCorrect", "yes")
    predictedClasses = form.get("predictedClasses", "")
    differentialDiagnosis = form.get("differentialDiagnosis", "")
    clinicalCase = form.get("clinicalCase", "")
    
    if not feedbackImage:
        return {"error": "Imagem de feedback ausente na carga."}
    if not setup_cloudinary():
        return {"error": "Servidor não possui as variáveis Cloudinary ativadas ou estão mal formatadas."}
        
    db_url = get_database_url()
    
    if not db_url:
        return {"error": "Servidor não possui NeonDB ativadas."}
        
    try:
        contents = await feedbackImage.read()
        
        # Upload para o Cloudinary (Fila quente de Curadoria)
        upload_result = cloudinary.uploader.upload(
            contents,
            folder="otoscopia_curadoria_pendente",
            resource_type="image"
        )
        
        secure_url = upload_result.get("secure_url")
        if not secure_url:
            return {"error": "Falha de comunicação Cloudinary"}
            
        # Conexão NeonDB e Ingestão
        conn = psycopg2.connect(db_url, sslmode='require')
        cur = conn.cursor()
        
        import json
        
        insert_query = """
        INSERT INTO feedback (feedback_image_url, correct_diagnosis, diagnosis_correct, predicted_classes, clinical_case)
        VALUES (%s, %s, %s, %s, %s)
        """
        
        # Consolida Diferenciais na coluna original de Predicted Classes pro Vercel renderizar lindamente 
        final_predictions = predictedClasses
        if differentialDiagnosis:
            final_predictions += f" | {differentialDiagnosis}"
            
        cur.execute(insert_query, (secure_url, correctDiagnosis, diagnosisCorrect, json.dumps(final_predictions), clinicalCase))
        conn.commit()
        cur.close()
        conn.close()
        
        return {"success": True}
        
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return {"error": f"Internal FastAPI feedback exception: {str(e)}"}

# -------------------------------------------------------------
# GEN 3.0: ATLAS CMS - ROTAS DE DADOS NUVEM DO FRONTEND
# O frontend busca e envia novos casos direto para Nuvem(Sem estourar o limite de 500MB do Github)
# -------------------------------------------------------------

@app.get("/api/atlas")
async def get_atlas_cloud_items():
    db_url = get_database_url()
    if not db_url:
        return {"error": "Banco de Dados indisponível"}
        
    try:
        conn = psycopg2.connect(db_url, sslmode='require')
        cur = conn.cursor()
        cur.execute("SELECT id, pathology, description, image_url, svg_json FROM atlas_cloud_items ORDER BY created_at DESC")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        
        items = []
        for r in rows:
            items.append({
                "id": str(r[0]),
                "pathology": r[1] or "",
                "description": r[2] or "",
                "image_url": r[3] or "",
                "svg_json": r[4] or ""
            })
        return {"success": True, "items": items}
        
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return {"error": str(e)}

@app.post("/api/admin/atlas")
async def create_atlas_cloud_item(request: Request):
    form = await request.form()
    file = form.get("file")
    pathology = form.get("pathology", "Sem Patologia")
    description = form.get("description", "Sem descrição")
    svg_json = form.get("svg_json", "[]")
    
    if not file:
        return {"error": "Arquivo não encontado no POST form."}
        
    if not setup_cloudinary():
        return {"error": "Credenciais do Cloudinary malformadas ou indisponíveis."}
        
    db_url = get_database_url()
    if not db_url:
        return {"error": "DATABASE_URL do Neon não localizada."}
        
    try:
        contents = await file.read()
        
        # 1. Envia para a plataforma Cloudinary Oficial (Na pasta CloudAtlas)
        upload_result = cloudinary.uploader.upload(
            contents,
            folder="otoscopia_atlas_nuvem",
            resource_type="image"
        )
        secure_url = upload_result.get("secure_url")
        
        if not secure_url:
            return {"error": "Falha silenciosa do Cloudinary - Não gerou URL."}
            
        # 2. Injeta Metadados SVG + Cloud URL no Neon DB!
        conn = psycopg2.connect(db_url, sslmode='require')
        cur = conn.cursor()
        
        insert_query = """
        INSERT INTO atlas_cloud_items (pathology, description, image_url, svg_json) 
        VALUES (%s, %s, %s, %s)
        """
        cur.execute(insert_query, (pathology, description, secure_url, svg_json))
        conn.commit()
        
        cur.close()
        conn.close()
        
        return {"success": True, "url": secure_url, "message": "Atlas Cloud Atualizado!"}
        
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return {"error": str(e)}

