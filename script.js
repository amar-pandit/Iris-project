/* ================= BACKEND URL ================= */
const BACKEND_URL = "https://iris-project-b4fp.onrender.com/predict";

/* ================= RACE CONDITION FIX ================= */
let requestId = 0;

/* ================= CANONICAL FEATURES (CSV MEAN BASED) ================= */
const canonicalFeatures = {
    "Iris-setosa":     [5.01, 3.43, 1.46, 0.25],
    "Iris-versicolor": [5.94, 2.77, 4.26, 1.33],
    "Iris-virginica":  [6.59, 2.97, 5.55, 2.03]
};

/* ================= GLOBAL ================= */
let charts = {};
let threeCore = { scene: null, camera: null, renderer: null, mesh: null };

const speciesData = {
    "Iris-setosa": { color: "#00f2ff" },
    "Iris-versicolor": { color: "#7000ff" },
    "Iris-virginica": { color: "#ff0070" }
};

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
            datasets: [{ data: [5.01, 3.43, 1.46, 0.25] }]
        },
        options: { plugins: { legend: { display: false } } }
    });
}

/* ================= MAIN LOGIC ================= */
function sync() {
    const sl = +slEl.value;
    const sw = +swEl.value;
    const pl = +plEl.value;
    const pw = +pwEl.value;

    vSl.innerText = sl;
    vSw.innerText = sw;
    vPl.innerText = pl;
    vPw.innerText = pw;

    /* ---------- BACKEND CALL (LATEST ONLY) ---------- */
    const currentRequest = ++requestId;

    fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            sepal_length: sl,
            sepal_width: sw,
            petal_length: pl,
            petal_width: pw
        })
    })
    .then(res => res.json())
    .then(data => {
        if (currentRequest !== requestId) return;

        const map = {
            0: "Iris-setosa",
            1: "Iris-versicolor",
            2: "Iris-virginica"
        };

        const mlSpecies = map[data.prediction];
        if (!mlSpecies) return;

        const mlCurr = speciesData[mlSpecies];

        /* ---------- TEXT + COLOR ---------- */
        document.getElementById("hud-name").innerText = mlSpecies.toUpperCase();
        document.getElementById("species-title").innerText = mlSpecies.split("-")[1];
        document.getElementById("species-title").style.color = mlCurr.color;

        /* ---------- CONFIDENCE ---------- */
        charts.prob.data.datasets[0].data = [
            data.probabilities.setosa,
            data.probabilities.versicolor,
            data.probabilities.virginica
        ];
        charts.prob.update();

        /* ---------- CANONICAL LOOK (CSV BASED) ---------- */
        const features = canonicalFeatures[mlSpecies];
        if (!features) return;

        charts.radar.data.datasets[0].data = features;
        charts.radar.data.datasets[0].borderColor = mlCurr.color;
        charts.radar.update();

        const [slB, swB, plB, pwB] = features;
        threeCore.mesh.scale.set(
    1 + plB * 0.045,
    1 + swB * 0.045,
    1 + pwB * 0.045
);

        threeCore.mesh.material.color.set(mlCurr.color);
    })
    .catch(() => {});
}

/* ================= INIT ================= */
window.onload = () => {
    initThree();
    initCharts();
    sync();

    ["sl", "sw", "pl", "pw"].forEach(id =>
        document.getElementById(id).addEventListener("input", sync)
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
