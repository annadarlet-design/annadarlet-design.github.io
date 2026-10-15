// КУСТ ПИОНОВ КОДЕКСА (13 окт: «подробная модель по фотографии»). Для сайта:
// • облегчён — сад/куст-кодекс/облегчить.py (лепестки проще: 4,2 млн → 0,45 млн треугольников);
// • вычищен — сад/куст-кодекс/пересечения.py, проверка по треугольникам в Blender: ~1300 мест, где лист прорезал
//   лист или цветок, а чужой стебель шёл сквозь цветок; теперь ноль;
// • упакован — упаковать.py → пион-лёгкий.bin.gz (base64 текстом) + пион-атлас.jpg; там же побеги (основание,
//   высота, точки стебля, головка) и листья (крепление, центр).
//
// ДВИЖЕНИЕ — КАК У РАБОТЫ И ПРИЩЕПОК, ОТ ПРИЧИНЫ (её слово 13 окт вечером: «каждая веточка отдельно, каждый листик
// отдельный… ладошка 15–20 см… не как жидкость, не как целлофан — как в природе»):
// • каждый побег — упругий стебель: гнётся от земли (поворот, к верху сильнее), со своей частотой и затуханием;
// • каждый лист — на своём креплении: качается сам, быстрее и легче стебля;
// • ладонь — шар ~16 см там, где палец лёг на куст: что задела — отталкивает (стебель отходит, лист отгибается),
//   чего не задела — не трогает; задетый стебель толкает соседа, а не проходит сквозь него: точки стеблей,
//   головки и листья разных побегов не сходятся ближе, чем стояли в покое (позиционные упоры, как у работы);
// • отпустила — всё возвращается само, с затухающим покачиванием (скорость — из того, как сдвинулось);
// • ветер — порыв страницы у верха каждого побега, у каждого чуть свой (своё дыхание), листья в порыв трепещут.
// Тот же вид, что buildPeony: { group, step(dt, t, wind), poke(ray, move), hit(ray) }.

