// РАМА «33 СЛЁЗ» — объёмным чертежом (её решение 1 нояб.: «однозначно оставляем нашим объёмным чертежом»).
// Профиль — классический карниз с сухариками и иониками, повёрнутый в раму: карниз снизу вверх — сухарики, ионик,
// слезник с полочкой, сима — в раме идёт от работы наружу. Сухарики заходят на работу зубцами (её рисунок 1 нояб.),
// яйца ионика — над промежутками между ними (точки на рисунке).
// 1 НОЯБ., ВТОРОЙ ЗАХОД (её слово: «раму в полтора раза шире, посмотри, как по пропорциям сделать хорошо»; «на углах
// лишние сухарики и недоионики»):
//  · СУХАРИКИ — точно по Витрувию (кн. III, 5): высота : лицо : промежуток = 6 : 3 : 2 → 30 : 15 : 10 мм, шаг 25.
//    Шаг 25 — единственный в этом размере, при котором сухарики сходятся на углах без обрезков у работы 500 и 700:
//    в каждом углу — один квадратный угловой сухарик 20 × 20 («двойной сухарик» на углу, как у Виньолы), от него —
//    обычный промежуток, и по сторонам ровно 18 и 26 сухариков. Всё — в целых миллиметрах.
//  · ИОНИК: яйца только целые, над промежутками; ряд идёт до самого угла — у уса по яйцу с каждой стороны,
//    между ними по усу стрелка-лист. Убрано только яйцо, которое ус резал пополам («недоионик»).
//  · ШИРЕ В ПОЛТОРА РАЗА — по образцу рамы «кассеты»: внутренняя группа (сухарики, ионик), широкий гладкий фриз
//    чуть утоплен, наружная группа (слезник с полочкой, сима). Слезник с полочкой — в высоту сухариков (Витрувий),
//    полочка — шестая часть, сима на восьмую выше слезника. Ширина от зубцов до наружного края — 150 мм (было 101).
// Начало — середина работы, тыл рамы — z = 0, лицо — к +z. Миллиметры внутри, наружу — метры.

const TOOTH = { len: 20, w: 15, gap: 10, z0: 11, z1: 24 }, STEP = TOOTH.w + TOOTH.gap;
// РАСКЛАДКА ПОД РАЗМЕР РАБОТЫ (1 нояб., «Фрагменты» 76 × 116): угловой сухарик C × C подбирается так, чтобы на обеих
// сторонах сухарики сходились без обрезков при том же шаге 25 и промежутке 10. Для 50 × 70 — C = 20 (как было),
// для 76 × 116 — C = 25. Яйца ионика — над промежутками: первый промежуток с центром в C + 5, дальше через 25.
let LAY = { C: 20, phase: 0 };
function layout(W, H) {
  for (const d of [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6, 7, -7, 8, -8, 9, -9, 10, -10, 11, -11, 12, -12]) {
    const C = TOOTH.len + d, ok = L => Math.abs(((L - TOOTH.gap - 2 * C) / STEP) - Math.round((L - TOOTH.gap - 2 * C) / STEP)) < 1e-6;
    if (ok(W) && ok(H)) return { C, phase: (C + TOOTH.gap / 2) % STEP };
  }
  return { C: TOOTH.len, phase: 0 };    // не сошлось ни при каком — как раньше
}
// r — от края работы наружу, z — над тылом рамы (мм)
const seg = (r0, z0, r1, z1) => [[r0, z0], [r1, z1]];
const arcPts = (cr, cz, R, a0, a1, n) => Array.from({ length: n + 1 }, (_, i) => {
  const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; return [cr + R * Math.cos(a), cz + R * Math.sin(a)]; });
