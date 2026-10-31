// ШТАМП ПОД РАБОТОЙ — подпись, материал, размер и цена в чертёжной рамке (её слово 31 окт: «подпись к картине и цену
// и прочее материалы там на сайте давай писать вот в такой чертежной рамке по госту»).
// По виду — основная надпись ГОСТ 2.104, форма 1: толстые и тонкие линии, однолинейный шрифт ГОСТ 2.304 тип Б
// (наклон 75°, толщина линии букв — десятая часть высоты). Упрощено, чтобы читалось на телефоне: граф 7 вместо ~25,
// всё крупно; штамп — под рамой, по её правому краю, как в правом нижнем углу листа чертежа.
//  ┌──────────────────────────┬────────┬────────┬──────────┐
//  │                          │ ЛИСТ   │ ЛИСТОВ │ МАСШТАБ  │
//  │        ФРАГМЕНТЫ         │   1    │   1    │   1:1    │
//  │                          ├────────┴────────┴──────────┤
//  │                          │         760 × 1160         │
//  ├──────────────────────────┼─────────────┬──────────────┤
//  │  АКВАРЕЛЬ, ТУШЬ, ХОЛСТ   │ ЦЕНА        │              │
//  ├────────┬─────────────────┤   2 400 €   │    КУПИТЬ    │
//  │ РАЗРАБ.│  АННА Д’АРЛЕТ   │             │              │
//  └────────┴─────────────────┴─────────────┴──────────────┘
// Шрифт — тот же, что в штампе ролика (`примерка/фрагменты-на-стене/ровно/overlay.py`), дополнен буквами Б З И П Ц,
// цифрами 2 4, точкой и €. Миллиметры внутри; начало — левый верхний угол штампа, y вниз; наружу — метры, y вверх.

const ell = (cx, cy, rx, ry, a0 = 0, a1 = 360, n = 40) => Array.from({ length: n + 1 }, (_, i) => {
  const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; });
