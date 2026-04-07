import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from ml_pipeline.main import get_database_url
except ImportError:
    print("Módulo 'main' não encontrado.")
    sys.exit(1)

import psycopg2

def alter_cloud_atlas_table():
    db_url = get_database_url()
    if not db_url:
        print("ERRO: DATABASE_URL ausente.")
        return
        
    print("Conectando ao banco Neon DB para alteração estrutural...")
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        # Adiciona a coluna is_deleted se ela não existir
        alter_table_sql = """
        ALTER TABLE atlas_cloud_items 
        ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
        """
        cur.execute(alter_table_sql)
        conn.commit()
        print(">> SUCESSO: Coluna 'is_deleted' acoplada à tabela 'atlas_cloud_items' para suporte à Lixeira!")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Erro fatal: {e}")

if __name__ == "__main__":
    alter_cloud_atlas_table()