export const PROFILE = {
  OUT: 130,                                                             // наружный край — 130 мм от работы
  plain: [
    seg(130, 0, 0, 0),                                                  // тыл
    seg(0, 0, 0, 24),                                                   // стенка у работы (видна в промежутках)
    seg(0, 24, 10, 24),                                                 // верх ряда сухариков (сплошная часть, 10 мм)
    seg(10, 24, 10, 25), seg(10, 25, 14, 25),                           // поясок
    // ионик — четверть круга R 22: (14, 25) → (36, 47); режется яйцами отдельно
    seg(36, 47, 40, 47),                                                // поясок
    seg(40, 47, 40, 40), seg(40, 40, 65, 40), seg(65, 40, 65, 50),      // фриз — гладкий, утоплен
    seg(65, 50, 90, 50),                                                // слезник
    arcPts(90, 53, 3, -90, 0, 6), seg(93, 53, 95, 53),                  // его полочка — каблучок
    Array.from({ length: 29 }, (_, i) => { const t = i / 28; return [95 + 28 * t, 53 + 11 * (1 - Math.cos(Math.PI * t)) / 2]; }),   // сима
    seg(123, 64, 130, 64),                                              // верхний поясок
    seg(130, 64, 130, 0),                                               // наружная стенка
  ],
  OVOLO: { cr: 36, cz: 25, R: 22 },
};

function sides(W, Hh) {                              // от угла c вдоль e, наружу n
  return [
    { c: [-W / 2, -Hh / 2], e: [1, 0], n: [0, -1], L: W },
    { c: [W / 2, -Hh / 2], e: [0, 1], n: [1, 0], L: Hh },
    { c: [W / 2, Hh / 2], e: [-1, 0], n: [0, 1], L: W },
    { c: [-W / 2, Hh / 2], e: [0, -1], n: [-1, 0], L: Hh },
  ];
}
const at = (sd, s, r, z) => [sd.c[0] + sd.e[0] * s + sd.n[0] * r, sd.c[1] + sd.e[1] * s + sd.n[1] * r, z];

