"""
Utilitário de Sincronização e Triagem (A Opção 1)
-------------------------------------------------
Este script ajuda o Dr. Dario a "despejar" novas fotos bagunçadas 
nomeadas com tags e ele automaticamente joga ou copia para as pastas de Treinamento Corretas.
Isso acelera meses de trabalho manual futuro!
"""

import os
import shutil
from pathlib import Path

# Mapa de sinônimos/Tags para as 6 Pastas Oficiais
TAG_MAP = {
    'normal': 'Normal-samples',
    'obstrucao': 'Obstrução Auditiva-samples',
    'rolha': 'Obstrução Auditiva-samples',
    'corpo estranho': 'Obstrução Auditiva-samples',
    'oea': 'Otite Externa-samples',
    'externa': 'Otite Externa-samples',
    'oma': 'Otite Média Aguda-samples',
    'aguda': 'Otite Média Aguda-samples',
    'omc': 'Otite Média Crônica-samples',
    'cronica': 'Otite Média Crônica-samples',
    'perfuração': 'Otite Média Crônica-samples',
    'pele': 'nao_otoscopica',
    'rost': 'nao_otoscopica'
}

def auto_tag_and_sync(inbox_dir, target_samples_dir, copy_only=True):
    inbox = Path(inbox_dir)
    target = Path(target_samples_dir)
    
    if not inbox.exists():
        print("Pasta inbox não encontrada.")
        return
        
    print(f"Procurando fotos que precisam de triagem em: {inbox}")
    Count = 0
    
    for filename in os.listdir(inbox):
        if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
            name_lower = filename.lower()
            pasta_destino = None
            
            # Checar qual tag o nome aborda
            for key_tag, folder_name in TAG_MAP.items():
                if key_tag in name_lower:
                    pasta_destino = folder_name
                    break
            
            if pasta_destino:
                origem = inbox / filename
                destino = target / pasta_destino / filename
                
                # Se for copy_only, ele não apaga a foto do Dr., apenas espelha no banco de treino
                if copy_only:
                    shutil.copy2(origem, destino)
                else:
                    shutil.move(origem, destino)
                print(f"[TRIAGEM] '{filename}' -> '{pasta_destino}'")
                Count += 1
            else:
                print(f"[ALERTA IGNORADO] Não encontrei Tag em '{filename}'. Analise manualmente.")
                
    print(f"\nFinalizado! {Count} imagens foram organizadas automaticamente.")

if __name__ == '__main__':
    # Onde você (usuário) jogou as fotos soltas do seu Whatsapp:
    INBOX = r"C:\Users\drdhs\OneDrive\Documentos\ottoatlas\inbox_fotos_novas"
    
    print("====== Sincronização Heroku -> Cloudinary (+ Downloader) ======")
    SAMPLES_DB = r"C:\Users\drdhs\OneDrive\Documentos\ottoatlas\OTTO_ML_Dataset_Raw"
    
    # Deixamos copy_only=True para NUNCA apagar os arquivos originais do médico
    auto_tag_and_sync(INBOX, SAMPLES_DB, copy_only=True)
