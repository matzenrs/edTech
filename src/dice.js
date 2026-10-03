// A die made with CSS 3D: six squares folded into a cube, then spun.
const PIPS = {
  1: [5],
  2: [1, 9],
  3: [1, 5, 9],
  4: [1, 3, 7, 9],
  5: [1, 3, 5, 7, 9],
  6: [1, 3, 4, 6, 7, 9],
};
// How to turn the cube so each face points at you
const SHOW = { 1: [0, 0], 2: [-90, 0], 3: [0, -90], 4: [0, 90], 5: [90, 0], 6: [0, 180] };

export function createDie() {
  const wrap = document.createElement('div');
  wrap.className = 'die-wrap';
  const cube = document.createElement('div');
  cube.className = 'die';
  for (let face = 1; face <= 6; face++) {
    const f = document.createElement('div');
    f.className = `face f${face}`;
    for (let spot = 1; spot <= 9; spot++) {
      const pip = document.createElement('i');
      if (PIPS[face].includes(spot)) pip.className = 'on';
      f.appendChild(pip);
    }
    cube.appendChild(f);
  }
  wrap.appendChild(cube);

  let spins = 0;
  return {
    el: wrap,
    /** Spin and land on `face`. Resolves when the animation is done. */
    roll(face, ms = 900) {
      spins += 2;
      const [x, y] = SHOW[face];
      cube.style.transitionDuration = `${ms}ms`;
      cube.style.transform = `rotateX(${x + 360 * spins}deg) rotateY(${y + 360 * spins}deg)`;
      wrap.classList.remove('landed');
      return new Promise((resolve) =>
        setTimeout(() => {
          wrap.classList.add('landed');
          resolve();
        }, ms),
      );
    },
    show(face) {
      const [x, y] = SHOW[face];
      cube.style.transitionDuration = '0ms';
      cube.style.transform = `rotateX(${x + 360 * spins}deg) rotateY(${y + 360 * spins}deg)`;
    },
  };
}
