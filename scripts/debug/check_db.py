import psycopg2
from ml_pipeline.main import get_database_url

def check():
    db_url = get_database_url()
    conn = psycopg2.connect(db_url, sslmode='require')
    cur = conn.cursor()
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
    """)
    tables = cur.fetchall()
    print("Tables in NeonDB:", tables)
    conn.close()

if __name__ == "__main__":
    check()
