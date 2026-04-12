import os
import shutil
from pathlib import Path

# Base directories
base_dirs = [
    r"C:\Users\drdhs\OneDrive\Documentos\ottoatlas\OTTO_ML_Dataset_Raw",
    r"C:\Users\drdhs\OneDrive\Documentos\ottoatlas\OTTO_ML_Dataset\TRAIN",
    r"C:\Users\drdhs\OneDrive\Documentos\ottoatlas\OTTO_ML_Dataset\VALIDATION"
]

# Mapping rules
mapping = {
    # Normal Forms
    "Normal": "normal",
    "Normal 100": "normal",
    "Normal 59": "normal",
    "Normal 67": "normal",
    "Normal 71": "normal",
    "Normal 77": "normal",
    "Normal 88": "normal",
    "Normal 96": "normal",
    "Normal 99": "normal",
    "Normal 1000": "normal",
    "Normal-samples": "normal",
    
    # Nao Otoscopica
    "Naootoscopica": "nao_otoscopica",
    "nao_otoscopica": "nao_otoscopica",
    
    # Cerume / Obstrucao
    "Obstrucao": "cerume_obstrucao",
    "Obstrucao Auditiva": "cerume_obstrucao",
    "Obstrução Auditiva-samples": "cerume_obstrucao",
    
    # Otite Media Cronica
    "Otite Media Cronica": "otite_media_cronica",
    "Otite Media Cronica 46": "otite_media_cronica",
    "Otite Media Cronica 58": "otite_media_cronica",
    "Otite Media Cronica 86": "otite_media_cronica",
    "Otite Média Crônica-samples": "otite_media_cronica",
    
    # Otite Externa Aguda
    "Otiteexternaaguda": "otite_externa_aguda",
    "Otite Externa": "otite_externa_aguda",
    "Otite Externa Aguda": "otite_externa_aguda",
    "Otite Externa Aguda Difusa": "otite_externa_aguda",
    "Otite Externa-samples": "otite_externa_aguda",
    "otite_externa_aguda": "otite_externa_aguda",
    
    # Otite Media Serosa
    "Otitemediaserosa": "otite_media_serosa",
    "Otite Media Serosa": "otite_media_serosa",
    
    # Otite Media Aguda
    "Otite Media Aguda": "otite_media_aguda",
    "Otite Media Aguda Bacteriana 970": "otite_media_aguda",
    "Otite Média Aguda-samples": "otite_media_aguda",
    
    # Corpo Estranho
    "Corpo Estranho": "corpo_estranho"
}

def clean_directories():
    files_moved = 0
    folders_deleted = 0
    for base in base_dirs:
        if not os.path.exists(base):
            continue
            
        for folder_name in os.listdir(base):
            folder_path = os.path.join(base, folder_name)
            if not os.path.isdir(folder_path):
                continue
                
            # If the folder matches one of our dirty mappings
            if folder_name in mapping:
                target_name = mapping[folder_name]
                if folder_name == target_name:
                    continue  # Already perfectly clean
                
                target_dir = os.path.join(base, target_name)
                os.makedirs(target_dir, exist_ok=True)
                
                # Move files
                for f in os.listdir(folder_path):
                    src = os.path.join(folder_path, f)
                    if os.path.isfile(src):
                        dst = os.path.join(target_dir, f)
                        # Avoid overwrite conflicts
                        if os.path.exists(dst):
                            dst = os.path.join(target_dir, f"dup_{f}")
                        shutil.move(src, dst)
                        files_moved += 1
                        
                # Delete empty dirty folder
                shutil.rmtree(folder_path)
                folders_deleted += 1
                
    print(f"Cleanup Completed. Moved {files_moved} files. Deleted {folders_deleted} dirty folders.")

if __name__ == "__main__":
    clean_directories()
