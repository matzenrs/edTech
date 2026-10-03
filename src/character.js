// Builds a cartoon person out of simple 3D shapes (spheres, capsules, cones…).
// Every object gets a `name` so the "scene graph" lesson can show the family tree.
import * as THREE from 'three';

// ---------- Materials ----------

// A toon gradient: only 3 brightness steps, so light looks "comic book" instead of smooth.
const toonSteps = new THREE.DataTexture(new Uint8Array([90, 170, 255]), 3, 1, THREE.RedFormat);
toonSteps.minFilter = THREE.NearestFilter;
toonSteps.magFilter = THREE.NearestFilter;
toonSteps.needsUpdate = true;

const materialCache = new Map();
function toon(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!materialCache.has(key)) {
    materialCache.set(key, new THREE.MeshToonMaterial({ color, gradientMap: toonSteps, ...opts }));
  }
  return materialCache.get(key);
}
const flat = (color) => toon(color, { side: THREE.DoubleSide });

const outlineMaterial = new THREE.MeshBasicMaterial({ color: '#1d1b2c', side: THREE.BackSide });

/**
 * Make a mesh. With an outline, we add a slightly bigger black copy that's
 * "inside out" (BackSide), so only its edge peeks around the shape.
 */
function part(geometry, material, { outline = true, name, thickness = 0.035 } = {}) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  if (name) mesh.name = name;
  if (outline) {
    geometry.computeBoundingSphere();
    const r = geometry.boundingSphere.radius || 1;
    const shell = new THREE.Mesh(geometry, outlineMaterial);
    shell.scale.setScalar(1 + thickness / r);
    shell.userData.isOutline = true;
    mesh.add(shell);
  }
  return mesh;
}

const sphere = (r, w = 32, h = 24) => new THREE.SphereGeometry(r, w, h);

// Point a child at a spot on the head's surface, facing outward.
const FORWARD = new THREE.Vector3(0, 0, 1);
const UP = new THREE.Vector3(0, 1, 0);
function stickTo(obj, dir, radius, facing = FORWARD) {
  const n = dir.clone().normalize();
  obj.position.copy(n).multiplyScalar(radius);
  obj.quaternion.setFromUnitVectors(facing, n);
  return obj;
}

// ---------- The person ----------

const HEAD_R = 0.55;

// What an un-rolled trait looks like: a gray "mystery mannequin".
const DEFAULTS = {
  hairColor: '#8a8798',
  hairStyle: 'bald',
  skin: '#d9d6e3',
  eyes: '#55526a',
  expression: 'neutral',
  height: 1,
  outfit: { shirt: '#b9b6c8', pants: '#9895a8' },
  accessory: 'none',
  pet: null,
};

