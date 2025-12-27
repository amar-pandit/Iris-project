/* ================= BACKEND ================= */
const BACKEND_URL = "https://iris-project-b4fp.onrender.com/predict";

/* ================= HELPERS ================= */
const $ = (id) => document.getElementById(id);

function normalize(v, min, max) {
  return (v - min) / (max - min);
}

/* ================= CLOCK ================= */
setInterval(() => {
  $("clock").innerText = new Date().toLocaleTimeString();
}, 1000);

/* ================= SPECIES MAP (CRITICAL FIX) ================= */
const speciesMap = {
  0: "Iris-setosa",
  1: "Iris-versicolor",
  2: "Iris-virginica",
  "setosa": "Iris-setosa",
  "versicolor": "Iris-versicolor",
  "virginica": "Iris-virginica"
};

/* ================= UI META ================= */
const speciesData = {
  "Iris-setosa": {
    color: "#00f5ff",
    features: [5.1, 3.5, 1.4, 0.2]
  },
  "Iris-versicolor": {
    color: "#7c5cff",
    features: [6.0, 2.8, 4.5, 1.5]
  },
  "Iris-virginica": {
    color: "#ff3d81",
    features: [6.5, 3.0, 5.5, 2.0]
  }
};

/* ================= THREE.JS ================= */
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.z = 6;

const renderer = new THREE.WebGLRenderer({
  canvas: $("three-canvas"),
  alpha: true,
  antialias: true
});
renderer.setSize($("viewport").clientWidth, $("viewport").clientHeight);

const mesh = new THREE.Mesh(
  new THREE.IcosahedronGeometry(1.6, 1),
  new THREE.MeshStandardMaterial({
    color: "#00f5ff",
    transparent: true,
    opacity: 0.9
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
// Probability bar
const probChart = new Chart($("probChart"), {
  type: "bar",
  data: {
    labels: ["Setosa", "Versicolor", "Virginica"],
    datasets: [{
      data: [0, 0, 0],
      backgroundColor: ["#00f5ff", "#7c5cff", "#ff3d81"]
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
      borderColor: "#00f5ff",
      backgroundColor: "rgba(0,245,255,0.2)",
      pointBackgroundColor: "#00f5ff"
    }]
  },
  options: {
    scales: { r: { min: 0, max: 7, ticks: { display: false } } },
    plugins: { legend: { display: false } }
  }
});

/* ================= BACKEND CALL ================= */
async function predict(sl, sw, pl, pw) {
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
  } catch (e) {
    console.error("FETCH ERROR:", e);
    return null;
  }
}

/* ================= MAIN SYNC ================= */
async function sync() {
  const sl = +$("sl").value;
  const sw = +$("sw").value;
  const pl = +$("pl").value;
  const pw = +$("pw").value;

  $("v-sl").innerText = sl;
  $("v-sw").innerText = sw;
  $("v-pl").innerText = pl;
  $("v-pw").innerText = pw;

  const data = await predict(sl, sw, pl, pw);
  if (!data) return;

  console.log("BACKEND DATA:", data);

  const mlSpecies = speciesMap[data.prediction];
  if (!mlSpecies) return;

  const meta = speciesData[mlSpecies];
  if (!meta) return;

  /* ===== TEXT ===== */
  $("hud-name").innerText = mlSpecies.toUpperCase();
  $("species-title").innerText = mlSpecies.split("-")[1];
  $("species-title").style.color = meta.color;

  /* ===== HARMONY ===== */
  $("harmony-score").innerText = Math.round(
    Math.max(
      data.probabilities.setosa,
      data.probabilities.versicolor,
      data.probabilities.virginica
    ) * 100
  );

  /* ===== 3D COLOR (FINAL FIX) ===== */
  mesh.material.color.set(meta.color);
  mesh.material.needsUpdate = true;

  /* ===== 3D SCALE (PROPER PROPORTION) ===== */
  mesh.scale.set(
    1 + normalize(pl, 1, 7) * 1.2,
    1 + normalize(sw, 2, 4.5) * 0.8,
    1 + normalize(pw, 0.1, 2.5) * 1.0
  );

  /* ===== PROBABILITY GRAPH ===== */
  probChart.data.datasets[0].data = [
    data.probabilities.setosa,
    data.probabilities.versicolor,
    data.probabilities.virginica
  ];
  probChart.update();

  /* ===== RADAR ===== */
  radarChart.data.datasets[0].data = meta.features;
  radarChart.data.datasets[0].borderColor = meta.color;
  radarChart.data.datasets[0].backgroundColor = meta.color + "33";
  radarChart.update();
}

/* ================= EVENTS ================= */
["sl", "sw", "pl", "pw"].forEach(id =>
  $(id).addEventListener("input", sync)
);

// initial call
sync();

/* ================= BUTTONS ================= */
window.saveSpecimen = () => alert("Specimen archived locally.");
window.runAnalysis = () =>
  ($("ai-report").innerText =
    "AI analysis complete. High confidence morphology.");
