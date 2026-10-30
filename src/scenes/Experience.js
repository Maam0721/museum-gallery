import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { MotionBlurPass } from '../effects/MotionBlurPass.js';
import { createGalleryScene } from './GalleryScene.js';

const exhibits = [
  { id: 'genghis', z: 0, width: 5.2, x: 3.8 },
  { id: 'terelj', z: -11, width: 13.4, x: 2.7 },
  { id: 'horses', z: -22, width: 12, x: 2.5 },
  { id: 'empire', z: -33, width: 12.4, x: 2.8 },
  { id: 'gobi', z: -44, width: 13.4, x: 2.7 },
];
const cameraStops = [10, -3, -14, -25, -36, -47];

// Owns the camera path, framed historical images and post-processing lifecycle.
export class Experience {
  constructor(canvas, artworks) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x13110e);
    this.camera = new THREE.PerspectiveCamera(37, 1, 0.1, 120);
    this.camera.position.set(0, 0, cameraStops[0]);
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.65));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.paintings = [];
    this.activePainting = 0;
    this.artOpacity = exhibits.map((_exhibit, index) => (index === 0 ? 1 : 0));
    this.artTransitionFrom = this.artOpacity.slice();
    this.artTransitionElapsed = 0.55;
    for (const exhibit of exhibits) {
      this.addPainting(artworks[exhibit.id], exhibit.z, exhibit.width, exhibit.x);
    }
    this.gallery = createGalleryScene(this.scene, artworks.genghis, artworks.empire, artworks.terelj);
    this.addAtmosphere();

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.motionBlur = new MotionBlurPass();
    this.composer.addPass(this.motionBlur);
    this.pointer = { x: 0, y: 0 };
    this.clock = new THREE.Clock();
    this.handlePointer = (event) => {
      this.pointer.x = (event.clientX / window.innerWidth - 0.5) * 0.38;
      this.pointer.y = (event.clientY / window.innerHeight - 0.5) * 0.26;
    };
    this.handleResize = () => this.resize();
    window.addEventListener('pointermove', this.handlePointer, { passive: true });
    window.addEventListener('resize', this.handleResize);
    this.resize();
    this.render = this.render.bind(this);
    this.frame = window.requestAnimationFrame(this.render);
  }

  addAtmosphere() {
    this.scene.add(new THREE.HemisphereLight(0xc8d1e0, 0x6b4a2d, 1.35));
    const keyLight = new THREE.PointLight(0xd9b87f, 23, 36, 1.7);
    keyLight.position.set(4, 5, 8);
    this.scene.add(keyLight);

    const count = 220;
    const positions = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      positions[index * 3] = (Math.random() - 0.5) * 28;
      positions[index * 3 + 1] = (Math.random() - 0.5) * 17;
      positions[index * 3 + 2] = -4 - Math.random() * 34;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.scene.add(new THREE.Points(
      geometry,
      new THREE.PointsMaterial({ color: 0xd9c59d, size: 0.026, transparent: true, opacity: 0.52 }),
    ));
  }

  addPainting(texture, z, width, x) {
    const aspect = texture.image.width / texture.image.height;
    const height = width / aspect;
    const initialOpacity = this.paintings.length === 0 ? 1 : 0;
    const painting = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height, 24, 24),
      new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide,
        toneMapped: false,
        transparent: true,
        opacity: initialOpacity,
        depthWrite: false,
      }),
    );
    painting.visible = initialOpacity > 0;
    painting.position.set(x, 0, z);
    this.scene.add(painting);
    const frame = this.addFrame(width, height, x, z - 0.12);
    this.paintings.push({ mesh: painting, frame, x, width, height, texture });
  }

  addFrame(width, height, x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    this.scene.add(group);
    const backing = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.28, height + 0.28, 0.2),
      new THREE.MeshStandardMaterial({
        color: 0x30231a,
        roughness: 0.58,
        metalness: 0.16,
        transparent: true,
        depthWrite: false,
      }),
    );
    group.add(backing);

    const railMaterial = new THREE.MeshStandardMaterial({
      color: 0xb49760,
      roughness: 0.34,
      metalness: 0.62,
      transparent: true,
      depthWrite: false,
    });
    const railWidth = Math.min(width, height) > 6 ? 0.105 : 0.075;
    const rails = [
      [width + 0.4, railWidth, 0, height / 2 + 0.17],
      [width + 0.4, railWidth, 0, -height / 2 - 0.17],
      [railWidth, height + 0.4, -width / 2 - 0.17, 0],
      [railWidth, height + 0.4, width / 2 + 0.17, 0],
    ];
    for (const [railWidth, railHeight, railX, railY] of rails) {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(railWidth, railHeight, 0.16),
        railMaterial,
      );
      rail.position.set(railX, railY, 0);
      group.add(rail);
    }
    return group;
  }

  resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const mobile = width < 700;
    this.camera.aspect = width / height;
    this.camera.fov = mobile ? 44 : 37;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.composer.setSize(width, height);

    for (const painting of this.paintings) {
      const scale = mobile ? 0.55 : 1;
      const x = mobile && painting.x !== 0 ? (painting.mesh.position.z === 0 ? 2.8 : 4) : painting.x;
      painting.mesh.scale.setScalar(scale);
      painting.mesh.position.x = x;
      painting.frame.position.x = x;
      painting.frame.scale.setScalar(scale);
    }
  }

  setScrollVelocity(velocity) {
    this.motionBlur.setVelocity(velocity);
  }

  setScrollProgress(progress) {
    const segmentPosition = THREE.MathUtils.clamp(progress, 0, 1) * (cameraStops.length - 1);
    const segment = Math.min(Math.floor(segmentPosition), cameraStops.length - 2);
    const amount = segmentPosition - segment;
    const easedAmount = amount * amount * (3 - 2 * amount);
    this.camera.position.z = THREE.MathUtils.lerp(
      cameraStops[segment],
      cameraStops[segment + 1],
      easedAmount,
    );
    const activeChapter = Math.min(
      cameraStops.length - 1,
      Math.floor(segmentPosition + 0.281),
    );
    const activePainting = Math.min(
      this.paintings.length - 1,
      activeChapter,
    );
    if (activePainting !== this.activePainting) {
      this.artTransitionFrom = this.artOpacity.slice();
      this.activePainting = activePainting;
      this.artTransitionElapsed = 0;
      this.paintings.forEach(({ mesh, frame }, index) => {
        mesh.visible = index === activePainting || this.artOpacity[index] > 0;
        frame.visible = index === activePainting || this.artOpacity[index] > 0;
      });
    }
    return activeChapter;
  }

  updateArtworkTransition(delta) {
    if (this.artTransitionElapsed >= 0.55) return;
    this.artTransitionElapsed = Math.min(this.artTransitionElapsed + delta, 0.55);
    const progress = this.artTransitionElapsed / 0.55;
    const eased = progress * progress * (3 - 2 * progress);
    for (let index = 0; index < this.paintings.length; index += 1) {
      const target = index === this.activePainting ? 1 : 0;
      const opacity = THREE.MathUtils.lerp(this.artTransitionFrom[index], target, eased);
      this.artOpacity[index] = opacity;
      const { mesh, frame } = this.paintings[index];
      mesh.material.opacity = opacity;
      mesh.visible = opacity > 0.005;
      frame.visible = opacity > 0.005;
      frame.traverse((object) => {
        if (object.isMesh) object.material.opacity = opacity;
      });
    }
  }

  render() {
    this.frame = window.requestAnimationFrame(this.render);
    const delta = Math.min(this.clock.getDelta(), 0.05);
    const parallaxX = this.pointer.x * 0.24;
    const parallaxY = -this.pointer.y * 0.17;
    this.updateArtworkTransition(delta);
    this.camera.position.x = parallaxX;
    this.camera.position.y = parallaxY;
    this.camera.lookAt(parallaxX * 0.65, parallaxY * 0.65, this.camera.position.z - 12);
    this.motionBlur.update(delta);
    this.composer.render(delta);
  }

  dispose() {
    window.cancelAnimationFrame(this.frame);
    window.removeEventListener('pointermove', this.handlePointer);
    window.removeEventListener('resize', this.handleResize);
    const geometries = new Set();
    const materials = new Set();
    const textures = new Set();
    this.scene.traverse((object) => {
      if (!object.isMesh && !object.isPoints) return;
      if (object.geometry) geometries.add(object.geometry);
      const list = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of list) {
        materials.add(material);
        for (const value of Object.values(material)) {
          if (value?.isTexture) textures.add(value);
        }
      }
    });
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose();
    for (const texture of textures) texture.dispose();
    this.motionBlur.dispose();
    this.composer.dispose();
    this.renderer.dispose();
  }
}
