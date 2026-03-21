// Minimal QR Code generator — produces an SVG string
// Implements QR Code Model 2, Version 1-4 with error correction level L

const GF256_EXP = new Uint8Array(256);
const GF256_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF256_EXP[i] = x;
    GF256_LOG[x] = i;
    x = (x << 1) ^ (x & 128 ? 0x11d : 0);
  }
  GF256_EXP[255] = GF256_EXP[0];
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF256_EXP[(GF256_LOG[a] + GF256_LOG[b]) % 255];
}

function polyMul(a: number[], b: number[]): number[] {
  const r = new Array(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i++)
    for (let j = 0; j < b.length; j++)
      r[i + j] ^= gfMul(a[i], b[j]);
  return r;
}

function ecBytes(data: number[], ecCount: number): number[] {
  let gen = [1];
  for (let i = 0; i < ecCount; i++) gen = polyMul(gen, [1, GF256_EXP[i]]);
  const msg = [...data, ...new Array(ecCount).fill(0)];
  for (let i = 0; i < data.length; i++) {
    const coef = msg[i];
    if (coef !== 0) for (let j = 0; j < gen.length; j++) msg[i + j] ^= gfMul(gen[j], coef);
  }
  return msg.slice(data.length);
}

function encodeData(text: string): { version: number; modules: boolean[][] } {
  const bytes = Array.from(new TextEncoder().encode(text));
  const len = bytes.length;

  // Pick smallest version (1-6) that fits with EC level L (byte mode)
  const caps = [0, 17, 32, 53, 78, 106, 134]; // max data bytes per version L
  let version = 1;
  for (version = 1; version <= 6; version++) if (caps[version] >= len + 2) break;
  if (version > 6) version = 6;

  const size = version * 4 + 17;
  const ecCounts = [0, 7, 10, 15, 20, 26, 36]; // EC codewords per version L
  const totalCw = [0, 26, 44, 70, 100, 134, 172];
  const ecCw = ecCounts[version];
  const dataCw = totalCw[version] - ecCw;

  // Build data codewords
  const bits: number[] = [];
  const pushBits = (val: number, n: number) => { for (let i = n - 1; i >= 0; i--) bits.push((val >> i) & 1); };
  pushBits(0b0100, 4); // byte mode
  pushBits(len, version >= 1 && version <= 9 ? 8 : 16);
  for (const b of bytes) pushBits(b, 8);
  pushBits(0, Math.min(4, dataCw * 8 - bits.length));
  while (bits.length % 8) bits.push(0);
  while (bits.length < dataCw * 8) { bits.push(...[1, 1, 1, 0, 1, 1, 0, 0]); if (bits.length < dataCw * 8) bits.push(...[0, 0, 0, 1, 0, 0, 0, 1]); }

  const dataWords: number[] = [];
  for (let i = 0; i < dataCw; i++) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | (bits[i * 8 + j] || 0);
    dataWords.push(byte);
  }
  const ec = ecBytes(dataWords, ecCw);
  const allCw = [...dataWords, ...ec];

  // Create module grid
  const mod: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const reserved: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const setMod = (r: number, c: number, v: boolean, res = true) => { mod[r][c] = v; if (res) reserved[r][c] = true; };

  // Finder patterns
  const drawFinder = (r: number, c: number) => {
    for (let dr = -1; dr <= 7; dr++) for (let dc = -1; dc <= 7; dc++) {
      const rr = r + dr, cc = c + dc;
      if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
      const ring = Math.max(Math.abs(dr - 3), Math.abs(dc - 3));
      setMod(rr, cc, ring !== 2 && ring !== 4);
    }
  };
  drawFinder(0, 0); drawFinder(0, size - 7); drawFinder(size - 7, 0);

  // Timing
  for (let i = 8; i < size - 8; i++) { setMod(6, i, i % 2 === 0); setMod(i, 6, i % 2 === 0); }

  // Alignment (version >= 2)
  if (version >= 2) {
    const pos = [6, size - 7];
    for (const ar of pos) for (const ac of pos) {
      if (reserved[ar]?.[ac]) continue;
      for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) {
        const v = Math.max(Math.abs(dr), Math.abs(dc));
        setMod(ar + dr, ac + dc, v !== 1);
      }
    }
  }

  // Dark module + reserved format
  setMod(size - 8, 8, true);
  for (let i = 0; i < 15; i++) {
    if (i < 8) { reserved[8][i < 6 ? i : i + 1] = true; reserved[i < 6 ? i : i + 1][8] = true; }
    else { reserved[8][size - 15 + i] = true; reserved[size - 15 + i][8] = true; }
  }

  // Place data
  let bitIdx = 0;
  const totalBits = allCw.length * 8;
  for (let col = size - 1; col >= 1; col -= 2) {
    if (col === 6) col = 5;
    for (let row = 0; row < size; row++) {
      for (let c = 0; c < 2; c++) {
        const cc = col - c;
        const rr = ((Math.floor((size - 1 - col + (col < 6 ? 1 : 0)) / 2)) % 2 === 0) ? size - 1 - row : row;
        if (reserved[rr][cc]) continue;
        if (bitIdx < totalBits) {
          const cwIdx = Math.floor(bitIdx / 8);
          const bitPos = 7 - (bitIdx % 8);
          mod[rr][cc] = ((allCw[cwIdx] >> bitPos) & 1) === 1;
        }
        bitIdx++;
      }
    }
  }

  // Apply mask 0 (checkerboard) and format info
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
    if (!reserved[r][c]) mod[r][c] = mod[r][c] !== ((r + c) % 2 === 0);
  }

  // Format bits for mask 0, EC level L = 01, mask 000 → data 01000
  const formatBits = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0]; // pre-computed for L/mask0
  // Place format
  const fmtPos1: [number, number][] = [[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,7],[8,8],[7,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8]];
  const fmtPos2: [number, number][] = [];
  for (let i = 0; i < 8; i++) fmtPos2.push([size - 1 - i, 8]);
  for (let i = 8; i < 15; i++) fmtPos2.push([8, size - 15 + i]);
  for (let i = 0; i < 15; i++) {
    mod[fmtPos1[i][0]][fmtPos1[i][1]] = formatBits[i] === 1;
    mod[fmtPos2[i][0]][fmtPos2[i][1]] = formatBits[i] === 1;
  }

  return { version, modules: mod };
}

/** Generate a QR code as an SVG string */
export function qrcodeSVG(text: string, size = 120): string {
  const { modules } = encodeData(text);
  const n = modules.length;
  const cellSize = size / (n + 8); // 4-cell quiet zone each side
  const offset = cellSize * 4;
  let rects = "";
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (modules[r][c]) {
        const x = (offset + c * cellSize).toFixed(2);
        const y = (offset + r * cellSize).toFixed(2);
        const s = cellSize.toFixed(2);
        rects += `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="#000"/>`;
      }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="#fff"/>${rects}</svg>`;
}
