// PayPilot — three.js scenes. Every scene pauses off-screen and respects reduced motion.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
const MOBILE = matchMedia('(max-width: 760px)').matches || navigator.maxTouchPoints > 1 && innerWidth < 1100;
const DPR = Math.min(devicePixelRatio || 1, MOBILE ? 1.5 : 2);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => 1 - Math.pow(1 - clamp(t), 3);
const span = (p, a, b) => clamp((p - a) / (b - a));
const VIOLET = 0x8b5cf6, LILAC = 0xc4b5fd, MAGENTA = 0xe879f9, CYAN = 0x67e8f9;

// ---------- shared plumbing ----------
function boot(canvas, { bloom = 0, exposure = 1.1, envIntensity = 1 } = {}) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: !bloom, alpha: true, powerPreference: 'high-performance' }); }
  catch { canvas.closest('[data-scene-host]')?.classList.add('no-webgl'); return null; }
  renderer.setPixelRatio(DPR);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = exposure;
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = envIntensity;
  pm.dispose();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 200);
  let composer = null, bloomPass = null;
  if (bloom && !MOBILE) {
    renderer.setClearColor(0x06050d, 1);
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), bloom, 0.6, 0.72);
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());
  }
  const ctx = { renderer, scene, camera, composer, canvas, visible: true, t: 0, tick: null, onResize: null };
  const resize = () => {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false); composer?.setSize(w, h); bloomPass?.setSize(w, h);
    camera.aspect = w / h; camera.updateProjectionMatrix(); ctx.onResize?.(w, h);
  };
  new ResizeObserver(resize).observe(canvas); resize();
  new IntersectionObserver(([e]) => { ctx.visible = e.isIntersecting; }, { rootMargin: '120px' }).observe(canvas);
  const clock = new THREE.Clock();
  const loop = () => {
    requestAnimationFrame(loop);
    if (!ctx.visible || document.hidden) { clock.getDelta(); return; }
    const dt = Math.min(clock.getDelta(), 0.05); ctx.t += REDUCE ? 0 : dt;
    ctx.tick?.(dt, ctx.t);
    composer ? composer.render() : renderer.render(scene, camera);
  };
  loop();
  return ctx;
}
function pointer(el) {
  const p = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', (e) => { p.tx = (e.clientX / innerWidth - .5) * 2; p.ty = (e.clientY / innerHeight - .5) * 2; }, { passive: true });
  p.update = (k = .06) => { p.x = lerp(p.x, p.tx, k); p.y = lerp(p.y, p.ty, k); };
  return p;
}
const progressOf = (el) => { const r = el.getBoundingClientRect(); return clamp(-r.top / Math.max(1, r.height - innerHeight)); };