export function buildCharacter(traits = {}) {
  const t = { ...DEFAULTS, ...traits };
  const h = t.height;

  const person = new THREE.Group();
  person.name = 'Person';

  const body = new THREE.Group();
  body.name = 'Body';
  person.add(body);

  // Legs + shoes
  const pantsMat = toon(t.outfit.pants);
  for (const side of [-1, 1]) {
    const leg = part(new THREE.CapsuleGeometry(0.13, 0.38 * h, 6, 16), pantsMat, {
      name: side < 0 ? 'Left Leg' : 'Right Leg',
    });
    leg.position.set(0.16 * side, 0.12 + (0.38 * h) / 2 + 0.06, 0);
    body.add(leg);
    const shoe = part(sphere(0.15), toon('#f4f1ea'), { name: 'Shoe' });
    shoe.scale.set(1, 0.6, 1.4);
    shoe.position.set(0.16 * side, 0.09, 0.05);
    body.add(shoe);
  }

  // Torso (the shirt)
  const hipY = 0.12 + 0.38 * h + 0.06;
  const torsoLen = 0.42 * h;
  const torso = part(new THREE.CapsuleGeometry(0.36, torsoLen, 8, 24), toon(t.outfit.shirt), {
    name: 'Torso',
  });
  torso.position.y = hipY + torsoLen / 2 + 0.12;
  body.add(torso);
  const shoulderY = hipY + torsoLen + 0.18;

  // Hero emblem + cape
  if (t.outfit.cape) {
    const emblem = part(new THREE.CircleGeometry(0.13, 24), flat(t.outfit.cape), { outline: false, name: 'Emblem' });
    stickTo(emblem, new THREE.Vector3(0, 0.1, 1), 0.365);
    emblem.position.y += torso.position.y;
    body.add(emblem);
    const capeLen = shoulderY - 0.15;
    const cape = part(
      // Only the back slice of an open tube (angles around π point backward)
      new THREE.CylinderGeometry(0.34, 0.6, capeLen, 24, 1, true, Math.PI * 0.6, Math.PI * 0.8),
      flat(t.outfit.cape),
      { outline: false, name: 'Cape' },
    );
    cape.position.set(0, shoulderY - capeLen / 2, -0.06);
    body.add(cape);
  }

  // Arms: sleeves + hands, hanging from the shoulders
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.name = side < 0 ? 'Left Arm' : 'Right Arm';
    arm.position.set(0.4 * side, shoulderY - 0.08, 0);
    arm.rotation.z = 0.35 * side;
    const sleeve = part(new THREE.CapsuleGeometry(0.1, 0.36 * h, 6, 16), toon(t.outfit.shirt), { name: 'Sleeve' });
    sleeve.position.y = -0.2 * h;
    arm.add(sleeve);
    const hand = part(sphere(0.12), toon(t.skin), { name: 'Hand' });
    hand.position.y = -0.4 * h - 0.06;
    arm.add(hand);
    body.add(arm);
  }

  // Head sits on top of the shoulders. It's a separate group so it can nod.
  const head = buildHead(t);
  head.position.y = shoulderY + HEAD_R * 0.82;
  person.add(head);
  person.userData.head = head;

  if (t.pet) {
    const pet = buildPet(t.pet);
    pet.position.set(0.95, 0, 0.35);
    pet.rotation.y = -0.5;
    person.add(pet);
    person.userData.pet = pet;
  }

  return person;
}

function buildHead(t) {
  const head = new THREE.Group();
  head.name = 'Head';

  const skin = toon(t.skin);
  head.add(part(sphere(HEAD_R, 48, 32), skin, { name: 'Face' }));

  for (const side of [-1, 1]) {
    const ear = part(sphere(0.12), skin, { name: 'Ear' });
    ear.scale.set(0.6, 1, 0.8);
    ear.position.set(HEAD_R * 0.98 * side, -0.02, 0);
    head.add(ear);
  }

  const nose = part(sphere(0.07), skin, { outline: false, name: 'Nose' });
  stickTo(nose, new THREE.Vector3(0, -0.12, 1), HEAD_R);
  head.add(nose);

  for (const side of [-1, 1]) {
    const blush = part(new THREE.CircleGeometry(0.07, 20), toon('#ff8fa3', { transparent: true, opacity: 0.55 }), {
      outline: false,
      name: 'Blush',
    });
    stickTo(blush, new THREE.Vector3(0.33 * side, -0.18, 0.92), HEAD_R + 0.005);
    head.add(blush);
  }

  head.add(buildEyes(t));
  head.add(buildMouth(t.expression));
  const hair = buildHair(t.hairStyle, t.hairColor);
  if (hair) head.add(hair);
  const acc = buildAccessory(t.accessory);
  if (acc) head.add(acc);
  return head;
}

