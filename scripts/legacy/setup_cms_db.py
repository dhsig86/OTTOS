import sys
import os

# Adiciona o diretório atual para importar funções do arquivo main
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from ml_pipeline.main import get_database_url
except ImportError:
    print("Módulo 'main' não encontrado. Verifique os caminhos.")
    sys.exit(1)

import psycopg2

def setup_clinical_cases_table():
    db_url = get_database_url()
    if not db_url:
        print("ERRO: DATABASE_URL não encontrada localmente/no .env")
        return
        
    print("Conectando ao banco Neon DB para criar a estrutura da Gen 4.0...")
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        # Cria a tabela de casos clínicos com suporte a JSONB para alta performance
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS clinical_cases (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            clinical_history TEXT,
            primary_diagnosis VARCHAR(255),
            patient_demographics JSONB,
            taxonomies JSONB,
            media_urls JSONB,
            svg_json TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_deleted BOOLEAN DEFAULT FALSE
        );
        """
        cur.execute(create_table_sql)
        conn.commit()
        print(">> SUCESSO: Tabela 'clinical_cases' verificada/criada no Neon PostgreSQL!")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Erro fatal ao comunicar com Banco: {e}")

if __name__ == "__main__":
    setup_clinical_cases_table()
