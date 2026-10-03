// ============================================================
//  🌑 ТЕНИ-ПЯТНА — мягкое тёмное пятнышко под ногами.
//  С ним персонажи «встают на землю», а не парят в воздухе.
//  Одна картинка и одна геометрия на всех — почти бесплатно!
// ============================================================

import * as THREE from 'three';

let blobMat = null;
const blobGeo = new THREE.PlaneGeometry(1, 1);

function getMat() {
  if (blobMat) return blobMat;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 4, 32, 32, 30);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.42)');
  grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.18)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  blobMat = new THREE.MeshBasicMaterial({
    map: new THREE.CanvasTexture(c),
    transparent: true,
    depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -2 // не спорим с землёй за пиксели
  });
  return blobMat;
}

// Повесить тень на любую фигурку: group — модель, radius — размер пятна
export function addBlobShadow(group, radius = 0.5) {
  const m = new THREE.Mesh(blobGeo, getMat());
  m.rotation.x = -Math.PI / 2; // ложим плоскость на землю
  m.position.y = 0.03;         // чуть над блоками, чтобы не мерцала
  m.scale.set(radius * 2, radius * 2, 1);
  m.renderOrder = 1;
  group.add(m);
  return m;
}
