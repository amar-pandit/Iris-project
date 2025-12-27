# 🌸 AETHER IRIS  
### Interactive Iris Flower Classification & Visualization Studio

AETHER IRIS is a **full-stack Machine Learning web application** that classifies Iris flowers in real time and visualizes predictions using **interactive graphs and 3D geometry**.

This project demonstrates **end-to-end ML deployment**, from data and model training to a modern, production-style frontend.

---

## 🔗 Live Demo

- 🌐 **Frontend (GitHub Pages)**  
  https://amar-pandit.github.io/iris-project/

- ⚙️ **Backend API (FastAPI on Render)**  
  https://iris-project-b4fp.onrender.com/docs

---

## ✨ Key Features

- 🎚️ **Interactive sliders** for Iris features  
  (Sepal Length, Sepal Width, Petal Length, Petal Width)

- 🤖 **Machine Learning classification**
  - Iris Setosa
  - Iris Versicolor
  - Iris Virginica

- 🎨 **Dynamic 3D visualization (Three.js)**
  - Shape size changes with input proportions
  - Color changes based on predicted species

- 📊 **Diversity Index (Probability Bar Chart)**
  - Displays confidence scores for all three classes

- 🕸️ **Radar Chart**
  - Shows morphological balance using canonical feature values

- 🔢 **Harmony Score**
  - Derived from ML confidence and user input proportions

- ⏱️ **Live system clock**

- 🧠 **AI Interpretation panel**
  - Explains prediction confidence in simple language

---

## 🧠 Machine Learning Details

- **Dataset:** Iris Dataset (150 samples)
- **Features:**
  - Sepal Length
  - Sepal Width
  - Petal Length
  - Petal Width
- **Model:** Scikit-learn classifier
- **Output:**
  - Predicted class (0 / 1 / 2)
  - Class probabilities

The trained model is saved using **pickle** and loaded into a **FastAPI backend**.

---

## 🛠️ Tech Stack

### Frontend
- HTML5
- CSS3 (Custom UI styling)
- JavaScript (ES Modules)
- **Three.js** — 3D visualization
- **Chart.js** — Bar & Radar charts

### Backend
- Python
- FastAPI
- Scikit-learn
- NumPy
- Pickle

### Deployment
- **Frontend:** GitHub Pages
- **Backend:** Render

---

## 📁 Project Structure

```text
iris-project/
├── backend/
│   ├── app.py
│   ├── model.pkl
│   ├── requirements.txt
│   └── __pycache__/
├── data/
│   └── IRIS.csv
├── notebooks/
│   └── iris_model_training.ipynb
├── index.html
├── script.js
├── style.css
└── README.md
🚀 How the System Works
User adjusts feature sliders on the frontend

Data is sent to FastAPI /predict endpoint

ML model predicts species and probabilities

Frontend updates in real time:

Species name & color

3D object size & color

Diversity Index bar chart

Radar chart

Harmony score

📡 API Usage
Endpoint
POST /predict

Request Body
json
Copy code
{
  "sepal_length": 5.1,
  "sepal_width": 3.5,
  "petal_length": 1.4,
  "petal_width": 0.2
}
Response
json
Copy code
{
  "prediction": 0,
  "probabilities": {
    "setosa": 0.98,
    "versicolor": 0.01,
    "virginica": 0.01
  }
}
⚙️ Run Locally
Backend
bash
Copy code
cd backend
pip install -r requirements.txt
uvicorn app:app --reload
Frontend
Open index.html using:

Live Server (VS Code), or

Any static file server

🎓 Learning Outcomes
End-to-end ML application development

Frontend–backend integration

CORS handling in production

Data-driven UI updates

3D visualization linked to ML outputs

Real-world deployment workflow

👤 Author
Amar Kumar Pandit
Machine Learning | Full-Stack Development | Data Science

⭐ Support
If you like this project:

⭐ Star the repository

🍴 Fork it

💬 Share feedback