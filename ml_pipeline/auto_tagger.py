import os
import shutil
import uuid
import psycopg2
from pathlib import Path
from fastai.vision.all import load_learner, PILImage
import pathlib

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

    # 2. Configurar Diretórios
    source_dir = r"C:\Users\drdhs\OneDrive\Imagens\Otoscopio 2026\IMG"
    if not os.path.exists(source_dir):
        print(f"Erro: Diretório de massa {source_dir} não existe.")
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
    for f in files:
        new_name = f"lote2026_{uuid.uuid4().hex[:8]}{f.suffix}"
        dest_path = os.path.join(public_queue_dir, new_name)
        
        # Copia imagem para a pasta exposta do UI
        shutil.copy2(str(f), dest_path)
        
        # Roda inferência de IA da foto
        img = PILImage.create(dest_path)
        pred_class, pred_idx, probs = learn.predict(img)
        
        # Constrói string de predições principais separadas por vírgula
        vocab = learn.dls.vocab
        prob_list = probs.tolist()
        predictions = [{"class": clean_name(str(v)), "confidence": float(p)} for v, p in zip(vocab, prob_list)]
        predictions.sort(key=lambda x: x["confidence"], reverse=True)
        
        # Pega Top 3 Formatado
        top_preds_str = ", ".join([f"{p['class']} ({p['confidence']*100:.0f}%)" for p in predictions[:3]])
        
        # Mapeia imagem servida localmente via HTTP frontend pathing
        relative_url = f"/curadoria_queue/{new_name}"
        
        cur.execute("""
            INSERT INTO feedback (feedback_image_url, correct_diagnosis, diagnosis_correct, predicted_classes, clinical_case)
            VALUES (%s, %s, %s, %s, %s)
        """, (relative_url, None, None, top_preds_str, "Puxado Automaticamente pelo Lote 2026"))
        
        sucesso_count += 1
        print(f"Lote Processado [{sucesso_count}/{len(files)}]: Predição Principal -> {predictions[0]['class']}")

    conn.commit()
    cur.close()
    conn.close()
    
    print("\n=======================================================")
    print(f"INCRÍVEL! {sucesso_count} imagens foram autoaditadas.")
    print("Agora abra o App React -> Curadoria MLOps e revise os achados!")
    print("As aprovadas voltarão ao ciclo em APPROTTO/Samples .")

if __name__ == '__main__':
    main()
