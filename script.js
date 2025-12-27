/* ================= BACKEND ================= */
const BACKEND_URL = "https://iris-project-b4fp.onrender.com/predict";

/* ================= GLOBAL ================= */
let requestId = 0;

const canonicalFeatures = {
    "Iris-setosa":     [5.01, 3.43, 1.46, 0.25],
    "Iris-versicolor": [5.94, 2.77, 4.26, 1.33],
    "Iris-virginica":  [6.59, 2.97, 5.55, 2.03]
};

const speciesData = {
    "Iris-setosa": { color: "#00f2ff" },
    "Iris-versicolor": { color: "#7a3cff" },
    "Iris-virginica": { color: "#ff2e88" }
};

/* ================= DOM ================= */
let slEl, swEl, plEl, pwEl;
let vSl, vSw, vPl, vPw;
let harmonyEl, speciesTitleEl, hudNameEl, clockEl;

/* ================= CHARTS / THREE ================= */
let charts = {};
let threeCore = {};

/* ================= LIVE CLOCK ================= */
function startClock() {
    function tick() {
        const d = new Date();
        clockEl.textContent =
            `${String(d.getHours()).padStart(2, "0")}:` +
            `${String(d.getMinutes()).padStart(2, "0")}:` +
            `${String(d.getSeconds()).padStart(2, "0")}`;
    }
    tick();
    setInterval(tick, 1000);
}

/* ================= THREE.JS ================= */
function initThree() {
    const canvas = document.getElementById("three-canvas");
    const container = document.getElementById("viewport");

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);

    scene.add(new THREE.AmbientLight(0xffffff, 0.9));

    const mesh = new THREE.Mesh(
        new THREE.IcosahedronGeometry(2, 1),
        new THREE.MeshStandardMaterial({
            color: "#00f2ff",
            transparent: true,
            opacity: 0.85
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

    charts.radar = new Chart(document.getElementById("radarChart"), {
        type: "radar",
        data: {
            labels: ["SL", "SW", "PL", "PW"],
            datasets: [{
                data: [5.01, 3.43, 1.46, 0.25],
                borderColor: "#00f2ff",
                backgroundColor: "rgba(0,242,255,0.25)"
            }]
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

    vSl.textContent = sl;
    vSw.textContent = sw;
    vPl.textContent = pl;
    vPw.textContent = pw;

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
    .then(r => r.json())
    .then(data => {
        if (currentRequest !== requestId) return;

        const map = {
            0: "Iris-setosa",
            1: "Iris-versicolor",
            2: "Iris-virginica"
        };

        const mlSpecies = map[data.prediction];
        if (!mlSpecies) return;

        const color = speciesData[mlSpecies].color;
        const probs = data.probabilities;

        /* ===== TEXT ===== */
        hudNameEl.textContent = mlSpecies.toUpperCase();
        speciesTitleEl.textContent = mlSpecies.split("-")[1];
        speciesTitleEl.style.color = color;

        /* ===== HARMONY ===== */
        harmonyEl.textContent = Math.round(
            Math.max(probs.setosa, probs.versicolor, probs.virginica) * 100
        );

        /* ===== DIVERSITY GRAPH (FIXED) ===== */
        charts.prob.data.datasets[0].data = [
            Number(probs.setosa.toFixed(2)),
            Number(probs.versicolor.toFixed(2)),
            Number(probs.virginica.toFixed(2))
        ];
        charts.prob.update();

        /* ===== RADAR ===== */
        const base = canonicalFeatures[mlSpecies];
        charts.radar.data.datasets[0].data = base;
        charts.radar.data.datasets[0].borderColor = color;
        charts.radar.data.datasets[0].backgroundColor = color + "44";
        charts.radar.update();

        /* ===== 3D SCALE ===== */
        const blend = 0.35;
        threeCore.mesh.scale.set(
            1 + (pl * (1 - blend) + base[2] * blend) * 0.05,
            1 + (sw * (1 - blend) + base[1] * blend) * 0.05,
            1 + (pw * (1 - blend) + base[3] * blend) * 0.05
        );

        /* ===== 3D COLOR (FIXED) ===== */
        threeCore.mesh.material.dispose();
        threeCore.mesh.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(color),
            transparent: true,
            opacity: 0.85
        });
    });
}

/* ================= BUTTONS ================= */
window.saveSpecimen = () => alert("✅ Specimen archived successfully!");
window.runAnalysis = () =>
    document.getElementById("ai-report").innerText =
        "AI Analysis Complete. Morphology stable with high confidence.";

/* ================= INIT ================= */
window.addEventListener("DOMContentLoaded", () => {
    slEl = document.getElementById("sl");
    swEl = document.getElementById("sw");
    plEl = document.getElementById("pl");
    pwEl = document.getElementById("pw");

    vSl = document.getElementById("v-sl");
    vSw = document.getElementById("v-sw");
    vPl = document.getElementById("v-pl");
    vPw = document.getElementById("v-pw");

    harmonyEl = document.getElementById("harmony-score");
    speciesTitleEl = document.getElementById("species-title");
    hudNameEl = document.getElementById("hud-name");
    clockEl = document.getElementById("clock");

    initThree();
    initCharts();
    startClock();
    sync();

    [slEl, swEl, plEl, pwEl].forEach(el =>
        el.addEventListener("input", sync)
    );
});