// скачать и распаковать — можно начать сразу при открытии страницы, пока строится остальное
export async function fetchPeony(url = './пион-лёгкий.txt') {
  // 15 окт: на открытом сайте (GitHub) — сам сжатый файл, без перевода в текст: на четверть легче.
  // Текстом (base64) — только в черновике claude.ai: тамошний сервер .gz не отдаёт.
  if (/github\.io$|^localhost$|^127\./.test(location.hostname) && url.endsWith('.txt')) {
    const r = await fetch(url.replace(/\.txt$/, '.bin.gz'));
    if (r.ok) {
      const b = await r.arrayBuffer(), u = new Uint8Array(b, 0, 2);
      if (u[0] !== 0x1f || u[1] !== 0x8b) return b;            // сервер уже распаковал сам
      return await new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
    }
  }
  const r = await fetch(url); if (!r.ok) throw new Error(url + ' ' + r.status);
  const t = (await r.text()).trim();
  let gz;
  if (Uint8Array.fromBase64) gz = Uint8Array.fromBase64(t);
  else { const s = atob(t); gz = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) gz[i] = s.charCodeAt(i); }
  return await new Response(new Blob([gz]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
}

export async function loadPeony(THREE, opt = {}) {
  const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const buf = await (opt.data ?? fetchPeony(opt.url));
  const hl = new DataView(buf).getUint32(0, true);
  const head = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 4, hl)));
  // 15 окт: эхинацея — тем же кодом, но без атласа: цвет по вершинам (sRGB байтами), развёртки нет
  const tex = head.groups.some(g => g.tex) ? await new THREE.TextureLoader().loadAsync(opt.atlas ?? './пион-атлас.webp') : null;
  if (tex) { tex.flipY = false; tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; }
  const LIN = new Float32Array(256).map((_, i) => { const c = i / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });   // развёртка из glTF — без переворота

  const SH = head.shoots, LV = head.leaves, NS = SH.length, NL = LV.length, TW = 64, TH = Math.ceil((NS + NL) / TW);
  // неподвижное: основание и высота побега, крепление листа; подвижное: наклон побега, отгиб листа
  const stat = new Float32Array(TW * TH * 4), dyn = new Float32Array(TW * TH * 4);
  SH.forEach((s, k) => stat.set([...s.base, s.H], 4 * k));
  LV.forEach((l, i) => stat.set([l[1], l[2], l[3], Math.atan2(l[6] - l[3], l[4] - l[1])], 4 * (NS + i)));   // w — куда смотрит жилка (вокруг неё лист поворачивается)
  const mk = a => { const t = new THREE.DataTexture(a, TW, TH, THREE.RGBAFormat, THREE.FloatType); t.needsUpdate = true; return t; };
  const tStat = mk(stat), tDyn = mk(dyn);
  const U = { uStat: { value: tStat }, uDyn: { value: tDyn } };
  const shade = m => {
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = `attribute vec2 aK; uniform highp sampler2D uStat, uDyn;
        vec4 txl(highp sampler2D t, int i) { return texelFetch(t, ivec2(i % ${TW}, i / ${TW}), 0); }
        vec3 bend(vec3 r, vec2 a) { float m = length(a); if (m < 1e-6) return r;
          vec3 ax = vec3(a.y, 0.0, -a.x) / m; return r * cos(m) + cross(ax, r) * sin(m) + ax * dot(ax, r) * (1.0 - cos(m)); }\n` +
        sh.vertexShader.replace('#include <begin_vertex>',
        `#include <begin_vertex>
         { int k = int(aK.x + 0.5);
           if (aK.y >= 0.0) { int l = ${NS} + int(aK.y + 0.5); vec4 sl = txl(uStat, l), dl = txl(uDyn, l);   // лист — вокруг крепления
             vec3 r = transformed - sl.xyz, ta = vec3(cos(sl.w), 0.0, sin(sl.w));                         // и вокруг своей жилки
             r = r * cos(dl.z) + cross(ta, r) * sin(dl.z) + ta * dot(ta, r) * (1.0 - cos(dl.z));
             transformed = sl.xyz + bend(r, dl.xy); }
           vec4 sb = txl(uStat, k); float u = clamp((position.y - sb.y) / sb.w, 0.0, 1.2);    // побег — от земли
           transformed = sb.xyz + bend(transformed - sb.xyz, txl(uDyn, k).xy * u); }`);
    };
    m.customProgramCacheKey = () => 'peonyP' + TW + NS;
  };
  const dm = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking }); shade(dm);
  const group = new THREE.Group(); group.name = 'куст';
  const [lx, ly, lz] = head.lo, [sx, sy, sz] = head.sc;
  let off = 4 + hl, tris = 0; const tops = [];
  // opt.keep(основание, № побега) → false — побег не ставить (основание в осях грядки)
  const drop = new Set(opt.keep ? SH.map((s, k) => opt.keep(V(...s.base), k) ? -1 : k).filter(k => k >= 0) : []);
  const take = (T, n, bytes) => { const a = new T(buf, off, n); off += bytes; return a; };
  for (const g of head.groups) {
    const [bq, bn, bu, bi, bk, bl, bc] = g.bytes;
    const q = take(Uint16Array, g.nV * 3, bq), n8 = take(Int8Array, g.nV * 3, bn), u16 = bu ? take(Uint16Array, g.nV * 2, bu) : null;
    const d = take(Int32Array, g.nI, bi), K = take(Uint8Array, g.nV, bk), L = take(Uint16Array, g.nV, bl);
    const c8 = bc ? take(Uint8Array, g.nV * 3, bc) : null;
    const P = new Float32Array(g.nV * 3), UV = new Float32Array(g.nV * 2), AK = new Float32Array(g.nV * 2);
    for (let i = 0; i < g.nV; i++) {
      P[3 * i] = lx + q[3 * i] * sx; P[3 * i + 1] = ly + q[3 * i + 1] * sy; P[3 * i + 2] = lz + q[3 * i + 2] * sz;
      if (u16) { UV[2 * i] = g.ulo[0] + u16[2 * i] * g.usc[0]; UV[2 * i + 1] = g.ulo[1] + u16[2 * i + 1] * g.usc[1]; }
      AK[2 * i] = K[i]; AK[2 * i + 1] = L[i] === 65535 ? -1 : L[i];
    }
    let I = new Uint32Array(g.nI); for (let i = 0, s = 0; i < g.nI; i++) I[i] = s += d[i];
    if (drop.size) I = I.filter((_, i, A) => !drop.has(K[A[i - i % 3]]));     // растения, что мешают (колышек, работа), — без них
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(P, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(new Int8Array(n8), 3, true));
    if (u16) geo.setAttribute('uv', new THREE.BufferAttribute(UV, 2));
    if (c8) geo.setAttribute('color', new THREE.BufferAttribute(Float32Array.from(c8, v => LIN[v]), 3));
    geo.setAttribute('aK', new THREE.BufferAttribute(AK, 2));
    geo.setIndex(new THREE.BufferAttribute(I, 1)); geo.computeBoundingSphere();
    const c = g.color, m = new THREE.MeshStandardMaterial({
      color: new THREE.Color(c[0], c[1], c[2]), map: g.tex ? tex : null, vertexColors: !!c8, roughness: g.rough, metalness: 0, side: THREE.DoubleSide });
    if (opt.env) { m.envMap = opt.env; m.envMapIntensity = 0.5; }
    shade(m);
    if (g.name === 'шипы') for (let i = 0; i < g.nV; i++) {            // верх шишки каждого растения — туда садятся бабочки
      const k = K[i], y = P[3 * i + 1]; if (!tops[k] || y > tops[k].y) tops[k] = V(P[3 * i], y, P[3 * i + 2]);
    }
    const mesh = new THREE.Mesh(geo, m); mesh.name = g.name;
    mesh.customDepthMaterial = dm; mesh.castShadow = mesh.receiveShadow = true; mesh.frustumCulled = false;
    group.add(mesh); tris += g.nI / 3;
  }

  // ---- побеги: наклон θ (рад, к x и к z), упругость; лист: отгиб φ на креплении ----
  const rnd = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const S = SH.map((s, k) => ({ k, base: V(...s.base), H: s.H, live: s.pts.length > 0 && !drop.has(k),
    x: 0, z: 0, vx: 0, vz: 0, x0: 0, z0: 0,
    w: 2 * Math.PI * THREE.MathUtils.clamp(0.8 / Math.sqrt(Math.max(s.H, 0.2)), 0.7, 1.6) * (0.9 + 0.2 * rnd(k)),
    ph: [rnd(k + 7) * 6.28, rnd(k + 13) * 6.28], fq: [0.31 + 0.2 * rnd(k + 3), 0.53 + 0.25 * rnd(k + 5)] }));
  const L = LV.map((l, i) => ({ k: l[0], piv: V(l[1], l[2], l[3]), cen: V(l[4], l[5], l[6]),
    x: 0, z: 0, vx: 0, vz: 0, x0: 0, z0: 0, w: 2 * Math.PI * (2.2 + 1.2 * rnd(i + 101)), ph: rnd(i + 57) * 6.28,
    // 15 окт ночью, её слово: «слишком одинаковые движения на листочках… вверх-вниз; а ветер дует — они по-разному
    // трепещут». У каждого листа своё: два направления качания, две частоты вперемешку, сила; и поворот вокруг жилки
    // (tw) — своей частотой; так лист то клонится, то переворачивается ребром.
    ps: rnd(i + 211) * 6.28, ps2: rnd(i + 223) * 6.28, amp: 0.55 + 0.9 * rnd(i + 229), f2: 1.37 + 0.5 * rnd(i + 233), ph2: rnd(i + 239) * 6.28,
    tw: 0, tv: 0, tf: 2 * Math.PI * (0.7 + 0.8 * rnd(i + 241)), tf2: 1.5 + 0.6 * rnd(i + 251), tph: rnd(i + 257) * 6.28, tph2: rnd(i + 263) * 6.28,
    // 15 окт, её слово: «моменты, когда слишком уж трепещут… как будто быстрая перемотка; нужно реалистичное, слабый
    // ветерок». Было: поворот вокруг жилки до 10 Гц и все листья в порыв разом. Теперь не быстрее 3 Гц, слабее, и у
    // каждого листа свой медленный черёд (раз в 7–15 с): одни затихли, другие шевелятся — разом не вскидываются.
    ef: 2 * Math.PI * (0.067 + 0.075 * rnd(i + 271)), eph: rnd(i + 277) * 6.28 }));
  for (const l of L) l.arm = Math.max(0.02, l.cen.distanceTo(l.piv));
  // ---- точки для касаний и упоров: стебель, головка, листья ----
  const PX = [];
  for (const s of S) {
    if (!s.live) continue;
    for (const p of SH[s.k].pts) PX.push({ s, l: null, rest: V(...p), r: 0.01 });
    if (SH[s.k].head) { const h = SH[s.k].head; PX.push({ s, l: null, rest: V(h[0], h[1], h[2]), r: h[3] * 0.9 }); }
  }
  L.forEach(l => { if (S[l.k].live) PX.push({ s: S[l.k], l, rest: l.cen.clone(), r: Math.min(0.035, l.arm * 0.6) }); });
  for (const p of PX) { p.h = Math.max(p.rest.y - p.s.base.y, 0.02); p.cur = p.rest.clone(); }
  // пары разных побегов, стоящие рядом: ближе, чем в покое, не сходятся. Только выше трети стебля: у корня
  // стебли стоят вплотную (1,5 см) и почти не движутся — упоры там спорили друг с другом и раскачивали весь куст
  const pairs = [], up = PX.filter(p => p.h > 0.3 * p.s.H);
  for (let i = 0; i < up.length; i++) for (let j = i + 1; j < up.length; j++) {
    const a = up[i], b = up[j]; if (a.s === b.s) continue;
    const D = a.rest.distanceTo(b.rest); if (D >= a.r + b.r + 0.02) continue;
    // упор — по направлению, как стояли в покое (по горизонтали): сосед может скользнуть вбок, но не перейти
    // на другую сторону; направление не меняется, поэтому и не скачет, когда точки близко
    const nx = a.rest.x - b.rest.x, nz = a.rest.z - b.rest.z, Lh = Math.hypot(nx, nz);
    if (Lh < 0.004) continue;
    pairs.push({ a, b, nx: nx / Lh, nz: nz / Lh, min: Math.min(Lh, a.r + b.r) * 0.8 });   // сблизиться на пятую часть можно
  }
  // где точка сейчас: наклон побега у её высоты (угол·h/H) и отгиб её листа
  const _r = V(), _ax = V();
  const place = p => {
    const s = p.s, u = Math.min(p.h / s.H, 1.2), ax = s.x * u, az = s.z * u;
    p.cur.set(p.rest.x + ax * p.h, p.rest.y - 0.5 * (ax * ax + az * az) * p.h, p.rest.z + az * p.h);
    if (p.l && finger.on) { p.cur.x += p.l.x * p.l.arm; p.cur.z += p.l.z * p.l.arm; }   // дрожь листа упоров не задевает
  };
  // сдвинуть точку на (cx, cz): часть — отгибом листа, остальное — наклоном побега. Стебель у земли жёсткий:
  // точка на высоте h сдвигается на угол·h²/H, и чтобы низ не швырял весь стебель, наклон берётся с податливостью
  // (как у работы): Δθ = c·J / (J² + ALPHA), J = h²/H — внизу стебель почти не подаётся, вверху — на всю величину
  const ALPHA = 0.03, J = p => p.h * p.h / p.s.H;
  const QS = new URLSearchParams(location.search), PSOFT = +(QS.get('psoft') ?? 0.04), PCAP = +(QS.get('pcap') ?? 0.15) / 1000;   // упор в ветер (доля, мм за шаг); psoft=0 — жёсткий всегда
  const shove = (p, cx, cz, leafShare) => {
    const s = p.s;
    if (p.l && leafShare > 0) { p.l.x += cx * leafShare / p.l.arm; p.l.z += cz * leafShare / p.l.arm; cx *= 1 - leafShare; cz *= 1 - leafShare; }
    const j = J(p), g = j / (j * j + ALPHA); s.x += cx * g; s.z += cz * g;
  };
  // 15 окт, её слово: «задерживаю палец на цветке — он дёргается, тремор. Нужно: потянули — наклоняется без тремора,
  // отпустили — возвращается, колышется, успокаивается». Причина была в двух вещах: палец стоит — телефон не шлёт
  // движений, и через 0,15 с куст «отпускался» и снова «хватался»; и ладонь толкала по ТЕКУЩЕМУ положению листьев —
  // лист отошёл, толчок пропал, пружина вернула, толчок снова. Теперь: пока палец лежит (hold), ладонь держит;
  // куда должно отойти — считается по ПОКОЮ куста (стоит палец — стоит и цель), побег идёт к цели без раскачки
  // (затухание критическое), а отпустили — пружина обычная, с покачиванием.
  const finger = { on: false, hold: false, depth: 0, c: V(), t: -9, R: 0.08, mx: 0, mz: 0 };   // mx, mz — куда идёт ладонь
  for (const s of S) { s.tx = s.tz = s.gx = s.gz = 0; }
  for (const l of L) { l.tx = l.tz = l.gx = l.gz = 0; }
  // где точка была бы при наклонах-целях (без ветра и дрожи) — для расчёта цели
  const placeT = p => {
    const s = p.s, u = Math.min(p.h / s.H, 1.2), ax = s.tx * u, az = s.tz * u;
    p.tgt.set(p.rest.x + ax * p.h, p.rest.y - 0.5 * (ax * ax + az * az) * p.h, p.rest.z + az * p.h);
    if (p.l) { p.tgt.x += p.l.tx * p.l.arm; p.tgt.z += p.l.tz * p.l.arm; }
  };
  for (const p of PX) p.tgt = p.rest.clone();
  const solveTargets = () => {
    for (const s of S) s.tx = s.tz = 0;
    for (const l of L) l.tx = l.tz = 0;
    if (!finger.on) return;
    for (let it = 0; it < 4; it++) {
      for (const p of PX) placeT(p);
      for (const p of PX) {
        const dx = p.tgt.x - finger.c.x, dy = p.tgt.y - finger.c.y, dz = p.tgt.z - finger.c.z, D = Math.hypot(dx, dy, dz), m = finger.R + p.r;
        if (D >= m) continue;
        let ux = dx / (Math.hypot(dx, dz) + 0.03) + finger.mx * 2, uz = dz / (Math.hypot(dx, dz) + 0.03) + finger.mz * 2;
        const Lu = Math.hypot(ux, uz) || 1, push = (m - D) * 0.5, cx = ux / Lu * push, cz = uz / Lu * push;
        let rx = cx, rz = cz;
        if (p.l) { p.l.tx += cx * 0.6 / p.l.arm; p.l.tz += cz * 0.6 / p.l.arm; rx *= 0.4; rz *= 0.4; }
        const j = J(p), g = j / (j * j + ALPHA); p.s.tx += rx * g; p.s.tz += rz * g;
        placeT(p);
      }
      for (const q of pairs) {
        const a = q.a, b = q.b, D = (a.tgt.x - b.tgt.x) * q.nx + (a.tgt.z - b.tgt.z) * q.nz;
        if (D >= q.min) continue;
        const c = (q.min - D) * 0.5, ja = J(a), jb = J(b), lam = c / (ja * ja + jb * jb + ALPHA);
        a.s.tx += q.nx * lam * ja; a.s.tz += q.nz * lam * ja; b.s.tx -= q.nx * lam * jb; b.s.tz -= q.nz * lam * jb;
        placeT(a); placeT(b);
      }
    }
    for (const s of S) { const a = Math.hypot(s.tx, s.tz); if (a > 0.35) { s.tx *= 0.35 / a; s.tz *= 0.35 / a; } }
  };
  const inv = new THREE.Matrix4(), _o = V(), _d = V(), _p = V();
  let clock = 0, gust = 0, loopT = 0;
  const qf = w => loopT ? Math.max(1, Math.round(w * loopT / (2 * Math.PI))) * 2 * Math.PI / loopT : w;   // угловая частота — к кратной петле
  const lim = (o, m) => { const a = Math.hypot(o.x, o.z); if (a > m) { o.x *= m / a; o.z *= m / a; } };
  return {
    group, tris, stems: S.filter(s => s.live).length, leaves: NL, pairs: pairs.length,
    dbg: () => ({ S, L, PX, pairs }),
    // верх шишки побега k сейчас (в осях грядки), с наклоном стебля; нажали ли на побег пальцем
    tops,
    top(k, out) {
      const r = tops[k], s = S[k]; if (!r || !s.live) return null;
      const h = Math.max(r.y - s.base.y, 0.02), u = Math.min(h / s.H, 1.2), ax = s.x * u, az = s.z * u;
      return out.set(r.x + ax * h, r.y - 0.5 * (ax * ax + az * az) * h, r.z + az * h);
    },
    pushed: k => Math.hypot(S[k].gx, S[k].gz),
    state: () => ({ th: Math.max(...S.map(s => Math.hypot(s.x, s.z))), phi: Math.max(...L.map(l => Math.hypot(l.x, l.z))), finger: finger.on }),
    // ветер: wind(x) — порыв страницы вдоль z (мир); dt — шаг, t — часы
    step(dt, t, wind) {
      if (!(dt > 1e-5)) return;                     // кадр без времени: скорость = сдвиг / 0 дала бы NaN, и растения пропали бы насовсем
      dt = Math.min(dt, 1 / 30); clock = t;
      group.updateMatrixWorld(); const e = group.matrixWorld.elements;
      let gs = 0, ns = 0;
      // 0) цель от ладони — по покою куста; к ней плавно (стоит палец — стоит и цель, дрожать нечему)
      finger.on = finger.hold || clock - finger.t < 0.15;
      solveTargets();
      const ag = 1 - Math.exp(-dt * 10);
      for (const s of S) { s.gx += (s.tx - s.gx) * ag; s.gz += (s.tz - s.gz) * ag; if (!finger.on) s.gx = s.gz = 0; }
      for (const l of L) { l.gx += (l.tx - l.gx) * ag; l.gz += (l.tz - l.gz) * ag; if (!finger.on) l.gx = l.gz = 0; }
      // 1) свободный шаг: упругость, затухание, ветер; под ладонью — к цели без раскачки
      for (const s of S) {
        if (!s.live) continue;
        _p.set(s.base.x, s.H, s.base.z).applyMatrix4(group.matrixWorld);
        const g = wind ? wind(_p.x) : 0; gs += Math.abs(g); ns++;
        const breath = 1 + 0.35 * Math.sin(t * qf(s.fq[0] * 6.28) + s.ph[0]) + 0.2 * Math.sin(t * qf(s.fq[1] * 6.28) + s.ph[1]);
        const held = s.held = finger.on && Math.abs(s.gx) + Math.abs(s.gz) > 1e-4;
        const wk = held ? 0 : 1;                                  // под ладонью ветер его не качает — рука держит
        const fx = wk * g * e[8] * 0.045 * breath + s.gx, fz = wk * g * e[10] * 0.045 * breath + s.gz, k2 = s.w * s.w, c = 2 * (held ? 1 : 0.22) * s.w;
        s.x0 = s.x; s.z0 = s.z;
        s.vx += (-k2 * (s.x - fx) - c * s.vx) * dt; s.vz += (-k2 * (s.z - fz) - c * s.vz) * dt;
        s.x += s.vx * dt; s.z += s.vz * dt;
      }
      gust += ((ns ? gs / ns : 0) - gust) * (1 - Math.exp(-dt * 2));
      for (const l of L) {
        const held = finger.on && Math.abs(l.gx) + Math.abs(l.gz) > 1e-4;
        // трепет: сильнее в порыв; две частоты своего листа, каждая к своему направлению
        const env = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * qf(l.ef) + l.eph)) ** 2;
        const a = held ? 0 : (0.004 + gust * 0.22) * l.amp * env, s1 = Math.sin(t * qf(l.w * 0.4) + l.ph), s2 = Math.sin(t * qf(l.w * 0.4 * (1 + 0.45 * (l.f2 - 1.37))) + l.ph2);
        const fx = a * (Math.cos(l.ps) * s1 + 0.4 * Math.cos(l.ps2) * s2), fz = a * (Math.sin(l.ps) * s1 + 0.4 * Math.sin(l.ps2) * s2);
        const k2 = l.w * l.w, c = 2 * (held ? 1 : 0.3) * l.w;
        l.x0 = l.x; l.z0 = l.z;
        l.vx += (-k2 * (l.x - fx - l.gx) - c * l.vx) * dt; l.vz += (-k2 * (l.z - fz - l.gz) - c * l.vz) * dt;
        l.x += l.vx * dt; l.z += l.vz * dt;
        const ta = held ? 0 : (0.012 + gust * 0.6) * l.amp * env * (0.75 * Math.sin(t * qf(l.tf) + l.tph) + 0.25 * Math.sin(t * qf(l.tf * l.tf2) + l.tph2));
        const tk = l.tf * l.tf; l.tv += (-tk * (l.tw - ta) - 2 * 0.25 * l.tf * l.tv) * dt; l.tw += l.tv * dt;
        if (Math.abs(l.tw) > 0.5) { l.tw = Math.sign(l.tw) * 0.5; l.tv *= -0.3; }
      }
      // 2) упоры: разные побеги не сходятся ближе покоя (ладонь — уже в цели, шаг 0)
      for (let it = 0; it < 3; it++) {
        for (const p of PX) place(p);
        for (const q of pairs) {
          const a = q.a, b = q.b, D = (a.cur.x - b.cur.x) * q.nx + (a.cur.z - b.cur.z) * q.nz;
          if (D >= q.min - 0.001) continue;                    // миллиметр запаса: на самой границе не дёргать
          // двое делят поправку по податливости: кто выше на стебле (легче сдвинуть), тот и уступает больше
          // стебель под ладонью держит рука — соседу не уступает, уступает сосед
          if (a.s.held && b.s.held) continue;
          // 15 окт, её слово: «дёргаются цветы как-то». Замер: в ветер у эхинацеи рывки в 25 раз сильнее среднего
          // движения, без упоров — в 5. Упор выталкивал соседа скачком. Теперь в ветер упор мягкий (доля перекрытия,
          // ≤0,15 мм за шаг; замер: наибольший рывок эхинацеи 8,7 → 2,9) — стебли расходятся плавно; под пальцем — жёсткий, как был (сквозь друг друга не идут).
          const c = finger.on || !PSOFT ? Math.min((q.min - D) * 0.5, 0.0025) : Math.min((q.min - D) * PSOFT, PCAP), ja = a.s.held ? 0 : J(a), jb = b.s.held ? 0 : J(b), lam = c / (ja * ja + jb * jb + ALPHA);   // не больше 4 мм за раз
          a.s.x += q.nx * lam * ja; a.s.z += q.nz * lam * ja; b.s.x -= q.nx * lam * jb; b.s.z -= q.nz * lam * jb;
          place(a); place(b);
        }
      }
      // 3) скорость — из того, как сдвинулось (упор не даёт рывка: отпустила — плавно назад, с покачиванием)
      // упор переносит в скорость только половину своего сдвига — иначе спор соседей копил бы раскачку
      for (const s of S) { if (!s.live) continue; lim(s, 0.35);
        s.vx = 0.5 * s.vx + 0.5 * (s.x - s.x0) / dt; s.vz = 0.5 * s.vz + 0.5 * (s.z - s.z0) / dt; }
      for (const l of L) { lim(l, 0.6); l.vx = (l.x - l.x0) / dt; l.vz = (l.z - l.z0) / dt; }
      for (const s of S) { dyn[4 * s.k] = s.x; dyn[4 * s.k + 1] = s.z; }
      L.forEach((l, i) => { dyn[4 * (NS + i)] = l.x; dyn[4 * (NS + i) + 1] = l.z; dyn[4 * (NS + i) + 2] = l.tw; });
      tDyn.needsUpdate = true;
    },
    // петля для видео (15 окт ночью: рилс 7 с, пересматривают по кругу): все частоты — кратны 1/T, движение повторяется
    setLoop(T) { loopT = T; },
    // палец ведёт по кусту: ладонь — там, где луч ближе всего подходит к кусту (первое, что задел)
    // палец лёг на куст: ладонь на глубине первого задетого — и дальше на той же глубине, пока не отпустят
    grab(ray) {
      inv.copy(group.matrixWorld).invert();
      _o.copy(ray.origin).applyMatrix4(inv); _d.copy(ray.direction).transformDirection(inv);
      let best = Infinity;
      for (const p of PX) {
        _p.copy(p.rest).sub(_o); const tt = _p.dot(_d); if (tt < 0) continue;
        if (_p.addScaledVector(_d, -tt).length() < 0.06 && tt < best) best = tt;
      }
      if (best === Infinity) return false;
      finger.hold = true; finger.depth = best + 0.04; finger.c.copy(_o).addScaledVector(_d, finger.depth);
      finger.mx = finger.mz = 0; finger.t = clock; return true;
    },
    release() { finger.hold = false; finger.t = -9; },
    poke(ray) {
      inv.copy(group.matrixWorld).invert();
      _o.copy(ray.origin).applyMatrix4(inv); _d.copy(ray.direction).transformDirection(inv);
      let best = Infinity, bt = 0;
      if (finger.hold) { best = bt = finger.depth - 0.04; }
      else for (const p of PX) {                         // мышь наведением — по покою куста, не по качнувшемуся
        _p.copy(p.rest).sub(_o); const tt = _p.dot(_d); if (tt < 0) continue;
        const dist = _p.addScaledVector(_d, -tt).length();
        if (dist < 0.06 && tt < best) { best = tt; bt = tt; }
      }
      if (best === Infinity) return false;
      const at = _o.clone().addScaledVector(_d, bt + 0.04);
      if (!finger.hold && clock - finger.t > 0.15) { finger.c.copy(at); finger.mx = finger.mz = 0; }
      else { const ox = finger.c.x, oz = finger.c.z; finger.c.lerp(at, 0.5);       // ладонь идёт за пальцем без скачка
        const mx = finger.c.x - ox, mz = finger.c.z - oz, Lm = Math.hypot(mx, mz);
        if (Lm > 1e-4) { finger.mx = 0.7 * finger.mx + 0.3 * mx / Lm; finger.mz = 0.7 * finger.mz + 0.3 * mz / Lm; } }
      finger.t = clock; return true;
    },
    hit(ray) {
      inv.copy(group.matrixWorld).invert();
      _o.copy(ray.origin).applyMatrix4(inv); _d.copy(ray.direction).transformDirection(inv);
      let best = Infinity;
      for (const p of PX) {
        _p.copy(p.cur).sub(_o); const tt = _p.dot(_d); if (tt < 0) continue;
        if (_p.addScaledVector(_d, -tt).length() < 0.06 && tt < best) best = tt;
      }
      return best;
    },
  };
}

