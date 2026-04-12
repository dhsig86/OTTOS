import os
import shutil
from pathlib import Path

source_dir = Path(r"C:\Users\drdhs\OneDrive\Documentos\ottoatlas\OTTO_ML_Dataset\VALIDATION")
dest_dir = Path(r"C:\Users\drdhs\OneDrive\Documentos\ottoatlas\otto-atlas-web\public\images\atlas_v4")
dest_dir.mkdir(parents=True, exist_ok=True)

classes = [d for d in source_dir.iterdir() if d.is_dir() and "50" not in d.name and "nao_otoscopica" not in d.name]

print("\n--- EXTRAÇÃO REALIZADA COM SUCESSO ---")
for cls in classes:
    imgs = list(cls.glob("*.jpg")) + list(cls.glob("*.png")) + list(cls.glob("*.jpeg"))
    imgs = sorted([str(img) for img in imgs])[:2]
    
    frontend_paths = []
    for i, img_path in enumerate(imgs):
        ext = os.path.splitext(img_path)[1].lower()
        new_name = f"{cls.name}_v4_{i+1}{ext}"
        dest_path = dest_dir / new_name
        shutil.copy2(img_path, dest_path)
        frontend_paths.append(f"      '/images/atlas_v4/{new_name}'")
        
    print(f"\n// CLASSE: {cls.name}")
    if frontend_paths:
        print(",\n".join(frontend_paths))
    else:
        print("Nenhuma imagem extra.")
