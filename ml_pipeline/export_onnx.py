import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
import torch
from fastai.vision.all import load_learner
import os
import pathlib

model_path = r'C:\Users\drdhs\OneDrive\Documentos\ottoatlas\otto-atlas-web\ml_pipeline\models\export.pkl'
onnx_path = r'C:\Users\drdhs\OneDrive\Documentos\ottoatlas\otto-atlas-web\ml_pipeline\models\otto_model.onnx'
vocab_path = r'C:\Users\drdhs\OneDrive\Documentos\ottoatlas\otto-atlas-web\ml_pipeline\models\vocab.txt'

print("1. Patch de PathLib ativado...")
temp = pathlib.PosixPath
pathlib.PosixPath = pathlib.WindowsPath

print("2. Carregando modelo Fast.AI (CPU)...")
learn = load_learner(model_path, cpu=True)

print("3. Extraindo e salvando Vocabulário Clínico...")
vocab = list(learn.dls.vocab)
with open(vocab_path, "w", encoding="utf-8") as f:
    for c in vocab:
        f.write(f"{c}\n")
print("Vocabulario Salvo:", vocab)

import torch.nn as nn

# learn.model[1][0] = FixedConcatPool()
pytorch_model = learn.model.eval()

import shutil

# Precisamos usar EXATAMENTE o mesmo nome do arquivo final ("otto_model.onnx")
# na raiz para que o onnxscript (PyTorch) não vincule a um nome temporário quebrado.
temp_onnx = "otto_model.onnx"

print("4. Iniciando conversão para ONNX Runtime Graph (Com Bypass)...")
dummy_input = torch.randn(1, 3, 224, 224)

torch.onnx.export(
    pytorch_model,
    dummy_input,
    temp_onnx,
    export_params=True,
    opset_version=14,
    do_constant_folding=False, # Impede RAM spikes em shape inference / optimization
    input_names=['input'],
    output_names=['output']
)

# Mover para a pasta correta
if os.path.exists(temp_onnx):
    shutil.move(temp_onnx, onnx_path)
    
# Se o onnxscript gerar um arquivo de pesos externo (.data), movemos também
if os.path.exists(temp_onnx + ".data"):
    shutil.move(temp_onnx + ".data", onnx_path + ".data")

print(f"\n[SUCESSO] O Cérebro neural desceu com sucesso para: {onnx_path}")
print(f"O tamanho original (pkl) no disco caiu drasticamente, pronto para nuvens apertadas.")
