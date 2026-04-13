import os
import uuid
import psycopg2
import cloudinary
import cloudinary.uploader
import json
from pathlib import Path

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
        except Exception as e:
            print("Erro ao decodificar CLOUDINARY_URL:", e)
    return False

def clean_name(name):
    return name.replace("_", " ").title() if name.islower() else name.replace("_", " ")

def main():
    print("Iniciando Resgate de Imagens da Arquitetura Legada...")
    
    db_url = get_database_url()
    if not db_url:
        print("Erro: DATABASE_URL não encontrada.")
        return
        
    if not get_cloudinary_config():
        print("Erro: CLOUDINARY_URL não encontrada.")
        return

    conn = psycopg2.connect(db_url, sslmode='require')
    cur = conn.cursor()

    legacy_dir = r"C:\Users\drdhs\OneDrive\Documentos\ottoatlas\OTTO_ML_Dataset_Raw"
    if not os.path.exists(legacy_dir):
        print(f"Diretorio {legacy_dir} nao existe.")
        return

    sucesso_count = 0
    falha_count = 0

    valid_extensions = [".jpg", ".jpeg", ".png", ".bmp", ".webp"]

    for root, dirs, files in os.walk(legacy_dir):
        class_name_raw = os.path.basename(root)
        
        # Ignorar a pasta pai
        if class_name_raw == "OTTO_ML_Dataset_Raw":
            continue
            
        class_name = clean_name(class_name_raw)

        for filename in files:
            ext = os.path.splitext(filename)[1].lower()
            if ext not in valid_extensions:
                continue

            file_path = os.path.join(root, filename)
            new_name = f"legacy_rescue_{uuid.uuid4().hex[:8]}"

            print(f"Resgatando: [{class_name}] {filename}")
            
            try:
                with open(file_path, "rb") as image_file:
                    upload_result = cloudinary.uploader.upload(
                        image_file,
                        folder="atlas_cases_gen4",
                        public_id=new_name,
                        resource_type="image"
                    )
                secure_url = upload_result.get("secure_url")
                if not secure_url:
                    print(f"[{filename}] Falhou ao obter URL.")
                    falha_count += 1
                    continue
            except Exception as e:
                print(f"[{filename}] Erro Cloudinary: {e}")
                falha_count += 1
                continue

            # Inserir na tabela clinical_cases com tag pure_ml (Datalake Bruto MLOps)
            try:
                taxonomies = ["pure_ml"] # Trinario: Oculto de TUDO, exceto exportacao Kaggle
                cur.execute("""
                    INSERT INTO clinical_cases 
                    (title, clinical_history, primary_diagnosis, taxonomies, media_urls) 
                    VALUES (%s, %s, %s, %s, %s)
                """, (
                    f"Rescue: {class_name}",
                    "Curadoria Física resgatada do disco local Legado.",
                    class_name,
                    json.dumps(taxonomies),
                    json.dumps([secure_url])
                ))
                sucesso_count += 1
            except Exception as e:
                print(f"[{filename}] Erro Database: {e}")
                falha_count += 1
                conn.rollback() # Previne travamento do cursor
                continue

    conn.commit()
    cur.close()
    conn.close()

    print("\n=======================================================")
    print(f"RESGATE CONCLUIDO! {sucesso_count} resgatados pro Cloudinary DB. {falha_count} falhas.")
    print("Agora voce pode excluir a pasta OTTO_ML_Dataset_Raw do seu PC!")

if __name__ == "__main__":
    main()