function buildEyes(t) {
  const eyes = new THREE.Group();
  eyes.name = 'Eyes';
  const big = t.expression === 'surprised' ? 1.2 : 1;
  for (const side of [-1, 1]) {
    const eye = new THREE.Group();
    eye.name = 'Eye';
    const white = part(sphere(0.14), toon('#ffffff'), { name: 'Eye White', thickness: 0.02 });
    white.scale.set(1, 1.15, 0.55);
    eye.add(white);
    const iris = part(sphere(0.085), toon(t.eyes), { outline: false, name: 'Iris' });
    iris.scale.z = 0.5;
    iris.position.z = 0.055;
    eye.add(iris);
    const pupil = part(sphere(0.045), toon('#141018'), { outline: false, name: 'Pupil' });
    pupil.scale.z = 0.5;
    pupil.position.z = 0.085;
    eye.add(pupil);
    const shine = part(sphere(0.02), new THREE.MeshBasicMaterial({ color: '#ffffff' }), { outline: false, name: 'Sparkle' });
    shine.position.set(0.03, 0.035, 0.1);
    eye.add(shine);
    if (t.expression === 'calm') {
      // A sleepy eyelid: skin-colored half sphere over the top of the eye
      const lid = part(new THREE.SphereGeometry(0.15, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), toon(t.skin), {
        outline: false,
        name: 'Eyelid',
      });
      lid.scale.set(1, 1.15, 0.62);
      lid.rotation.x = 0.25;
      eye.add(lid);
    }
    eye.scale.setScalar(big);
    stickTo(eye, new THREE.Vector3(0.21 * side, 0.08, 0.5), HEAD_R * 0.93);
    eyes.add(eye);
  }
  return eyes;
}

function buildMouth(expression) {
  const mouth = new THREE.Group();
  mouth.name = 'Mouth';
  const dark = toon('#4a1424', { side: THREE.DoubleSide });
  const smileArc = (r, tube = 0.024) => {
    const m = part(new THREE.TorusGeometry(r, tube, 8, 24, Math.PI), dark, { outline: false, name: 'Smile' });
    m.rotation.z = Math.PI; // flip the arc so it curves up into a smile
    return m;
  };
  switch (expression) {
    case 'smile':
      mouth.add(smileArc(0.12));
      break;
    case 'grin': {
      const open = part(new THREE.CircleGeometry(0.15, 24, Math.PI, Math.PI), dark, { outline: false, name: 'Open Mouth' });
      const teeth = part(new THREE.PlaneGeometry(0.24, 0.045), flat('#ffffff'), { outline: false, name: 'Teeth' });
      teeth.position.set(0, -0.025, 0.002);
      mouth.add(open, teeth);
      break;
    }
    case 'surprised': {
      const o = part(sphere(0.07), dark, { outline: false, name: 'O Mouth' });
      o.scale.set(0.85, 1.15, 0.35);
      mouth.add(o);
      break;
    }
    case 'smirk': {
      const s = smileArc(0.1);
      s.rotation.z = Math.PI + 0.35;
      s.position.x = 0.05;
      mouth.add(s);
      break;
    }
    case 'tongue': {
      mouth.add(smileArc(0.12));
      const tongue = part(sphere(0.06), toon('#ff6b8b'), { outline: false, name: 'Tongue' });
      tongue.scale.set(1, 1.2, 0.4);
      tongue.position.set(0.02, -0.12, 0.01);
      mouth.add(tongue);
      break;
    }
    case 'calm':
      mouth.add(smileArc(0.07, 0.018));
      break;
    default: {
      const line = part(new THREE.CapsuleGeometry(0.018, 0.12, 4, 8), dark, { outline: false, name: 'Mouth Line' });
      line.rotation.z = Math.PI / 2;
      mouth.add(line);
    }
  }
  stickTo(mouth, new THREE.Vector3(0, -0.36, 0.93), HEAD_R + 0.005);
  return mouth;
}

// Pick evenly spread points on the top of the head (a "Fibonacci spiral").
function capPoints(count, maxAngle) {
  const pts = [];
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * (1 - Math.cos(maxAngle));
    const r = Math.sqrt(1 - y * y);
    const a = i * 2.399963; // the golden angle, in radians
    pts.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
  }
  return pts;
}