// ---------- canvas textures ----------
function tex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  t.redraw = (fn) => { fn(g, w, h); t.needsUpdate = true; };
  return t;
}
function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function logoMark(g, x, y, s, color = '#fff') {
  g.save(); g.translate(x, y); g.scale(s / 100, s / 100);
  g.lineWidth = 7; g.strokeStyle = color; g.lineJoin = 'round'; g.lineCap = 'round';
  rr(g, 6, 34, 70, 50, 9); g.stroke();
  g.beginPath(); g.moveTo(6, 50); g.lineTo(76, 50); g.stroke();
  const gr = g.createLinearGradient(40, 60, 96, 6); gr.addColorStop(0, '#A78BFA'); gr.addColorStop(1, '#E879F9');
  g.strokeStyle = gr; g.lineWidth = 8;
  g.beginPath(); g.moveTo(52, 46); g.lineTo(90, 10); g.stroke();
  g.beginPath(); g.moveTo(66, 9); g.lineTo(91, 9); g.lineTo(91, 34); g.stroke();
  g.restore();
}
function cardFace(front) {
  return tex(1024, 646, (g, w, h) => {
    const bg = g.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#2A1A5E'); bg.addColorStop(.45, '#1A1240'); bg.addColorStop(1, '#0D0A22');
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    const glow = g.createRadialGradient(w * .85, h * .1, 10, w * .85, h * .1, w * .7);
    glow.addColorStop(0, 'rgba(232,121,249,.55)'); glow.addColorStop(.5, 'rgba(139,92,246,.18)'); glow.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = glow; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(196,181,253,.10)'; g.lineWidth = 2;
    for (let i = -h; i < w; i += 34) { g.beginPath(); g.moveTo(i, h); g.lineTo(i + h * .6, 0); g.stroke(); }
    if (front) {
      logoMark(g, 70, 54, 92);
      g.fillStyle = '#fff'; g.font = '600 64px Sora, Inter, sans-serif'; g.fillText('PayPilot', 176, 128);
      const chip = g.createLinearGradient(80, 250, 230, 360); chip.addColorStop(0, '#F6E7B3'); chip.addColorStop(.5, '#C9A64B'); chip.addColorStop(1, '#F2D98A');
      g.fillStyle = chip; rr(g, 80, 250, 150, 112, 18); g.fill();
      g.strokeStyle = 'rgba(80,60,10,.45)'; g.lineWidth = 3;
      [[80, 288, 230, 288], [80, 324, 230, 324], [140, 250, 140, 362], [170, 250, 170, 362]].forEach(([a, b, c, d]) => { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); });
      g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 7; g.lineCap = 'round';
      for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(280, 306, 18 + i * 16, -0.9, 0.9); g.stroke(); }
      g.fillStyle = 'rgba(255,255,255,.9)'; g.font = '500 46px "SF Mono", Menlo, monospace';
      g.fillText('••••  ••••  ••••  4242', 80, 480);
      g.fillStyle = 'rgba(255,255,255,.55)'; g.font = '500 26px Inter, sans-serif'; g.fillText('BUSINESS', 80, 566);
      g.fillStyle = 'rgba(255,255,255,.9)'; g.font = '600 30px Inter, sans-serif'; g.fillText('PILOT  MERCHANT', 80, 604);
      g.fillStyle = '#fff'; g.font = 'italic 700 56px Inter, sans-serif'; g.textAlign = 'right'; g.fillText('VISA', w - 70, h - 56);
    } else {
      g.fillStyle = '#05040C'; g.fillRect(0, 70, w, 120);
      g.fillStyle = 'rgba(255,255,255,.85)'; rr(g, 70, 250, 560, 80, 8); g.fill();
      g.fillStyle = '#333'; g.font = 'italic 500 34px Inter'; g.fillText('Authorized signature', 90, 302);
      logoMark(g, w - 210, h - 200, 130, 'rgba(255,255,255,.9)');
      g.fillStyle = 'rgba(255,255,255,.5)'; g.font = '500 24px Inter'; g.fillText('Payments, piloted.', 70, h - 70);
    }
  });
}
function screenTex() {
  const t = tex(640, 400, () => {});
  t.state = {};
  t.show = (s) => {
    if (JSON.stringify(s) === JSON.stringify(t.state)) return; t.state = { ...s };
    t.redraw((g, w, h) => {
      const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#1B1240'); bg.addColorStop(1, '#09071A');
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      logoMark(g, 24, 18, 40); g.fillStyle = '#fff'; g.font = '600 24px Sora, Inter'; g.fillText('PayPilot', 72, 50);
      g.textAlign = 'center';
      if (s.mode === 'approved') {
        g.fillStyle = '#10B981'; g.beginPath(); g.arc(w / 2, 175, 62, 0, 7); g.fill();
        g.strokeStyle = '#fff'; g.lineWidth = 12; g.lineCap = 'round'; g.lineJoin = 'round';
        g.beginPath(); g.moveTo(w / 2 - 28, 177); g.lineTo(w / 2 - 6, 199); g.lineTo(w / 2 + 30, 155); g.stroke();
        g.fillStyle = '#fff'; g.font = '600 46px Sora, Inter'; g.fillText('Approved', w / 2, 300);
        g.fillStyle = '#A7A0C8'; g.font = '500 24px Inter'; g.fillText(s.sub || 'Thank you!', w / 2, 345);
      } else if (s.mode === 'deposit') {
        g.fillStyle = '#C4B5FD'; g.font = '600 26px Inter'; g.fillText('Deposit scheduled', w / 2, 140);
        g.fillStyle = '#fff'; g.font = '600 76px Sora, Inter'; g.fillText(s.amount || '$1,248.60', w / 2, 230);
        g.fillStyle = '#34D399'; g.font = '600 26px Inter'; g.fillText('Next business day', w / 2, 290);
      } else {
        g.fillStyle = '#A7A0C8'; g.font = '500 26px Inter'; g.fillText('Total', w / 2, 120);
        g.fillStyle = '#fff'; g.font = '600 96px Sora, Inter'; g.fillText(s.amount || '$17.95', w / 2, 215);
        g.strokeStyle = '#A78BFA'; g.lineWidth = 7; g.lineCap = 'round';
        for (let i = 0; i < 3; i++) { g.globalAlpha = s.pulse ? 1 - i * .25 : .5; g.beginPath(); g.arc(w / 2 - 70, 300, 14 + i * 14, -0.9, 0.9); g.stroke(); }
        g.globalAlpha = 1; g.fillStyle = '#fff'; g.font = '600 30px Inter'; g.textAlign = 'left'; g.fillText('Tap, insert or swipe', w / 2 - 20, 312);
      }
    });
  };
  t.show({ mode: 'total' });
  return t;
}
function uiTex(kind) {
  return tex(512, 900, (g, w, h) => {
    const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#1E1548'); bg.addColorStop(1, '#0A0819');
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    logoMark(g, 28, 34, 44); g.fillStyle = '#fff'; g.font = '600 28px Sora, Inter'; g.fillText('PayPilot', 80, 70);
    if (kind === 'go') {
      const items = [['🍔', 'Burger', '$12'], ['🍟', 'Fries', '$4'], ['🥤', 'Soda', '$3'], ['🍰', 'Cake', '$7']];
      items.forEach(([e, n, p], i) => {
        const x = 28 + (i % 2) * 232, y = 130 + Math.floor(i / 2) * 200;
        g.fillStyle = 'rgba(255,255,255,.08)'; rr(g, x, y, 216, 180, 22); g.fill();
        g.font = '70px serif'; g.textAlign = 'left'; g.fillText(e, x + 20, y + 90);
        g.fillStyle = '#fff'; g.font = '600 26px Inter'; g.fillText(n, x + 20, y + 140);
        g.fillStyle = '#A7A0C8'; g.font = '500 22px Inter'; g.fillText(p, x + 20, y + 168);
      });
      g.fillStyle = '#A7A0C8'; g.font = '500 24px Inter'; g.fillText('Table 12 · 3 guests', 28, 590);
      g.fillStyle = '#fff'; g.font = '600 56px Sora, Inter'; g.fillText('$26.00', 28, 660);
      const b = g.createLinearGradient(28, 720, 484, 820); b.addColorStop(0, '#A78BFA'); b.addColorStop(1, '#7C3AED');
      g.fillStyle = b; rr(g, 28, 720, 456, 100, 26); g.fill();
      g.fillStyle = '#fff'; g.font = '600 34px Inter'; g.textAlign = 'center'; g.fillText('Charge $26.00', w / 2, 783);
    } else {
      g.textAlign = 'center'; g.strokeStyle = '#C4B5FD'; g.lineWidth = 10; g.lineCap = 'round';
      for (let i = 0; i < 4; i++) { g.globalAlpha = 1 - i * .2; g.beginPath(); g.arc(w / 2, 470, 40 + i * 44, -0.85, 0.85); g.stroke(); }
      g.globalAlpha = 1; g.fillStyle = '#fff'; g.font = '600 40px Sora, Inter'; g.fillText('Hold to tap', w / 2, 760);
    }
  });
}

