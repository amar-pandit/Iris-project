/* ================= BACKEND URL ================= */
const BACKEND_URL = "https://iris-project-b4fp.onrender.com/predict";

/* ================= GLOBAL ================= */
let charts = {};
let threeCore = { scene: null, camera: null, renderer: null, mesh: null };

const speciesData = {
    "Iris-setosa": { color: "#00f2ff", confidence: [0.99, 0.01, 0.01] },
    "Iris-versicolor": { color: "#7000ff", confidence: [0.05, 0.90, 0.05] },
    "Iris-virginica": { color: "#ff0070", confidence: [0.01, 0.05, 0.94] }
};

/* ================= THREE.JS ================= */
function initThree() {
    const container = document.getElementById("viewport");
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
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
            datasets: [{ data: [0.99, 0.01, 0.01] }]
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

    // Local fallback logic (safe)
    let species = "Iris-setosa";
    if (pl > 2.2 && pl <= 4.9) species = "Iris-versicolor";
    else if (pl > 4.9) species = "Iris-virginica";

    const curr = speciesData[species];

    // UI update (local)
    document.getElementById("hud-name").innerText = species.toUpperCase();
    document.getElementById("species-title").innerText = species.split("-")[1];
    document.getElementById("species-title").style.color = curr.color;

    charts.radar.data.datasets[0].data = [sl, sw, pl, pw];
    charts.radar.data.datasets[0].borderColor = curr.color;
    charts.radar.update();

    charts.prob.data.datasets[0].data = curr.confidence;
    charts.prob.update();

    threeCore.mesh.material.color.set(curr.color);

    /* ================= FASTAPI ML OVERRIDE ================= */
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
        const map = {
            0: "Iris-setosa",
            1: "Iris-versicolor",
            2: "Iris-virginica"
        };

        const mlSpecies = map[data.prediction];
        if (!mlSpecies) return;

        const mlCurr = speciesData[mlSpecies];

        document.getElementById("hud-name").innerText = mlSpecies.toUpperCase();
        document.getElementById("species-title").innerText = mlSpecies.split("-")[1];
        document.getElementById("species-title").style.color = mlCurr.color;

        charts.prob.data.datasets[0].data = [
            data.probabilities.setosa,
            data.probabilities.versicolor,
            data.probabilities.virginica
        ];
        charts.prob.update();

        charts.radar.data.datasets[0].borderColor = mlCurr.color;
        charts.radar.update();

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
