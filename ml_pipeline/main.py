from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastai.vision.all import load_learner, PILImage
import psycopg2
import os
import pathlib
import cloudinary
import cloudinary.uploader

def get_database_url():
    env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            for line in f:
                if line.startswith("DATABASE_URL="):
                    return line.strip().split("=", 1)[1]
    return os.environ.get("DATABASE_URL")

app = FastAPI(title="OTOSCOP-IA Engine", description="FastAPI Backend for Fast.ai PyTorch Model")

# Permitir o Frontend React (localhost:5173) acessar o Python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Variável de memória para a nossa Rede Neural (ResNet18)
learn = None

@app.on_event("startup")
async def load_model():
    global learn
    model_path = os.path.join("models", "otto_diagnostic_model.pkl")
    print("Iniciando motor OTOSCOP-IA...")
    
    if os.path.exists(model_path):
        # Correção de compatibilidade para modelos treinados no Windows sendo carregados no Linux (Render)
        import platform
        temp_win = None
        if platform.system() == 'Linux':
            temp_win = pathlib.WindowsPath
            pathlib.WindowsPath = pathlib.PosixPath
            
        try:
            learn = load_learner(model_path, cpu=True)
            print(f"Sucesso! Modelo Neural Carregado: {learn.dls.vocab}")
        except Exception as e:
            print(f"Erro Crítico ao carregar MLOps: {e}")
        finally:
            if temp_win is not None:
                pathlib.WindowsPath = temp_win
    else:
        print(f"Alerta: Arquivo '{model_path}' não encontrado. A IA não está operante.")

@app.post("/api/predict")
async def predict_image(file: UploadFile = File(...)):
    if not learn:
        return {"error": "O cérebro PyTorch não está carregado. Verifique os logs do servidor."}
    
    # Lemos os bytes físicos da imagem enviada pelo React
    contents = await file.read()
    
    # O Fast.ai processa bytes nativamente
    img = PILImage.create(contents)
    
    # Inferência Viva na Rede Neural:
    pred_class, pred_idx, probs = learn.predict(img)
    
    # Extração vocabular
    vocab = learn.dls.vocab
    prob_list = probs.tolist()
    
    # Construir JSON estruturado no formato que o TypeScript/React espera, 
    # limpando sufixos indesejados como "-samples" e sublinhados
    def clean_name(name):
        return name.replace("-samples", "").replace("_", " ").title() if name.islower() else name.replace("-samples", "").replace("_", " ")
        
    predictions = [{"class": clean_name(str(v)), "confidence": float(p)} for v, p in zip(vocab, prob_list)]
    
    # Ordenar pelos maiores chutes primeiro
    predictions.sort(key=lambda x: x["confidence"], reverse=True)
    
    # Retornar o formidável Top-3 Diferencial!
    return predictions[:3]

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
        # Remove caracteres especiais
        n = re.sub(r'[^a-zA-Z0-9\s]', '', n)
        # Normaliza espaços extras e aplica CamelCase (ex: "Otite Media Cronica")
        return ' '.join(n.split()).title()

    if not file.filename.lower().endswith('.zip'):
        return {"error": "Por segurança, a rota de ingestão bulk aceita exclusivamente formato .zip."}
    
    # 1. Salvar na memória temporária para processamento
    temp_zip = f"temp_ingest_{int(time.time())}.zip"
    with open(temp_zip, "wb") as f:
        f.write(await file.read())
        
    try:
        # Aponte fixo para o "Coração" do seu banco de amostras legadas
        base_dir = r"C:\Users\drdhs\OneDrive\Documentos\APPROTTO\Samples"
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
                    
                    if not file_name: continue # era só uma pasta
                    
                    # Normaliza o nome da patologia para evitar poluição da Árvore de Pastas
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
        n = re.sub(r'[^a-zA-Z0-9\s]', '', n)
        return ' '.join(n.split()).title()
        
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
        base_dir = r"C:\Users\drdhs\OneDrive\Documentos\APPROTTO\Samples"
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

@app.post("/api/curadoria/donate")
async def donate_image(
    file: UploadFile = File(...),
    diagnostic: str = Form(...),
    clinical_case: str = Form("")
):
    env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
    c_url = os.environ.get("CLOUDINARY_URL")
    if not c_url and os.path.exists(env_path):
        with open(env_path, "r") as f:
            for line in f:
                if line.startswith("CLOUDINARY_URL="):
                    c_url = line.strip().split("=", 1)[1]
                    break
    
    if c_url:
        os.environ["CLOUDINARY_URL"] = c_url
        cloudinary.config(cloudinary_url=c_url)
        
    db_url = get_database_url()
    
    if not c_url or not db_url:
        return {"error": "Credenciais do Cloudinary ou do Banco de Dados não configuradas no Servidor."}
        
    try:
        contents = await file.read()
        
        upload_result = cloudinary.uploader.upload(
            contents,
            folder="otoscopia_colaboracao_externa",
            resource_type="image"
        )
        
        secure_url = upload_result.get("secure_url")
        if not secure_url:
            return {"error": "Ocorreu um erro interno no upload para o Cloudinary"}
            
        case_info = f"[DOAÇÃO COMUNITÁRIA] {clinical_case}".strip()
        
        conn = psycopg2.connect(db_url, sslmode='require')
        cur = conn.cursor()
        
        insert_query = """
        INSERT INTO feedback (feedback_image_url, correct_diagnosis, diagnosis_correct, predicted_classes, clinical_case)
        VALUES (%s, %s, %s, %s, %s)
        """
        cur.execute(insert_query, (secure_url, diagnostic, "donation", "", case_info))
        conn.commit()
        cur.close()
        conn.close()
        
        return {"success": True, "url": secure_url, "message": "Doação recebida na nuvem com sucesso!"}
        
    except Exception as e:
        return {"error": f"Erro interno da rota Donate: {str(e)}"}