// ---------- reusable models ----------
const matte = (color = 0x111018, rough = .55) => new THREE.MeshPhysicalMaterial({ color, roughness: rough, metalness: .25, clearcoat: .4, clearcoatRoughness: .5 });
function makeCard() {
  const g = new THREE.Group();
  const W = 3.4, H = 2.14, D = 0.06;
  const body = new THREE.Mesh(new RoundedBoxGeometry(W, H, D, 6, 0.16), new THREE.MeshPhysicalMaterial({ color: 0x2a1a5e, metalness: .8, roughness: .25, clearcoat: 1, clearcoatRoughness: .08, iridescence: .7, iridescenceIOR: 1.5, iridescenceThicknessRange: [200, 600] }));
  g.add(body);
  const geo = new THREE.PlaneGeometry(W - .08, H - .08);
  const fm = new THREE.MeshPhysicalMaterial({ map: cardFace(true), roughness: .3, metalness: .35, clearcoat: 1, clearcoatRoughness: .06, iridescence: .35 });
  const bm = new THREE.MeshPhysicalMaterial({ map: cardFace(false), roughness: .35, metalness: .3, clearcoat: 1 });
  const f = new THREE.Mesh(geo, fm); f.position.z = D / 2 + .002; g.add(f);
  const b = new THREE.Mesh(geo, bm); b.position.z = -D / 2 - .002; b.rotation.y = Math.PI; g.add(b);
  const rim = new THREE.Mesh(new RoundedBoxGeometry(W + .02, H + .02, D * .4, 6, .17), new THREE.MeshBasicMaterial({ color: LILAC, transparent: true, opacity: .35 }));
  g.add(rim);
  return g;
}
function makeTerminal() {
  const g = new THREE.Group();
  const shell = matte(0x14121f, .45);
  const body = new THREE.Mesh(new RoundedBoxGeometry(2.1, 3.6, .55, 6, .26), shell); g.add(body);
  const screen = screenTex();
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.13), new THREE.MeshBasicMaterial({ map: screen, toneMapped: false }));
  scr.position.set(0, .72, .281); g.add(scr);
  const glassM = new THREE.MeshPhysicalMaterial({ color: 0x000000, roughness: .05, metalness: 0, transmission: 0, clearcoat: 1, transparent: true, opacity: .18 });
  const glass = new THREE.Mesh(new RoundedBoxGeometry(1.92, 1.25, .02, 4, .06), glassM); glass.position.set(0, .72, .285); g.add(glass);
  const keyM = matte(0x23202f, .6);
  const colors = [0xef4444, 0xfbbf24, 0x22c55e];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
    const k = new THREE.Mesh(new RoundedBoxGeometry(.46, .26, .06, 3, .05), r === 3 ? new THREE.MeshStandardMaterial({ color: colors[c], roughness: .4 }) : keyM);
    k.position.set(-.55 + c * .55, -.42 - r * .34, .29); g.add(k);
  }
  const slot = new THREE.Mesh(new THREE.BoxGeometry(1.2, .05, .2), new THREE.MeshBasicMaterial({ color: 0x000000 })); slot.position.set(0, 1.8, .05); g.add(slot);
  const glowStrip = new THREE.Mesh(new THREE.BoxGeometry(1.6, .03, .02), new THREE.MeshBasicMaterial({ color: VIOLET, toneMapped: false })); glowStrip.position.set(0, -1.76, .27); g.add(glowStrip);
  const stand = new THREE.Mesh(new RoundedBoxGeometry(2.3, .25, 1.6, 4, .1), matte(0x0d0c15, .5)); stand.position.set(0, -1.95, -.25); g.add(stand);
  g.userData = { screen, glowStrip };
  return g;
}
function makeHandheld() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new RoundedBoxGeometry(1.5, 3.1, .3, 6, .2), matte(0x15131f, .5)));
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.32, 2.32), new THREE.MeshBasicMaterial({ map: uiTex('go'), toneMapped: false })); scr.position.set(0, .2, .152); g.add(scr);
  const printer = new THREE.Mesh(new RoundedBoxGeometry(1.5, .5, .5, 4, .15), matte(0x0f0e18, .5)); printer.position.set(0, 1.45, -.12); g.add(printer);
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(1, .5), new THREE.MeshStandardMaterial({ color: 0xf5f3ff, roughness: .9 })); paper.position.set(0, 1.78, -.05); paper.rotation.x = -.25; g.add(paper);
  return g;
}
function makeReader() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new RoundedBoxGeometry(2, 2, .35, 8, .45), matte(0x16131f, .4)));
  const face = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), new THREE.MeshBasicMaterial({ map: uiTex('reader'), toneMapped: false, transparent: true })); face.position.z = .177; g.add(face);
  const led = new THREE.Mesh(new THREE.TorusGeometry(1.02, .02, 8, 80), new THREE.MeshBasicMaterial({ color: VIOLET, toneMapped: false })); led.position.z = .05; g.add(led);
  return g;
}

