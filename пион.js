// КУСТ ПИОНА — строится прямо на странице (Анныч, 12 окт вечером: «грубый, сломанный; палка насквозь
// через бутон; бутоны в воздухе; веточки одинаковые, дублируются; листочки одной толщины; может, проще
// заново построить»). Прежний куст (сад/куст/пион.glb, скрипт Кодекса) — шар из одинаковых веток.
// Здесь — по ботанике травянистого пиона (P. lactiflora) и её фото сад/фото/2-куст-в-бутонах.jpg:
//   · 16–18 стеблей из корневища ⌀ ~30 см; внутренние прямее и выше, крайние клонятся наружу дугой;
//   · стебель у земли красноватый, выше зелёный; листья очерёдные, по спирали, 5–8 на стебель;
//   · лист ДВАЖДЫ ТРОЙЧАТЫЙ: черешок → три веточки → на каждой 2–3 узких ланцетных листочка;
//     у каждого листочка своя длина (6–14 см), своя ширина (доля 0,17–0,36), свой изгиб, перегиб по
//     средней жилке и поворот; верхние листья мельче и проще;
//   · бутон — только на конце стебля (над листвой, на голой цветоножке) или на боковой цветоножке из
//     пазухи верхнего листа. Ни один бутон не висит отдельно: каждый сидит на своей ножке;
//   · проверка касаний: листочек, задевший чужой бутон, отводится или убирается; боковой бутон, севший
//     на чужой стебель или бутон, переставляется; стебли, чьи бутоны сошлись, строятся заново.
// Качание: у каждого стебля свой маятник (своя частота), ветер страницы и ПАЛЕЦ толкают их; листья
// и бутоны едут за своим стеблем (сдвиг в шейдере), кончики листочков чуть трепещут.
export function buildPeony(THREE, opt = {}) {
  let s = (opt.seed ?? 7) * 2654435761 >>> 0;
  const rnd = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const R = (a, b) => a + (b - a) * rnd();
  const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z), UP = V(0, 1, 0);
  const NS = 19;                                              // стеблей (сколько маятников в шейдере)

  // ---- буферы трёх материалов: стебли, листья, бутоны ----
  const mk = () => ({ p: [], n: [], c: [], uv: [], w: [], i: [] });
  const B = { stem: mk(), leaf: mk(), bud: mk() };
  const vert = (b, p, col, uv, w) => { b.p.push(p.x, p.y, p.z); b.c.push(col.r, col.g, col.b); b.uv.push(uv[0], uv[1]); b.w.push(...w); return b.p.length / 3 - 1; };
  const grid = (b, base, rows, cols) => {
    for (let r = 0; r < rows - 1; r++) for (let c = 0; c < cols - 1; c++) {
      const a = base + r * cols + c; b.i.push(a, a + 1, a + cols, a + 1, a + cols + 1, a + cols);
    }
  };
  const C = (hex) => new THREE.Color(hex);
  const mixC = (a, b, t) => a.clone().lerp(b, t);

  // ---- труба по точкам (стебель, черешок, цветоножка) ----
  function tube(pts, rad, cols, wts, stem, sides = 6) {
    if (pts.some(p => !Number.isFinite(p.x + p.y + p.z))) return;
    const b = B.stem, base = b.p.length / 3; let prevN = null, prevT = V(0, 1, 0);
    for (let j = 0; j < pts.length; j++) {
      let t = pts[Math.min(j + 1, pts.length - 1)].clone().sub(pts[Math.max(0, j - 1)]);
      t = t.lengthSq() > 1e-12 ? t.normalize() : prevT.clone(); prevT = t;   // совпавшие точки — берём прежнее направление
      let n = prevN ? prevN.clone().sub(t.clone().multiplyScalar(prevN.dot(t))) : null;
      if (!n || n.lengthSq() < 1e-8) n = V(1, 0, 0).cross(t).lengthSq() > 0.01 ? V(1, 0, 0).cross(t) : V(0, 0, 1).cross(t);
      n.normalize();
      prevN = n; const bn = t.clone().cross(n);
      for (let k = 0; k <= sides; k++) {
        const a = k / sides * Math.PI * 2, d = n.clone().multiplyScalar(Math.cos(a)).addScaledVector(bn, Math.sin(a));
        vert(b, pts[j].clone().addScaledVector(d, rad[j]), cols[j], [k / sides, j / (pts.length - 1)], [stem, wts[j], 0, 0]);
      }
    }
    grid(b, base, pts.length, sides + 1);
  }

  // ---- твёрдое для проверок ----
  const buds = [];                                            // { c, r, stem }
  const segs = [];                                            // { a, b, r, stem } — оси стеблей и ножек
  const segDist = (p, a, b) => { const ab = b.clone().sub(a), t = THREE.MathUtils.clamp(p.clone().sub(a).dot(ab) / ab.lengthSq(), 0, 1);
    return p.distanceTo(a.clone().addScaledVector(ab, t)); };
  const hitsBud = (p, pad, own = -1) => buds.some(q => q.stem !== own && p.distanceTo(q.c) < q.r + pad)
                                     || buds.some(q => q.stem === own && p.distanceTo(q.c) < q.r + pad * 0.5);
  const hitsStem = (p, pad, own) => segs.some(q => q.stem !== own && segDist(p, q.a, q.b) < q.r + pad);

  // ---- путь стебля: из корневища дугой наружу ----
  function stemPath(st) {
    const pts = [], n = 16; let p = st.base.clone();
    for (let j = 0; j <= n; j++) {
      const u = j / n, lean = st.lean0 + st.arch * Math.pow(u, 1.6);                     // к верху клонится сильнее
      const az = st.az + st.wander * Math.sin(u * 2.4 + st.ph);
      const d = V(Math.sin(lean) * Math.cos(az), Math.cos(lean), Math.sin(lean) * Math.sin(az));
      pts.push(p.clone()); p = p.clone().addScaledVector(d, st.L / n);
    }
    return pts;
  }
  const along = (pts, u) => { const f = u * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(f)), t = f - i;
    return { p: pts[i].clone().lerp(pts[i + 1], t), d: pts[i + 1].clone().sub(pts[i]).normalize() }; };

  // ---- стебли ----
  const stems = [];
  const RC = 0.16;                                            // радиус корневища, м
  for (let k = 0; k < NS; k++) {
    let st, ok = false;
    for (let tr = 0; tr < 14 && !ok; tr++) {
      const rr = RC * Math.sqrt(R(0.05, 1)), a = k / NS * Math.PI * 2 + R(-0.35, 0.35), out = rr / RC;
      st = { i: k, base: V(rr * Math.cos(a), -0.02, rr * Math.sin(a)), az: a + R(-0.4, 0.4),
             lean0: 0.08 + 0.5 * out * out + R(0, 0.14), arch: R(0.1, 0.4) * (0.5 + out),
             wander: R(-0.25, 0.25), ph: R(0, 6), L: (0.86 - 0.22 * out + R(-0.08, 0.05)) * (opt.height ?? 1),
             bloom: rnd() < 0.36, f: R(0.75, 1.25) };
      st.pts = stemPath(st);
      const top = st.pts[st.pts.length - 1];
      ok = top.y > 0.45 && stems.every(o => o.pts[o.pts.length - 1].distanceTo(top) > (st.bloom && o.bloom ? 0.09 : 0.05));
    }
    stems.push(st);
  }
  // красноватый низ стебля, зелёный верх (на фото — бордовые стебли у земли)
  const cStemLo = C('#6a2a22'), cStemHi = C('#5c8a3c'), cStemTop = C('#6f9a45');
  for (const st of stems) {
    const n = st.pts.length, rad = st.pts.map((_, j) => THREE.MathUtils.lerp(0.0055, 0.0034, j / (n - 1)) * R(0.95, 1.05));
    const cols = st.pts.map((_, j) => { const u = j / (n - 1); return u < 0.25 ? mixC(cStemLo, cStemHi, u / 0.25) : mixC(cStemHi, cStemTop, (u - 0.25) / 0.75); });
    tube(st.pts, rad, cols, st.pts.map((_, j) => (j / (n - 1)) ** 2), st.i, 6);
    for (let j = 0; j < n - 1; j++) segs.push({ a: st.pts[j], b: st.pts[j + 1], r: rad[j], stem: st.i });
  }

  // ---- бутоны: на конце стебля и на боковых ножках ----
  const cBud = C('#b3142e'), cBudDeep = C('#7a0a1e'), cSepal = C('#6f9645'), cSepalRed = C('#8a4a36');
  function bud(c, axis, r, stem, w, young) {
    const b = B.bud, base = b.p.length / 3, rows = 12, cols = 16;
    const a = axis.clone().normalize(), e1 = (Math.abs(a.y) < 0.9 ? V(0, 1, 0) : V(1, 0, 0)).cross(a).normalize(), e2 = a.clone().cross(e1);
    const ph = R(0, 6), lumps = Math.floor(R(4, 7));
    for (let i = 0; i < rows; i++) {
      const th = i / (rows - 1) * Math.PI;                    // 0 — макушка, π — основание
      for (let j = 0; j < cols; j++) {
        const fi = j / (cols - 1) * Math.PI * 2;
        // шар чуть приплюснут, по бокам — бугры лепестков; к основанию сужается в цветоложе
        const rr = r * (1 + 0.05 * Math.sin(lumps * fi + ph) * Math.sin(th)) * (th > 2.2 ? 1 - 0.35 * (th - 2.2) : 1);
        const d = a.clone().multiplyScalar(Math.cos(th) * 0.9).addScaledVector(e1, Math.sin(th) * Math.cos(fi)).addScaledVector(e2, Math.sin(th) * Math.sin(fi));
        const u = th / Math.PI;
        let col = young ? mixC(C('#c23a5a'), C('#9fbf6a'), THREE.MathUtils.smoothstep(u, 0.08, 0.38))
                        : mixC(cBud, cBudDeep, 0.35 * Math.max(0, Math.sin(lumps * fi + ph + 1.2)) + 0.25 * u);
        vert(b, c.clone().addScaledVector(d, rr), col, [fi / 6.283, u], [stem, w, 0, 0]);
      }
    }
    grid(b, base, rows, cols);
    // чашелистики: 4–5 выпуклых ладошек облегают низ бутона, зелёные с бурым краем
    const ns = Math.floor(R(4, 6));
    for (let q = 0; q < ns; q++) {
      const f0 = q / ns * Math.PI * 2 + R(-0.3, 0.3), wd = R(1.2, 1.6) * Math.PI / ns, top = young ? R(0.15, 0.35) : R(0.35, 0.55), base2 = b.p.length / 3;
      for (let i = 0; i < 6; i++) {
        const th = Math.PI * (1 - (1 - top) * i / 5);         // от основания вверх
        for (let j = 0; j < 5; j++) {
          const fi = f0 + (j / 4 - 0.5) * wd * (1 - 0.55 * (i / 5) ** 2), lift = 1.05 + 0.04 * (i / 5);
          const d = a.clone().multiplyScalar(Math.cos(th) * 0.9).addScaledVector(e1, Math.sin(th) * Math.cos(fi)).addScaledVector(e2, Math.sin(th) * Math.sin(fi));
          const edge = Math.abs(j / 4 - 0.5) * 2;
          vert(b, c.clone().addScaledVector(d, r * lift), mixC(cSepal, cSepalRed, 0.25 + 0.5 * edge * (i / 5)), [j / 4, i / 5], [stem, w, 0, 0]);
        }
      }
      grid(b, base2, 6, 5);
    }
  }

  // ---- листочек: ланцет с перегибом по жилке, дугой вниз, с поворотом ----
  const cLeaf = C('#4a7a32');
  function leaflet(base, dir, L, ratio, droop, twist, fold, tint, stem, w0, flut, test = true) {
    // 12 сечений вдоль, 7 поперёк: поперёк — желобок (края приподняты по параболе), вдоль — дуга вниз,
    // кромка чуть волнится; кончик оттянут, основание клином, у каждого листочка своя ширина
    const nL = 10, nW = 5, pts = [], nrms = [];
    let d = dir.clone().normalize(), side = d.clone().cross(UP); if (side.lengthSq() < 1e-4) side = V(1, 0, 0); side.normalize();
    let p = base.clone();
    const spine = [], wv = R(0, 6), wa = R(0.0004, 0.0012);
    for (let i = 0; i < nL; i++) {
      const t = i / (nL - 1);
      const dd = d.clone().applyAxisAngle(side, -droop * Math.pow(t, 1.3));
      const sd = side.clone().applyAxisAngle(dd, twist * t);
      spine.push({ p: p.clone(), d: dd, s: sd });
      p = p.clone().addScaledVector(dd, L / (nL - 1));
    }
    const W = L * ratio, peak = R(0.3, 0.45);
    for (let i = 0; i < nL; i++) {
      const t = i / (nL - 1);
      const prof = t < peak ? Math.pow(Math.sin(Math.PI / 2 * t / peak), 0.9) : Math.pow(Math.max(0, Math.cos(Math.PI / 2 * Math.min(1, (t - peak) / (1 - peak)))), 1.35);
      const hw = Math.max(0.0007, 0.5 * W * prof);              // кончик не в точку: иначе свет на нём ломается (чёрные точки)
      const nrm = spine[i].s.clone().cross(spine[i].d).normalize();
      for (let j = 0; j < nW; j++) {
        const u = j / (nW - 1) * 2 - 1;
        const wave = Math.abs(u) > 0.6 ? wa * Math.sin(t * 19 + wv + u) * Math.abs(u) : 0;
        pts.push(spine[i].p.clone().addScaledVector(spine[i].s, u * hw).addScaledVector(nrm, fold * u * u * hw + wave));
        nrms.push(nrm.clone().addScaledVector(spine[i].s, -2 * fold * u).normalize());   // нормаль желобка — по самой форме, не по сетке
      }
    }
    if (test) {                                               // test === 'own': свой бутон рядом можно, лишь бы не насквозь
      const own = test === 'own' ? stem : -1;
      for (let i = 3; i < pts.length; i += 3) if (pts[i].y < 0.015 || hitsBud(pts[i], own >= 0 ? 0.004 : 0.012, own) || hitsStem(pts[i], 0.003, stem)) return false;
    }
    const b = B.leaf, b0 = b.p.length / 3, ph = R(0, 6.28);
    for (let i = 0; i < nL; i++) for (let j = 0; j < nW; j++) {
      const t = i / (nL - 1), u = j / (nW - 1), edge = Math.abs(u - 0.5) * 2;
      const col = tint.clone().multiplyScalar(1 - 0.1 * edge + 0.08 * t);
      vert(b, pts[i * nW + j], col, [u, t], [stem, w0, flut * t * t, ph]); const nn = nrms[i * nW + j]; b.n.push(nn.x, nn.y, nn.z);
    }
    grid(b, b0, nL, nW);
    return true;
  }

  // ---- лист: черешок → три веточки → листочки ----
  function leaf(st, u, k, nLeaves) {
    const { p: node, d: sd } = along(st.pts, u), w0 = u * u;
    const big = 1 - 0.55 * (k / Math.max(1, nLeaves - 1)) + R(-0.08, 0.08);   // нижние крупнее
    const az = st.az + k * 2.4 + R(-0.5, 0.5);                                     // очерёдно, по спирали
    const out = V(Math.cos(az), 0, Math.sin(az));
    const elev = R(0.45, 1.05) * (0.6 + 0.45 * u);                                  // нижние почти плашмя
    let pd = out.clone().multiplyScalar(Math.cos(elev)).add(UP.clone().multiplyScalar(Math.sin(elev))).normalize();
    if (u > 0.97) pd = sd.clone().lerp(out, 0.7).normalize();                     // стебель без бутона кончается листом
    // черешок дугой: от стебля вверх-наружу, к концу опускается
    const pl = (0.035 + 0.1 * big * big) * R(0.8, 1.2), pts = [node.clone()], n = 6;
    let q = node.clone(), d = sd.clone().lerp(pd, 0.65).normalize();
    for (let j = 1; j <= n; j++) {
      d = d.clone().lerp(pd.clone().add(V(0, -0.35 * j / n, 0)).normalize(), 0.45).normalize();
      q = q.clone().addScaledVector(d, pl / n); pts.push(q);
    }
    const cP = mixC(cStemHi, C('#7a4a2e'), R(0, 0.35));
    tube(pts, pts.map((_, j) => THREE.MathUtils.lerp(0.0022, 0.0013, j / n)), pts.map(() => cP), pts.map(() => w0), st.i, 4);
    const end = pts[pts.length - 1], ed = d.clone().setY(d.y * 0.5).normalize();
    const side = ed.clone().cross(UP).normalize();
    const tint = cLeaf.clone().offsetHSL(R(-0.025, 0.03), R(-0.08, 0.06), R(-0.06, 0.07) + 0.05 * u);
    const L0 = (0.12 + 0.06 * big) * (opt.leaf ?? 1);
    const fol = (b0, dir, L) => {                                                  // листочек с подбором, чтобы ни во что не войти
      for (let tr = 0; tr < 4; tr++) {
        const dd = dir.clone().applyAxisAngle(UP, (tr ? R(-0.5, 0.5) : 0)).normalize();
        if (leaflet(b0, dd, L * (1 - 0.12 * tr), R(0.2, 0.32), R(0.25, 0.85) + 0.25 * tr, R(-0.3, 0.3), R(0.12, 0.3), tint, st.i, w0, 0.6 + 0.4 * big)) return;
      }
    };
    const simple = u > 0.72 || big < 0.45;
    if (simple) {                                                                  // верхние — три листочка из одной точки
      fol(end, ed, L0 * R(0.85, 1.1));
      fol(end, ed.clone().applyAxisAngle(UP, R(0.5, 0.9)), L0 * R(0.6, 0.85));
      if (rnd() < 0.8) fol(end, ed.clone().applyAxisAngle(UP, -R(0.5, 0.9)), L0 * R(0.6, 0.85));
      return;
    }
    // три веточки: средняя дальше, боковые в стороны; на каждой 2–3 листочка разной длины
    for (const sgn of [0, -1, 1]) {
      const bd = sgn === 0 ? ed.clone() : ed.clone().applyAxisAngle(UP, sgn * R(0.6, 1.0)).setY(ed.y - 0.1).normalize();
      const bl = (sgn === 0 ? R(0.03, 0.06) : R(0.015, 0.04)) * (0.7 + 0.5 * big);
      const b1 = end.clone().addScaledVector(bd, bl);
      tube([end, end.clone().lerp(b1, 0.5).add(V(0, 0.003, 0)), b1], [0.0013, 0.0011, 0.0009], [cP, cP, cP], [w0, w0, w0], st.i, 3);
      fol(b1, bd, L0 * (sgn === 0 ? R(0.9, 1.15) : R(0.75, 1.0)));
      fol(b1, bd.clone().applyAxisAngle(UP, R(0.45, 0.85)), L0 * R(0.55, 0.85));
      if (rnd() < (sgn === 0 ? 0.85 : 0.55)) fol(b1, bd.clone().applyAxisAngle(UP, -R(0.45, 0.85)), L0 * R(0.55, 0.85));
    }
  }

  // сперва все бутоны (чтобы листья их обходили), потом листья
  const sideBuds = [];
  for (const st of stems) {
    if (!st.bloom) continue;
    const top = st.pts[st.pts.length - 1], d = top.clone().sub(st.pts[st.pts.length - 2]).normalize(), r = R(0.017, 0.023);
    const c = top.clone().addScaledVector(d, r * 0.82);
    // чужой стебель проходит сквозь бутон или бутоны сошлись — этот стебель остаётся без цветка
    if (hitsStem(c, r + 0.004, st.i) || hitsBud(c, r + 0.01)) { st.bloom = false; continue; }
    buds.push({ c, r, stem: st.i, axis: d, w: 1, young: rnd() < 0.35 });
  }
  for (const st of stems) {                                   // боковые бутоны из пазух верхних листьев
    if (!st.bloom || rnd() > 0.45) continue;
    for (let m = 0, cnt = rnd() < 0.2 ? 2 : 1; m < cnt; m++) {
      for (let tr = 0; tr < 10; tr++) {
        const u = R(0.68, 0.84), { p: node, d: sd } = along(st.pts, u);
        const az = R(0, 6.28), out = V(Math.cos(az), 0, Math.sin(az)), len = R(0.06, 0.13), n = 5, pts = [node.clone()];
        let q = node.clone(), d = sd.clone().lerp(out, 0.55).normalize();
        for (let j = 1; j <= n; j++) { d = d.clone().lerp(UP, 0.18).normalize(); q = q.clone().addScaledVector(d, len / n); pts.push(q); }
        const r = R(0.008, 0.012), c = q.clone().addScaledVector(d, r * 0.8);
        if (hitsBud(c, r + 0.012) || hitsStem(c, r + 0.006, st.i) || pts.some(p => hitsBud(p, 0.006))) continue;
        sideBuds.push({ st, pts, w: u * u });
        buds.push({ c, r, stem: st.i, axis: d, w: u * u + 0.05, young: rnd() < 0.7 });
        for (let j = 0; j < n; j++) segs.push({ a: pts[j], b: pts[j + 1], r: 0.0018, stem: st.i });
        break;
      }
    }
  }
  for (const sb of sideBuds) tube(sb.pts, sb.pts.map((_, j) => THREE.MathUtils.lerp(0.0019, 0.0015, j / (sb.pts.length - 1))),
                                  sb.pts.map(() => cStemTop), sb.pts.map(() => sb.w), sb.st.i, 5);
  for (const q of buds) bud(q.c, q.axis, q.r, q.stem, q.w, q.young);
  for (const st of stems) {
    const nL = Math.floor(R(7, 9.99)), hi = st.bloom ? R(0.84, 0.9) : 1;
    for (let k = 0; k < nL; k++) leaf(st, Math.min(1, THREE.MathUtils.lerp(R(0.16, 0.24), hi, Math.pow(k / (nL - 1), 0.8)) + (k < nL - 1 ? R(-0.02, 0.02) : 0)), k, nL);
    // под бутоном — один-два узких прицветника (на фото у каждого бутона)
    if (st.bloom) {
      // прицветники: 2–3 узких листа сразу под бутоном, поднимаются к нему (на фото у каждого бутона)
      const { p } = along(st.pts, 0.965), a0 = R(0, 6.28);
      for (let m = 0, nb = rnd() < 0.5 ? 3 : 2; m < nb; m++) {
        const az = a0 + m * 6.28 / nb + R(-0.4, 0.4), dd = V(Math.cos(az), R(0.5, 1.1), Math.sin(az)).normalize();
        for (let tr = 0; tr < 5; tr++)
          if (leaflet(p, dd.clone().applyAxisAngle(UP, tr * 0.7).lerp(V(0, -0.3, 0), 0.1 * tr).normalize(), R(0.05, 0.09), R(0.12, 0.2), R(0.5, 1.0), R(-0.3, 0.3), 0.25,
                      cLeaf.clone().offsetHSL(0.01, 0, 0.04), st.i, 0.9, 0.5, 'own')) break;
      }
    }
  }

  // ---- геометрия, материалы, качание ----
  const sway = { uBend: { value: Array.from({ length: NS }, () => V()) }, uT: { value: 0 } };
  const swayify = (m, key) => {
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, sway);
      if (key === 'leaf') sh.fragmentShader = sh.fragmentShader.replace('#include <color_fragment>',
        '#include <color_fragment>\n if (!gl_FrontFacing) diffuseColor.rgb = diffuseColor.rgb * vec3(1.25, 1.3, 1.15) + vec3(0.02, 0.03, 0.02);');   // изнанка листа светлее, сизая
      sh.vertexShader = `attribute vec4 aW; uniform vec3 uBend[${NS}]; uniform float uT;\n` + sh.vertexShader.replace('#include <begin_vertex>',
        `#include <begin_vertex>
         { vec3 b = uBend[int(aW.x + 0.5)]; float w = aW.y;
           transformed += b * w; transformed.y -= dot(b.xz, b.xz) * w * 0.55;      // стебель гнётся — верх чуть опускается
           float f = aW.z; transformed += vec3(sin(uT * 3.1 + aW.w), 0.6 * sin(uT * 4.3 + aW.w * 1.7), cos(uT * 2.6 + aW.w)) * f * 0.0035; }`);
    };
    m.customProgramCacheKey = () => 'peony-' + key;
  };
  const leafTex = (() => {                                    // средняя жилка светлее, боковые жилки еле видны
    const cv = document.createElement('canvas'); cv.width = 64; cv.height = 256; const g = cv.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 64, 0); gr.addColorStop(0, '#c9d2bf'); gr.addColorStop(0.42, '#f4f6ef'); gr.addColorStop(0.5, '#ffffff');
    gr.addColorStop(0.58, '#f4f6ef'); gr.addColorStop(1, '#c9d2bf'); g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
    g.strokeStyle = 'rgba(255,255,230,0.9)'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(32, 0); g.lineTo(32, 256); g.stroke();
    g.strokeStyle = 'rgba(255,255,235,0.35)'; g.lineWidth = 1;
    for (let y = 18; y < 250; y += 17) { g.beginPath(); g.moveTo(32, y); g.quadraticCurveTo(46, y + 12, 62, y + 26); g.moveTo(32, y); g.quadraticCurveTo(18, y + 12, 2, y + 26); g.stroke(); }
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
  })();
  const geo = b => { const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(b.p, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(b.c, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2)); g.setAttribute('aW', new THREE.Float32BufferAttribute(b.w, 4));
    g.setIndex(b.i); if (b.n.length) g.setAttribute('normal', new THREE.Float32BufferAttribute(b.n, 3)); else g.computeVertexNormals(); return g; };
  const group = new THREE.Group(); group.name = 'куст';
  const mats = {
    stem: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6 }),
    leaf: new THREE.MeshStandardMaterial({ vertexColors: true, map: leafTex, roughness: 0.38, side: THREE.DoubleSide }),
    bud: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, side: THREE.DoubleSide }),
  };
  let tris = 0;
  for (const k of ['stem', 'leaf', 'bud']) {
    const m = mats[k]; if (opt.env) { m.envMap = opt.env; m.envMapIntensity = 0.5; } swayify(m, k);
    const dm = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking }); swayify(dm, 'd-' + k);
    const mesh = new THREE.Mesh(geo(B[k]), m); mesh.customDepthMaterial = dm; mesh.castShadow = mesh.receiveShadow = true;
    mesh.frustumCulled = false; group.add(mesh); tris += B[k].i.length / 3;
  }

  // ---- маятники стеблей ----
  const S = stems.map(st => ({ x: 0, z: 0, vx: 0, vz: 0, w: 2 * Math.PI * st.f, top: st.pts[st.pts.length - 1].clone(), L: st.L }));
  const inv = new THREE.Matrix4(), _o = V(), _d = V(), _m = V(), _p = V();
  return {
    group, stems: stems.length, buds: buds.length, tris,
    // ветер: wind(x) — порыв страницы вдоль z (мир); dt — шаг, t — часы
    step(dt, t, wind) {
      dt = Math.min(dt, 0.05); sway.uT.value = t;
      group.updateMatrixWorld(); const e = group.matrixWorld.elements;
      for (let k = 0; k < S.length; k++) {
        const q = S[k]; _p.copy(q.top).applyMatrix4(group.matrixWorld);
        const g = wind ? wind(_p.x) : 0;                         // порыв в мире вдоль z → в куст
        const fx = g * e[8] * 0.05, fz = g * e[10] * 0.05;      // столбец z матрицы: куда в кусте смотрит мировой z
        const k2 = q.w * q.w, c = 2 * 0.16 * q.w;
        q.vx += (-k2 * q.x - c * q.vx + fx * k2) * dt; q.vz += (-k2 * q.z - c * q.vz + fz * k2) * dt;
        const lim = 0.22 * q.L, a = Math.hypot(q.x, q.z); if (a > lim) { q.x *= lim / a; q.z *= lim / a; }
        q.x += q.vx * dt; q.z += q.vz * dt;
        sway.uBend.value[k].set(q.x, 0, q.z);
      }
    },
    // палец провёл по кусту: ray — луч взгляда через палец (мир), move — ход пальца в мире за событие, м
    poke(ray, move) {
      inv.copy(group.matrixWorld).invert();
      _o.copy(ray.origin).applyMatrix4(inv); _d.copy(ray.direction).transformDirection(inv);
      _m.copy(move).transformDirection(inv).multiplyScalar(move.length());
      let any = false;
      for (let k = 0; k < S.length; k++) {
        const pts = stems[k].pts;
        for (let j = 6; j < pts.length; j += 2) {
          const p = pts[j]; _p.copy(p).sub(_o); const tt = _p.dot(_d); if (tt < 0) continue;
          const dist = _p.addScaledVector(_d, -tt).length(), Rr = 0.09;
          if (dist < Rr) { const f = (1 - dist / Rr) * (j / (pts.length - 1)); S[k].vx += _m.x * 26 * f; S[k].vz += _m.z * 26 * f; any = true; break; }
        }
      }
      return any;
    },
  };
}
