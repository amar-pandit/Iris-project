/* ================= BACKEND ================= */
const BACKEND_URL = "https://iris-project-b4fp.onrender.com/predict";

/* ================= GLOBAL ================= */
let requestId = 0;

/* ================= SPECIES META ================= */
const speciesMeta = {
    "Iris-setosa": {
        color: "#00f2ff",
        radar: [5.01, 3.43, 1.46, 0.25]
    },
    "Iris-versicolor": {
        color: "#7a3cff",
        radar: [5.94, 2.77, 4.26, 1.33]
    },
    "Iris-virginica": {
        color: "#ff2e88",
        radar: [6.59, 2.97, 5.55, 2.03]
    }
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

/* ================= THREE ================= */
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

let mesh = new THREE.Mesh(
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

/* ================= MAIN ================= */
function sync() {
    vsl.innerText = sl.value;
    vsw.innerText = sw.value;
    vpl.innerText = pl.value;
    vpw.innerText = pw.value;

    const id = ++requestId;

    fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            sepal_length: +sl.value,
            sepal_width: +sw.value,
            petal_length: +pl.value,
            petal_width: +pw.value
        })
    })
    .then(r => r.json())
    .then(data => {
        if (id !== requestId) return;

        const map = ["Iris-setosa", "Iris-versicolor", "Iris-virginica"];
        const species = map[data.prediction];
        const meta = speciesMeta[species];
        const probs = data.probabilities;

        /* ===== TEXT ===== */
        speciesEl.innerText = species.split("-")[1];
        speciesEl.style.color = meta.color;
        hudEl.innerText = species.toUpperCase();

        /* ===== HARMONY ===== */
        harmonyEl.innerText = Math.round(
            Math.max(probs.setosa, probs.versicolor, probs.virginica) * 100
        );

        /* ===== GRAPH (THIS WILL MOVE) ===== */
        probChart.data.datasets[0].data = [
            probs.setosa,
            probs.versicolor,
            probs.virginica
        ];
        probChart.update();

        /* ===== RADAR ===== */
        radarChart.data.datasets[0].data = meta.radar;
        radarChart.data.datasets[0].borderColor = meta.color;
        radarChart.data.datasets[0].backgroundColor = meta.color + "55";
        radarChart.update();

        /* ===== 3D SIZE ===== */
        mesh.scale.set(
            1 + pl.value * 0.05,
            1 + sw.value * 0.05,
            1 + pw.value * 0.05
        );

        /* ===== 3D COLOR (FORCED) ===== */
        mesh.material.dispose();
        mesh.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(meta.color)
        });
    });
}

/* ================= EVENTS ================= */
[sl, sw, pl, pw].forEach(el => el.addEventListener("input", sync));
sync();

/* ================= BUTTONS ================= */
window.saveSpecimen = () => alert("Specimen archived");
window.runAnalysis = () =>
    document.getElementById("ai-report").innerText =
        "AI analysis complete. High confidence morphology.";