function buildHair(style, color) {
  const hair = new THREE.Group();
  hair.name = 'Hair';
  const mat = toon(color);
  const shellMat = toon(color, { side: THREE.DoubleSide });
  // phi=π/2 is the face; leave a gap there so the hair doesn't cover it.
  const backShell = (r, thetaLen, gap) =>
    part(new THREE.SphereGeometry(r, 40, 24, Math.PI / 2 + gap, Math.PI * 2 - gap * 2, 0, thetaLen), shellMat, {
      outline: false,
      name: 'Hair Shell',
    });
  const topCap = (r, thetaLen) =>
    part(new THREE.SphereGeometry(r, 40, 16, 0, Math.PI * 2, 0, thetaLen), shellMat, { outline: false, name: 'Hair Cap' });

  switch (style) {
    case 'bald': {
      const shine = part(sphere(0.09), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.6 }), {
        outline: false,
        name: 'Shine',
      });
      shine.scale.set(1.4, 0.4, 1);
      stickTo(shine, new THREE.Vector3(-0.3, 0.9, 0.35), HEAD_R, UP);
      hair.add(shine);
      break;
    }
    case 'spiky': {
      hair.add(topCap(HEAD_R * 1.03, Math.PI * 0.32));
      for (const p of capPoints(14, Math.PI * 0.4)) {
        if (p.z > 0.55) continue; // keep the forehead clear
        const spike = part(new THREE.ConeGeometry(0.12, 0.38, 12), mat, { name: 'Spike', thickness: 0.025 });
        stickTo(spike, p, HEAD_R * 1.0, UP);
        spike.position.add(p.clone().multiplyScalar(0.12));
        hair.add(spike);
      }
      break;
    }
    case 'curly': {
      hair.add(backShell(HEAD_R * 1.04, Math.PI * 0.6, 0.55));
      for (const p of capPoints(42, Math.PI * 0.62)) {
        if (p.z > 0.6 && p.y < 0.75) continue;
        const curl = part(sphere(0.16, 16, 12), mat, { name: 'Curl', thickness: 0.02 });
        curl.position.copy(p).multiplyScalar(HEAD_R * 1.05);
        hair.add(curl);
      }
      break;
    }
    case 'ponytail': {
      hair.add(backShell(HEAD_R * 1.05, Math.PI * 0.55, 0.6));
      hair.add(topCap(HEAD_R * 1.05, Math.PI * 0.3));
      const band = part(new THREE.TorusGeometry(0.09, 0.035, 8, 16), toon('#ff4d6d'), { name: 'Hair Tie' });
      band.position.set(0, 0.25, -HEAD_R * 1.02);
      hair.add(band);
      const tail = part(sphere(0.17), mat, { name: 'Ponytail' });
      tail.scale.set(0.8, 1.9, 0.8);
      tail.position.set(0, -0.05, -HEAD_R * 1.18);
      tail.rotation.x = 0.35;
      hair.add(tail);
      break;
    }
    case 'bob': {
      hair.add(backShell(HEAD_R * 1.08, Math.PI * 0.68, 0.7));
      hair.add(topCap(HEAD_R * 1.08, Math.PI * 0.36));
      break;
    }
    case 'mohawk': {
      for (let i = 0; i < 7; i++) {
        const a = 0.65 - i * 0.32; // sweep from the forehead (+) over the top to the back (−)
        const dir = new THREE.Vector3(0, Math.cos(a), Math.sin(a));
        const fin = part(new THREE.ConeGeometry(0.11, 0.4 - Math.abs(i - 3) * 0.04, 4), mat, {
          name: 'Mohawk Spike',
          thickness: 0.02,
        });
        fin.scale.x = 0.45; // thin side-to-side, long front-to-back
        stickTo(fin, dir, HEAD_R + 0.14, UP);
        hair.add(fin);
      }
      break;
    }
  }
  return hair;
}

