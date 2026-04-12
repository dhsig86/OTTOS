import requests

def test():
    with open("public/images/atlas_v3/Normal_1.jpg", "rb") as f:
        r = requests.post("http://127.0.0.1:8000/api/predict", files={"file": f})
        print(r.status_code, r.text)

if __name__ == "__main__":
    test()