// ---------- particles ----------
function galaxy(count, radius) {
  const geo = new THREE.BufferGeometry(), pos = new Float32Array(count * 3), col = new Float32Array(count * 3), size = new Float32Array(count);
  const palette = [new THREE.Color(VIOLET), new THREE.Color(LILAC), new THREE.Color(MAGENTA), new THREE.Color(CYAN), new THREE.Color(0xffffff)];
  for (let i = 0; i < count; i++) {
    const arm = i % 3, r = Math.pow(Math.random(), .7) * radius, a = r * .9 + arm * (Math.PI * 2 / 3) + (Math.random() - .5) * .9;
    pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = (Math.random() - .5) * (1.2 + r * .12); pos[i * 3 + 2] = Math.sin(a) * r;
    const c = palette[Math.random() < .55 ? 0 : (Math.random() * palette.length) | 0]; col.set([c.r, c.g, c.b], i * 3);
    size[i] = Math.random() * 1.6 + .4;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.setAttribute('size', new THREE.BufferAttribute(size, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true,
    uniforms: { uTime: { value: 0 }, uPx: { value: DPR } },
    vertexShader: `attribute float size; varying vec3 vC; uniform float uTime; uniform float uPx;
      void main(){ vC=color; vec3 p=position; float a=uTime*0.05*(1.0+2.0/(length(p.xz)+1.0)); float c=cos(a), s=sin(a); p.xz=mat2(c,-s,s,c)*p.xz;
      vec4 mv=modelViewMatrix*vec4(p,1.0); gl_Position=projectionMatrix*mv; gl_PointSize=size*uPx*(26.0/-mv.z); }`,
    fragmentShader: `varying vec3 vC; void main(){ float d=length(gl_PointCoord-0.5); float a=smoothstep(0.5,0.0,d); gl_FragColor=vec4(vC,a*0.9); }`,
  });
  return new THREE.Points(geo, mat);
}
function ribbon(points, color, radius = .015) {
  const curve = new THREE.CatmullRomCurve3(points, true);
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 300, radius, 8, true), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(color) } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `varying vec2 vUv; uniform float uTime; uniform vec3 uColor; void main(){ float f=fract(vUv.x*2.0-uTime*0.12); float a=smoothstep(0.0,0.35,f)*smoothstep(1.0,0.55,f); gl_FragColor=vec4(uColor*1.1,a*0.55); }`,
  }));
  return m;
}
function burst(n = 260) {
  const geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), vel = [], col = new Float32Array(n * 3);
  const pal = [0x8b5cf6, 0xe879f9, 0x67e8f9, 0x34d399, 0xfbbf24].map(c => new THREE.Color(c));
  for (let i = 0; i < n; i++) { vel.push(new THREE.Vector3((Math.random() - .5), Math.random() * .9 + .2, (Math.random() - .5)).normalize().multiplyScalar(Math.random() * 3 + 1.5)); const c = pal[i % pal.length]; col.set([c.r, c.g, c.b], i * 3); }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: .07, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  pts.userData.set = (t) => { const a = geo.attributes.position.array; for (let i = 0; i < n; i++) { const v = vel[i]; a[i * 3] = v.x * t; a[i * 3 + 1] = v.y * t - 2.2 * t * t; a[i * 3 + 2] = v.z * t; } geo.attributes.position.needsUpdate = true; pts.material.opacity = clamp(1.4 - t); pts.visible = t > 0 && t < 1.4; };
  pts.userData.set(0);
  return pts;
}

