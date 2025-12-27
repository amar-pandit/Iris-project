const BACKEND_URL = "https://iris-project-b4fp.onrender.com/predict";
const $ = (id) => document.getElementById(id);

/* ================= CLOCK ================= */
setInterval(() => {
  $("clock").innerText = new Date().toLocaleTimeString();
}, 1000);

/* ================= HELPERS ================= */
function normalize(v, min, max) {
  return (v - min) / (max - min);
}

/* ================= SPECIES META ================= */
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

/* ================= THREE.JS ================= */
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.z = 6;

const renderer = new THREE.WebGLRenderer({
  canvas: $("three-canvas"),
  alpha: true,
  antialias: true,
});
renderer.setSize($("viewport").clientWidth, $("viewport").clientHeight);

const mesh = new THREE.Mesh(
  new THREE.DodecahedronGeometry(1.5),
  new THREE.MeshStandardMaterial({
    color: "#22e6f2",
    transparent: true,
    opacity: 0.9,
  })
);
scene.add(mesh);

scene.add(new THREE.AmbientLight(0xffffff, 0.9));
const light = new THREE.DirectionalLight(0xffffff, 0.6);
light.position.set(5, 5, 5);
scene.add(light);

(function animate() {
  requestAnimationFrame(animate);
  mesh.rotation.y += 0.003;
  renderer.render(scene, camera);
})();

/* ================= CHARTS ================= */
// Diversity Index
const probChart = new Chart($("probChart"), {
  type: "bar",
  data: {
    labels: ["Setosa", "Versicolor", "Virginica"],
    datasets: [{
      data: [0, 0, 0],
      backgroundColor: ["#22e6f2", "#8a5cff", "#ff4f9a"]
    }]
  },
  options: {
    indexAxis: "y",
    scales: { x: { min: 0, max: 1 } },
    plugins: { legend: { display: false } }
  }
});

// Radar
const radarChart = new Chart($("radarChart"), {
  type: "radar",
  data: {
    labels: ["SL", "SW", "PL", "PW"],
    datasets: [{
      data: [0, 0, 0, 0],
      borderColor: "#22e6f2",
      backgroundColor: "rgba(34,230,242,0.2)",
      pointBackgroundColor: "#22e6f2",
    }]
  },
  options: {
    scales: { r: { min: 0, max: 7, ticks: { display: false } } },
    plugins: { legend: { display: false } }
  }
});

/* ================= BACKEND CALL ================= */
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

/* ================= MAIN SYNC ================= */
async function sync() {
  try {
    const sl = +$("sl").value;
    const sw = +$("sw").value;
    const pl = +$("pl").value;
    const pw = +$("pw").value;

    $("v-sl").innerText = sl;
    $("v-sw").innerText = sw;
    $("v-pl").innerText = pl;
    $("v-pw").innerText = pw;

    const data = await predict(sl, sw, pl, pw);
    console.log("BACKEND:", data);

    const map = {
      0: "Iris-setosa",
      1: "Iris-versicolor",
      2: "Iris-virginica",
    };

    const species = map[data.prediction];
    const meta = speciesMeta[species];
    const p = data.probabilities;

    $("hud-name").innerText = species.toUpperCase();
    $("species-title").innerText = species.split("-")[1];
    $("species-title").style.color = meta.color;

    $("harmony-score").innerText =
      Math.round(Math.max(p.setosa, p.versicolor, p.virginica) * 100);

    // 3D
    mesh.material.color.set(meta.color);
    mesh.scale.set(
      1 + normalize(pl, 1, 7),
      1 + normalize(sw, 2, 4.5),
      1 + normalize(pw, 0.1, 2.5)
    );

    // Graph
    probChart.data.datasets[0].data = [p.setosa, p.versicolor, p.virginica];
    probChart.update();

    // Radar
    radarChart.data.datasets[0].data = meta.base;
    radarChart.data.datasets[0].borderColor = meta.color;
    radarChart.update();

  } catch (e) {
    console.error("SYNC ERROR:", e);
  }
}

/* ================= EVENTS ================= */
["sl", "sw", "pl", "pw"].forEach(id =>
  $(id).addEventListener("input", sync)
);

sync();

/* ================= BUTTONS ================= */
window.saveSpecimen = () => alert("Saved locally");
window.runAnalysis = () =>
  ($("ai-report").innerText = "Prediction confidence is high.");
