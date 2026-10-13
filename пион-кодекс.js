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
  const tex = await new THREE.TextureLoader().loadAsync(opt.atlas ?? './пион-атлас.jpg');
  tex.flipY = false; tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;   // развёртка из glTF — без переворота

  const SH = head.shoots, LV = head.leaves, NS = SH.length, NL = LV.length, TW = 64, TH = Math.ceil((NS + NL) / TW);
  // неподвижное: основание и высота побега, крепление листа; подвижное: наклон побега, отгиб листа
  const stat = new Float32Array(TW * TH * 4), dyn = new Float32Array(TW * TH * 4);
  SH.forEach((s, k) => stat.set([...s.base, s.H], 4 * k));
  LV.forEach((l, i) => stat.set([l[1], l[2], l[3], 0], 4 * (NS + i)));
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
           if (aK.y >= 0.0) { int l = ${NS} + int(aK.y + 0.5); vec3 pv = txl(uStat, l).xyz;      // лист — вокруг крепления
             transformed = pv + bend(transformed - pv, txl(uDyn, l).xy); }
           vec4 sb = txl(uStat, k); float u = clamp((position.y - sb.y) / sb.w, 0.0, 1.2);    // побег — от земли
           transformed = sb.xyz + bend(transformed - sb.xyz, txl(uDyn, k).xy * u); }`);
    };
    m.customProgramCacheKey = () => 'peonyP';
  };
  const dm = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking }); shade(dm);
  const group = new THREE.Group(); group.name = 'куст';
  const [lx, ly, lz] = head.lo, [sx, sy, sz] = head.sc;
  let off = 4 + hl, tris = 0;
  const take = (T, n, bytes) => { const a = new T(buf, off, n); off += bytes; return a; };
  for (const g of head.groups) {
    const [bq, bn, bu, bi, bk, bl] = g.bytes;
    const q = take(Uint16Array, g.nV * 3, bq), n8 = take(Int8Array, g.nV * 3, bn), u16 = take(Uint16Array, g.nV * 2, bu);
    const d = take(Int32Array, g.nI, bi), K = take(Uint8Array, g.nV, bk), L = take(Uint16Array, g.nV, bl);
    const P = new Float32Array(g.nV * 3), UV = new Float32Array(g.nV * 2), AK = new Float32Array(g.nV * 2);
    for (let i = 0; i < g.nV; i++) {
      P[3 * i] = lx + q[3 * i] * sx; P[3 * i + 1] = ly + q[3 * i + 1] * sy; P[3 * i + 2] = lz + q[3 * i + 2] * sz;
      UV[2 * i] = g.ulo[0] + u16[2 * i] * g.usc[0]; UV[2 * i + 1] = g.ulo[1] + u16[2 * i + 1] * g.usc[1];
      AK[2 * i] = K[i]; AK[2 * i + 1] = L[i] === 65535 ? -1 : L[i];
    }
    const I = new Uint32Array(g.nI); for (let i = 0, s = 0; i < g.nI; i++) I[i] = s += d[i];
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(P, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(new Int8Array(n8), 3, true));
    geo.setAttribute('uv', new THREE.BufferAttribute(UV, 2));
    geo.setAttribute('aK', new THREE.BufferAttribute(AK, 2));
    geo.setIndex(new THREE.BufferAttribute(I, 1)); geo.computeBoundingSphere();
    const c = g.color, m = new THREE.MeshStandardMaterial({
      color: new THREE.Color(c[0], c[1], c[2]), map: g.tex ? tex : null, roughness: g.rough, metalness: 0, side: THREE.DoubleSide });
    if (opt.env) { m.envMap = opt.env; m.envMapIntensity = 0.5; }
    shade(m);
    const mesh = new THREE.Mesh(geo, m); mesh.name = g.name;
    mesh.customDepthMaterial = dm; mesh.castShadow = mesh.receiveShadow = true; mesh.frustumCulled = false;
    group.add(mesh); tris += g.nI / 3;
  }

  // ---- побеги: наклон θ (рад, к x и к z), упругость; лист: отгиб φ на креплении ----
  const rnd = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const S = SH.map((s, k) => ({ k, base: V(...s.base), H: s.H, live: s.pts.length > 0,
    x: 0, z: 0, vx: 0, vz: 0, x0: 0, z0: 0,
    w: 2 * Math.PI * THREE.MathUtils.clamp(0.8 / Math.sqrt(Math.max(s.H, 0.2)), 0.7, 1.6) * (0.9 + 0.2 * rnd(k)),
    ph: [rnd(k + 7) * 6.28, rnd(k + 13) * 6.28], fq: [0.31 + 0.2 * rnd(k + 3), 0.53 + 0.25 * rnd(k + 5)] }));
  const L = LV.map((l, i) => ({ k: l[0], piv: V(l[1], l[2], l[3]), cen: V(l[4], l[5], l[6]),
    x: 0, z: 0, vx: 0, vz: 0, x0: 0, z0: 0, w: 2 * Math.PI * (2.2 + 1.2 * rnd(i + 101)), ph: rnd(i + 57) * 6.28 }));
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
  const shove = (p, cx, cz, leafShare) => {
    const s = p.s;
    if (p.l && leafShare > 0) { p.l.x += cx * leafShare / p.l.arm; p.l.z += cz * leafShare / p.l.arm; cx *= 1 - leafShare; cz *= 1 - leafShare; }
    const j = J(p), g = j / (j * j + ALPHA); s.x += cx * g; s.z += cz * g;
  };
  const finger = { on: false, c: V(), t: -9, R: 0.08, mx: 0, mz: 0 };   // mx, mz — куда идёт ладонь (единичный)
  const inv = new THREE.Matrix4(), _o = V(), _d = V(), _p = V();
  let clock = 0, gust = 0;
  const lim = (o, m) => { const a = Math.hypot(o.x, o.z); if (a > m) { o.x *= m / a; o.z *= m / a; } };
  return {
    group, tris, stems: S.filter(s => s.live).length, leaves: NL, pairs: pairs.length,
    dbg: () => ({ S, L, PX, pairs }),
    state: () => ({ th: Math.max(...S.map(s => Math.hypot(s.x, s.z))), phi: Math.max(...L.map(l => Math.hypot(l.x, l.z))), finger: finger.on }),
    // ветер: wind(x) — порыв страницы вдоль z (мир); dt — шаг, t — часы
    step(dt, t, wind) {
      dt = Math.min(dt, 1 / 30); clock = t;
      group.updateMatrixWorld(); const e = group.matrixWorld.elements;
      let gs = 0, ns = 0;
      // 1) свободный шаг: упругость, затухание, ветер
      for (const s of S) {
        if (!s.live) continue;
        _p.set(s.base.x, s.H, s.base.z).applyMatrix4(group.matrixWorld);
        const g = wind ? wind(_p.x) : 0; gs += Math.abs(g); ns++;
        const breath = 1 + 0.35 * Math.sin(t * s.fq[0] * 6.28 + s.ph[0]) + 0.2 * Math.sin(t * s.fq[1] * 6.28 + s.ph[1]);
        const fx = g * e[8] * 0.045 * breath, fz = g * e[10] * 0.045 * breath, k2 = s.w * s.w, c = 2 * 0.22 * s.w;
        s.x0 = s.x; s.z0 = s.z;
        s.vx += (-k2 * (s.x - fx) - c * s.vx) * dt; s.vz += (-k2 * (s.z - fz) - c * s.vz) * dt;
        s.x += s.vx * dt; s.z += s.vz * dt;
      }
      gust += ((ns ? gs / ns : 0) - gust) * (1 - Math.exp(-dt * 2));
      for (const l of L) {
        const fl = (0.008 + gust * 0.4) * Math.sin(t * l.w * 0.5 + l.ph);   // трепет: каждый в свою фазу, сильнее в порыв
        const k2 = l.w * l.w, c = 2 * 0.3 * l.w;
        l.x0 = l.x; l.z0 = l.z;
        l.vx += (-k2 * (l.x - fl) - c * l.vx) * dt; l.vz += (-k2 * (l.z - fl * 0.6) - c * l.vz) * dt;
        l.x += l.vx * dt; l.z += l.vz * dt;
      }
      // 2) упоры: ладонь отталкивает, разные побеги не сходятся ближе покоя
      finger.on = clock - finger.t < 0.15;
      for (let it = 0; it < 3; it++) {
        for (const p of PX) place(p);
        if (finger.on) for (const p of PX) {
          const dx = p.cur.x - finger.c.x, dy = p.cur.y - finger.c.y, dz = p.cur.z - finger.c.z, D = Math.hypot(dx, dy, dz), m = finger.R + p.r;
          if (D >= m) continue;
          // ладонь толкает наружу и по ходу пальца (как рука по траве — ведёт за собой), направление ровное
          let ux = dx / (Math.hypot(dx, dz) + 0.03) + finger.mx * 2, uz = dz / (Math.hypot(dx, dz) + 0.03) + finger.mz * 2;
          const Lu = Math.hypot(ux, uz) || 1, push = (m - D) * 0.35;
          shove(p, ux / Lu * push, uz / Lu * push, p.l ? 0.6 : 0); place(p);
        }
        for (const q of pairs) {
          const a = q.a, b = q.b, D = (a.cur.x - b.cur.x) * q.nx + (a.cur.z - b.cur.z) * q.nz;
          if (D >= q.min - 0.001) continue;                    // миллиметр запаса: на самой границе не дёргать
          // двое делят поправку по податливости: кто выше на стебле (легче сдвинуть), тот и уступает больше
          const c = Math.min((q.min - D) * 0.5, 0.0025), ja = J(a), jb = J(b), lam = c / (ja * ja + jb * jb + ALPHA);   // не больше 4 мм за раз
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
      L.forEach((l, i) => { dyn[4 * (NS + i)] = l.x; dyn[4 * (NS + i) + 1] = l.z; });
      tDyn.needsUpdate = true;
    },
    // палец ведёт по кусту: ладонь — там, где луч ближе всего подходит к кусту (первое, что задел)
    poke(ray) {
      inv.copy(group.matrixWorld).invert();
      _o.copy(ray.origin).applyMatrix4(inv); _d.copy(ray.direction).transformDirection(inv);
      let best = Infinity, bt = 0;
      for (const p of PX) {
        _p.copy(p.cur).sub(_o); const tt = _p.dot(_d); if (tt < 0) continue;
        const dist = _p.addScaledVector(_d, -tt).length();
        if (dist < 0.06 && tt < best) { best = tt; bt = tt; }
      }
      if (best === Infinity) return false;
      const at = _o.clone().addScaledVector(_d, bt + 0.04);
      if (clock - finger.t > 0.15) { finger.c.copy(at); finger.mx = finger.mz = 0; }
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