// ОПАВШИЕ ЛЕПЕСТКИ НА ЗЕМЛЕ (15 окт, её слово: «урони несколько лепестков, пусть что-то на земле лежит — немножко уюта»).
// Лепесток — веер из сетки: узкий ноготок у основания, широкий скруглённый край; лодочкой (края приподняты), лежит
// на земле самым низом в 0,6 мм над ней. Раскладка — под растением и чуть вокруг, не ближе 3 см к стеблям.
// opt: { n, seed, len, wid, cup, color: [sRGB], edge: [sRGB] — подвявший край, spread — радиус россыпи от центра, м }
export function litter(THREE, P, opt = {}) {
  const n = opt.n ?? 14, rnd = (i => () => { i = (i * 16807) % 2147483647; return (i - 1) / 2147483646; })(opt.seed ?? 11);
  const bases = P.dbg().S.filter(s => s.live).map(s => s.base);
  const cx = bases.reduce((a, b) => a + b.x, 0) / bases.length, cz = bases.reduce((a, b) => a + b.z, 0) / bases.length;
  const NS = 7, NT = 6, pos = [], col = [], idx = [], C = new THREE.Color();
  const lin = c => C.setRGB(c[0] / 255, c[1] / 255, c[2] / 255, THREE.SRGBColorSpace).clone();
  const body = lin(opt.color ?? [150, 28, 66]), edge = lin(opt.edge ?? [96, 30, 40]), claw = lin(opt.claw ?? [190, 120, 120]);
  for (let p = 0; p < n; p++) {
    let x = 0, z = 0;
    for (let tries = 0; tries < 40; tries++) {
      const a = rnd() * 6.283, r = (opt.spread ?? 0.45) * Math.sqrt(rnd());
      x = cx + r * Math.cos(a); z = cz + r * Math.sin(a) * (opt.squash ?? 1);
      if (bases.every(b => Math.hypot(b.x - x, b.z - z) > 0.03)) break;
    }
    const L = (opt.len ?? 0.045) * (0.8 + 0.4 * rnd()), Wd = (opt.wid ?? 0.75) * (0.85 + 0.3 * rnd()), cup = (opt.cup ?? 0.25) * (0.6 + 0.8 * rnd());
    const yaw = rnd() * 6.283, cs = Math.cos(yaw), sn = Math.sin(yaw), wilt = rnd(), flip = rnd() < 0.3 ? -1 : 1;
    const v0 = pos.length / 3; let lo = Infinity; const tmp = [];
    for (let i = 0; i <= NS; i++) for (let j = 0; j <= NT; j++) {
      const s = i / NS, t = j / NT * 2 - 1, th = t * Wd * (0.35 + 0.65 * Math.min(1, s * 2.2));   // у основания — узкий ноготок
      const R = L * s * (1 - 0.2 * t * t) * (1 + 0.04 * Math.sin(7 * t + p));
      const u = R * Math.cos(th), v = R * Math.sin(th), h = flip * cup * L * (t * t * 0.5 * s + 0.35 * s * s) + 0.003 * Math.sin(5 * s + p) * s;
      tmp.push([u, h, v]); if (h < lo) lo = h;
      const e = Math.max(Math.abs(t), s) ** 3 * (0.3 + 0.7 * wilt);       // подвявший край темнее
      const k = s < 0.18 ? (0.18 - s) / 0.18 : 0;
      C.copy(body).lerp(edge, e * 0.8).lerp(claw, k * 0.7); col.push(C.r, C.g, C.b);
    }
    for (const [u, h, v] of tmp) pos.push(x + u * cs - v * sn, h - lo + 0.0006, z + u * sn + v * cs);
    for (let i = 0; i < NS; i++) for (let j = 0; j < NT; j++) {
      const a = v0 + i * (NT + 1) + j, b = a + NT + 1; idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx); geo.computeVertexNormals();
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, m); mesh.name = 'опавшие лепестки'; mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}
