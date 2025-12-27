from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pickle

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

model = pickle.load(open("model.pkl", "rb"))

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