// ---------- 1. Hero ----------
function hero(canvas) {
  const s = boot(canvas, { bloom: .62, exposure: 1.1 }); if (!s) return;
  const { scene, camera } = s; camera.position.set(0, 0, 11);
  const p = pointer();
  const gal = galaxy(MOBILE ? 5000 : 14000, 14); gal.rotation.x = .38; gal.position.set(2.5, -1.2, -6); scene.add(gal);
  const card = makeCard(); scene.add(card);
  const rib = new THREE.Group(); scene.add(rib);
  [[VIOLET, 2.6, 0], [MAGENTA, 3.0, 1.2], [CYAN, 3.4, 2.4]].forEach(([c, r, ph]) => {
    const pts = []; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a * 2 + ph) * .5, Math.sin(a) * r * .55)); }
    const m = ribbon(pts, c, .007 + Math.random() * .006); m.rotation.z = ph * .3; rib.add(m);
  });
  const key = new THREE.PointLight(MAGENTA, 30, 20); key.position.set(4, 3, 4); scene.add(key);
  const fill = new THREE.PointLight(CYAN, 18, 20); fill.position.set(-5, -2, 3); scene.add(fill);
  scene.add(new THREE.AmbientLight(0x6b5bd6, .4));
  const place = (w, h = canvas.clientHeight) => {
    const narrow = w < 900, half = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    const y = narrow ? (1 - 2 * 205 / Math.max(h, 1)) * half : .1;
    card.position.set(narrow ? 0 : 2.6, y, 0); rib.position.copy(card.position);
    const k = narrow ? Math.min(.54, w / 700) : 1; card.scale.setScalar(k); rib.scale.setScalar(k);
  };
  s.onResize = place; place(canvas.clientWidth);
  const host = canvas.closest('section');
  s.tick = (dt, t) => {
    p.update();
    const sp = clamp(-host.getBoundingClientRect().top / innerHeight);
    card.rotation.y = -0.45 + p.x * .35 + Math.sin(t * .5) * .12 + sp * 2.4;
    card.rotation.x = .18 + p.y * .2 + Math.sin(t * .7) * .06 - sp * .4;
    card.position.y += (Math.sin(t * 1.1) * .002);
    rib.rotation.y = t * .25; rib.children.forEach((m) => m.material.uniforms.uTime.value = t);
    gal.material.uniforms.uTime.value = t; gal.rotation.y = p.x * .08;
    camera.position.x = lerp(camera.position.x, p.x * .5, .05); const narrowCam = canvas.clientWidth < 900;
    camera.position.y = lerp(camera.position.y, narrowCam ? 0 : -p.y * .3 - sp * 1.5, .05);
    camera.lookAt(0, narrowCam ? 0 : -sp * 1.2, 0);
  };
}

