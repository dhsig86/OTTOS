import os
import psycopg2
import csv
import json
import urllib.request
import zipfile
import random
from pathlib import Path
from collections import defaultdict
from PIL import Image, ImageEnhance

def get_database_url():
    env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            for line in f:
                if line.startswith("DATABASE_URL="):
                    return line.strip().split("=", 1)[1]
    return os.environ.get("DATABASE_URL")

def main():
    print("Iniciando Exportação OTTO -> Kaggle Dataset...")
    
    # Carrega Dicionário de Agrupamento MLOps
    mapping_dict = {}
    mapping_path = os.path.join(os.path.dirname(__file__), "ml_class_mapping.json")
    if os.path.exists(mapping_path):
        with open(mapping_path, "r", encoding="utf-8") as fm:
            mapping_dict = json.load(fm)

    db_url = get_database_url()
    if not db_url:
        print("Erro: DATABASE_URL não encontrada.")
        return

    conn = psycopg2.connect(db_url, sslmode='require')
    cur = conn.cursor()

    # Query master cases, ignoring quiz_only tags
    cur.execute("""
        SELECT id, title, primary_diagnosis, taxonomies, media_urls
        FROM clinical_cases 
        WHERE is_deleted = FALSE
    """)
    rows = cur.fetchall()
    
    # Prepare Output Directories
    export_dir = os.path.join(os.path.dirname(__file__), "..", "kaggle_export")
    images_dir = os.path.join(export_dir, "images")
    os.makedirs(images_dir, exist_ok=True)
    
    metadata_map = []
    
    
    print(f"[{len(rows)}] Registros totais encontrados na V4.")
    
    downloaded_count = 0
    # Agrupador para Oversampling
    grouped_files = defaultdict(list)
    for r in rows:
        case_id = r[0]
        # title = r[1]
        primary_diagnosis = r[2]
        taxonomies = r[3] or []
        media_urls = r[4] or []
        
        # Todas as imagens são do padrão Ouro e devem nutrir a IA no Kaggle!
        for i, url in enumerate(media_urls):
            filename = f"case_{case_id}_img_{i}.jpg"
            filepath = os.path.join(images_dir, filename)
            
            # Download Image
            try:
                # Add headers for security sometimes cloud providers deny urllib
                req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req) as response, open(filepath, 'wb') as out_file:
                    out_file.write(response.read())
                    
                raw_label = primary_diagnosis.upper().strip()
                patched_label = mapping_dict.get(raw_label, raw_label)
                
                metadata_map.append({
                    "file_name": f"images/{filename}",
                    "label": patched_label
                })
                # Registra o arquivo baixado no grupo da doença para possível augmentation
                grouped_files[patched_label].append(filepath)
                downloaded_count += 1
            except Exception as e:
                print(f"Erro ao baixar {url}: {e}")

    cur.close()
    conn.close()
    
    print(f"Download concluído: {downloaded_count} imagens master. Iniciando processamento de Oversampling ML...")

    # MLOps OFFLINE OVERSAMPLING: Preenchendo buracos de classes raras (Minimo 50)
    TARGET_MIN = 50
    augmented_count = 0
    
    for label, filepaths in grouped_files.items():
        current_count = len(filepaths)
        if 0 < current_count < TARGET_MIN:
            deficit = TARGET_MIN - current_count
            print(f">>> Classe Fraca Detectada: [{label}] tem apenas {current_count} fotos. Gerando {deficit} mutações...")
            
            for i in range(deficit):
                # Escolhe uma foto base aleatoria desse grupo
                base_filepath = random.choice(filepaths)
                try:
                    with Image.open(base_filepath) as img:
                        # Mutação 1: Espelho aleatorio
                        if random.random() > 0.5:
                            import PIL.ImageOps
                            img = PIL.ImageOps.mirror(img)
                        # Mutação 2: Rotação leve
                        angle = random.uniform(-15, 15)
                        img = img.rotate(angle, expand=False)
                        # Mutação 3: Brilho
                        enhancer = ImageEnhance.Brightness(img)
                        img = enhancer.enhance(random.uniform(0.8, 1.2))
                        
                        # Salva arquivo mutante
                        aug_filename = os.path.basename(base_filepath).replace(".jpg", f"_aug_{i}.jpg")
                        aug_filepath = os.path.join(images_dir, aug_filename)
                        
                        # Garante cores RGB para salvar JPEGs corretamente
                        if img.mode in ('RGBA', 'P'):
                            img = img.convert('RGB')
                            
                        img.save(aug_filepath, "JPEG")
                        
                        # Insere a nova imagem no metadata do Kaggle
                        metadata_map.append({
                            "file_name": f"images/{aug_filename}",
                            "label": label
                        })
                        augmented_count += 1
                except Exception as e:
                    print(f"Erro ao gerar augmentation para {base_filepath}: {e}")

    print(f"Oversampling concluído! {augmented_count} imagens mutantes geradas com sucesso.")

    # Write Metadata CSV
    csv_path = os.path.join(export_dir, "metadata.csv")
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["file_name", "label"])
        writer.writeheader()
        for row in metadata_map:
            writer.writerow(row)
            
    print("Metadata.csv gerado com sucesso!")
    
    # Zip tudo
    zip_path = os.path.join(os.path.dirname(__file__), "..", "OTTO_Kaggle_Dataset.zip")
    print(f"Compactando dataset em {zip_path}...")
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        zipf.write(csv_path, arcname="metadata.csv")
        for root, _, files in os.walk(images_dir):
            for file in files:
                abs_path = os.path.join(root, file)
                zipf.write(abs_path, arcname=f"images/{file}")
                
    print("\n[OK] Dataset Finalizado MLOps! Voce pode fazer upload desse ZIP no Kaggle Datasets.")

if __name__ == "__main__":
    main()
