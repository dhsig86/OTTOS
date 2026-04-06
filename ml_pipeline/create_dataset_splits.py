import os
import shutil
import random
from pathlib import Path
import argparse

def create_splits(source_dir, output_dir, train_ratio=0.7, val_ratio=0.2):
    """
    Lê um diretório brutão com pastas de classes (ex: APPROTTO/Samples),
    embaralha as fotos e cria o "Padrão Ouro" MLOps:
    - TRAIN/
    - VALIDATION/
    - TEST/
    """
    src = Path(source_dir)
    out = Path(output_dir)
    
    if not src.exists():
        print(f"Pasta fonte não encontrada: {src}")
        return
        
    classes = [d for d in src.iterdir() if d.is_dir()]
    print(f"Classes detectadas: {[c.name for c in classes]}")
    
    for cls in classes:
        images = list(cls.glob('*.jpg')) + list(cls.glob('*.png')) + list(cls.glob('*.jpeg'))
        random.seed(42) # Fator de semente para garantir reproducibilidade
        random.shuffle(images)
        
        total = len(images)
        if total == 0:
            continue
            
        train_end = int(total * train_ratio)
        val_end = train_end + int(total * val_ratio)
        
        train_imgs = images[:train_end]
        val_imgs = images[train_end:val_end]
        test_imgs = images[val_end:]
        
        # Cria as pastas para cada split
        for split_name, imgs in zip(['TRAIN', 'VALIDATION', 'TEST'], [train_imgs, val_imgs, test_imgs]):
            split_dir = out / split_name / cls.name
            split_dir.mkdir(parents=True, exist_ok=True)
            for img in imgs:
                shutil.copy2(str(img), str(split_dir / img.name))
                
        print(f"[{cls.name}] Total: {total} -> TRAIN: {len(train_imgs)}, VAL: {len(val_imgs)}, TEST: {len(test_imgs)}")
                
    print(f"\n>>>> Dataset Estruturado com SUCESSO na raiz: {output_dir}")

if __name__ == '__main__':
    print("==================================================================")
    print("OTTO MLOps: Gerador Automático de Datasets (Train/Val/Test Splits)")
    print("==================================================================")
    
    # Você aponta as imagens puras aprovadas pela Curadoria (pasta bruta)
    SOURCE = r"C:\Users\drdhs\OneDrive\Documentos\ottoatlas\OTTO_ML_Dataset_Raw"
    
    # Ele separa 85% para treino e 15% para validação na pasta oficial da Inteligência
    DESTINATION = r"C:\Users\drdhs\OneDrive\Documentos\ottoatlas\OTTO_ML_Dataset"
    
    create_splits(SOURCE, DESTINATION)
