import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const container = document.querySelector('.board-3d');
if (!container) {
    throw new Error('.board-3d not found');
}

const resizeHandle = document.querySelector('.board-resize-handle');

function getBoardSizeLimits() {
    const margin = 32;
    const maxInner = Math.floor(
        Math.min(window.innerWidth - margin, window.innerHeight - margin)
    );
    return { min: 180, max: Math.max(220, maxInner) };
}

function initBoardFrameSize() {
    const { min, max } = getBoardSizeLimits();
    const rect = container.getBoundingClientRect();
    const fallback = Math.min(
        window.innerWidth * 0.9,
        (window.innerHeight - 96) * 0.9,
        640
    );
    const base = rect.width > 0 ? rect.width : fallback;
    const initial = Math.min(max, Math.max(min, Math.round(base)));
    container.style.width = `${initial}px`;
}

function clampBoardFrameSize() {
    const { min, max } = getBoardSizeLimits();
    const fromStyle = parseFloat(container.style.width);
    const w = Number.isFinite(fromStyle) && fromStyle > 0 ? fromStyle : container.offsetWidth;
    const next = Math.min(max, Math.max(min, Math.round(w)));
    if (Math.round(w) !== next) {
        container.style.width = `${next}px`;
    }
}

initBoardFrameSize();

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1d24);

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
const initialCameraPosition = new THREE.Vector3(9.2, 7.4, 11);
camera.position.copy(initialCameraPosition);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 6;
controls.maxDistance = 28;
controls.maxPolarAngle = Math.PI * 0.48;
const initialControlsTarget = new THREE.Vector3(0, 0.35, 0);
controls.target.copy(initialControlsTarget);

const ambient = new THREE.AmbientLight(0xefe8dc, 0.42);
scene.add(ambient);

const key = new THREE.DirectionalLight(0xffffff, 1.05);
key.position.set(10, 18, 8);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
key.shadow.camera.near = 0.5;
key.shadow.camera.far = 60;
key.shadow.camera.left = -12;
key.shadow.camera.right = 12;
key.shadow.camera.top = 12;
key.shadow.camera.bottom = -12;
key.shadow.bias = -0.0003;
scene.add(key);

const rim = new THREE.DirectionalLight(0xb8c4e8, 0.28);
rim.position.set(-12, 6, -10);
scene.add(rim);

const board = new THREE.Group();
scene.add(board);

const cell = 1;
const gap = 0.02;
const tileW = cell - gap;
const tileH = 0.14;
const lightHex = 0xf0d9b5;
const darkHex = 0xb58863;

const tileGeo = new THREE.BoxGeometry(tileW, tileH, tileW);

for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
        const mat = new THREE.MeshStandardMaterial({
            color: (row + col) % 2 === 0 ? lightHex : darkHex,
            roughness: 0.62,
            metalness: 0.04,
        });
        const mesh = new THREE.Mesh(tileGeo, mat);
        mesh.position.set(
            (col - 3.5) * cell,
            tileH / 2,
            (row - 3.5) * cell
        );
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        board.add(mesh);
    }
}

const baseGeo = new THREE.BoxGeometry(8.85, 0.32, 8.85);
const baseMat = new THREE.MeshStandardMaterial({
    color: 0x3d2f24,
    roughness: 0.82,
    metalness: 0.02,
});
const base = new THREE.Mesh(baseGeo, baseMat);
base.position.y = -0.16;
base.receiveShadow = true;
board.add(base);

const frameMat = new THREE.MeshStandardMaterial({
    color: 0x2a2118,
    roughness: 0.75,
    metalness: 0.03,
});

function addFrameRail(w, h, d, x, y, z) {
    const g = new THREE.BoxGeometry(w, h, d);
    const m = new THREE.Mesh(g, frameMat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    board.add(m);
}

const fh = 0.38;
const fy = tileH + fh / 2;
const span = 8 * cell + 0.35;
const thick = 0.28;

addFrameRail(span + thick * 2, fh, thick, 0, fy, -(4 * cell + thick / 2));
addFrameRail(span + thick * 2, fh, thick, 0, fy, 4 * cell + thick / 2);
addFrameRail(thick, fh, span, -(4 * cell + thick / 2), fy, 0);
addFrameRail(thick, fh, span, 4 * cell + thick / 2, fy, 0);

const floorGeo = new THREE.PlaneGeometry(80, 80);
const floorMat = new THREE.MeshStandardMaterial({
    color: 0x14161c,
    roughness: 1,
    metalness: 0,
});
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.33;
floor.receiveShadow = true;
scene.add(floor);

function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w === 0 || h === 0) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
}

function applyPixelRatio(mode) {
    const dprCap = (v) => Math.min(window.devicePixelRatio || 1, v);
    if (mode === '1') renderer.setPixelRatio(1);
    else if (mode === '2') renderer.setPixelRatio(dprCap(2));
    else renderer.setPixelRatio(dprCap(2));
}

