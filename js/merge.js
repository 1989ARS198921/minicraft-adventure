// ============================================================
//  🧱 СКЛЕЙКА СТРОЕНИЙ (оптимизация отрисовки!)
//  Деревни и города строились из тысяч отдельных кубиков —
//  каждый кубик это отдельный вызов отрисовки (draw call),
//  и телефон задыхался: 16 000 кубиков ≈ 2200 вызовов за кадр!
//  Здесь мы склеиваем все статичные детали группы в 1–2 больших
//  меша (непрозрачные отдельно, прозрачные отдельно),
//  а цвет каждой детали запекаем прямо в вершины.
//  Было: 16 000 мешей → стало: 2 меша на строение!
// ============================================================

import * as THREE from 'three';

// Склеить список геометрий в одну большую (position + normal + color)
function mergeGeoms(list) {
  let total = 0;
  for (const g of list) total += g.attributes.position.count;
  const pos = new Float32Array(total * 3);
  const nor = new Float32Array(total * 3);
  const col = new Float32Array(total * 3);
  let off = 0;
  for (const g of list) {
    pos.set(g.attributes.position.array, off * 3);
    nor.set(g.attributes.normal.array, off * 3);
    col.set(g.attributes.color.array, off * 3);
    off += g.attributes.position.count;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
}

// Склеить все статичные меши внутри группы (деревня, город)
export function mergeStaticGroup(group) {
  group.updateMatrixWorld(true);
  // Переводим мировые координаты деталей в локальные координаты группы
  const inv = new THREE.Matrix4().copy(group.matrixWorld).invert();
  const tmp = new THREE.Matrix4();
  const solid = []; // непрозрачные детали
  const glass = []; // прозрачные детали (окна, вода)
  const doomed = []; // старые меши на удаление из сцены

  group.traverse(o => {
    if (!o.isMesh || o.userData.noMerge) return;   // спрайты и помеченные не трогаем
    if (o.material && o.material.map) return;      // текстурированные не трогаем
    const g = o.geometry;
    if (!g || !g.attributes.position) return;

    // Копия геометрии без индексов (так проще склеивать)
    const geo = g.index ? g.toNonIndexed() : g.clone();
    tmp.multiplyMatrices(inv, o.matrixWorld);
    geo.applyMatrix4(tmp);

    // Запекаем цвет материала в вершины
    const c = (o.material && o.material.color) || { r: 1, g: 1, b: 1 };
    const n = geo.attributes.position.count;
    const colors = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    // Убираем лишние атрибуты, чтобы склейка не споткнулась
    for (const k of Object.keys(geo.attributes))
      if (k !== 'position' && k !== 'normal' && k !== 'color') geo.deleteAttribute(k);

    (o.material && o.material.transparent ? glass : solid).push(geo);
    doomed.push(o);
  });

  if (!doomed.length) return;
  // Убираем старые кубики из сцены (сами объекты остаются в памяти —
  // по ним работает физика столкновений городов!)
  for (const m of doomed) m.parent.remove(m);

  const addMerged = (list, mat) => {
    if (!list.length) return;
    const mesh = new THREE.Mesh(mergeGeoms(list), mat);
    mesh.matrixAutoUpdate = false; // статика — не считаем матрицу каждый кадр
    group.add(mesh);
  };
  addMerged(solid, new THREE.MeshLambertMaterial({ vertexColors: true }));
  addMerged(glass, new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, opacity: 0.5 }));
}
