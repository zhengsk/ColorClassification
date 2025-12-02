import type { Color, ColorPalette } from './colorPalette';

export interface MatchedColor {
  key: string;
  name: string;
  hex: string;
  lab: number[];
  distance: number;
}


// RGB转XYZ
function rgbToXyz(r: number, g: number, b: number): number[] {
  r = r / 255;
  g = g / 255;
  b = b / 255;

  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  r *= 100;
  g *= 100;
  b *= 100;

  const x = r * 0.4124 + g * 0.3576 + b * 0.1805;
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const z = r * 0.0193 + g * 0.1192 + b * 0.9505;

  return [x, y, z];
}

// XYZ转LAB
function xyzToLab(x: number, y: number, z: number): number[] {
  x = x / 95.047;
  y = y / 100.000;
  z = z / 108.883;

  x = x > 0.008856 ? Math.pow(x, 1 / 3) : (7.787 * x) + 16 / 116;
  y = y > 0.008856 ? Math.pow(y, 1 / 3) : (7.787 * y) + 16 / 116;
  z = z > 0.008856 ? Math.pow(z, 1 / 3) : (7.787 * z) + 16 / 116;

  const l = (116 * y) - 16;
  const a = 500 * (x - y);
  const b = 200 * (y - z);

  return [l, a, b];
}

// RGB转LAB（完整流程）
export function rgbToLab(r: number, g: number, b: number): number[] {
  const [x, y, z] = rgbToXyz(r, g, b);
  return xyzToLab(x, y, z);
}

// Hex转RGB
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// 计算LAB色彩空间的色差（Delta E）
function calculateDeltaE(lab1: number[], lab2: number[]): number {
  const deltaL = lab1[0] - lab2[0];
  const deltaA = lab1[1] - lab2[1];
  const deltaB = lab1[2] - lab2[2];
  return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
}

// 找到最接近的枚举颜色
export default function findClosestColor(hexColor: string, palette: ColorPalette): MatchedColor | null {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return null;

  const inputLab = rgbToLab(rgb.r, rgb.g, rgb.b);

  let minDistance = Infinity;
  let closestColor: MatchedColor | null = null;

  Object.entries(palette).forEach(([key, colorCategory]) => {
    colorCategory.colors.forEach((color: Color) => {
      const distance = calculateDeltaE(inputLab, color.lab);
      if (distance < minDistance) {
        minDistance = distance;
        closestColor = {
          key,
          name: colorCategory.name,
          hex: color.hex,
          lab: color.lab,
          distance
        };
      }
    });
  });

  return closestColor;
}