// ---------- 2. Tap story (scroll-driven) ----------
function tap(canvas) {
  const s = boot(canvas, { bloom: .7, exposure: 1.1 }); if (!s) return;
  const { scene, camera } = s; camera.position.set(0, .6, 10.5);
  const term = makeTerminal(); term.rotation.set(-.12, -.35, 0); term.position.set(-.4, -.2, 0); scene.add(term);
  const card = makeCard(); card.scale.setScalar(.62); scene.add(card);
  const rings = new THREE.Group(); scene.add(rings);
  for (let i = 0; i < 4; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(.6, .015, 8, 90), new THREE.MeshBasicMaterial({ color: LILAC, transparent: true, opacity: 0, toneMapped: false })); rings.add(r); }
  rings.position.set(-.4, .55, .45); rings.rotation.set(-.12, -.35, 0);
  const conf = burst(MOBILE ? 140 : 300); conf.position.set(-.4, .9, .6); scene.add(conf);
  const receipt = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 2.2), new THREE.MeshStandardMaterial({ map: tex(256, 540, (g, w, h) => {
    g.fillStyle = '#FAF9FF'; g.fillRect(0, 0, w, h); g.fillStyle = '#1b1240'; g.font = '600 22px Sora, Inter'; g.textAlign = 'center'; g.fillText('PayPilot Market', w / 2, 44);
    g.font = '500 15px Menlo, monospace'; g.textAlign = 'left';
    [['Bananas', '1.27'], ['Avocados', '2.58'], ['Tomatoes', '2.74'], ['Broccoli', '1.99'], ['Strawberries', '3.99'], ['Water 24pk', '5.49']].forEach(([a, b], i) => { g.fillText(a, 22, 96 + i * 30); g.textAlign = 'right'; g.fillText(b, w - 22, 96 + i * 30); g.textAlign = 'left'; });
    g.fillRect(22, 290, w - 44, 2); g.font = '700 22px Menlo, monospace'; g.fillText('TOTAL', 22, 330); g.textAlign = 'right'; g.fillText('$17.95', w - 22, 330);
    g.textAlign = 'center'; g.font = '500 14px Inter'; g.fillStyle = '#6b6290'; g.fillText('Approved · Contactless', w / 2, 380); g.fillText('Receipt sent by text', w / 2, 404);
    for (let x = 22; x < w - 22; x += 6) { g.fillStyle = '#1b1240'; g.fillRect(x, 440, Math.random() > .5 ? 3 : 1.5, 50); }
  }), color: 0x8c86ab, roughness: .95, side: THREE.DoubleSide }));
  receipt.position.set(-.4, 1.4, -.05); receipt.rotation.set(-.12, -.35, 0); receipt.scale.y = .001; scene.add(receipt);
  scene.add(new THREE.AmbientLight(0x8070ff, .5));
  const kl = new THREE.PointLight(MAGENTA, 25, 18); kl.position.set(3, 3, 4); scene.add(kl);
  const cl = new THREE.PointLight(CYAN, 14, 18); cl.position.set(-4, 0, 3); scene.add(cl);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.MeshBasicMaterial({ map: tex(256, 256, (g, w, h) => { const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); r.addColorStop(0, 'rgba(139,92,246,.55)'); r.addColorStop(.45, 'rgba(139,92,246,.12)'); r.addColorStop(1, 'rgba(139,92,246,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); }), transparent: true, depthWrite: false })); floor.rotation.x = -Math.PI / 2; floor.position.y = -2.3; scene.add(floor);
  const host = canvas.closest('[data-pin]'), steps = host ? [...host.querySelectorAll('.pin__step')] : [], bar = host?.querySelector('.pin__bar i');
  const p = pointer(); let lastStep = -1;
  s.tick = (dt, t) => {
    p.update();
    const pr = host && innerWidth > 900 ? progressOf(host) : (t * .08) % 1;
    const step = Math.min(3, Math.floor(pr * 4));
    if (step !== lastStep) { steps.forEach((el, i) => el.classList.toggle('on', i === step)); lastStep = step; }
    if (bar) bar.style.width = (pr * 100) + '%';
    // card flight
    const a = ease(span(pr, .05, .3));
    card.position.set(lerp(4.2, .05, a), lerp(2.2, .75, a) + Math.sin(t * 2) * .03 * (1 - a), lerp(1.5, 1.05, a));
    card.rotation.set(lerp(.4, -.15, a), lerp(-1.1, -.35, a), lerp(.5, 0, a));
    const leave = ease(span(pr, .42, .55)); card.position.x += leave * 4; card.position.y += leave * 1.5; card.rotation.z -= leave * .6;
    // rings
    const ringOn = span(pr, .22, .42);
    rings.children.forEach((r, i) => { const k = ((t * .9 + i / 4) % 1); r.scale.setScalar(.4 + k * 1.6); r.material.opacity = ringOn > 0 && ringOn < 1 ? (1 - k) * .9 : 0; });
    // screen
    const scr = term.userData.screen;
    if (pr < .3) scr.show({ mode: 'total', pulse: pr > .18 }); else if (pr < .75) scr.show({ mode: 'approved', sub: 'Contactless · $17.95' }); else scr.show({ mode: 'deposit', amount: '$1,248.60' });
    term.userData.glowStrip.material.color.setHex(pr >= .3 && pr < .75 ? 0x34d399 : VIOLET);
    conf.userData.set(pr > .3 && pr < .62 ? (pr - .3) * 4.2 : 0);
    // receipt
    const rc = ease(span(pr, .5, .7)); receipt.scale.y = Math.max(.001, rc * .8); receipt.position.y = 1.8 + rc * .85;
    receipt.visible = pr < .78;
    term.rotation.y = -.35 + p.x * .12 + Math.sin(t * .4) * .03; term.rotation.x = -.12 + p.y * .05;
    rings.rotation.y = term.rotation.y; receipt.rotation.y = term.rotation.y;
    camera.position.x = lerp(camera.position.x, p.x * .4, .05);
    camera.lookAt(0, .2, 0);
  };
}

// ---------- 3. Hardware turntable ----------
function hardware(canvas) {
  const s = boot(canvas, { exposure: 1.15 }); if (!s) return;
  const { scene, camera } = s; camera.position.set(0, 1.4, 12.5);
  const devices = [makeTerminal(), makeHandheld(), makeReader()];
  devices[1].scale.setScalar(1.12); devices[2].scale.setScalar(1.35); devices[2].rotation.x = -.35;
  devices[0].userData.screen?.show({ mode: 'total', amount: '$42.50', pulse: true });
  const stage = new THREE.Group(); scene.add(stage);
  devices.forEach((d, i) => { d.visible = i === 0; stage.add(d); });
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.75, .16, 96), new THREE.MeshPhysicalMaterial({ color: 0x0b0918, metalness: .9, roughness: .38, clearcoat: .6, envMapIntensity: .35 })); disc.position.y = -2.25; scene.add(disc);
  const glow = new THREE.Mesh(new THREE.TorusGeometry(2.68, .02, 8, 160), new THREE.MeshBasicMaterial({ color: VIOLET, toneMapped: false })); glow.rotation.x = Math.PI / 2; glow.position.y = -2.15; scene.add(glow);
  scene.add(new THREE.AmbientLight(0x7a6cff, .5));
  const kl = new THREE.SpotLight(0xffffff, 45, 30, .5, .6); kl.position.set(3, 9, 7); kl.target.position.set(0, 0, 0); scene.add(kl, kl.target);
  const rim = new THREE.PointLight(MAGENTA, 20, 20); rim.position.set(-4, 2, -3); scene.add(rim);
  let cur = 0, target = 0, rotY = -.3, vel = 0, dragging = false, lx = 0, swap = 1;
  canvas.addEventListener('pointerdown', (e) => { dragging = true; lx = e.clientX; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => { if (!dragging) return; vel = (e.clientX - lx) * .01; rotY += vel; lx = e.clientX; });
  canvas.addEventListener('pointerup', () => { dragging = false; });
  const tabs = [...document.querySelectorAll('[data-hw]')];
  tabs.forEach((b) => b.addEventListener('click', () => { target = +b.dataset.hw; tabs.forEach(x => x.classList.toggle('on', x === b)); }));
  s.tick = (dt, t) => {
    if (target !== cur) { swap -= dt * 4; if (swap <= 0) { devices[cur].visible = false; cur = target; devices[cur].visible = true; swap = 0; } }
    else if (swap < 1) swap = Math.min(1, swap + dt * 3);
    const k = ease(swap); stage.scale.setScalar(.6 + .4 * k); stage.position.y = (1 - k) * -1;
    if (!dragging) { vel *= .94; rotY += vel + dt * .25; }
    stage.rotation.y = rotY; disc.rotation.y = rotY; stage.position.y += Math.sin(t * 1.2) * .04;
    camera.lookAt(0, -.1, 0);
  };
}

// ---------- 4. Globe ----------
function globe(canvas) {
  const s = boot(canvas, { exposure: 1 }); if (!s) return;
  const { scene, camera } = s; camera.position.set(0, 0, 12.5);
  const R = 3, world = new THREE.Group(); scene.add(world); world.rotation.set(.35, 0, .12);
  const N = MOBILE ? 2600 : 5200, pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = i * 2.399963; pos.set([Math.cos(th) * r * R, y * R, Math.sin(th) * r * R], i * 3); }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  world.add(new THREE.Points(dg, new THREE.PointsMaterial({ color: 0x8f7bf5, size: .032, transparent: true, opacity: .75, depthWrite: false })));
  world.add(new THREE.Mesh(new THREE.SphereGeometry(R * .985, 64, 64), new THREE.MeshBasicMaterial({ color: 0x0a0718 })));
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(R * 1.12, 64, 64), new THREE.ShaderMaterial({
    transparent: true, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false,
    vertexShader: `varying vec3 vN; void main(){ vN=normalize(normalMatrix*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `varying vec3 vN; void main(){ float i=pow(clamp(0.62-dot(vN,vec3(0,0,1.0)),0.0,1.0),2.0); gl_FragColor=vec4(0.55,0.36,0.96,1.0)*i*1.1; }`,
  })); scene.add(atmo);
  const ll = (lat, lon) => { const phi = (90 - lat) * Math.PI / 180, th = (lon + 180) * Math.PI / 180; return new THREE.Vector3(-R * Math.sin(phi) * Math.cos(th), R * Math.cos(phi), R * Math.sin(phi) * Math.sin(th)); };
  const cities = [[40.71, -74], [34.05, -118.24], [41.88, -87.63], [25.76, -80.19], [29.76, -95.37], [47.6, -122.33], [39.74, -104.99], [33.75, -84.39], [42.36, -71.06], [37.77, -122.42], [33.45, -112.07], [32.78, -96.8], [36.17, -115.14], [45.52, -122.68], [39.95, -75.17], [43.65, -79.38], [19.43, -99.13], [51.5, -.12], [21.31, -157.86], [61.22, -149.9]];
  const pinM = new THREE.MeshBasicMaterial({ color: LILAC, toneMapped: false });
  cities.forEach(([a, b]) => { const m = new THREE.Mesh(new THREE.SphereGeometry(.04, 12, 12), pinM); m.position.copy(ll(a, b)); world.add(m); });
  const arcs = [];
  const arcMat = (c) => new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uT: { value: 0 }, uC: { value: new THREE.Color(c) } },
    vertexShader: `varying float vU; void main(){ vU=uv.x; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `varying float vU; uniform float uT; uniform vec3 uC; void main(){ float h=smoothstep(uT-0.25,uT,vU)*step(vU,uT); float base=0.12; gl_FragColor=vec4(uC*1.5, max(base*step(vU,uT), h)); }` });
  function newArc() {
    const a = cities[(Math.random() * cities.length) | 0], b = cities[(Math.random() * cities.length) | 0]; if (a === b) return;
    const A = ll(...a), B = ll(...b), mid = A.clone().add(B).multiplyScalar(.5), d = A.distanceTo(B); mid.normalize().multiplyScalar(R + d * .35);
    const curve = new THREE.QuadraticBezierCurve3(A, mid, B);
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, .012, 6, false), arcMat([VIOLET, MAGENTA, CYAN][(Math.random() * 3) | 0]));
    m.userData.life = 0; m.userData.speed = .45 + Math.random() * .4; world.add(m); arcs.push(m);
  }
  const counter = document.querySelector('[data-live-count]'); let count = 0;
  s.tick = (dt, t) => {
    world.rotation.y += dt * .08;
    if (arcs.length < (MOBILE ? 10 : 18) && Math.random() < .12) { newArc(); count++; if (counter) counter.textContent = count.toLocaleString(); }
    for (let i = arcs.length - 1; i >= 0; i--) { const m = arcs[i]; m.userData.life += dt * m.userData.speed; m.material.uniforms.uT.value = m.userData.life; if (m.userData.life > 1.6) { world.remove(m); m.geometry.dispose(); arcs.splice(i, 1); } }
  };
}

