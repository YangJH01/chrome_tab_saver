import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const sizes = [16, 32, 48, 128];

for (const size of sizes) {
  const pixels = renderIcon(size, 8);
  const png = encodePng(size, size, pixels);
  const outputPath = resolve("public/assets", `icon-${size}.png`);

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, png);
}

function renderIcon(size, supersample) {
  const width = size * supersample;
  const height = size * supersample;
  const pixels = new Uint8Array(width * height * 4);

  const colors = {
    bgTop: [59, 130, 246, 255],
    bgBottom: [37, 99, 235, 255],
    bgDeep: [30, 64, 175, 255],
    glow: [147, 197, 253, 92],
    rim: [255, 255, 255, 42],
    backTab: [255, 255, 255, 92],
    midTab: [255, 255, 255, 136],
    frontTab: [255, 255, 255, 248],
    line: [219, 234, 254, 255],
    lineStrong: [29, 78, 216, 255],
    slot: [239, 246, 255, 255],
    arrow: [37, 99, 235, 255]
  };

  fillRoundedRect(pixels, width, height, 0.1, 0.1, 0.8, 0.8, 0.22, colors.bgTop);
  fillRoundedRect(pixels, width, height, 0.1, 0.48, 0.8, 0.42, 0.22, colors.bgBottom);
  fillCircle(pixels, width, height, 0.3, 0.24, 0.2, colors.glow);
  fillCircle(pixels, width, height, 0.79, 0.78, 0.17, withAlpha(colors.bgDeep, 0.42));
  strokeRoundedRect(pixels, width, height, 0.1, 0.1, 0.8, 0.8, 0.22, 0.018, colors.rim);

  drawTab(pixels, width, height, { x: 0.28, y: 0.21, w: 0.38, h: 0.24, radius: 0.08 }, colors.backTab, colors.line, 1);
  drawTab(pixels, width, height, { x: 0.23, y: 0.29, w: 0.44, h: 0.26, radius: 0.085 }, colors.midTab, colors.line, 1);
  fillRoundedRect(pixels, width, height, 0.19, 0.39, 0.48, 0.34, 0.1, withAlpha(colors.bgDeep, 0.16));
  drawTab(pixels, width, height, { x: 0.18, y: 0.37, w: 0.5, h: 0.35, radius: 0.1 }, colors.frontTab, colors.lineStrong, 1);

  fillRoundedRect(pixels, width, height, 0.31, 0.62, 0.24, 0.06, 0.04, colors.slot);
  fillRect(pixels, width, height, 0.39, 0.48, 0.08, 0.15, colors.arrow);
  fillTriangle(
    pixels,
    width,
    height,
    [0.32, 0.55],
    [0.54, 0.55],
    [0.43, 0.68],
    colors.arrow
  );
  fillRoundedRect(pixels, width, height, 0.25, 0.46, 0.22, 0.022, 0.011, withAlpha(colors.lineStrong, 0.18));
  fillRoundedRect(pixels, width, height, 0.25, 0.515, 0.16, 0.02, 0.01, withAlpha(colors.lineStrong, 0.14));

  return downsample(pixels, width, height, supersample);
}

function drawTab(pixels, width, height, rect, bodyColor, barColor, alphaScale) {
  const body = withAlpha(bodyColor, alphaScale);
  const bar = withAlpha(barColor, alphaScale);

  fillRoundedRect(pixels, width, height, rect.x, rect.y, rect.w, rect.h, rect.radius, body);
  fillRoundedRect(pixels, width, height, rect.x + 0.02, rect.y + 0.03, rect.w - 0.04, 0.055, 0.03, bar);
}

function fillRect(pixels, width, height, x, y, w, h, color) {
  const x0 = Math.floor(x * width);
  const y0 = Math.floor(y * height);
  const x1 = Math.ceil((x + w) * width);
  const y1 = Math.ceil((y + h) * height);

  for (let py = y0; py < y1; py += 1) {
    for (let px = x0; px < x1; px += 1) {
      blendPixel(pixels, width, px, py, color);
    }
  }
}

function fillRoundedRect(pixels, width, height, x, y, w, h, radius, color) {
  const x0 = x * width;
  const y0 = y * height;
  const x1 = (x + w) * width;
  const y1 = (y + h) * height;
  const r = radius * Math.min(width, height);

  for (let py = Math.floor(y0); py < Math.ceil(y1); py += 1) {
    for (let px = Math.floor(x0); px < Math.ceil(x1); px += 1) {
      const insideX = clamp(px + 0.5, x0 + r, x1 - r);
      const insideY = clamp(py + 0.5, y0 + r, y1 - r);
      const dx = px + 0.5 - insideX;
      const dy = py + 0.5 - insideY;

      if (dx * dx + dy * dy <= r * r) {
        blendPixel(pixels, width, px, py, color);
      }
    }
  }
}

