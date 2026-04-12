import os
import shutil
import uuid
import psycopg2
from pathlib import Path
from fastai.vision.all import load_learner, PILImage
import pathlib
import cloudinary
import cloudinary.uploader

def clean_name(name):
    # Formata como Título Bonito o que vier da predição ("otite_media_aguda" -> "Otite Media Aguda")
    return name.replace("-samples", "").replace("_", " ").title() if name.islower() else name.replace("-samples", "").replace("_", " ")

def get_database_url():
    env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            for line in f:
                if line.startswith("DATABASE_URL="):
                    return line.strip().split("=", 1)[1]
    return os.environ.get("DATABASE_URL")

def get_cloudinary_config():
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

def main():
    print("=======================================")
    print("  OTTO MLOps: BATCH PRE-TAGGER IA")
    print("=======================================")
    
    # 1. Carregar Modelo de IA
    model_path = os.path.join(os.path.dirname(__file__), "models", "otto_diagnostic_model.pkl")
    if not os.path.exists(model_path):
        print(f"Erro: Modelo não encontrado em {model_path}.")
        return
        
    print("Acordando a IA (ResNet18)...")
    temp = pathlib.PosixPath
    pathlib.PosixPath = pathlib.WindowsPath
    try:
        learn = load_learner(model_path)
    except Exception as e:
        print(f"Falha ao ligar a IA: {e}")
        return
    finally:
        pathlib.PosixPath = temp
        
    print("IA Pronta e carregada.")

    # 2. Configurar Diretórios via Input Dinâmico
    print("\n")
    print("Por favor, digite ou cole o caminho da pasta com as fotos (ex: C:\\Imagens\\Lote 1)")
    source_dir = input("Caminho da Pasta: ").strip()
    
    if not source_dir or not os.path.exists(source_dir):
        print(f"Erro: Diretório de massa '{source_dir}' não existe.")
        return
        
    # Salvaremos na Public do React para ele conseguir "enxergar" as imagens locais sem precisar do Cloudinary!
    public_queue_dir = os.path.join(os.path.dirname(__file__), "..", "public", "curadoria_queue")
    os.makedirs(public_queue_dir, exist_ok=True)
    
    # 3. Conectar ao Banco para Auditoria
    db_url = get_database_url()
    if not db_url:
        print("Erro: .env DATABASE_URL não encontrada.")
        return
        
    try:
        conn = psycopg2.connect(db_url, sslmode='require')
        cur = conn.cursor()
    except Exception as e:
        print(f"Database falha de conexão: {e}")
        return
        
    files = list(Path(source_dir).glob("*.jpg")) + list(Path(source_dir).glob("*.png")) + list(Path(source_dir).glob("*.jpeg"))
    print(f"Fornecimento detectado: {len(files)} fotos aguardando classificação artificial.")
    
    sucesso_count = 0
    # Processa cada arquivo
    # Inicializa Cloudinary fora do loop para não recarregar
    c_url = get_cloudinary_config()
    if not c_url:
        print("Erro crítico: Variável CLOUDINARY_URL ausente do .env!")
        return

    for f in files:
        new_name = f"lote2026_{uuid.uuid4().hex[:8]}"
        
        # Roda inferência de IA direto da foto original
        img = PILImage.create(str(f))
        pred_class, pred_idx, probs = learn.predict(img)
        
        # Constrói string de predições principais separadas por vírgula
        vocab = learn.dls.vocab
        prob_list = probs.tolist()
        predictions = [{"class": clean_name(str(v)), "confidence": float(p)} for v, p in zip(vocab, prob_list)]
        predictions.sort(key=lambda x: x["confidence"], reverse=True)
        top_preds_str = ", ".join([f"{p['class']} ({p['confidence']*100:.0f}%)" for p in predictions[:3]])
        
        # Upload nativo para O Cloudinary e resgate da URL Segura
        try:
            with open(str(f), "rb") as image_file:
                upload_result = cloudinary.uploader.upload(
                    image_file,
                    folder="curadoria_lote2026",
                    public_id=new_name,
                    resource_type="image"
                )
            secure_url = upload_result.get("secure_url")
            if not secure_url:
                print(f"[{f.name}] Falhou ao obter URL Seguro.")
                continue
        except Exception as e:
            print(f"[{f.name}] Erro Cloudinary: {e}")
            continue
        
        import json
        cur.execute("""
            INSERT INTO feedback (feedback_image_url, correct_diagnosis, diagnosis_correct, predicted_classes, clinical_case)
            VALUES (%s, %s, %s, %s, %s)
        """, (secure_url, None, None, json.dumps(top_preds_str), "Pré-classificado pelo Lote 2026"))
        conn.commit() # Commit iterativo para não perder avanço
        
        sucesso_count += 1
        print(f"Lote Processado [{sucesso_count}/{len(files)}]: {predictions[0]['class']} -> Nuvem OK")

    conn.commit()
    cur.close()
    conn.close()
    
    print("\n=======================================================")
    print(f"INCRÍVEL! {sucesso_count} imagens foram autoaditadas.")
    print("    e agora aguardam seu Veredito Médico no painel Curadoria (Revisar).")
    print("As aprovadas voltarão ao ciclo em OTTO_ML_Dataset_Raw .")

if __name__ == '__main__':
    main()
