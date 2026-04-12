from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
import psycopg2
import json

from ml_pipeline.main import get_database_url, setup_cloudinary, upload_to_cloudinary_rest

router = APIRouter(prefix="/api/cms", tags=["CMS Gen 4.0"])

class ClinicalCasePayload(BaseModel):
    title: str
    clinical_history: str = ""
    primary_diagnosis: str = ""
    patient_demographics: dict = {}
    taxonomies: list = []
    media_urls: list = []
    svg_json: str = "[]"

def get_db_connection():
    db_url = get_database_url()
    if not db_url:
        raise HTTPException(status_code=500, detail="Database URL não configurada")
    return psycopg2.connect(db_url, sslmode='require')

@router.get("/cases")
async def list_active_cases():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT id, title, clinical_history, primary_diagnosis, 
                   patient_demographics, taxonomies, media_urls, svg_json, created_at, updated_at
            FROM clinical_cases WHERE is_deleted = FALSE ORDER BY created_at DESC
        """)
        rows = cur.fetchall()
        cur.close()
        conn.close()
        
        def safe_json(val, default):
            if isinstance(val, (dict, list)): return val
            if not val: return default
            try: return json.loads(val)
            except: return default

        cases = []
        for r in rows:
            cases.append({
                "id": r[0],
                "title": r[1],
                "clinical_history": r[2],
                "primary_diagnosis": r[3],
                "patient_demographics": safe_json(r[4], {}),
                "taxonomies": safe_json(r[5], []),
                "media_urls": safe_json(r[6], []),
                "svg_json": r[7],
                "created_at": r[8],
                "updated_at": r[9]
            })
        return {"success": True, "cases": cases}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/cases")
async def create_case(case: ClinicalCasePayload):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        query = """
            INSERT INTO clinical_cases 
            (title, clinical_history, primary_diagnosis, patient_demographics, taxonomies, media_urls, svg_json)
            VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id
        """
        cur.execute(query, (
            case.title, 
            case.clinical_history, 
            case.primary_diagnosis, 
            json.dumps(case.patient_demographics),
            json.dumps(case.taxonomies),
            json.dumps(case.media_urls),
            case.svg_json
        ))
        new_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        return {"success": True, "id": new_id, "message": "Caso criado com sucesso"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/cases/{case_id}")
async def get_case(case_id: int):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT id, title, clinical_history, primary_diagnosis, 
                   patient_demographics, taxonomies, media_urls, svg_json, created_at, updated_at
            FROM clinical_cases WHERE id = %s AND is_deleted = FALSE
        """, (case_id,))
        r = cur.fetchone()
        cur.close()
        conn.close()
        
        if not r:
            raise HTTPException(status_code=404, detail="Caso não encontrado")
            
        def safe_json(val, default):
            if isinstance(val, (dict, list)): return val
            if not val: return default
            try: return json.loads(val)
            except: return default
            
        case = {
            "id": r[0], "title": r[1], "clinical_history": r[2], "primary_diagnosis": r[3],
            "patient_demographics": safe_json(r[4], {}), "taxonomies": safe_json(r[5], []), "media_urls": safe_json(r[6], []), 
            "svg_json": r[7], "created_at": r[8], "updated_at": r[9]
        }
        return {"success": True, "case": case}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/cases/{case_id}")
async def update_case(case_id: int, case: ClinicalCasePayload):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        query = """
            UPDATE clinical_cases 
            SET title = %s, clinical_history = %s, primary_diagnosis = %s, 
                patient_demographics = %s, taxonomies = %s, media_urls = %s, 
                svg_json = %s, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s AND is_deleted = FALSE
        """
        cur.execute(query, (
            case.title, case.clinical_history, case.primary_diagnosis, 
            json.dumps(case.patient_demographics), json.dumps(case.taxonomies), 
            json.dumps(case.media_urls), case.svg_json, case_id
        ))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Caso não encontrado")
            
        conn.commit()
        cur.close()
        conn.close()
        return {"success": True, "message": "Caso atualizado com sucesso"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class SVGPayload(BaseModel):
    svg_json: str

@router.patch("/cases/{case_id}/svg")
async def update_svg(case_id: int, payload: SVGPayload):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        query = "UPDATE clinical_cases SET svg_json = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s AND is_deleted = FALSE"
        cur.execute(query, (payload.svg_json, case_id))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Caso não encontrado")
        conn.commit()
        cur.close()
        conn.close()
        return {"success": True, "message": "SVG salvo na V4 com sucesso"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/cases/{case_id}")
async def delete_case(case_id: int):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("UPDATE clinical_cases SET is_deleted = TRUE WHERE id = %s", (case_id,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Caso não encontrado")
        conn.commit()
        cur.close()
        conn.close()
        return {"success": True, "message": "Caso deletado fisicamente (Soft Delete)"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload")
async def upload_media(file: UploadFile = File(...)):
    if not setup_cloudinary():
        raise HTTPException(status_code=500, detail="Cloudinary não configurado")
        
    try:
        contents = await file.read()
        secure_url = upload_to_cloudinary_rest(contents, "otoscopia_atlas_gen4")
        if not secure_url:
            raise HTTPException(status_code=500, detail="Falha ao obter URL segura do Cloudinary")
            
        return {"success": True, "url": secure_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