function fillTriangle(pixels, width, height, a, b, c, color) {
  const ax = a[0] * width;
  const ay = a[1] * height;
  const bx = b[0] * width;
  const by = b[1] * height;
  const cx = c[0] * width;
  const cy = c[1] * height;
  const minX = Math.floor(Math.min(ax, bx, cx));
  const maxX = Math.ceil(Math.max(ax, bx, cx));
  const minY = Math.floor(Math.min(ay, by, cy));
  const maxY = Math.ceil(Math.max(ay, by, cy));

  for (let py = minY; py < maxY; py += 1) {
    for (let px = minX; px < maxX; px += 1) {
      if (isPointInTriangle(px + 0.5, py + 0.5, ax, ay, bx, by, cx, cy)) {
        blendPixel(pixels, width, px, py, color);
      }
    }
  }
}

function fillCircle(pixels, width, height, cx, cy, radius, color) {
  const centerX = cx * width;
  const centerY = cy * height;
  const r = radius * Math.min(width, height);
  const minX = Math.floor(centerX - r);
  const maxX = Math.ceil(centerX + r);
  const minY = Math.floor(centerY - r);
  const maxY = Math.ceil(centerY + r);

  for (let py = minY; py < maxY; py += 1) {
    for (let px = minX; px < maxX; px += 1) {
      const dx = px + 0.5 - centerX;
      const dy = py + 0.5 - centerY;
      if (dx * dx + dy * dy <= r * r) {
        blendPixel(pixels, width, px, py, color);
      }
    }
  }
}

function strokeRoundedRect(pixels, width, height, x, y, w, h, radius, strokeWidth, color) {
  fillRoundedRect(pixels, width, height, x, y, w, h, radius, color);
  fillRoundedRect(
    pixels,
    width,
    height,
    x + strokeWidth,
    y + strokeWidth,
    w - strokeWidth * 2,
    h - strokeWidth * 2,
    Math.max(0, radius - strokeWidth),
    [0, 0, 0, 0]
  );
}

function isPointInTriangle(px, py, ax, ay, bx, by, cx, cy) {
  const area = (x1, y1, x2, y2, x3, y3) => (x1 - x3) * (y2 - y3) - (x2 - x3) * (y1 - y3);
  const d1 = area(px, py, ax, ay, bx, by);
  const d2 = area(px, py, bx, by, cx, cy);
  const d3 = area(px, py, cx, cy, ax, ay);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;

  return !(hasNeg && hasPos);
}

function downsample(sourcePixels, sourceWidth, sourceHeight, factor) {
  const width = sourceWidth / factor;
  const height = sourceHeight / factor;
  const result = new Uint8Array(width * height * 4);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;

      for (let sy = 0; sy < factor; sy += 1) {
        for (let sx = 0; sx < factor; sx += 1) {
          const sourceIndex = ((y * factor + sy) * sourceWidth + (x * factor + sx)) * 4;
          r += sourcePixels[sourceIndex];
          g += sourcePixels[sourceIndex + 1];
          b += sourcePixels[sourceIndex + 2];
          a += sourcePixels[sourceIndex + 3];
        }
      }

      const samples = factor * factor;
      const index = (y * width + x) * 4;
      result[index] = Math.round(r / samples);
      result[index + 1] = Math.round(g / samples);
      result[index + 2] = Math.round(b / samples);
      result[index + 3] = Math.round(a / samples);
    }
  }

  return result;
}

function blendPixel(pixels, width, x, y, color) {
  if (x < 0 || y < 0) {
    return;
  }

  const height = pixels.length / 4 / width;
  if (x >= width || y >= height) {
    return;
  }

  const index = (y * width + x) * 4;
  const alpha = (color[3] ?? 255) / 255;
  const inverse = 1 - alpha;

  pixels[index] = Math.round(color[0] * alpha + pixels[index] * inverse);
  pixels[index + 1] = Math.round(color[1] * alpha + pixels[index + 1] * inverse);
  pixels[index + 2] = Math.round(color[2] * alpha + pixels[index + 2] * inverse);
  pixels[index + 3] = Math.round((alpha + pixels[index + 3] / 255 * inverse) * 255);
}

function withAlpha(color, scale) {
  return [color[0], color[1], color[2], Math.round(color[3] * scale)];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function encodePng(width, height, rgbaPixels) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const scanlineLength = width * 4 + 1;
  const raw = Buffer.alloc(scanlineLength * height);
  const rgbaBuffer = Buffer.from(rgbaPixels);

  for (let y = 0; y < height; y += 1) {
    raw[y * scanlineLength] = 0;
    rgbaBuffer.copy(raw, y * scanlineLength + 1, y * width * 4, (y + 1) * width * 4);
  }

  return Buffer.concat([
    signature,
    pngChunk("IHDR", createIhdr(width, height)),
    pngChunk("IDAT", deflateSync(raw)),
    pngChunk("IEND", Buffer.alloc(0))
  ]);
}

function createIhdr(width, height) {
  const buffer = Buffer.alloc(13);
  buffer.writeUInt32BE(width, 0);
  buffer.writeUInt32BE(height, 4);
  buffer[8] = 8;
  buffer[9] = 6;
  buffer[10] = 0;
  buffer[11] = 0;
  buffer[12] = 0;
  return buffer;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32BE(data.length, 0);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([lengthBuffer, typeBuffer, data, crcBuffer]);
}

function crc32(buffer) {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}