function buildAccessory(kind) {
  if (kind === 'none') return null;
  const acc = new THREE.Group();
  acc.name = 'Accessory';
  switch (kind) {
    case 'cap': {
      acc.name = 'Baseball Cap';
      const red = toon('#2f6fed', { side: THREE.DoubleSide });
      const dome = part(new THREE.SphereGeometry(HEAD_R * 1.1, 40, 16, 0, Math.PI * 2, 0, Math.PI * 0.42), red, {
        name: 'Cap Dome',
        outline: false,
      });
      const brim = part(new THREE.CylinderGeometry(0.34, 0.34, 0.03, 32, 1, false, -Math.PI / 2, Math.PI), red, {
        name: 'Brim',
        thickness: 0.02,
      });
      brim.position.set(0, HEAD_R * 0.27, HEAD_R * 0.92);
      brim.rotation.x = 0.12;
      const button = part(sphere(0.05), red, { name: 'Button' });
      button.position.y = HEAD_R * 1.1;
      acc.add(dome, brim, button);
      break;
    }
    case 'glasses': {
      acc.name = 'Glasses';
      const frame = toon('#22202e');
      for (const side of [-1, 1]) {
        const ring = part(new THREE.TorusGeometry(0.15, 0.025, 10, 32), frame, { outline: false, name: 'Lens Frame' });
        ring.position.set(0.21 * side, 0.08, HEAD_R * 0.98);
        acc.add(ring);
        const arm = part(new THREE.CylinderGeometry(0.018, 0.018, 0.45, 8), frame, { outline: false, name: 'Arm' });
        arm.rotation.x = Math.PI / 2;
        arm.position.set(0.36 * side, 0.08, HEAD_R * 0.68);
        acc.add(arm);
      }
      const bridge = part(new THREE.CylinderGeometry(0.018, 0.018, 0.12, 8), frame, { outline: false, name: 'Bridge' });
      bridge.rotation.z = Math.PI / 2;
      bridge.position.set(0, 0.1, HEAD_R * 1.0);
      acc.add(bridge);
      break;
    }
    case 'crown': {
      acc.name = 'Crown';
      const gold = toon('#ffc93c', { side: THREE.DoubleSide });
      const ring = part(new THREE.CylinderGeometry(0.33, 0.3, 0.2, 32, 1, true), gold, { outline: false, name: 'Crown Band' });
      acc.add(ring);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const point = part(new THREE.ConeGeometry(0.07, 0.18, 8), gold, { name: 'Crown Point', thickness: 0.015 });
        point.position.set(Math.sin(a) * 0.31, 0.18, Math.cos(a) * 0.31);
        acc.add(point);
        const gem = part(sphere(0.035, 12, 8), toon(i % 2 ? '#ff4d6d' : '#3dd6d0'), { outline: false, name: 'Gem' });
        gem.position.set(Math.sin(a) * 0.33, 0, Math.cos(a) * 0.33);
        acc.add(gem);
      }
      acc.position.y = HEAD_R * 0.92;
      acc.rotation.z = 0.12;
      break;
    }
    case 'wizard': {
      acc.name = 'Wizard Hat';
      const blue = toon('#4b3fb5', { side: THREE.DoubleSide });
      const brim = part(new THREE.CylinderGeometry(0.72, 0.72, 0.04, 40), blue, { name: 'Hat Brim', thickness: 0.02 });
      const cone = part(new THREE.ConeGeometry(0.42, 0.95, 32), blue, { name: 'Hat Cone' });
      cone.position.y = 0.48;
      cone.rotation.z = -0.15;
      const star = part(new THREE.OctahedronGeometry(0.08), toon('#ffd23f'), { name: 'Star', thickness: 0.015 });
      star.position.set(0.1, 0.45, 0.3);
      acc.add(brim, cone, star);
      acc.position.y = HEAD_R * 0.72;
      acc.rotation.x = -0.12;
      break;
    }
    case 'headphones': {
      acc.name = 'Headphones';
      const band = part(new THREE.TorusGeometry(HEAD_R * 1.1, 0.04, 10, 40, Math.PI), toon('#ff5a4e'), {
        name: 'Headband',
        thickness: 0.015,
      });
      acc.add(band);
      for (const side of [-1, 1]) {
        const cup = part(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 24), toon('#2d2d3a'), { name: 'Ear Cup' });
        cup.rotation.z = Math.PI / 2;
        cup.position.set(HEAD_R * 1.08 * side, 0, 0);
        acc.add(cup);
      }
      break;
    }
  }
  return acc;
}