const G = {  // штрихи в клетке: высота прописной 10, x вправо, y вверх; [ширина, [штрихи]]
  'А': [6, [[[0, 0], [3, 10], [6, 0]], [[1.1, 3.4], [4.9, 3.4]]]],
  'Б': [5.6, [[[5.2, 10], [0, 10], [0, 0], [4, 0], [5.6, 1.3], [5.6, 4.2], [4, 5.5], [0, 5.5]]]],
  'В': [5.8, [[[0, 5.2], [4, 5.2], [5.4, 6.4], [5.4, 8.8], [4, 10], [0, 10], [0, 0], [4.4, 0], [5.8, 1.3], [5.8, 3.9], [4.4, 5.2]]]],
  'Г': [5.2, [[[5.2, 10], [0, 10], [0, 0]]]],
  'Д': [6.6, [[[-0.2, -1.6], [-0.2, 0], [6.8, 0], [6.8, -1.6]], [[0.8, 0], [1.9, 10], [5.6, 10], [5.6, 0]]]],
  'Е': [5.4, [[[5.4, 10], [0, 10], [0, 0], [5.4, 0]], [[0, 5.2], [4.4, 5.2]]]],
  'З': [5.6, [[[0.2, 8.8], [1.4, 10], [4, 10], [5.2, 8.9], [5.2, 6.6], [3.8, 5.3], [2, 5.3]], [[3.8, 5.3], [5.6, 4], [5.6, 1.3], [4.2, 0], [1.4, 0], [0, 1.3]]]],
  'И': [5.8, [[[0, 10], [0, 0], [5.8, 10], [5.8, 0]]]],
  'Й': [5.8, [[[0, 10], [0, 0], [5.8, 10], [5.8, 0]], [[1.6, 12.4], [2.9, 11.2], [4.2, 12.4]]]],
  'К': [5.8, [[[0, 0], [0, 10]], [[5.6, 10], [0, 4]], [[2, 6.2], [5.8, 0]]]],
  'Л': [5.8, [[[-0.2, 0], [0.9, 1.2], [1.9, 10], [5.8, 10], [5.8, 0]]]],
  'М': [7, [[[0, 0], [0, 10], [3.5, 3], [7, 10], [7, 0]]]],
  'Н': [5.6, [[[0, 0], [0, 10]], [[5.6, 0], [5.6, 10]], [[0, 5.2], [5.6, 5.2]]]],
  'О': [6, [ell(3, 5, 3, 5)]],
  'П': [5.6, [[[0, 0], [0, 10], [5.6, 10], [5.6, 0]]]],
  'Р': [5.6, [[[0, 0], [0, 10], [4, 10], [5.6, 8.7], [5.6, 6.3], [4, 5], [0, 5]]]],
  'С': [5.8, [ell(3.1, 5, 3.1, 5, 35, 325)]],
  'Т': [6, [[[0, 10], [6, 10]], [[3, 10], [3, 0]]]],
  'У': [6, [[[0, 10], [3.2, 3.6]], [[6, 10], [2.2, 0.6], [1.1, 0], [0, 0.3]]]],
  'Ф': [7, [ell(3.5, 6, 3.5, 2.9), [[3.5, 0], [3.5, 10]]]],
  'Х': [6, [[[0, 0], [6, 10]], [[0, 10], [6, 0]]]],
  'Ц': [6.4, [[[0, 10], [0, 0], [5.6, 0], [5.6, 10]], [[5.6, 0], [6.6, 0], [6.6, -1.8]]]],
  'Ч': [5.6, [[[0, 10], [0, 6.4], [1.2, 5], [5.6, 5]], [[5.6, 10], [5.6, 0]]]],
  'Ш': [7.4, [[[0, 10], [0, 0], [7.4, 0], [7.4, 10]], [[3.7, 0], [3.7, 10]]]],
  'Ы': [6.8, [[[0, 10], [0, 0], [3, 0], [4.3, 1.2], [4.3, 3.8], [3, 5], [0, 5]], [[6.8, 0], [6.8, 10]]]],
  'Ь': [5.2, [[[0, 10], [0, 0], [3.8, 0], [5.2, 1.3], [5.2, 3.7], [3.8, 5], [0, 5]]]],
  'Я': [5.6, [[[5.6, 0], [5.6, 10], [1.6, 10], [0, 8.7], [0, 6.3], [1.6, 5], [5.6, 5]], [[3.2, 5], [0, 0]]]],
  ',': [1, [[[0.6, 0.6], [0, -1.6]]]],
  '.': [1, [ell(0.5, 0.5, 0.5, 0.5, 0, 360, 8)]],
  '’': [1, [[[0.6, 10], [0, 8]]]],
  '0': [5.6, [ell(2.8, 5, 2.8, 5)]],
  '1': [3.6, [[[0.6, 7.4], [3.4, 10], [3.4, 0]]]],
  '2': [5.6, [[[0.3, 8.4], [1.6, 9.8], [3.8, 10], [5.3, 8.8], [5.4, 6.8], [4.4, 5], [0, 0], [5.6, 0]]]],
  '3': [5.6, [[[0.2, 8.8], [1.4, 10], [4, 10], [5.2, 8.9], [5.2, 6.6], [3.8, 5.3], [2, 5.3]], [[3.8, 5.3], [5.6, 4], [5.6, 1.3], [4.2, 0], [1.4, 0], [0, 1.3]]]],
  '4': [5.8, [[[4.4, 0], [4.4, 10], [0, 3], [5.8, 3]]]],
  '5': [5.6, [[[5.2, 10], [0.8, 10], [0.3, 5.6], [2.2, 6.3], [4, 6.2], [5.6, 4.8], [5.6, 1.4], [4.2, 0], [1.4, 0], [0, 1.2]]]],
  '6': [5.8, [[[5.4, 8.8], [4.2, 10], [2.2, 10], [0.6, 8.6], [0, 6], [0, 2.6], [1, 0.6], [3, 0], [4.8, 0.6], [5.8, 2.2], [5.6, 4.2], [4, 5.5], [2, 5.5], [0.4, 4.3]]]],
  '7': [5.6, [[[0, 10], [5.6, 10], [1.8, 0]]]],
  ':': [1, [ell(0.5, 1.2, 0.5, 0.6, 0, 360, 8), ell(0.5, 6.5, 0.5, 0.6, 0, 360, 8)]],
  '×': [5, [[[0.4, 2], [4.6, 7]], [[0.4, 7], [4.6, 2]]]],
  '€': [6.4, [ell(3.8, 5, 3.4, 5, 40, 320), [[0, 6], [4.6, 6]], [[0, 4], [4.2, 4]]]],
  ' ': [3, []],
};
const SL = Math.tan(15 * Math.PI / 180);
const textWidth = (s, h) => ([...s].reduce((a, ch) => a + G[ch][0] + 2.2, -2.2) + 10 * SL) * h / 10;
// штрихи надписи: x, y — левый край базовой линии (y вниз), h — высота прописной
function text(s, x, y, h) {
  const k = h / 10, out = []; let cx = 0;
  for (const ch of s) {
    const [w, st] = G[ch];
    for (const line of st) out.push(line.map(([gx, gy]) => [x + (cx + gx + gy * SL) * k, y - gy * k]));
    cx += w + 2.2;
  }
  return out;
}

