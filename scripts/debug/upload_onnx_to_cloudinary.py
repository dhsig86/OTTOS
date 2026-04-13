"""
OTTO Atlas — Upload do modelo ONNX para o Cloudinary (resource_type=raw)
e geração do comando curl para usar no Render Shell.

Execute LOCALMENTE antes de configurar o Render Disk:
  python scripts/debug/upload_onnx_to_cloudinary.py
"""

import os
import sys
import hashlib
import time
import requests

# ─── Configuração ───────────────────────────────────────────────────────────

# Caminho local do modelo ONNX
ONNX_PATH = os.path.join(
    os.path.dirname(__file__), "..", "..", "ml_pipeline", "models", "otto_model.onnx"
)
VOCAB_PATH = os.path.join(
    os.path.dirname(__file__), "..", "..", "ml_pipeline", "models", "vocab.txt"
)

# ─── Carregar credenciais do .env ────────────────────────────────────────────

def load_env():
    env_path = os.path.join(os.path.dirname(__file__), "..", "..", ".env")
    config = {}
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            for line in f:
                if line.startswith("CLOUDINARY_URL="):
                    c_url = line.strip().split("=", 1)[1]
                    url_no_prefix = c_url.replace("cloudinary://", "")
                    api_key, rest = url_no_prefix.split(":", 1)
                    api_secret, cloud_name = rest.split("@", 1)
                    config = {
                        "cloud_name": cloud_name,
                        "api_key": api_key,
                        "api_secret": api_secret,
                    }
                    break
    return config

# ─── Upload ──────────────────────────────────────────────────────────────────

def upload_raw(file_path, public_id, config):
    cloud_name = config["cloud_name"]
    api_key = config["api_key"]
    api_secret = config["api_secret"]

    timestamp = str(int(time.time()))
    folder = "otto_models"

    params_to_sign = f"folder={folder}&public_id={public_id}&timestamp={timestamp}{api_secret}"
    signature = hashlib.sha1(params_to_sign.encode("utf-8")).hexdigest()

    file_size = os.path.getsize(file_path) / (1024 * 1024)
    print(f"  Enviando {os.path.basename(file_path)} ({file_size:.1f} MB)...")

    with open(file_path, "rb") as f:
        response = requests.post(
            f"https://api.cloudinary.com/v1_1/{cloud_name}/raw/upload",
            data={
                "api_key": api_key,
                "timestamp": timestamp,
                "folder": folder,
                "public_id": public_id,
                "signature": signature,
            },
            files={"file": f},
            timeout=300,  # 5 minutos para arquivo de 83MB
        )

    if response.status_code == 200:
        return response.json().get("secure_url")
    else:
        print(f"  ERRO HTTP {response.status_code}: {response.text[:300]}")
        return None

# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    print("=== OTTO Atlas — Upload de Modelo para Cloudinary (raw) ===\n")

    config = load_env()
    if not config:
        print("ERRO: CLOUDINARY_URL não encontrada no .env")
        sys.exit(1)

    print(f"Cloud: {config['cloud_name']}\n")

    # Upload do ONNX
    if not os.path.exists(ONNX_PATH):
        print(f"ERRO: Modelo não encontrado em {ONNX_PATH}")
        sys.exit(1)

    onnx_url = upload_raw(ONNX_PATH, "otto_model", config)
    if not onnx_url:
        print("FALHA no upload do ONNX.")
        sys.exit(1)
    print(f"  ✅ ONNX: {onnx_url}\n")

    # vocab.txt é pequeno — upload também
    vocab_url = upload_raw(VOCAB_PATH, "vocab", config)
    print(f"  ✅ vocab.txt: {vocab_url}\n")

    # Gerar o comando para o Render Shell
    print("=" * 60)
    print("COPIE e COLE esses comandos no Render Shell:\n")
    print(f'mkdir -p /opt/otto_models')
    print(f'curl -L -o /opt/otto_models/otto_model.onnx "{onnx_url}"')
    print(f'curl -L -o /opt/otto_models/vocab.txt "{vocab_url}"')
    print(f'ls -lh /opt/otto_models/')
    print("=" * 60)
    print("\nApós rodar no Render Shell, o OTOSCOP-IA estará ativo!")

if __name__ == "__main__":
    main()
