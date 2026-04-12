import sys
import os

# Adiciona o diretório atual para importar funções do arquivo main
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from ml_pipeline.main import get_database_url
except ImportError:
    print("Módulo 'main' não econtrado. Verifique os caminhos.")
    sys.exit(1)

import psycopg2

def setup_cloud_atlas_table():
    db_url = get_database_url()
    if not db_url:
        print("ERRO: DATABASE_URL não encontrada localmente/no Render .env")
        return
        
    print("Conectando ao banco Neon DB oficial...")
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        # Cria a tabela de itens do novo Atlas Gen 3
        # O image_url guarda o link do Cloudinary, e o svg_json guarda as coordenadas e textos
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS atlas_cloud_items (
            id SERIAL PRIMARY KEY,
            pathology VARCHAR(255) NOT NULL,
            description TEXT,
            image_url TEXT NOT NULL,
            svg_json TEXT, -- Pode conter o JSON stringificado do mapping
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
        cur.execute(create_table_sql)
        conn.commit()
        print(">> SUCESSO: Tabela 'atlas_cloud_items' verificada/criada no Neon PostgreSQL!")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Erro fatal ao comunicar com Banco: {e}")

if __name__ == "__main__":
    setup_cloud_atlas_table()
