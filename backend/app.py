from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pickle
import os

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model safely
MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")

with open(MODEL_PATH, "rb") as f:
    model = pickle.load(f)

@app.get("/")
def root():
    return {"status": "Backend is live"}

@app.post("/predict")
def predict(data: dict):
    X = [[
        data["sepal_length"],
        data["sepal_width"],
        data["petal_length"],
        data["petal_width"]
    ]]

    pred = model.predict(X)[0]
    probs = model.predict_proba(X)[0]

    return {
        "prediction": pred,
        "probabilities": {
            "setosa": float(probs[0]),
            "versicolor": float(probs[1]),
            "virginica": float(probs[2])
        }
    }
