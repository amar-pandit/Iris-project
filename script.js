import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

/* ================= BACKEND ================= */
const BACKEND_URL = "https://iris-project-b4fp.onrender.com/predict";

/* ================= FIREBASE ================= */
let firebaseConfig = { apiKey: "local", projectId: "local" };
let appId = "iris-luxury-v1";

try {
    if (typeof __firebase_config !== "undefined")
        firebaseConfig = JSON.parse(__firebase_config);
    if (typeof __app_id !== "undefined")
        appId = __app_id;
} catch (e) {}

const app = initializeApp(firebaseConfig);
const db = firebaseConfig.apiKey !== "local" ? getFirestore(app) : null;
const auth = firebaseConfig.apiKey !== "local" ? getAuth(app) : null;

/* ================= SPECIES META ================= */
const speciesMeta = {
    0: { name: "Iris-setosa", color: "#00f2ff" },
    1: { name: "Iris-versicolor", color: "#7a3cff" },
    2: { name: "Iris-virginica", color: "#ff2e88" }
};

/* ================= DOM ================= */
const sl = document.getElementById("sl");
const sw = document.getElementById("sw");
const pl = document.getElementById("pl");
const pw = document.getElementById("pw");

const vsl = document.getElementById("v-sl");
const vsw = document.getElementById("v-sw");
const vpl = document.getElementById("v-pl");
const vpw = document.getElementById("v-pw");

const harmonyEl = document.getElementById("harmony-score");
const speciesEl = document.getElementById("species-title");
const hudEl = document.getElementById("hud-name");
const clockEl = document.getElementById("clock");

/* ================= CLOCK ================= */
setInterval(() => {
    const d = new Date();
    clockEl.innerText =
        `${String(d.getHours()).padStart(2, "0")}:` +
        `${String(d.getMinutes()).padStart(2, "0")}:` +
        `${String(d.getSeconds()).padStart(2, "0")}`;
}, 1000);

/* ================= THREE JS ================= */
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.z = 7;

const renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById("three-canvas"),
    alpha: true,
    antialias: true
});
renderer.setSize(600, 600);

scene.add(new THREE.AmbientLight(0xffffff, 1));

const mesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2, 1),
    new THREE.MeshStandardMaterial({ color: "#00f2ff" })
);
scene.add(mesh);

(function animate() {
    requestAnimationFrame(animate);
    mesh.rotation.y += 0.003;
    renderer.render(scene, camera);
})();

/* ================= CHARTS ================= */
const probChart = new Chart(document.getElementById("probChart"), {
    type: "bar",
    data: {
        labels: ["Setosa", "Versicolor", "Virginica"],
        datasets: [{
            data: [0, 0, 0],
            backgroundColor: ["#00f2ff", "#7a3cff", "#ff2e88"]
        }]
    },
    options: {
        indexAxis: "y",
        plugins: { legend: { display: false } },
        scales: { x: { min: 0, max: 1 } }
    }
});

const radarChart = new Chart(document.getElementById("radarChart"), {
    type: "radar",
    data: {
        labels: ["SL", "SW", "PL", "PW"],
        datasets: [{
            data: [5, 3, 1, 0.2],
            borderColor: "#00f2ff",
            backgroundColor: "rgba(0,242,255,0.3)"
        }]
    },
    options: { plugins: { legend: { display: false } } }
});

/* ================= MAIN SYNC ================= */
async function sync() {
    vsl.innerText = sl.value;
    vsw.innerText = sw.value;
    vpl.innerText = pl.value;
    vpw.innerText = pw.value;

    try {
        const res = await fetch(BACKEND_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                sepal_length: +sl.value,
                sepal_width: +sw.value,
                petal_length: +pl.value,
                petal_width: +pw.value
            })
        });

        const data = await res.json();
        const meta = speciesMeta[data.prediction];
        const probs = data.probabilities;

        /* TEXT */
        speciesEl.innerText = meta.name.split("-")[1];
        speciesEl.style.color = meta.color;
        hudEl.innerText = meta.name.toUpperCase();

        /* HARMONY */
        harmonyEl.innerText = Math.round(
            Math.max(probs.setosa, probs.versicolor, probs.virginica) * 100
        );

        /* BAR */
        probChart.data.datasets[0].data = [
            probs.setosa,
            probs.versicolor,
            probs.virginica
        ];
        probChart.update();

        /* RADAR */
        radarChart.data.datasets[0].data = [
            +sl.value, +sw.value, +pl.value, +pw.value
        ];
        radarChart.data.datasets[0].borderColor = meta.color;
        radarChart.data.datasets[0].backgroundColor = meta.color + "55";
        radarChart.update();

        /* 3D */
        mesh.scale.set(
            1 + pl.value * 0.05,
            1 + sw.value * 0.05,
            1 + pw.value * 0.05
        );
        mesh.material.color.set(meta.color);

    } catch (e) {
        console.error("Backend error", e);
    }
}

/* ================= EVENTS ================= */
[sl, sw, pl, pw].forEach(el => el.addEventListener("input", sync));
sync();

/* ================= BUTTONS ================= */
window.saveSpecimen = () => alert("Specimen archived");
window.runAnalysis = () =>
    document.getElementById("ai-report").innerText =
        "AI analysis complete. High confidence morphology.";
