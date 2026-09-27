// Tarayıcıda STL / OBJ dosyasından hacim (cm³) ve ölçü (mm) hesaplar.
function ucgenlerSTL(buf) {
  const dv = new DataView(buf);
  const n = buf.byteLength >= 84 ? dv.getUint32(80, true) : 0;
  if (84 + n * 50 === buf.byteLength) {
    const t = new Float32Array(n * 9);
    for (let i = 0; i < n; i++) for (let k = 0; k < 9; k++) t[i * 9 + k] = dv.getFloat32(84 + i * 50 + 12 + k * 4, true);
    return t;
  }
  const metin = new TextDecoder().decode(buf);
  const say = [...metin.matchAll(/vertex\s+([-\d.eE+]+)\s+([-\d.eE+]+)\s+([-\d.eE+]+)/g)].flatMap((m) => [+m[1], +m[2], +m[3]]);
  return new Float32Array(say);
}

function ucgenlerOBJ(buf) {
  const v = [], t = [];
  for (const satir of new TextDecoder().decode(buf).split('\n')) {
    const p = satir.trim().split(/\s+/);
    if (p[0] === 'v') v.push([+p[1], +p[2], +p[3]]);
    else if (p[0] === 'f') {
      const idx = p.slice(1).map((x) => { const i = parseInt(x, 10); return i < 0 ? v.length + i : i - 1; });
      for (let k = 1; k < idx.length - 1; k++) t.push(...v[idx[0]], ...v[idx[k]], ...v[idx[k + 1]]);
    }
  }
  return new Float32Array(t);
}

export function modelOlc(buf, uzanti) {
  const t = uzanti === 'obj' ? ucgenlerOBJ(buf) : ucgenlerSTL(buf);
  if (!t.length) throw new Error('Model okunamadı');
  let hacim = 0;
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < t.length; i += 9) {
    const [ax, ay, az, bx, by, bz, cx, cy, cz] = t.subarray(i, i + 9);
    hacim += (ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx)) / 6;
    for (let k = 0; k < 9; k++) { const e = k % 3; if (t[i + k] < min[e]) min[e] = t[i + k]; if (t[i + k] > max[e]) max[e] = t[i + k]; }
  }
  return { hacimCm3: Math.abs(hacim) / 1000, olcu: max.map((m, i) => m - min[i]), ucgen: t.length / 9 };
}

// Tahmini fiyat: gram = hacim × yoğunluk × (kabuk payı + doluluk payı)
export function tahminiFiyat({ hacimCm3, olcek = 100, malzeme, dolulukYuzde = 20, kalite, adet = 1 }, fiyatAyar) {
  if (!hacimCm3 || !malzeme || !kalite) return null;
  const hacim = hacimCm3 * (olcek / 100) ** 3;
  const gram = hacim * malzeme.yogunluk * (0.3 + 0.7 * (dolulukYuzde / 100));
  const birim = Math.max(fiyatAyar.min_fiyat, fiyatAyar.baslangic + gram * malzeme.gram_fiyat * kalite.carpan);
  return { gram: Math.round(gram), birim: Math.round(birim), toplam: Math.round(birim * adet) };
}
