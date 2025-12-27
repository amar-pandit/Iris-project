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
let threeCore = { scene: null, camera: null, renderer: null, mesh: null };

/* ================= LIVE CLOCK ================= */
function startClock() {
    if (!clockEl) return;

    function tick() {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, "0");
        const m = String(now.getMinutes()).padStart(2, "0");
        const s = String(now.getSeconds()).padStart(2, "0");
        clockEl.textContent = `${h}:${m}:${s}`;
    }

    tick();
    setInterval(tick, 1000);
}

/* ================= THREE.JS ================= */
function initThree() {
    const container = document.getElementById("viewport");
    const canvas = document.getElementById("three-canvas");

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );

    const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true
    });

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
                backgroundColor: "rgba(0,242,255,0.2)"
            }]
        },
        options: {
            plugins: { legend: { display: false } }
        }
    });
}

/* ================= MAIN LOGIC ================= */
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

        const color = speciesData[mlSpecies].color;

        /* ===== TEXT ===== */
        speciesTitleEl.textContent = mlSpecies.split("-")[1];
        speciesTitleEl.style.color = color;
        hudNameEl.textContent = mlSpecies.toUpperCase();

        /* ===== HARMONY SCORE ===== */
        const probs = data.probabilities;
        const harmony = Math.round(
            Math.max(probs.setosa, probs.versicolor, probs.virginica) * 100
        );
        harmonyEl.textContent = harmony;

        /* ===== DIVERSITY INDEX ===== */
        charts.prob.data.datasets[0].data = [
            probs.setosa,
            probs.versicolor,
            probs.virginica
        ];
        charts.prob.update();

        /* ===== RADAR ===== */
        const base = canonicalFeatures[mlSpecies];
        charts.radar.data.datasets[0].data = base;
        charts.radar.data.datasets[0].borderColor = color;
        charts.radar.data.datasets[0].backgroundColor = color + "33";
        charts.radar.update();

        /* ===== 3D SCALE (SLIDER + CANONICAL BLEND) ===== */
        const [slB, swB, plB, pwB] = base;
        const blend = 0.35;

        const scalePL = pl * (1 - blend) + plB * blend;
        const scaleSW = sw * (1 - blend) + swB * blend;
        const scalePW = pw * (1 - blend) + pwB * blend;

        threeCore.mesh.scale.set(
            1 + scalePL * 0.05,
            1 + scaleSW * 0.05,
            1 + scalePW * 0.05
        );

        threeCore.mesh.material.color.setStyle(color);
        threeCore.mesh.material.needsUpdate = true;
    });
}

/* ================= BUTTONS ================= */
window.saveSpecimen = function () {
    alert("✅ Specimen archived successfully!");
};

window.runAnalysis = function () {
    document.getElementById("ai-report").innerText =
        "AI Analysis Complete. Specimen shows stable morphology with high confidence.";
};

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
