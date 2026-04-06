"""
Motor de Treinamento Contínuo: OTTO Atlas AI Diagnóstico
--------------------------------------------------------
Este script utiliza o framework Fast.ai (construído sobre o PyTorch) para 
fazer Transfer Learning em cima de um modelo de visão já consagrado (resnet18).

NOTA CLÍNICA: O diretório original de 'Samples' serve apenas como 
"Leitura" (Read-Only). Nada é apagado do acervo original do Dr. Dario.
"""

from fastai.vision.all import *
from pathlib import Path
import warnings

# Ignorar alertas verbosos para um console limpo
warnings.filterwarnings('ignore')

def train_otto_model(samples_dir, output_dir, epochs=5):
    path = Path(samples_dir)
    print(f"[{datetime.now()}] Iniciando leitura do Dataset em: {path}")
    
    # Data Augmentation Clinico: Otoscopio roda 360 no canal, brilho varia com cerume.
    # mult=2 aumenta a multiplicidade, max_rotate=360 faz giro livre.
    dls = ImageDataLoaders.from_folder(
        path, 
        train='TRAIN',
        valid='VALIDATION', # Usa estritamente a separação das pastas do especialista
        item_tfms=Resize(460), 
        batch_tfms=aug_transforms(size=224, min_scale=0.75, max_rotate=360.0, max_lighting=0.3, max_zoom=1.2, p_affine=0.75), 
        num_workers=0, # CRÍTICO PARA NÃO CONGELAR NO WINDOWS
        bs=16 # Batch size seguro
    )
    
    print(f"[{datetime.now()}] Estrutura pronta. Classes detectadas: {dls.vocab}")
    
    # 2. Configurar o Modelo (Transfer Learning)
    # Usamos o ResNet18 por ser absurdamente rápido e ótimo para apps mobile (via ONNX/TFlite depois).
    print(f"[{datetime.now()}] Baixando base resnet18 e preparando a Rede Neural...")
    learn = vision_learner(dls, resnet18, metrics=error_rate)
    
    # 3. Treinar (Fine tuning) com Guardiões contra Overfitting
    print(f"[{datetime.now()}] Iniciando o Treinamento Seguro por até {epochs} épocas...")
    
    # EarlyStoppingCallback vigia se a Inteligência parar de aprender (loss validation).
    # SaveModelCallback garante que só será exportado o modelo exato da época onde ele foi mais inteligente.
    cbs = [
        EarlyStoppingCallback(monitor='valid_loss', min_delta=0.01, patience=3),
        SaveModelCallback(monitor='error_rate', min_delta=0.01)
    ]
    
    learn.fine_tune(epochs, cbs=cbs)
    
    # 4. Avaliar Validação (Confusion Matrix via Terminal)
    # Ignorado temporariamente no MVP para evitar crashes de Array Size
    # caso alguma classe tenha poucas fotos e não entre na amostra de validação.

    
    # 5. Salvar Modelo para o Frontend / Backend API
    out_path = Path(output_dir)
    out_path.mkdir(exist_ok=True, parents=True)
    
    export_file = out_path / 'otto_diagnostic_model.pkl'
    learn.export(export_file)
    print(f"\n[{datetime.now()}] SUCESSO! Modelo exportado com segurança para: {export_file}")

if __name__ == '__main__':
    # O novo diretório MLOps consolidado, livre da estrutura antiga APPROTTO
    ORIGINAL_DATASET_DIR = r"C:\Users\drdhs\OneDrive\Documentos\ottoatlas\OTTO_ML_Dataset"
    
    # Onde salvaremos o modelo gerado (longe das pastas legadas)
    OUTPUT_DIR = r"C:\Users\drdhs\OneDrive\Documentos\ottoatlas\otto-atlas-web\ml_pipeline\models"
    
    try:
        # Aumentamos para 15 épocas. O EarlyStopping parará antes se o modelo decorar os dados (overfit)
        train_otto_model(ORIGINAL_DATASET_DIR, OUTPUT_DIR, epochs=15) 
    except Exception as e:
        print(f"ERRO CRÍTICO no treinamento: {e}")
        print("Certifique-se de instalar as dependências: pip install -r requirements.txt")
