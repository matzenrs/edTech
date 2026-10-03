// The 3D "stage": camera, lights, floor, and the loop that redraws ~60 times a second.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function createStage(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(1.9, 1.9, 5.9); // a little to the side, so you see it's 3D

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0.15, 1.2, 0);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 3;
  controls.maxDistance = 10;
  controls.minPolarAngle = 0.4;
  controls.maxPolarAngle = Math.PI / 2 - 0.05;

  // Lights: a soft sky/ground glow plus a "sun" that casts shadows.
  scene.add(new THREE.HemisphereLight('#fff7f0', '#b9a7ff', 1.4));
  const sun = new THREE.DirectionalLight('#ffffff', 2.2);
  sun.position.set(3, 6, 4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -3;
  sun.shadow.camera.right = 3;
  sun.shadow.camera.top = 4;
  sun.shadow.camera.bottom = -1;
  sun.shadow.radius = 4;
  scene.add(sun);

  // A round toy-box stage to stand on
  const floor = new THREE.Mesh(
    new THREE.CylinderGeometry(2, 2.1, 0.18, 64),
    new THREE.MeshToonMaterial({ color: '#ffe8a3' }),
  );
  floor.position.y = -0.09;
  floor.receiveShadow = true;
  scene.add(floor);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(2.03, 0.05, 12, 80), new THREE.MeshToonMaterial({ color: '#ff9f68' }));
  rim.rotation.x = Math.PI / 2;
  scene.add(rim);

  let character = null;
  let popStart = -1;
  let nodStart = -1;
  let xray = false;
  let outlines = true;
  const clock = new THREE.Clock();

  // FPS counter (frames per second): count frames, check every half second.
  const stats = { fps: 0, frames: 0, triangles: 0 };
  let fpsFrames = 0;
  let fpsTime = performance.now();
  const listeners = new Set();

  function applyLooks(root) {
    root.traverse((obj) => {
      if (!obj.isMesh) return;
      if (obj.userData.isOutline) obj.visible = outlines && !xray;
      else if (obj.material) obj.material.wireframe = xray;
    });
  }

  function setCharacter(group, { pop = true } = {}) {
    if (character) scene.remove(character);
    character = group;
    applyLooks(character);
    scene.add(character);
    if (pop) popStart = clock.elapsedTime;
  }

  function resize() {
    const { clientWidth: w, clientHeight: h } = container;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(container);
  resize();

  // The render loop. requestAnimationFrame asks the browser:
  // "call me again right before you paint the next picture".
  function frame() {
    requestAnimationFrame(frame);
    const t = clock.getElapsedTime();

    if (character) {
      // Idle breathing bounce, plus a "pop" when a new trait arrives
      let s = 1 + Math.sin(t * 2.2) * 0.012;
      if (popStart >= 0) {
        const p = (t - popStart) / 0.6;
        if (p < 1) s *= 1 + Math.sin(p * Math.PI) * 0.12 * (1 - p);
        else popStart = -1;
      }
      character.scale.set(1 / s, s, 1 / s);

      const head = character.userData.head;
      if (head) {
        head.rotation.z = Math.sin(t * 1.3) * 0.04;
        head.rotation.x = 0;
        if (nodStart >= 0) {
          const p = (t - nodStart) / 1.6;
          if (p < 1) head.rotation.x = Math.sin(p * Math.PI * 4) * 0.35 * (1 - p);
          else nodStart = -1;
        }
      }
      character.userData.pet?.userData.animate?.(t);
    }

    controls.update();
    renderer.render(scene, camera);

    stats.frames++;
    stats.triangles = renderer.info.render.triangles;
    fpsFrames++;
    const now = performance.now();
    if (now - fpsTime >= 500) {
      stats.fps = Math.round((fpsFrames * 1000) / (now - fpsTime));
      fpsFrames = 0;
      fpsTime = now;
      listeners.forEach((fn) => fn(stats));
    }
  }
  requestAnimationFrame(frame);

  return {
    setCharacter,
    stats,
    /** Get notified about twice a second with fresh FPS / triangle numbers. */
    onStats(fn) {
      listeners.add(fn);
      fn(stats);
      return () => listeners.delete(fn);
    },
    get xray() {
      return xray;
    },
    setXray(on) {
      xray = on;
      if (character) applyLooks(character);
    },
    get outlines() {
      return outlines;
    },
    setOutlines(on) {
      outlines = on;
      if (character) applyLooks(character);
    },
    nod() {
      nodStart = clock.elapsedTime;
    },
    get character() {
      return character;
    },
    /** Take a small picture of the stage (used for gallery cards). */
    snapshot(size = 180) {
      renderer.render(scene, camera); // draw fresh so the picture isn't blank
      const out = document.createElement('canvas');
      const src = renderer.domElement;
      const side = Math.min(src.width, src.height);
      out.width = out.height = size;
      out
        .getContext('2d')
        .drawImage(src, (src.width - side) / 2, (src.height - side) / 2, side, side, 0, 0, size, size);
      return out.toDataURL('image/webp', 0.8);
    },
  };
}
