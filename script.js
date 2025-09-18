import * as THREE from 'three';

// Lista de frases (proporcionadas por el usuario)
const PHRASES = [
  '❤️eres mi lugar favorito❤️',
  '❤️eres muy hermosa❤️',
  '❤️ te amo mucho❤️',
  '❤️te quiero casar conmigo❤️',
  '❤️te amo❤️',
  '❤️no paro de pensarte❤️',
  '❤️eres el amor de mi vida❤️',
  '❤️espero que seas feliz conmigo❤️',
  '❤️no sabes lo mucho que te amo❤️',
  '❤️me encantas todo los días❤️',
  '❤️cada día me enamoro más de ti❤️',
  '❤️estaremos siempre juntos❤️'
];

// Configuración básica
const canvas = document.getElementById('galaxy-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.0008);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 10000);
camera.position.z = 800;

// Luz sutil
const ambient = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambient);

// Crea una textura a partir de canvas con texto (para usar en Sprite)
function createTextTexture(text) {
  const padding = 20;
  const fontSize = Math.round(Math.max(28, window.innerWidth * 0.02));
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // medir ancho
  ctx.font = `${fontSize}px Arial`;
  const metrics = ctx.measureText(text);
  const textWidth = Math.ceil(metrics.width);
  const textHeight = Math.ceil(fontSize * 1.2);

  canvas.width = textWidth + padding * 2;
  canvas.height = textHeight + padding * 2;

  // fondo transparente
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Sombra y estilo
  ctx.font = `${fontSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Glow (suave)
  ctx.shadowColor = 'rgba(255,100,150,0.85)';
  ctx.shadowBlur = 20;

  // Texto blanco con ligera traza rosa
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = 'rgba(255,100,150,0.25)';
  ctx.lineWidth = Math.max(2, fontSize * 0.08);

  const x = canvas.width / 2;
  const y = canvas.height / 2;

  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Crear sprites a partir de las frases y esparcirlos en una 'galaxia'
const sprites = [];
const countPerPhrase = 6; // cuántas copias por frase

PHRASES.forEach((phrase, i) => {
  const texture = createTextTexture(phrase);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });

  for (let j = 0; j < countPerPhrase; j++) {
    const sprite = new THREE.Sprite(material.clone());

    // Posición aleatoria dentro de una esfera elíptica
    const radius = THREE.MathUtils.randFloat(200, 1500);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));

    sprite.position.x = radius * Math.sin(phi) * Math.cos(theta);
    sprite.position.y = radius * Math.sin(phi) * Math.sin(theta);
    sprite.position.z = radius * Math.cos(phi);

    // Escala inicial basada en distancia para dar profundidad
    const scale = THREE.MathUtils.mapLinear(radius, 200, 1500, 1.2, 0.18);
    sprite.scale.set(scale * texture.image.width / 80, scale * texture.image.height / 80, 1);

    sprite.userData = {
      speed: THREE.MathUtils.randFloat(-0.0015, 0.0015),
      oscillate: THREE.MathUtils.randFloat(0.2, 1.6),
      baseScale: scale
    };

    scene.add(sprite);
    sprites.push(sprite);
  }
});

// Fondo estrellado
const starsGeometry = new THREE.BufferGeometry();
const starCount = 1500;
const positions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  const r = THREE.MathUtils.randFloat(800, 3000);
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));
  positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
  positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
  positions[i * 3 + 2] = r * Math.cos(phi);
}
starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const starsMaterial = new THREE.PointsMaterial({ size: 1.8, transparent: true });
const starPoints = new THREE.Points(starsGeometry, starsMaterial);
scene.add(starPoints);

// Animación
let time = 0;
function animate() {
  time += 0.005;
  scene.rotation.y += 0.0006;
  sprites.forEach((s, idx) => {
    const osc = Math.sin(time * s.userData.oscillate + idx) * 0.15;
    const newScale = s.userData.baseScale * (1 + osc * 0.18);
    s.scale.set(newScale * (s.material.map.image.width / 80), newScale * (s.material.map.image.height / 80), 1);
    s.material.rotation = Math.sin(time * (0.2 + s.userData.oscillate)) * 0.08;
  });
  starsMaterial.opacity = 0.6 + Math.sin(time * 0.7) * 0.25;
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

// Responsivo
function onWindowResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);

  sprites.forEach((s, idx) => {
    const phraseIndex = Math.floor(idx / countPerPhrase) % PHRASES.length;
    const newTex = createTextTexture(PHRASES[phraseIndex]);
    s.material.map.dispose();
    s.material.map = newTex;
    s.material.needsUpdate = true;
    const radius = s.position.length();
    s.userData.baseScale = THREE.MathUtils.mapLinear(radius, 200, 1500, 1.2, 0.18);
  });
}
window.addEventListener('resize', onWindowResize, { passive: true });

// Interacción táctil
let isPointerDown = false;
let lastX = 0;
let lastY = 0;
window.addEventListener('pointerdown', (e) => {
  isPointerDown = true;
  lastX = e.clientX;
  lastY = e.clientY;
});
window.addEventListener('pointermove', (e) => {
  if (!isPointerDown) return;
  const dx = (e.clientX - lastX) * 0.003;
  const dy = (e.clientY - lastY) * 0.003;
  scene.rotation.y += dx;
  scene.rotation.x += dy;
  lastX = e.clientX;
  lastY = e.clientY;
});
window.addEventListener('pointerup', () => { isPointerDown = false; });

onWindowResize();
export { PHRASES };
