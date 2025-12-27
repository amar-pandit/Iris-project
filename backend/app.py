from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pickle
import os

app = FastAPI(title="Iris ML Backend")

# ----------------------------
# CORS (Frontend connect ke liye)
# ----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------
# Load model
# ----------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")

with open(MODEL_PATH, "rb") as f:
    model = pickle.load(f)

# ----------------------------
# Health check
# ----------------------------
@app.get("/")
def root():
    return {"status": "Backend is live"}

# ----------------------------
# Prediction API
# ----------------------------
@app.post("/predict")
def predict(data: dict):
    X = [[
        data["sepal_length"],
        data["sepal_width"],
        data["petal_length"],
        data["petal_width"]
    ]]

    pred = int(model.predict(X)[0])
    probs = model.predict_proba(X)[0]

    return {
        "prediction": pred,   # 0 / 1 / 2
        "probabilities": {
            "setosa": float(probs[0]),
            "versicolor": float(probs[1]),
            "virginica": float(probs[2])
        }
    }
