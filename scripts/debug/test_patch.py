import requests

def test():
    payload = {"svg_json": '[{"id": "test", "label": "Cone de Luz", "path": "M 10 10"}]'}
    r = requests.patch("http://127.0.0.1:8000/api/cms/cases/15/svg", json=payload)
    print(r.status_code, r.text)

if __name__ == "__main__":
    test()