// штрихи — ленты: segs — [{ a, b, hw, ta, tb }] (мм, y вниз); draw и px — общие часы пера и размер экрана
function inkMesh(THREE, segs, glow, gain, draw, px) {
  // лента: 4 вершины на отрезок; концы продлены на полутолщину — углы рамки и изломы букв сходятся без щелей
  // aOther — точка дальше по ходу отрезка (задаёт направление), aSide — [сторона −1/1, полутолщина, конец −1/1]
  const n = segs.length, P = new Float32Array(n * 12), O = new Float32Array(n * 12), A = new Float32Array(n * 12), Tm = new Float32Array(n * 4), idx = [];
  segs.forEach(({ a, b, hw, ta, tb }, i) => {
    const far = [2 * b[0] - a[0], 2 * b[1] - a[1]];
    const ends = [[a, b, ta, -1, -1], [a, b, ta, 1, -1], [b, far, tb, 1, 1], [b, far, tb, -1, 1]];
    ends.forEach(([p, q, t, side, end], j) => {
      const v = i * 4 + j;
      P.set([p[0], -p[1], 0], v * 3); O.set([q[0], -q[1], 0], v * 3); A.set([side, hw, end], v * 3); Tm[v] = t;
    });
    idx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(P, 3));
  geo.setAttribute('aOther', new THREE.BufferAttribute(O, 3));
  geo.setAttribute('aSide', new THREE.BufferAttribute(A, 3));
  geo.setAttribute('aT', new THREE.BufferAttribute(Tm, 1));
  geo.setIndex(idx);
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1e5);

  // тоньше точки экрана линия не рисуется: ширина держится в 1,2 точки, а яркость — по настоящей толщине (как
  // миллиметровка куба). Иначе тонкие линии и мелкие буквы рвутся и мерцают при повороте (её слово 31 окт).
  const mat = new THREE.ShaderMaterial({
    uniforms: { uGlow: { value: glow }, uDraw: draw, uPx: px, uGain: { value: gain } },
    vertexShader: `attribute vec3 aOther, aSide; attribute float aT; uniform vec2 uPx;
varying float vT, vAcross, vCov;
void main() {
  vec2 d = normalize(aOther.xy - position.xy), nrm = vec2(-d.y, d.x);
  float hw = aSide.y;
  vec4 c0 = projectionMatrix * modelViewMatrix * vec4(position, 1.);
  vec4 c1 = projectionMatrix * modelViewMatrix * vec4(position + vec3(nrm * hw, 0.), 1.);
  float wpx = length((c1.xy / c1.w - c0.xy / c0.w) * uPx * .5);          // полутолщина в точках экрана
  float k = max(1., .6 / max(wpx, 1e-4));                                  // тоньше — рисуем шире, но тусклее
  vCov = 1. / k; vAcross = aSide.x; vT = aT;
  vec3 p = position + vec3(nrm * hw * aSide.x * k + d * hw * k * aSide.z, 0.);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
}`,
    fragmentShader: `uniform vec3 uGlow; uniform float uDraw, uGain; varying float vT, vAcross, vCov;
void main() {
  float on = clamp((uDraw - vT) / .04, 0., 1.); if (on <= 0.) discard;
  float edge = 1. - smoothstep(1. - 1.5 * fwidth(vAcross), 1., abs(vAcross));
  gl_FragColor = vec4(uGlow * uGain * vCov * edge * on, 1.);
}`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; return mesh;
}
// одним пером по очереди, по длине: polys — [{ pts, w }] за t0…t1; дописывает в segs
const lenOf = p => p.slice(1).reduce((a, q, i) => a + Math.hypot(q[0] - p[i][0], q[1] - p[i][1]), 0);
function penInto(segs, polys, [t0, t1]) {
  const tot = polys.reduce((a, p) => a + lenOf(p.pts), 0) || 1; let run = 0;
  for (const { pts, w } of polys) for (let i = 0; i < pts.length - 1; i++) {
    const d = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    segs.push({ a: pts[i], b: pts[i + 1], hw: w / 2, ta: t0 + (t1 - t0) * run / tot, tb: t0 + (t1 - t0) * (run + d) / tot });
    run += d;
  }
}

// Штамп — втрое больше настоящей формы 1 (185 × 55 мм): 560 × 165 мм (её слово 31 окт: «не такую гиганту»).
// Раскладка считается в прежней сетке 1020 × 300 и сжимается в SC раз; BUY — клетка «КУПИТЬ» в той же сетке.
const SC = 560 / 1020;
// линии и клетка «КУПИТЬ» — на целых миллиметрах мира (её слово 31 окт: «чтобы всё миллиметр в миллиметр сходилось»)
const snap = v => Math.round(v * SC) / SC;
export const STAMP = { W: 1020 * SC / 1000, H: 300 * SC / 1000, SC, BUY: { x0: snap(820), x1: 1020, y0: snap(170), y1: 300 } };
const THICK = 6, THIN = 2.5;   // толстая и тонкая линии в сетке раскладки (на штампе — 3,3 и 1,4 мм)

// d — что писать: title (перенос — \n), author, material, size, sheets (листов), price
export function buildStamp(THREE, { glow, lines: L, bg, sheet, d }) {
  const W = 1020, H = 300, { BUY } = STAMP;
  // линии рамки: [x0, y0, x1, y1, толщина]; сначала наружный контур одним пером, потом внутренние
  const frame = [
    [0, 0, W, 0, THICK], [W, 0, W, H, THICK], [W, H, 0, H, THICK], [0, H, 0, 0, THICK],
    [580, 0, 580, H, THICK], [0, 170, 580, 170, THICK], [580, 100, W, 100, THICK], [580, 170, W, 170, THICK],
    [820, 170, 820, H, THICK], [0, 235, 580, 235, THIN], [150, 235, 150, H, THIN],
    [580, 35, W, 35, THIN], [720, 0, 720, 100, THIN], [860, 0, 860, 100, THIN],
  ].map(([x0, y0, x1, y1, w]) => [snap(x0), snap(y0), snap(x1), snap(y1), w]);
  // надписи: [текст, клетка x0, x1, y0, y1, высота, как ставить] — по порядку чтения
  const cell = (s, x0, x1, y0, y1, h, how = 'c') => {
    const pad = 14; h = Math.min(h, h * (x1 - x0 - 2 * pad) / textWidth(s, h));   // не влезает — мельче
    const w = textWidth(s, h);
    const x = how === 'c' ? (x0 + x1 - w) / 2 : x0 + pad;
    const y = how === 'tl' ? y0 + pad + h : (y0 + y1 + h) / 2;
    return { s, x, y, h };
  };
  const tl = d.title.split('\n');          // название в одну или две строки, одной высоты
  const th = Math.min(tl.length > 1 ? 44 : 64, ...tl.map(t => cell(t, 0, 580, 0, 170, 64).h));
  const title = tl.map((t, i) => ({ ...cell(t, 0, 580, 0, 170, th), y: 85 + th / 2 + (i - (tl.length - 1) / 2) * th * 1.6 }));
  const texts = [
    ...title,
    cell('ЛИСТ', 580, 720, 0, 35, 20), cell('ЛИСТОВ', 720, 860, 0, 35, 20), cell('МАСШТАБ', 860, W, 0, 35, 20),
    cell('1', 580, 720, 35, 100, 32), cell(String(d.sheets || 1), 720, 860, 35, 100, 32), cell('1:1', 860, W, 35, 100, 32),
    cell(d.size, 580, W, 100, 170, 32),
    cell(d.material, 0, 580, 170, 235, 30),
    cell('РАЗРАБ.', 0, 150, 235, H, 22), cell(d.author, 150, 580, 235, H, 30),
    cell('ЦЕНА', 580, 820, 170, H, 20, 'tl'), { ...cell(d.price, 580, 820, 170, H, 34), y: 170 + 92 },
    cell('КУПИТЬ', 820, W, 170, H, 34),
  ];
  // все штрихи — ленты: отрезок [a, b], полутолщина, мгновение пера в начале и в конце
  const segs = [];
  const T_LINES = [0, 0.9], T_TEXT = [0.8, 2.6];
  penInto(segs, frame.map(([x0, y0, x1, y1, w]) => ({ pts: [[x0, y0], [x1, y1]], w })), T_LINES);
  const borderAt = T_LINES[0] + (T_LINES[1] - T_LINES[0]) * (2 * (W + H)) / frame.reduce((a, f) => a + Math.hypot(f[2] - f[0], f[3] - f[1]), 0);
  penInto(segs, texts.flatMap(({ s, x, y, h }) => text(s, x, y, h).map(pts => ({ pts, w: Math.max(h / 10, 1.6) }))), T_TEXT);

  const draw = { value: 0 }, px = { value: new THREE.Vector2(1000, 1000) };
  const group = new THREE.Group(); group.name = 'штамп';
  const inner = new THREE.Group(); inner.scale.setScalar(0.001 * SC); group.add(inner);
  // лист штампа заслоняет миллиметровку грани, когда контур замкнулся (как тело рамы), и чуть темнеет из тумана:
  // светящиеся буквы на ровном тоне на тон темнее читаются, а на сетке и на светлом сером — нет (сравнение 31 окт)
  const sheetMat = new THREE.MeshBasicMaterial({ color: bg.clone(), toneMapped: false, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 8 });
  const hide = new THREE.Mesh(new THREE.PlaneGeometry(W, H).translate(W / 2, -H / 2, 0), sheetMat);
  hide.renderOrder = -5; hide.visible = false;
  const ink = inkMesh(THREE, segs, glow, L ?? 0.8, draw, px); ink.renderOrder = 6;
  // «КУПИТЬ» — клетка чуть светится, как кнопка; ярче под курсором
  const btnMat = new THREE.MeshBasicMaterial({ color: glow, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const btn = new THREE.Mesh(new THREE.PlaneGeometry(BUY.x1 - BUY.x0 - THICK, BUY.y1 - BUY.y0 - THICK)
    .translate((BUY.x0 + BUY.x1) / 2, -(BUY.y0 + BUY.y1) / 2, 0), btnMat);
  btn.renderOrder = 5;
  inner.add(hide, btn, ink);
  // ПРОДАНО (её слово 31 окт: «на кнопку Купить красный кружочек… залепить, что нельзя купить уже») — красная
  // наклейка, как в галереях: матовый кружок поверх клетки «КУПИТЬ», лёгкий, без свечения; ссылки у проданной нет
  let dot = null;
  if (d.sold) {
    // издали — почти в тон листа, на себя не берёт; вблизи — полный красный (её слово 31 окт: «не такими яркими… когда
    // приближаешься — тогда интенсивно»): сила — по тому, сколько миллиметров приходится на точку экрана
    dot = new THREE.Mesh(new THREE.CircleGeometry(42, 48).translate((BUY.x0 + BUY.x1) / 2, -(BUY.y0 + BUY.y1) / 2, 2),
      new THREE.ShaderMaterial({
        uniforms: { uRed: { value: new THREE.Color(0xb5463a) }, uBase: { value: sheet }, uOp: { value: 0 } },
        vertexShader: `varying vec3 vP; void main() { vP = (modelMatrix * vec4(position, 1.)).xyz * 1000.; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
        fragmentShader: `uniform vec3 uRed, uBase; uniform float uOp; varying vec3 vP;
void main() { float k = smoothstep(9., 2., length(fwidth(vP))); gl_FragColor = vec4(mix(uBase, uRed, .18 + .82 * k), uOp); }`,
        transparent: true, depthWrite: false }));
    dot.renderOrder = 7; inner.add(dot);
  }
  const DONE = T_TEXT[1] + 0.4;
  let hot = false;
  const update = (t, size) => {
    draw.value = t; if (size) px.value.copy(size);
    hide.visible = t >= borderAt; sheetMat.color.lerpColors(bg, sheet, Math.min(1, Math.max(0, (t - borderAt) / 0.5)));
    const end = Math.min(1, Math.max(0, (t - T_TEXT[1]) / 0.4));
    btnMat.opacity = d.sold ? 0 : (hot ? 0.16 : 0.08) * end;
    if (dot) dot.material.uniforms.uOp.value = end;
    return t < DONE;
  };
  const hover = on => { if (hot === on) return false; hot = on; return true; };
  return { group, update, hover, sold: !!d.sold };
}

// ВЫНОСКА «СНЯТЬ РАМУ» (её слово 31 окт: «кнопку рядышком с каждой работой и под ней маленькая подпись — выключить
// рамку… тоже что-то чертёжное»). Из чертежа — линия-выноска с полкой (ГОСТ 2.316): точка на детали — у левого нижнего
// угла рамы, линия наискось вниз-влево, на полке надпись. Касание надписи снимает и возвращает раму этой работы.
// Начало — угол рамы; мм, y вниз; наружу — метры.
export const NOTE = { x0: -310, x1: -36, y0: 4, y1: 50 };   // где касаться (мм от угла рамы)
export function buildNote(THREE, { glow, lines: L }) {
  const draw = { value: 0 }, px = { value: new THREE.Vector2(1000, 1000) }, h = 26;
  const lead = [];
  penInto(lead, [{ pts: Array.from({ length: 13 }, (_, i) => [3 * Math.cos(i * Math.PI / 6), 3 * Math.sin(i * Math.PI / 6)]), w: 3 },
                 { pts: [[0, 0], [-40, 40], [-302, 40]], w: 1.4 }], [0, 0.45]);
  const word = (s) => { const sg = [], x = -48 - textWidth(s, h);
    penInto(sg, text(s, x, 34, h).map(pts => ({ pts, w: h / 10 })), [0.35, 1.0]); return inkMesh(THREE, sg, glow, L ?? 0.8, draw, px); };
  const group = new THREE.Group(); group.name = 'выноска';
  const inner = new THREE.Group(); inner.scale.setScalar(0.001); group.add(inner);
  const lines = inkMesh(THREE, lead, glow, L ?? 0.8, draw, px), off = word('СНЯТЬ РАМУ'), on = word('ВЕРНУТЬ РАМУ');
  for (const m of [lines, off, on]) { m.renderOrder = 6; inner.add(m); }
  on.visible = false;
  const update = (t, size) => { draw.value = t; if (size) px.value.copy(size); return t < 1.1; };
  const show = framed => { off.visible = framed; on.visible = !framed; };
  return { group, update, show };
}
