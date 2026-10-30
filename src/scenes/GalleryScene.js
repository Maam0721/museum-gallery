import * as THREE from 'three';

function addBeam(parent, from, to, radius, material) {
  const start = new THREE.Vector3(...from);
  const end = new THREE.Vector3(...to);
  const direction = end.clone().sub(start);
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.8, radius, direction.length(), 8),
    material,
  );
  beam.position.copy(start).add(end).multiplyScalar(0.5);
  beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  parent.add(beam);
}

function addExhibit(parent, texture, x, width, z) {
  const height = width / (texture.image.width / texture.image.height);
  const backing = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.3, height + 0.3, 0.2),
    new THREE.MeshStandardMaterial({ color: 0x38291e, roughness: 0.46, metalness: 0.18 }),
  );
  backing.position.set(x, 1, z);
  parent.add(backing);

  const trim = new THREE.MeshStandardMaterial({ color: 0xc5a267, roughness: 0.33, metalness: 0.6 });
  const painting = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshStandardMaterial({ map: texture, roughness: 0.8 }),
  );
  painting.position.set(x, 1, z + 0.115);
  parent.add(painting);

  const edge = 0.065;
  const rails = [
    new THREE.Mesh(new THREE.BoxGeometry(width + 0.42, edge, 0.13), trim),
    new THREE.Mesh(new THREE.BoxGeometry(width + 0.42, edge, 0.13), trim),
    new THREE.Mesh(new THREE.BoxGeometry(edge, height + 0.42, 0.13), trim),
    new THREE.Mesh(new THREE.BoxGeometry(edge, height + 0.42, 0.13), trim),
  ];
  rails[0].position.set(x, 1 + height / 2 + 0.21, z);
  rails[1].position.set(x, 1 - height / 2 - 0.21, z);
  rails[2].position.set(x - width / 2 - 0.21, 1, z);
  rails[3].position.set(x + width / 2 + 0.21, 1, z);
  parent.add(...rails);

  const reflection = new THREE.Mesh(
    new THREE.PlaneGeometry(width, Math.min(height, 2.2)),
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    }),
  );
  reflection.rotation.x = -Math.PI / 2;
  reflection.position.set(x, -5.18, -3.8);
  parent.add(reflection);
}

// Creates a ger-inspired exhibition hall for the historical portrait and map.
export function createGalleryScene(scene, portraitTexture, empireTexture, landscapeTexture) {
  const room = new THREE.Group();
  room.position.z = -51;
  scene.add(room);

  const felt = new THREE.MeshStandardMaterial({
    color: 0x776048,
    roughness: 0.92,
    side: THREE.BackSide,
  });
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 11, 48, 1, true), felt);
  wall.position.y = 0.25;
  room.add(wall);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(8.95, 64),
    new THREE.MeshStandardMaterial({ color: 0x57483a, roughness: 0.24, metalness: 0.23 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -5.25;
  room.add(floor);

  const stone = new THREE.MeshStandardMaterial({ color: 0x927657, roughness: 0.55 });
  const bronze = new THREE.MeshStandardMaterial({ color: 0xb79763, roughness: 0.36, metalness: 0.55 });
  const darkTimber = new THREE.MeshStandardMaterial({ color: 0x473426, roughness: 0.58 });

  for (const y of [-4.85, 4.7]) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(8.96, 0.095, 8, 64), bronze);
    band.rotation.x = Math.PI / 2;
    band.position.y = y;
    room.add(band);
  }

  for (let index = 0; index < 20; index += 1) {
    const angle = (index / 20) * Math.PI * 2;
    const x = Math.sin(angle) * 8.65;
    const z = Math.cos(angle) * 8.65;
    addBeam(room, [x, -4.75, z], [x, 4.45, z], 0.055, darkTimber);

    const innerAngle = angle;
    const from = [Math.sin(innerAngle) * 0.82, 5.05, Math.cos(innerAngle) * 0.82];
    const to = [Math.sin(angle) * 8.5, 4.2, Math.cos(angle) * 8.5];
    addBeam(room, from, to, 0.045, bronze);
  }

  for (const x of [-0.72, 0.72]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 10, 16), darkTimber);
    post.position.set(x, -0.1, 0);
    room.add(post);
    const capital = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.3, 0.28, 16), bronze);
    capital.position.set(x, 5, 0);
    room.add(capital);
  }

  const crown = new THREE.Mesh(new THREE.TorusGeometry(1.08, 0.12, 10, 40), bronze);
  crown.rotation.x = Math.PI / 2;
  crown.position.y = 5.05;
  room.add(crown);

  for (let index = 0; index < 3; index += 1) {
    const inlay = new THREE.Mesh(
      new THREE.RingGeometry(3.05 + index * 0.32, 3.09 + index * 0.32, 72),
      new THREE.MeshBasicMaterial({ color: 0xb28e59, transparent: true, opacity: 0.46, side: THREE.DoubleSide }),
    );
    inlay.rotation.x = -Math.PI / 2;
    inlay.position.y = -5.22 + index * 0.003;
    room.add(inlay);
  }

  addExhibit(room, landscapeTexture, -3.35, 3.1, -7.85);
  addExhibit(room, portraitTexture, 0, 2.1, -7.85);
  addExhibit(room, empireTexture, 3.25, 3.05, -7.85);

  for (const x of [-3.8, -1.2, 1.2, 3.8]) {
    const spotlight = new THREE.SpotLight(0xffd79c, 28, 15, Math.PI / 6, 0.62, 1.2);
    spotlight.position.set(x, 5.1, -3);
    spotlight.target.position.set(x * 0.7, 0.9, -7.5);
    room.add(spotlight, spotlight.target);
  }
  room.add(new THREE.HemisphereLight(0xe3d2b1, 0x443427, 1.5));

  return room;
}
