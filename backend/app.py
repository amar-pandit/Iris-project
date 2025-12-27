from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pickle
import os

app = FastAPI()

# 🔥 CORS — MUST BE AT TOP, BEFORE ROUTES
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://amar-pandit.github.io",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
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
        "prediction": pred,
        "probabilities": {
            "setosa": float(probs[0]),
            "versicolor": float(probs[1]),
            "virginica": float(probs[2])
        }
    }
