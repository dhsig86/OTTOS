import psycopg2
from ml_pipeline.main import get_database_url

def dump():
    db_url = get_database_url()
    conn = psycopg2.connect(db_url, sslmode='require')
    cur = conn.cursor()
    cur.execute("SELECT id, title, svg_json FROM clinical_cases WHERE svg_json IS NOT NULL LIMIT 1")
    rows = cur.fetchall()
    print("Row:", rows)
    conn.close()

if __name__ == "__main__":
    dump()