// ---------- 5. Ambient (subpages / CTA) ----------
function ambient(canvas) {
  const s = boot(canvas, { bloom: .6, exposure: 1.1 }); if (!s) return;
  const { scene, camera } = s; camera.position.set(0, 0, 12);
  const gal = galaxy(MOBILE ? 3000 : 8000, 16); gal.rotation.x = 1.1; gal.position.set(0, -2, -8); scene.add(gal);
  const group = new THREE.Group(); scene.add(group);
  const glassM = new THREE.MeshPhysicalMaterial({ color: 0xb9a6ff, metalness: .1, roughness: .08, transmission: .9, thickness: .6, ior: 1.4, clearcoat: 1, iridescence: .8, transparent: true });
  const shapes = [];
  for (let i = 0; i < (MOBILE ? 4 : 7); i++) {
    const geo = i % 3 === 0 ? new RoundedBoxGeometry(1.7, 1.07, .06, 4, .1) : i % 3 === 1 ? new THREE.TorusGeometry(.55, .16, 24, 64) : new THREE.IcosahedronGeometry(.5, 0);
    const m = new THREE.Mesh(geo, glassM); const side = i % 2 ? 1 : -1; m.position.set(side * (4 + Math.random() * 5), (Math.random() - .5) * 6, -2 - Math.random() * 5); m.scale.setScalar(.7 + Math.random() * .4);
    m.userData = { rx: Math.random() * .4, ry: Math.random() * .5, f: Math.random() * 6 }; group.add(m); shapes.push(m);
  }
  const card = canvas.dataset.card !== undefined ? makeCard() : null;
  if (card) { card.scale.setScalar(.9); card.position.set(innerWidth > 900 ? 3.8 : 0, innerWidth > 900 ? 0 : 2.4, 1); scene.add(card); }
  scene.add(new THREE.AmbientLight(0x7a6cff, .6));
  const kl = new THREE.PointLight(MAGENTA, 30, 25); kl.position.set(5, 4, 5); scene.add(kl);
  const cl = new THREE.PointLight(CYAN, 18, 25); cl.position.set(-6, -3, 4); scene.add(cl);
  const p = pointer();
  s.tick = (dt, t) => {
    p.update();
    shapes.forEach((m) => { m.rotation.x += dt * m.userData.rx; m.rotation.y += dt * m.userData.ry; m.position.y += Math.sin(t + m.userData.f) * .003; });
    gal.material.uniforms.uTime.value = t;
    group.rotation.y = p.x * .12; group.rotation.x = p.y * .06;
    if (card) { card.rotation.y = -.5 + p.x * .4 + Math.sin(t * .5) * .1; card.rotation.x = .15 + p.y * .2; }
  };
}

const SCENES = { hero, tap, hardware, globe, ambient };
document.querySelectorAll('canvas[data-scene]').forEach((c) => {
  const run = () => { try { SCENES[c.dataset.scene]?.(c); } catch (e) { console.warn('scene failed', c.dataset.scene, e); } };
  if (c.dataset.scene === 'hero') run();
  else new IntersectionObserver(([e], o) => { if (e.isIntersecting) { o.disconnect(); run(); } }, { rootMargin: '400px' }).observe(c);
});