function onWindowResize() {
    clampBoardFrameSize();
    resize();
}

resize();
window.addEventListener('resize', onWindowResize);

if (resizeHandle) {
    let resizing = false;
    let activePointerId = null;
    const resizeStart = { x: 0, y: 0, size: 0 };

    resizeHandle.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        resizing = true;
        activePointerId = e.pointerId;
        resizeStart.x = e.clientX;
        resizeStart.y = e.clientY;
        resizeStart.size = container.offsetWidth;
        resizeHandle.setPointerCapture(e.pointerId);
    });

    resizeHandle.addEventListener('pointermove', (e) => {
        if (!resizing || e.pointerId !== activePointerId) return;
        const dx = e.clientX - resizeStart.x;
        const dy = e.clientY - resizeStart.y;
        const delta = (dx + dy) / 2;
        const { min, max } = getBoardSizeLimits();
        let next = Math.round(resizeStart.size + delta);
        next = Math.min(max, Math.max(min, next));
        container.style.width = `${next}px`;
        resize();
    });

    const endResize = (e) => {
        if (!resizing || e.pointerId !== activePointerId) return;
        resizing = false;
        activePointerId = null;
        try {
            resizeHandle.releasePointerCapture(e.pointerId);
        } catch (_) {
            /* ignore */
        }
    };

    resizeHandle.addEventListener('pointerup', endResize);
    resizeHandle.addEventListener('pointercancel', endResize);
}

const elShadow = document.getElementById('set-shadow');
const elDpr = document.getElementById('set-dpr');
const elBgPresets = document.querySelectorAll('input[name="set-bg-preset"]');
const elRotate = document.getElementById('set-rotate');
const elRotateVal = document.getElementById('set-rotate-val');
const elAutorotateCycle = document.getElementById('set-autorotate-cycle');
const elResetCam = document.getElementById('set-reset-cam');

let autoRotateMode = 0;
const AUTO_ROTATE_BASE = 2;

function getManualRotateFactor() {
    return elRotate ? Number(elRotate.value) : 1;
}

function applyAutoRotateMode() {
    const mag = AUTO_ROTATE_BASE * getManualRotateFactor();
    if (autoRotateMode === 0) {
        controls.autoRotate = false;
        controls.autoRotateSpeed = Math.abs(mag);
    } else if (autoRotateMode === 1) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = -Math.abs(mag);
    } else {
        controls.autoRotate = true;
        controls.autoRotateSpeed = Math.abs(mag);
    }
}

function syncAutoRotateCycleButton() {
    if (!elAutorotateCycle) return;
    const labels = ['자동 회전: 꺼짐', '자동 회전: 오른쪽', '자동 회전: 왼쪽'];
    const titles = [
        '클릭: 오른쪽으로 자동 회전',
        '클릭: 왼쪽으로 자동 회전',
        '클릭: 자동 회전 끄기',
    ];
    elAutorotateCycle.textContent = labels[autoRotateMode];
    elAutorotateCycle.title = titles[autoRotateMode];
    elAutorotateCycle.setAttribute(
        'aria-label',
        `${labels[autoRotateMode]}. 다음: ${titles[autoRotateMode]}`
    );
}

applyAutoRotateMode();
syncAutoRotateCycleButton();

if (elAutorotateCycle) {
    elAutorotateCycle.addEventListener('click', () => {
        autoRotateMode = (autoRotateMode + 1) % 3;
        applyAutoRotateMode();
        syncAutoRotateCycleButton();
    });
}

if (elShadow) {
    elShadow.addEventListener('change', () => {
        const on = elShadow.checked;
        renderer.shadowMap.enabled = on;
        key.castShadow = on;
    });
}

if (elDpr) {
    elDpr.addEventListener('change', () => {
        applyPixelRatio(elDpr.value);
        resize();
    });
}

function applyBackgroundHex(hex) {
    scene.background = new THREE.Color(hex);
}

elBgPresets.forEach((radio) => {
    radio.addEventListener('change', () => {
        if (radio.checked) applyBackgroundHex(radio.value);
    });
});

if (elRotate && elRotateVal) {
    const syncRotateLabel = () => {
        elRotateVal.textContent = `${Math.round(Number(elRotate.value) * 100)}%`;
    };
    syncRotateLabel();
    elRotate.addEventListener('input', () => {
        controls.rotateSpeed = Number(elRotate.value);
        syncRotateLabel();
        if (autoRotateMode !== 0) {
            applyAutoRotateMode();
        }
    });
}

if (elResetCam) {
    elResetCam.addEventListener('click', () => {
        camera.position.copy(initialCameraPosition);
        controls.target.copy(initialControlsTarget);
        controls.update();
    });
}

function tick() {
    requestAnimationFrame(tick);
    controls.update();
    renderer.render(scene, camera);
}

tick();
