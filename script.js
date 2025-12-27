import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

/* ================= BACKEND ================= */
const BACKEND_URL = "https://iris-project-b4fp.onrender.com/predict";
// local test:
// const BACKEND_URL = "http://127.0.0.1:8000/predict";

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

let charts = {};
let threeCore = { scene: null, camera: null, renderer: null, mesh: null };

/* ================= AUTH ================= */
if (auth) {
    signInAnonymously(auth).catch(() => {});
    onAuthStateChanged(auth, (user) => {
        if (user) {
            const u = document.getElementById("user-display");
            if (u)
                u.innerHTML = `<i class="fa-solid fa-user-check"></i> ${user.uid
                    .substr(0, 5)
                    .toUpperCase()}`;
            loadArchive();
        }
    });
}

/* ================= FIRESTORE ================= */
function loadArchive() {
    if (!db) return;

    try {
        const ref = collection(db, "artifacts", appId, "public", "data", "archive");
        onSnapshot(ref, (snap) => {
            const list = document.getElementById("global-archive");
            if (!list) return;
            list.innerHTML = "";

            const arr = [];
            snap.forEach((d) => arr.push(d.data()));
            arr.sort((a, b) => b.time - a.time)
                .slice(0, 4)
                .forEach((r) => {
                    const div = document.createElement("div");
                    div.className = "archive-item";
                    div.innerHTML = `<span><b>${r.name}</b></span>
                        <span style="opacity:.5">${new Date(r.time).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit"
                        })}</span>`;
                    list.appendChild(div);
                });
        });
    } catch (e) {}
}

window.saveSpecimen = async () => {
    const name = document.getElementById("hud-name")?.innerText || "Discovery";

    if (!db || (auth && !auth.currentUser)) {
        notify("Archived (Local)");
        const list = document.getElementById("global-archive");
        const div = document.createElement("div");
        div.className = "archive-item";
        div.innerHTML = `<span><b>${name}</b></span>
            <span style="opacity:.5">${new Date().toLocaleTimeString()}</span>`;
        list.prepend(div);
        return;
    }

    try {
        await addDoc(
            collection(db, "artifacts", appId, "public", "data", "archive"),
            { name, time: Date.now() }
        );
        notify("Discovery Archived");
    } catch {
        notify("Sync Error");
    }
};

/* ================= THREE JS ================= */
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

    const p1 = new THREE.PointLight(0x00f2ff, 1);
    p1.position.set(5, 5, 5);
    scene.add(p1);

    const p2 = new THREE.PointLight(0x7000ff, 1);
    p2.position.set(-5, -5, 5);
    scene.add(p2);

    const geo = new THREE.IcosahedronGeometry(2, 1);
    const mat = new THREE.MeshStandardMaterial({
        color: 0x00f2ff,
        transparent: true,
        opacity: 0.7,
        metalness: 0.5,
        roughness: 0.1
    });

    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    threeCore = { scene, camera, renderer, mesh };
    camera.position.z = 7;

    const animate = () => {
        requestAnimationFrame(animate);
        mesh.rotation.y += 0.003;
        mesh.rotation.z += 0.001;
        renderer.render(scene, camera);
    };
    animate();
}

/* ================= CHARTS ================= */
function initCharts() {
    charts.prob = new Chart(document.getElementById("probChart"), {
        type: "bar",
        data: {
            labels: ["Setosa", "Versicolor", "Virginica"],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: ["#00f2ff", "#7000ff", "#ff0070"],
                borderRadius: 10
            }]
        },
        options: {
            indexAxis: "y",
            plugins: { legend: { display: false } },
            scales: { x: { display: false } }
        }
    });

    charts.radar = new Chart(document.getElementById("radarChart"), {
        type: "radar",
        data: {
            labels: ["SL", "SW", "PL", "PW"],
            datasets: [{
                data: [0, 0, 0, 0],
                borderColor: "#00f2ff",
                backgroundColor: "rgba(0,242,255,.1)"
            }]
        },
        options: {
            plugins: { legend: { display: false } },
            scales: { r: { min: 0, max: 8 } }
        }
    });
}

/* ================= MAIN SYNC (ML CONNECTED) ================= */
async function sync() {
    const sl = +slEl.value;
    const sw = +swEl.value;
    const pl = +plEl.value;
    const pw = +pwEl.value;

    vSl.innerText = sl;
    vSw.innerText = sw;
    vPl.innerText = pl;
    vPw.innerText = pw;

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

        const data = await res.json();
        const probs = data.probabilities;

        let species = ["Iris-setosa", "Iris-versicolor", "Iris-virginica"][data.prediction];
        let color = ["#00f2ff", "#7000ff", "#ff0070"][data.prediction];

        hudName.innerText = species.toUpperCase();
        speciesTitle.innerText = species.split("-")[1];
        speciesTitle.style.color = color;

        harmonyScore.innerText = Math.floor(80 + Math.max(...Object.values(probs)) * 20);

        charts.prob.data.datasets[0].data = [
            probs.setosa,
            probs.versicolor,
            probs.virginica
        ];
        charts.prob.update();

        charts.radar.data.datasets[0].data = [sl, sw, pl, pw];
        charts.radar.data.datasets[0].borderColor = color;
        charts.radar.update();

        threeCore.mesh.material.color.set(color);

    } catch (e) {
        console.error("Backend error", e);
    }
}

/* ================= UTIL ================= */
function notify(msg) {
    const t = document.createElement("div");
    t.style.cssText =
        "position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:#fff;color:#000;padding:10px 25px;font-weight:800;font-size:.7rem;border-radius:50px;z-index:9999;";
    t.innerText = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
}

/* ================= INIT ================= */
const slEl = document.getElementById("sl");
const swEl = document.getElementById("sw");
const plEl = document.getElementById("pl");
const pwEl = document.getElementById("pw");

const vSl = document.getElementById("v-sl");
const vSw = document.getElementById("v-sw");
const vPl = document.getElementById("v-pl");
const vPw = document.getElementById("v-pw");

const hudName = document.getElementById("hud-name");
const speciesTitle = document.getElementById("species-title");
const harmonyScore = document.getElementById("harmony-score");

window.onload = () => {
    initThree();
    initCharts();
    sync();
    [slEl, swEl, plEl, pwEl].forEach(el => el.addEventListener("input", sync));
};

setInterval(() => {
    const c = document.getElementById("clock");
    if (c) c.innerText = new Date().toLocaleTimeString();
}, 1000);