// ---------- Pets ----------

function petEyes(group, spread, y, z, size = 0.04) {
  for (const side of [-1, 1]) {
    const white = part(sphere(size), toon('#ffffff'), { outline: false, name: 'Pet Eye' });
    white.position.set(spread * side, y, z);
    const pupil = part(sphere(size * 0.55), toon('#141018'), { outline: false, name: 'Pet Pupil' });
    pupil.position.set(spread * side, y, z + size * 0.6);
    group.add(white, pupil);
  }
}

function buildPet(kind) {
  const pet = new THREE.Group();
  pet.name = 'Pet';
  const inner = new THREE.Group(); // this part bounces; `pet` stays put
  pet.add(inner);
  let animate;

  switch (kind) {
    case 'rock': {
      pet.name = 'Pet Rock';
      const rock = part(new THREE.DodecahedronGeometry(0.2), toon('#9a96a6', { flatShading: true }), { name: 'Rock' });
      rock.scale.set(1.2, 0.8, 1);
      rock.position.y = 0.16;
      inner.add(rock);
      petEyes(inner, 0.07, 0.2, 0.18, 0.045);
      animate = (time) => {
        inner.rotation.z = Math.sin(time * 1.5) * 0.04; // rocks don't do much
      };
      break;
    }
    case 'cat':
    case 'dog': {
      const isCat = kind === 'cat';
      pet.name = isCat ? 'Kitty Cat' : 'Puppy';
      const fur = toon(isCat ? '#ffa94d' : '#c58b5a');
      const bodyMesh = part(sphere(0.2), fur, { name: 'Pet Body' });
      bodyMesh.scale.set(0.9, 0.8, 1.3);
      bodyMesh.position.y = 0.2;
      const headMesh = part(sphere(0.17), fur, { name: 'Pet Head' });
      headMesh.position.set(0, 0.42, 0.2);
      inner.add(bodyMesh, headMesh);
      for (const side of [-1, 1]) {
        let ear;
        if (isCat) {
          ear = part(new THREE.ConeGeometry(0.06, 0.13, 8), fur, { name: 'Pet Ear', thickness: 0.015 });
          ear.position.set(0.1 * side, 0.57, 0.18);
          ear.rotation.z = -0.3 * side;
        } else {
          ear = part(sphere(0.07), toon('#7a4b2a'), { name: 'Floppy Ear', thickness: 0.015 });
          ear.scale.set(0.6, 1.4, 0.6);
          ear.position.set(0.16 * side, 0.4, 0.17);
        }
        inner.add(ear);
      }
      const snout = part(sphere(0.07), toon(isCat ? '#ffe0c2' : '#e8c39e'), { name: 'Snout', thickness: 0.015 });
      snout.scale.set(1.2, 0.8, 1);
      snout.position.set(0, 0.37, 0.35);
      const nose = part(sphere(0.025), toon('#2b2233'), { outline: false, name: 'Pet Nose' });
      nose.position.set(0, 0.4, 0.42);
      inner.add(snout, nose);
      petEyes(inner, 0.07, 0.47, 0.33);
      const tail = part(new THREE.CapsuleGeometry(0.035, 0.25, 4, 8), fur, { name: 'Tail', thickness: 0.015 });
      tail.position.set(0, 0.32, -0.27);
      tail.rotation.x = -0.6;
      inner.add(tail);
      animate = (time) => {
        tail.rotation.z = Math.sin(time * (isCat ? 3 : 12)) * 0.5; // dogs wag fast!
        inner.position.y = Math.abs(Math.sin(time * 2.5)) * 0.04;
      };
      break;
    }
    case 'bird': {
      pet.name = 'Little Bird';
      const feathers = toon('#4cc9f0');
      const bodyMesh = part(sphere(0.15), feathers, { name: 'Bird Body' });
      bodyMesh.scale.set(1, 1.1, 1);
      const beak = part(new THREE.ConeGeometry(0.04, 0.1, 8), toon('#ffb703'), { name: 'Beak', thickness: 0.012 });
      beak.rotation.x = Math.PI / 2;
      beak.position.set(0, 0.02, 0.17);
      inner.add(bodyMesh, beak);
      petEyes(inner, 0.06, 0.06, 0.12, 0.032);
      const wings = [-1, 1].map((side) => {
        const wing = part(sphere(0.1), toon('#3a86ff'), { name: 'Wing', thickness: 0.015 });
        wing.scale.set(1.2, 0.3, 0.8);
        wing.position.set(0.14 * side, 0.02, -0.02);
        inner.add(wing);
        return wing;
      });
      animate = (time) => {
        inner.position.y = 1.2 + Math.sin(time * 2) * 0.12; // hovering in the air
        inner.position.x = Math.sin(time * 0.8) * 0.15;
        wings.forEach((w, i) => (w.rotation.z = Math.sin(time * 18) * 0.6 * (i ? -1 : 1)));
      };
      break;
    }
    case 'slime': {
      pet.name = 'Bouncy Slime';
      const goo = part(
        new THREE.SphereGeometry(0.24, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.55),
        toon('#7ae582', { transparent: true, opacity: 0.88 }),
        { name: 'Slime Goo' },
      );
      inner.add(goo);
      petEyes(inner, 0.08, 0.14, 0.17, 0.05);
      animate = (time) => {
        const squish = Math.sin(time * 4);
        inner.scale.set(1 + squish * 0.08, 1 - squish * 0.12, 1 + squish * 0.08);
      };
      break;
    }
    case 'dragon': {
      pet.name = 'Baby Dragon';
      const scales = toon('#9b5de5');
      const bodyMesh = part(sphere(0.2), scales, { name: 'Dragon Body' });
      bodyMesh.scale.set(0.9, 1, 1.1);
      bodyMesh.position.y = 0.22;
      const headMesh = part(sphere(0.16), scales, { name: 'Dragon Head' });
      headMesh.position.set(0, 0.5, 0.12);
      const belly = part(sphere(0.13), toon('#ffd6a5'), { outline: false, name: 'Belly' });
      belly.scale.set(1, 1.2, 0.6);
      belly.position.set(0, 0.2, 0.12);
      inner.add(bodyMesh, headMesh, belly);
      petEyes(inner, 0.07, 0.54, 0.25);
      for (const side of [-1, 1]) {
        const horn = part(new THREE.ConeGeometry(0.035, 0.12, 8), toon('#fff3b0'), { name: 'Horn', thickness: 0.012 });
        horn.position.set(0.08 * side, 0.67, 0.08);
        horn.rotation.z = -0.25 * side;
        inner.add(horn);
      }
      const wings = [-1, 1].map((side) => {
        const wing = part(new THREE.ConeGeometry(0.14, 0.3, 3), toon('#f15bb5'), { name: 'Dragon Wing', thickness: 0.015 });
        wing.scale.z = 0.25;
        wing.position.set(0.22 * side, 0.36, -0.1);
        wing.rotation.z = -1.1 * side;
        inner.add(wing);
        return wing;
      });
      const tail = part(new THREE.ConeGeometry(0.08, 0.35, 12), scales, { name: 'Dragon Tail' });
      tail.position.set(0, 0.12, -0.3);
      tail.rotation.x = -1.2;
      inner.add(tail);
      animate = (time) => {
        wings.forEach((w, i) => (w.rotation.z = (i ? 1.1 : -1.1) + Math.sin(time * 9) * 0.35 * (i ? 1 : -1)));
        inner.position.y = 0.1 + Math.sin(time * 3) * 0.06;
      };
      break;
    }
  }
  pet.userData.animate = animate;
  return pet;
}