export function frameGeometry(THREE, W, Hh) {
  LAY = layout(W, Hh);
  const S = sides(W, Hh), P = PROFILE;
  const pos = [], nrm = [], idx = [];
  for (const sd of S) for (const pl of P.plain) {
    const base = pos.length / 3;
    for (let i = 0; i < pl.length; i++) {
      const [r, z] = pl[i], a = pl[Math.max(0, i - 1)], b = pl[Math.min(pl.length - 1, i + 1)];
      const dr = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dr, dz) || 1, nr = -dz / l, nz = dr / l;
      for (const s of [-r, sd.L + r]) { pos.push(...at(sd, s, r, z)); nrm.push(sd.n[0] * nr, sd.n[1] * nr, nz); }   // на ус
    }
    for (let i = 0; i < pl.length - 1; i++) { const a = base + 2 * i; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  orient(pos, nrm, idx);
  const plain = mk(THREE, pos, nrm, idx);
  // ИОНИК
  const O = P.OVOLO, op = [], on = [], ob = [], oi = [], NT = 20;
  for (const sd of S) {
    const base = op.length / 3, NS = Math.ceil((sd.L + 2 * O.cr) / 0.8);
    for (let j = 0; j <= NS; j++) for (let i = 0; i <= NT; i++) {
      const t = i / NT, r = O.cr - O.R * Math.cos(t * Math.PI / 2);
      const s = -r + (j / NS) * (sd.L + 2 * r);
      const q = ovoloAt(sd, s, t, 0); op.push(...q.p); on.push(...q.n);
      ob.push(...at(sd, s, r, O.cz + O.R * Math.sin(t * Math.PI / 2)));      // та же точка без яиц — для сетки
    }
    for (let j = 0; j < NS; j++) for (let i = 0; i < NT; i++) { const a = base + j * (NT + 1) + i, b = a + NT + 1; oi.push(a, b, a + 1, a + 1, b, b + 1); }
  }
  orient(op, on, oi);
  const ovolo = new THREE.BufferGeometry();
  ovolo.setAttribute('position', new THREE.Float32BufferAttribute(op, 3)); ovolo.setIndex(oi); ovolo.computeVertexNormals();
  // миллиметровка ложится по гладкой четверти круга, а не по яйцам: иначе сантиметровая линия виляла по ним швом
  ovolo.setAttribute('basePos', new THREE.Float32BufferAttribute(ob, 3)); ovolo.setAttribute('baseNrm', new THREE.Float32BufferAttribute(on, 3));
  // рисунок ионика чистыми линиями: яйцо, скорлупа, стрелки между яйцами; на углу — стрелка-лист по усу
  const lp = [];
  for (const sd of S) {
    const N = Math.round((sd.L - 2 * LAY.phase) / STEP), P0 = LAY.phase;
    const loop = (sc, ka, kb) => {
      let prev = null;
      for (let i = 0; i <= 48; i++) {
        const th = 2 * Math.PI * i / 48, cur = ovoloAt(sd, sc + ka * Math.cos(th) * STEP / 2, (kb * Math.sin(th) + 1) / 2, 0.35).p;
        if (prev) lp.push(...prev, ...cur); prev = cur;
      }
    };
    for (let j = 0; j <= N; j++) { loop(P0 + j * STEP, 0.62, 0.78); loop(P0 + j * STEP, 0.62 * 1.22, 0.78 * 1.22); }
    for (let j = 0; j < N; j++) { const sdart = P0 + (j + 0.5) * STEP;
      for (let i = 0; i < 6; i++) lp.push(...ovoloAt(sd, sdart, 0.2 + 0.1 * i, 0.35).p, ...ovoloAt(sd, sdart, 0.3 + 0.1 * i, 0.35).p); }
    for (let i = 0; i < 10; i++) {                   // ус угла: лист — у начала стороны (каждый угол рисуется один раз)
      const t0 = 0.05 + 0.09 * i, t1 = t0 + 0.09, r0 = O.cr - O.R * Math.cos(t0 * Math.PI / 2), r1 = O.cr - O.R * Math.cos(t1 * Math.PI / 2);
      lp.push(...ovoloAt(sd, -r0, t0, 0.35).p, ...ovoloAt(sd, -r1, t1, 0.35).p);
    }
  }
  const ovoloLines = new THREE.BufferGeometry(); ovoloLines.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
  // СУХАРИКИ: 15 × 20 мм над работой, высотой от 11 до 24 мм над тылом (лист — на 9 мм); от углового — промежуток 10
  const boxes = [];
  S.forEach((sd, k) => {
    const CORNER = LAY.C, vert = k % 2 === 1, n = Math.round((sd.L - 2 * CORNER - TOOTH.gap) / STEP), zc = (TOOTH.z0 + TOOTH.z1) / 2;
    for (let m = 0; m < n; m++) {
      const s = CORNER + TOOTH.gap + TOOTH.w / 2 + STEP * m;
      const g = new THREE.BoxGeometry(vert ? TOOTH.len : TOOTH.w, vert ? TOOTH.w : TOOTH.len, TOOTH.z1 - TOOTH.z0);
      g.translate(...at(sd, s, -TOOTH.len / 2, zc)); boxes.push(g.toNonIndexed());
    }
    const c = new THREE.BoxGeometry(CORNER, CORNER, TOOTH.z1 - TOOTH.z0);   // угловой «двойной» сухарик
    c.translate(...at(sd, CORNER / 2, -CORNER / 2, zc)); boxes.push(c.toNonIndexed());
  });
  const teeth = merge(THREE, boxes);
  return { plain, ovolo, teeth, ovoloLines, Wo: W + 2 * P.OUT, Ho: Hh + 2 * P.OUT };
}
// ОВАЛЬНАЯ И КРУГЛАЯ РАМА (её слово 31 окт: «для двух ваз сделай такие овальные рамы»; глаз — «как роза на храмах»).
// Тот же профиль, обведённый по эллипсу с полуосями a × b (мм, проём); ks — масштаб профиля (малой работе — уже рама).
// Углов нет, поэтому раскладка проще прямой: сухарики идут по кругу ровным шагом — число целое, шаг подогнан
// к длине (≈ 25·ks), яйца ионика — над каждым промежутком, стрелки — над сухариками.
export function ovalGeometry(THREE, a, b, ks = 1) {
  // эллипс по длине дуги: s = 0 — внизу, дальше против часовой (низ → право → верх → лево, как перо у прямой рамы)
  const NT0 = 4096, th = [], len = [0];
  for (let i = 0; i <= NT0; i++) th.push(-Math.PI / 2 + 2 * Math.PI * i / NT0);
  for (let i = 1; i <= NT0; i++) len.push(len[i - 1] + Math.hypot(a * (Math.cos(th[i]) - Math.cos(th[i - 1])), b * (Math.sin(th[i]) - Math.sin(th[i - 1]))));
  const L = len[NT0];
  const thetaAt = s => { s = ((s % L) + L) % L; let lo = 0, hi = NT0; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (len[m] <= s) lo = m; else hi = m; }
    return th[lo] + (th[hi] - th[lo]) * (s - len[lo]) / (len[hi] - len[lo] || 1); };
  const frameAt = s => { const t = thetaAt(s), c = Math.cos(t), sn = Math.sin(t), nl = Math.hypot(b * c, a * sn);
    return { x: a * c, y: b * sn, nx: b * c / nl, ny: a * sn / nl }; };
  const at = (s, r, z) => { const f = frameAt(s); return [f.x + f.nx * r, f.y + f.ny * r, z]; };
  const P = PROFILE, O = { cr: P.OVOLO.cr * ks, cz: P.OVOLO.cz * ks, R: P.OVOLO.R * ks };
  const n = Math.max(8, Math.round(L / (STEP * ks))), sp = L / n;          // сухариков по кругу и их шаг
  const M = Math.max(96, Math.round(L / (6 * ks)));                         // кольцо профиля — отрезками по ~6 мм
  // гладкий профиль
  const pos = [], nrm = [], idx = [];
  for (const pl of P.plain) {
    const base = pos.length / 3;
    for (let k = 0; k <= M; k++) {
      const f = frameAt(k / M * L);
      for (let i = 0; i < pl.length; i++) {
        const [r0, z0] = pl[i], A = pl[Math.max(0, i - 1)], B = pl[Math.min(pl.length - 1, i + 1)];
        const dr = B[0] - A[0], dz = B[1] - A[1], l = Math.hypot(dr, dz) || 1, nr = -dz / l, nz = dr / l;
        pos.push(f.x + f.nx * r0 * ks, f.y + f.ny * r0 * ks, z0 * ks); nrm.push(f.nx * nr, f.ny * nr, nz);
      }
    }
    const np = pl.length;
    for (let k = 0; k < M; k++) for (let i = 0; i < np - 1; i++) { const q = base + k * np + i, w = q + np; idx.push(q, w, q + 1, q + 1, w, w + 1); }
  }
  orient(pos, nrm, idx);
  const plain = mk(THREE, pos, nrm, idx);
  // ионик с яйцами над промежутками
  const egg = (s, t) => {
    const j = Math.floor(s / sp), c = (j + 0.5) * sp, A = (s - c) / (sp / 2), B2 = 2 * t - 1;
    let d = 0; const e = (A / 0.62) ** 2 + (B2 / 0.78) ** 2;
    if (e < 1) d = 1.7 * Math.sqrt(1 - e); else if (e < 1.5) d = -1.1 * Math.sin(Math.PI * (e - 1) / 0.5);
    if (Math.abs(A) > 0.86) d = Math.max(d, 0.9 * (1 - Math.abs(B2)) * (Math.abs(A) - 0.86) / 0.14);
    return d * Math.min(1, t / 0.08, (1 - t) / 0.08);
  };
  const ovAt = (s, t, lift) => {
    const ang = (180 - 90 * t) * Math.PI / 180, nr = Math.cos(ang), nz = Math.sin(ang), d = (egg(s, t) + lift) * ks;
    const f = frameAt(s), r = O.cr + O.R * nr + nr * d;
    return { p: [f.x + f.nx * r, f.y + f.ny * r, O.cz + O.R * nz + nz * d], n: [f.nx * nr, f.ny * nr, nz], b: [f.x + f.nx * (O.cr + O.R * nr), f.y + f.ny * (O.cr + O.R * nr), O.cz + O.R * nz] };
  };
  const op = [], on = [], ob = [], oi = [], NTt = 20, NS = Math.max(200, Math.round(L / (1.2 * ks)));
  for (let j = 0; j <= NS; j++) for (let i = 0; i <= NTt; i++) { const q = ovAt(j / NS * L, i / NTt, 0); op.push(...q.p); on.push(...q.n); ob.push(...q.b); }
  for (let j = 0; j < NS; j++) for (let i = 0; i < NTt; i++) { const q = j * (NTt + 1) + i, w = q + NTt + 1; oi.push(q, w, q + 1, q + 1, w, w + 1); }
  orient(op, on, oi);
  const ovolo = new THREE.BufferGeometry();
  ovolo.setAttribute('position', new THREE.Float32BufferAttribute(op, 3)); ovolo.setIndex(oi); ovolo.computeVertexNormals();
  ovolo.setAttribute('basePos', new THREE.Float32BufferAttribute(ob, 3)); ovolo.setAttribute('baseNrm', new THREE.Float32BufferAttribute(on, 3));
  const lp = [];
  for (let j = 0; j < n; j++) {
    const c = (j + 0.5) * sp;
    for (const k of [1, 1.22]) { let prev = null;
      for (let i = 0; i <= 48; i++) { const t2 = 2 * Math.PI * i / 48, cur = ovAt(c + 0.62 * k * Math.cos(t2) * sp / 2, (0.78 * k * Math.sin(t2) + 1) / 2, 0.35).p;
        if (prev) lp.push(...prev, ...cur); prev = cur; } }
    for (let i = 0; i < 6; i++) lp.push(...ovAt(j * sp, 0.2 + 0.1 * i, 0.35).p, ...ovAt(j * sp, 0.3 + 0.1 * i, 0.35).p);
  }
  const ovoloLines = new THREE.BufferGeometry(); ovoloLines.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
  // сухарики: лицо 15 : промежуток 10 того же шага, над работой на 20, высота 11…24 — всё × ks
  const boxes = [], tw = TOOTH.w / STEP * sp, tl = TOOTH.len * ks, zc = (TOOTH.z0 + TOOTH.z1) / 2 * ks;
  for (let m = 0; m < n; m++) {
    const f = frameAt(m * sp), g = new THREE.BoxGeometry(tw, tl, (TOOTH.z1 - TOOTH.z0) * ks);
    g.rotateZ(Math.atan2(f.ny, f.nx) - Math.PI / 2); g.translate(...at(m * sp, -tl / 2, zc)); boxes.push(g.toNonIndexed());
  }
  const teeth = merge(THREE, boxes);
  const OUT = P.OUT * ks;
  // перо: доля обхода от низа против часовой и насколько точка снаружи проёма (0…1 ширины рамы)
  const pen = (x, y) => { const t = Math.atan2(y / b, x / a); return [(((t + Math.PI / 2) / (2 * Math.PI)) % 1 + 1) % 1, (Math.hypot(x / a, y / b) - 1) * (a + b) / 2 / OUT]; };
  return { plain, ovolo, teeth, ovoloLines, Wo: 2 * (a + OUT), Ho: 2 * (b + OUT), oval: true, pen };
}
// точка ионика: s — вдоль стороны, t — поперёк (0 — у сухариков, 1 — у фриза); lift — над поверхностью, мм.
// Яйца — над промежутками сухариков (s = 25, 50 … L − 25) и по одному у самого угла (s = 0 и L) — оно целое,
// до уса остаётся место; на усу — лист-стрелка. Лишним было только яйцо, разрезанное усом (её слово 1 нояб.).
function ovoloAt(sd, s, t, lift) {
  const O = PROFILE.OVOLO, ang = (180 - 90 * t) * Math.PI / 180, nr = Math.cos(ang), nz = Math.sin(ang);
  const r = O.cr + O.R * nr, z = O.cz + O.R * nz, P0 = LAY.phase, N = Math.round((sd.L - 2 * P0) / STEP);
  const j = Math.round((s - P0) / STEP), a = (s - P0 - STEP * j) / (STEP / 2), b = 2 * t - 1;
  let d = 0;
  if (j >= 0 && j <= N) {
    const e = (a / 0.62) ** 2 + (b / 0.78) ** 2;
    if (e < 1) d = 1.7 * Math.sqrt(1 - e);                                // яйцо
    else if (e < 1.5) d = -1.1 * Math.sin(Math.PI * (e - 1) / 0.5);        // жёлобок скорлупы
  }
  if (Math.abs(a) > 0.86 && s > 0 && s < sd.L) d = Math.max(d, 0.9 * (1 - Math.abs(b)) * (Math.abs(a) - 0.86) / 0.14);   // стрелка
  const dm = Math.min(s + r, sd.L + r - s);                                // до уса
  d = Math.max(d, 1.2 * (1 - Math.abs(b)) * Math.max(0, 1 - dm / 3));      // лист по усу
  d = d * Math.min(1, t / 0.08, (1 - t) / 0.08) + lift;
  return { p: at(sd, s, r + nr * d, z + nz * d), n: [sd.n[0] * nr, sd.n[1] * nr, nz] };
}
function mk(THREE, pos, nrm, idx) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  g.setIndex(idx); return g;
}
function orient(p, n, ix) {                         // треугольники — лицом туда, куда смотрит нормаль профиля
  for (let t = 0; t < ix.length; t += 3) {
    const [a, b, c] = [ix[t], ix[t + 1], ix[t + 2]];
    const ux = p[3 * b] - p[3 * a], uy = p[3 * b + 1] - p[3 * a + 1], uz = p[3 * b + 2] - p[3 * a + 2];
    const vx = p[3 * c] - p[3 * a], vy = p[3 * c + 1] - p[3 * a + 1], vz = p[3 * c + 2] - p[3 * a + 2];
    const gx = uy * vz - uz * vy, gy = uz * vx - ux * vz, gz = ux * vy - uy * vx;
    if (gx * (n[3 * a] + n[3 * b] + n[3 * c]) + gy * (n[3 * a + 1] + n[3 * b + 1] + n[3 * c + 1]) + gz * (n[3 * a + 2] + n[3 * b + 2] + n[3 * c + 2]) < 0) {
      ix[t + 1] = c; ix[t + 2] = b;
    }
  }
}
function merge(THREE, list) {
  let n = 0; for (const g of list) n += g.attributes.position.count;
  const pos = new Float32Array(n * 3), nrm = new Float32Array(n * 3); let o = 0;
  for (const g of list) { pos.set(g.attributes.position.array, o * 3); nrm.set(g.attributes.normal.array, o * 3); o += g.attributes.position.count; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  return g;
}

export function buildFrame(THREE, { workW, workH, mode = 'drawing', envMap = null, glow, fade, far = 0.4, gridGain = 1, oval = false, ks = 1, veil = null, veilA = 0 }) {
  // oval — проём эллипсом workW × workH (диаметры), ks — масштаб профиля
  const G = oval ? ovalGeometry(THREE, workW * 500, workH * 500, ks) : frameGeometry(THREE, workW * 1000, workH * 1000);
  const group = new THREE.Group(); group.name = 'рама';
  const inner = new THREE.Group(); inner.scale.setScalar(0.001); group.add(inner);
  const parts = [G.plain, G.ovolo, G.teeth];
  if (mode !== 'drawing') {
    const mat = new THREE.MeshPhysicalMaterial({ color: mode === 'whitegold' ? '#e7e4dc' : '#e8b85c', metalness: 1,
      roughness: mode === 'whitegold' ? 0.22 : 0.25, envMap, envMapIntensity: 1.0, side: THREE.DoubleSide, transparent: true });
    mat.onBeforeCompile = sh => { sh.uniforms.uFade = fade;
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uFade;')
        .replace('#include <dithering_fragment>', '#include <dithering_fragment>\n  gl_FragColor.rgb = min(gl_FragColor.rgb, vec3(.9)); gl_FragColor.a *= uFade;'); };
    for (const g of parts) inner.add(new THREE.Mesh(g, mat));
    return { group, Wo: G.Wo / 1000, Ho: G.Ho / 1000 };
  }
  // РАМА РИСУЕТСЯ, КАК КУБ (её слово 1 нояб.: «рамку будешь так же чертежом появлять, картину — плавно»).
  // Свои часы uDraw — секунды от начала: наружный контур тянется пером по сторонам, за ним кольца профиля внутрь,
  // потом сухарики и ионик; как контур замкнулся — тело становится непрозрачным для мира за ним; последней —
  // миллиметровка: сантиметры, пять миллиметров, миллиметры, каждая линия в своё мгновение, как на гранях куба.
  const draw = { value: 0 };
  const DRAW = { body: 0.6, done: 2.4 };   // контур замкнулся — тело непрозрачно; к 2,4 с нарисовано всё
  // тело чуть отодвинуто в глубину (на несколько единиц буфера), чтобы своя сетка и свои линии всегда были перед ним
  const hide = new THREE.MeshBasicMaterial({ colorWrite: false, side: THREE.DoubleSide,
    polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 8 });
  const grid = new THREE.ShaderMaterial({
    uniforms: { uGlow: { value: glow }, uDraw: draw, uFar: { value: far }, uGrid: { value: gridGain } },   // uGrid — сила миллиметровки (для видео ярче)
    // положение считается так же, как у невидимого тела (MeshBasicMaterial), — иначе глубина расходится в последних
    // знаках и сетка на гранях, смотрящих прямо в глаз, пропадает пятнами (так и было до 1 нояб., версия 19)
    vertexShader: `attribute vec3 basePos, baseNrm; varying vec3 vP, vN;
void main() { vP = (modelMatrix * vec4(basePos, 1.)).xyz * 1000.; vN = normalize(mat3(modelMatrix) * baseNrm);
  vec4 mv = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uGlow; uniform float uDraw, uFar, uGrid; varying vec3 vP, vN;
float hash(float k) { return fract(sin(k * 12.9898 + 78.233) * 43758.5453); }
// семейство линий через s мм; t0 — когда начинает появляться, sp — за сколько секунд появятся все (в случайном порядке)
float fam(float x, float s, float w, float t0, float sp, float seed) {
  float g = max(fwidth(x), 1e-4), spx = s / g, k = floor(x / s + .5), d = abs(x - s * k) / g;
  float wv = max(w / g, 1.2), cov = (w / g) / wv * (1. - smoothstep(0., wv, d));
  float a = clamp((uDraw - t0 - hash(k + seed) * sp) / .15, 0., 1.), full = clamp((uDraw - t0) / (sp + .15), 0., 1.);
  return mix(cov * a, w / s * uFar * full, smoothstep(6., 2.5, spx));   // издали — тише среднего: рама читается линиями
}
float mm(float x, float seed) { return .12 * fam(x, 1., .1, 1.55, .6, seed) + .3 * fam(x, 5., .15, 1.25, .5, seed) + .65 * fam(x, 10., .3, .95, .45, seed); }
void main() {
  // миллиметры мира: на поверхности — следы плоскостей x, y, z = целый мм. Семейство гаснет там, где поверхность ему
  // параллельна. Раньше на кривых (ионик, сима) сетка бралась с одной из трёх сторон и на 45° перескакивала —
  // миллиметры там не сходились; теперь каждая линия — та же, что в мире, и переходит с грани на грань без скачка.
  vec3 k = 1. - smoothstep(.8, .97, abs(normalize(vN)));
  float e = k.x * mm(vP.x, 0.) + k.y * mm(vP.y, 1000.5) + k.z * mm(vP.z, 2000.5);
  float lit = .75 + .35 * max(dot(vN, normalize(vec3(.35, 1., .6))), 0.);   // грани профиля — разного тона
  gl_FragColor = vec4(uGlow * (e * .3 * uGrid + .03 * smoothstep(${DRAW.body.toFixed(2)}, ${(DRAW.body + 0.4).toFixed(2)}, uDraw)) * lit, 1.);
}`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4,
  });
  // линии гаснут, когда мельче глаза: сколько мм в пикселе — по fwidth положения. Контур рамы издали остаётся
  // (floor), а сухарики и яйца уходят совсем — иначе в изометрии сотни линий складывались в светлое пятно.
  // aT — мгновение, когда перо доходит до этой точки линии: точка видна, когда uDraw его прошёл.
  const edgeMat = (floor) => new THREE.ShaderMaterial({
    uniforms: { uGlow: { value: glow }, uDraw: draw, uFloor: { value: floor } },
    vertexShader: `attribute float aT; varying vec3 vP; varying float vT;
void main() { vP = (modelMatrix * vec4(position, 1.)).xyz * 1000.; vT = aT; vec4 mv = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uGlow; uniform float uDraw, uFloor; varying vec3 vP; varying float vT;
void main() { float k = mix(uFloor, 1., smoothstep(6., 1.5, length(fwidth(vP)))), on = clamp((uDraw - vT) / .04, 0., 1.);
  if (on <= 0.) discard; gl_FragColor = vec4(uGlow * .62 * k * on, 1.); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const edgeOuter = edgeMat(0.45), edgeDetail = edgeMat(0);
  // порядок пера: сторона — по усам (середина отрезка решает, чья она), u — от начала стороны до конца (0…1),
  // r — насколько точка снаружи от края работы. Перо обходит раму от левого нижнего угла, как куб рисуется снизу.
  const W = workW * 1000, H = workH * 1000;
  const penTimes = (geo, kind) => {
    const p = geo.attributes.position.array, n = p.length / 3, T = new Float32Array(n);
    const sideOf = (x, y) => (Math.abs(y) - H / 2 >= Math.abs(x) - W / 2) ? (y < 0 ? 0 : 2) : (x > 0 ? 1 : 3);
    const su = (sd, x, y) => {             // [u вдоль стороны, r наружу]
      const L = sd % 2 ? H : W, s = [x + W / 2, y + H / 2, W / 2 - x, H / 2 - y][sd], r = [-y - H / 2, x - W / 2, y - H / 2, -x - W / 2][sd];
      return [Math.min(1, Math.max(0, (s + r) / (L + 2 * r))), r];
    };
    if (G.oval) {                          // овал: одним пером по кругу от низа, кольца — снаружи внутрь
      for (let j = 0; j < n; j++) { const [w, r] = G.pen(p[3 * j], p[3 * j + 1]);
        T[j] = kind === 'outer' ? 0.35 * (1 - Math.min(1, Math.max(0, r))) + 0.6 * w : kind === 'teeth' ? 0.75 + 0.5 * w : 0.85 + 0.55 * w; }
      geo.setAttribute('aT', new THREE.BufferAttribute(T, 1)); return geo;
    }
    for (let i = 0; i < n; i += 2) {
      const sd = sideOf((p[3 * i] + p[3 * i + 3]) / 2, (p[3 * i + 1] + p[3 * i + 4]) / 2);
      for (const j of [i, i + 1]) {
        const [u, r] = su(sd, p[3 * j], p[3 * j + 1]);
        const w = (sd + u) / 4;            // одним пером вокруг: низ слева направо, правая вверх, верх влево, левая вниз
        T[j] = kind === 'outer' ? 0.35 * (1 - Math.max(0, r) / PROFILE.OUT) + 0.6 * w   // кольца — снаружи внутрь
             : kind === 'teeth' ? 0.75 + 0.5 * w : 0.85 + 0.55 * w;   // сухарики, потом ионик
      }
    }
    geo.setAttribute('aT', new THREE.BufferAttribute(T, 1)); return geo;
  };
  const hides = [];
  // ВУАЛЬ (её слово 31 окт: «чтобы работа за рамой чуть-чуть терялась»): тело рамы чуть непрозрачно цвета тумана —
  // где рама перед работой (сухарики, профиль под углом), работа приглушена; где перед туманом — не видно вовсе
  const veilMat = veil && veilA > 0 ? new THREE.MeshBasicMaterial({ color: veil, transparent: true, opacity: 0, depthWrite: false, toneMapped: false,
    polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 2 }) : null;
  for (const g of parts) {
    if (!g.attributes.basePos) { g.setAttribute('basePos', g.attributes.position); g.setAttribute('baseNrm', g.attributes.normal); }
    // невидимое тело — раньше всего непрозрачного: three сортирует непрозрачное по материалу раньше, чем по
    // глубине, и то, что за рамой (кресло), иначе успевало лечь в кадр первым
    const hm = new THREE.Mesh(g, hide); hm.renderOrder = -5; inner.add(hm); hides.push(hm);
    if (veilMat) { const vm = new THREE.Mesh(g, veilMat); vm.renderOrder = 3; inner.add(vm); }
    const m = new THREE.Mesh(g, grid); m.renderOrder = 4; inner.add(m);
    if (g === G.ovolo) continue;
    const l = new THREE.LineSegments(penTimes(new THREE.EdgesGeometry(g, 25), g === G.teeth ? 'teeth' : 'outer'), g === G.teeth ? edgeDetail : edgeOuter);
    l.renderOrder = 5; inner.add(l);
  }
  const ol = new THREE.LineSegments(penTimes(G.ovoloLines, 'ovolo'), edgeDetail); ol.renderOrder = 5; inner.add(ol);
  // t — секунды от начала рисования рамы; возвращает, рисуется ли ещё
  const update = t => { draw.value = t; for (const h of hides) h.visible = t >= DRAW.body;
    if (veilMat) veilMat.opacity = veilA * Math.min(1, Math.max(0, (t - DRAW.body) / 0.6));
    return t < DRAW.done; };
  return { group, Wo: G.Wo / 1000, Ho: G.Ho / 1000, update, bodyAt: DRAW.body };
}
