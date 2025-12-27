/* ================== CONFIG ================== */
const BACKEND_URL = "https://iris-project-b4fp.onrender.com/predict";

/* ================== HELPERS ================== */
const $ = (id) => document.getElementById(id);

function normalize(val, min, max) {
  return (val - min) / (max - min);
}

/* ================== CLOCK ================== */
function startClock() {
  setInterval(() => {
    const d = new Date();
    $("clock").innerText = d.toLocaleTimeString();
  }, 1000);
}
startClock();

/* ================== SPECIES META ================== */
const speciesMeta = {
  "Iris-setosa": {
    color: "#22e6f2",
    base: [5.1, 3.5, 1.4, 0.2],
  },
  "Iris-versicolor": {
    color: "#8a5cff",
    base: [6.0, 2.8, 4.3, 1.3],
  },
  "Iris-virginica": {
    color: "#ff4f9a",
    base: [6.5, 3.0, 5.5, 2.0],
  },
};

/* ================== THREE.JS ================== */
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
camera.position.z = 6;

const renderer = new THREE.WebGLRenderer({
  canvas: $("three-canvas"),
  antialias: true,
  alpha: true,
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize($("viewport").clientWidth, $("viewport").clientHeight);

const geometry = new THREE.DodecahedronGeometry(1.5, 0);
const material = new THREE.MeshStandardMaterial({
  color: "#22e6f2",
  transparent: true,
  opacity: 0.9,
});
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const light = new THREE.DirectionalLight(0xffffff, 0.6);
light.position.set(5, 5, 5);
scene.add(light);

function animate() {
  requestAnimationFrame(animate);
  mesh.rotation.y += 0.003;
  renderer.render(scene, camera);
}
animate();

window.addEventListener("resize", () => {
  renderer.setSize($("viewport").clientWidth, $("viewport").clientHeight);
});

/* ================== CHARTS ================== */
// Probability (Diversity Index)
const probChart = new Chart($("probChart"), {
  type: "bar",
  data: {
    labels: ["Setosa", "Versicolor", "Virginica"],
    datasets: [
      {
        data: [0, 0, 0],
        backgroundColor: ["#22e6f2", "#8a5cff", "#ff4f9a"],
      },
    ],
  },
  options: {
    responsive: true,
    indexAxis: "y",
    scales: {
      x: { min: 0, max: 1 },
    },
    plugins: { legend: { display: false } },
  },
});

// Radar
const radarChart = new Chart($("radarChart"), {
  type: "radar",
  data: {
    labels: ["SL", "SW", "PL", "PW"],
    datasets: [
      {
        data: [0, 0, 0, 0],
        borderColor: "#22e6f2",
        backgroundColor: "rgba(34,230,242,0.15)",
        pointBackgroundColor: "#22e6f2",
      },
    ],
  },
  options: {
    responsive: true,
    scales: {
      r: {
        min: 0,
        max: 7,
        ticks: { display: false },
      },
    },
    plugins: { legend: { display: false } },
  },
});

/* ================== FETCH ================== */
async function predict(sl, sw, pl, pw) {
  const res = await fetch(BACKEND_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sepal_length: sl,
      sepal_width: sw,
      petal_length: pl,
      petal_width: pw,
    }),
  });
  return await res.json();
}

/* ================== SYNC UI ================== */
let reqId = 0;

async function sync() {
  const current = ++reqId;

  const sl = Number($("sl").value);
  const sw = Number($("sw").value);
  const pl = Number($("pl").value);
  const pw = Number($("pw").value);

  $("v-sl").innerText = sl.toFixed(1);
  $("v-sw").innerText = sw.toFixed(1);
  $("v-pl").innerText = pl.toFixed(1);
  $("v-pw").innerText = pw.toFixed(1);

  const data = await predict(sl, sw, pl, pw);
  if (current !== reqId) return;

  const map = {
    0: "Iris-setosa",
    1: "Iris-versicolor",
    2: "Iris-virginica",
  };
  const species = map[data.prediction];
  const meta = speciesMeta[species];
  const probs = data.probabilities;

  // Titles
  $("hud-name").innerText = species.toUpperCase();
  $("species-title").innerText = species.split("-")[1];
  $("species-title").style.color = meta.color;

  // Harmony score (simple)
  const harmony = Math.round(
    Math.max(probs.setosa, probs.versicolor, probs.virginica) * 100
  );
  $("harmony-score").innerText = harmony;

  // ===== 3D SCALE (PROPER PROPORTION) =====
  const nPL = normalize(pl, 1.0, 7.0);
  const nSW = normalize(sw, 2.0, 4.5);
  const nPW = normalize(pw, 0.1, 2.5);

  mesh.scale.set(
    1 + nPL * 1.2,
    1 + nSW * 0.8,
    1 + nPW * 1.0
  );

  // ===== 3D COLOR (FINAL FIX) =====
  mesh.material.color.set(meta.color);
  mesh.material.needsUpdate = true;

  // ===== PROBABILITY GRAPH =====
  probChart.data.datasets[0].data = [
    probs.setosa,
    probs.versicolor,
    probs.virginica,
  ];
  probChart.update();

  // ===== RADAR =====
  radarChart.data.datasets[0].data = meta.base;
  radarChart.data.datasets[0].borderColor = meta.color;
  radarChart.data.datasets[0].pointBackgroundColor = meta.color;
  radarChart.data.datasets[0].backgroundColor =
    meta.color + "33";
  radarChart.update();
}

/* ================== EVENTS ================== */
["sl", "sw", "pl", "pw"].forEach((id) =>
  $(id).addEventListener("input", sync)
);

// initial
sync();

/* ================== OPTIONAL BUTTONS ================== */
window.saveSpecimen = () => alert("Archived locally.");
window.runAnalysis = () =>
  ($("ai-report").innerText =
    "Prediction confidence is high based on feature alignment.");
