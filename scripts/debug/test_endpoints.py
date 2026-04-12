import requests

def test_predict():
    print("Testing /api/predict")
    try:
        # Create a dummy image
        with open("dummy.jpg", "wb") as f:
            f.write(b"fffff")  # Not a real image, but should hit the endpoint
            
        with open("dummy.jpg", "rb") as f:
            files = {"file": ("dummy.jpg", f, "image/jpeg")}
            r = requests.post("https://otto-atlas.onrender.com/api/predict", files=files)
            print("Predict response:", r.status_code, r.text[:200])
    except Exception as e:
        print("Error testing predict:", e)

def test_donate():
    print("\nTesting /api/curadoria/donate without clinical_case (simulating older frontend version)")
    import requests
    try:
        with open("dummy.jpg", "rb") as f:
            files = [("files", ("dummy.jpg", f, "image/jpeg"))]
            data = {"diagnostic": "OMA"} # Missing clinical_case entirely!
            r = requests.post("https://otto-atlas.onrender.com/api/curadoria/donate", files=files, data=data)
            print("Donate response:", r.status_code, r.text[:200])
    except Exception as e:
        print("Error testing donate:", e)

if __name__ == "__main__":
    test_donate()
