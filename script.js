/* ================= BACKEND URL =================
   🔴 IMPORTANT:
   Deploy ke baad is URL ko apne Render URL se replace karna
   Example:
   https://iris-backend-abc123.onrender.com/predict
================================================ */
const BACKEND_URL = "REPLACE_WITH_RENDER_URL/predict";

/* ================= DEBOUNCE ================= */
function debounce(fn, delay = 400) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

/* ================= TOAST ================= */
function toast(msg) {
    const t = document.createElement("div");
    t.innerText = msg;
    t.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.85);
        color: #fff;
        padding: 12px 28px;
        font-weight: 700;
        font-size: 0.8rem;
        border-radius: 30px;
        z-index: 9999;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    `;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
}

/* ================= GLOBAL ================= */
let charts = {};
let threeCore = { scene: null, camera: null, renderer: null, mesh: null };

const speciesData = {
    "Iris-setosa": { color: "#00f2ff" },
    "Iris-versicolor": { color: "#7000ff" },
    "Iris-virginica": { color: "#ff0070" }
};

/* ================= BACKEND CALL ================= */
async function fetchPrediction(sl, sw, pl, pw) {
    try {
        const res = await fetch(BACKEND_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                sepal_length: sl,
                sepal_width: sw,
                petal_length: pl,
                petal_width: pw
            })
        });
        return await res.json();
    } catch (err) {
        console.error("Backend not reachable");
        return null;
    }
}

/* ================= THREE.JS ================= */
function initThree() {
    const container = document.getElementById("viewport");
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );

    const renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById("three-canvas"),
        antialias: true,
        alpha: true
    });

    renderer.setSize(container.clientWidth, container.clientHeight);
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    const mesh = new THREE.Mesh(
        new THREE.IcosahedronGeometry(2, 1),
        new THREE.MeshStandardMaterial({
            color: 0x00f2ff,
            transparent: true,
            opacity: 0.7
        })
    );

    scene.add(mesh);
    camera.position.z = 7;

    threeCore = { scene, camera, renderer, mesh };

    (function animate() {
        requestAnimationFrame(animate);
        mesh.rotation.y += 0.003;
        renderer.render(scene, camera);
    })();
}

/* ================= CHARTS ================= */
function initCharts() {
    charts.prob = new Chart(document.getElementById("probChart"), {
        type: "bar",
        data: {
            labels: ["Setosa", "Versicolor", "Virginica"],
            datasets: [{ data: [0, 0, 0] }]
        },
        options: {
            indexAxis: "y",
            plugins: { legend: { display: false } }
        }
    });

    charts.radar = new Chart(document.getElementById("radarChart"), {
        type: "radar",
        data: {
            labels: ["SL", "SW", "PL", "PW"],
            datasets: [{ data: [5.1, 3.5, 1.4, 0.2] }]
        },
        options: { plugins: { legend: { display: false } } }
    });
}

/* ================= MAIN SYNC ================= */
function sync() {
    const sl = +slEl.value;
    const sw = +swEl.value;
    const pl = +plEl.value;
    const pw = +pwEl.value;

    vSl.innerText = sl;
    vSw.innerText = sw;
    vPl.innerText = pl;
    vPw.innerText = pw;

    charts.radar.data.datasets[0].data = [sl, sw, pl, pw];
    charts.radar.update();

    fetchPrediction(sl, sw, pl, pw).then((data) => {
        if (!data) return;

        const pred = data.prediction;
        const probs = data.probabilities;
        const curr = speciesData[pred];

        document.getElementById("hud-name").innerText = pred.toUpperCase();
        document.getElementById("species-title").innerText = pred.split("-")[1];
        document.getElementById("species-title").style.color = curr.color;

        charts.prob.data.datasets[0].data = [
            probs.setosa,
            probs.versicolor,
            probs.virginica
        ];
        charts.prob.update();

        threeCore.mesh.material.color.set(curr.color);
    });
}

const debouncedSync = debounce(sync, 400);

/* ================= BUTTON ================= */
window.saveSpecimen = () => toast("Archived (Local)");

/* ================= INIT ================= */
window.onload = () => {
    initThree();
    initCharts();

    ["sl", "sw", "pl", "pw"].forEach(id =>
        document.getElementById(id).addEventListener("input", debouncedSync)
    );
};

/* ================= DOM ================= */
const slEl = document.getElementById("sl");
const swEl = document.getElementById("sw");
const plEl = document.getElementById("pl");
const pwEl = document.getElementById("pw");

const vSl = document.getElementById("v-sl");
const vSw = document.getElementById("v-sw");
const vPl = document.getElementById("v-pl");
const vPw = document.getElementById("v-pw");
