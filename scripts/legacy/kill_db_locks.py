import psycopg2
from ml_pipeline.main import get_database_url

def kill_locks():
    db_url = get_database_url()
    conn = psycopg2.connect(db_url, sslmode='require')
    conn.autocommit = True
    cur = conn.cursor()
    # Terminate all connections/queries that are active for too long or idle in transaction
    cur.execute("""
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE state = 'idle in transaction' OR state = 'active'
        AND pid <> pg_backend_pid();
    """)
    terminated = cur.fetchall()
    print("Terminated DB Processes:", terminated)
    cur.close()
    conn.close()

if __name__ == "__main__":
    kill_locks()
