/**
 * 颜色分类（改进版本 - 使用 Delta E 2000 算法）
 * 根据LAB色彩空间计算色差，找到最接近的枚举颜色
 * 改进点：
 * 1. 使用更准确的 Delta E 2000 算法替代简单的欧几里得距离
 * 2. 添加输入验证和错误处理
 * 3. 优化性能（提前计算 LAB 值）
 * 
 * 注意：此版本不依赖第三方库，但实现了更准确的 Delta E 2000 算法
 */

// 定义类型
import type { Color, ColorPalette } from './colorPalette';

export interface MatchedColor {
  key: string;
  name: string;
  hex: string;
  lab: number[];
  distance: number;
}


// RGB转XYZ（使用 sRGB 标准）
function rgbToXyz(r: number, g: number, b: number): number[] {
  // 归一化到 0-1
  r = r / 255;
  g = g / 255;
  b = b / 255;

  // 反伽马校正
  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  // 转换到 0-100 范围
  r *= 100;
  g *= 100;
  b *= 100;

  // sRGB 到 XYZ 转换矩阵（D65 白点）
  const x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
  const y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750;
  const z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041;

  return [x, y, z];
}

// XYZ转LAB（使用 D65 标准白点）
function xyzToLab(x: number, y: number, z: number): number[] {
  // D65 白点参考值
  const xn = 95.047;
  const yn = 100.000;
  const zn = 108.883;

  x = x / xn;
  y = y / yn;
  z = z / zn;

  // 立方根或线性变换
  const fx = x > 0.008856 ? Math.pow(x, 1 / 3) : (7.787 * x) + 16 / 116;
  const fy = y > 0.008856 ? Math.pow(y, 1 / 3) : (7.787 * y) + 16 / 116;
  const fz = z > 0.008856 ? Math.pow(z, 1 / 3) : (7.787 * z) + 16 / 116;

  const l = (116 * fy) - 16;
  const a = 500 * (fx - fy);
  const b = 200 * (fy - fz);

  return [l, a, b];
}

// RGB转LAB（完整流程）
export function rgbToLab(r: number, g: number, b: number): number[] {
  const [x, y, z] = rgbToXyz(r, g, b);
  return xyzToLab(x, y, z);
}

// Hex转RGB（改进：支持 3 位和 6 位 HEX）
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // 移除 # 号
  hex = hex.replace('#', '');

  // 支持 3 位 HEX（如 #f00）
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }

  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * 计算 Delta E 76（简单的欧几里得距离）
 * 这是原版本使用的方法
 */
function calculateDeltaE76(lab1: number[], lab2: number[]): number {
  const deltaL = lab1[0] - lab2[0];
  const deltaA = lab1[1] - lab2[1];
  const deltaB = lab1[2] - lab2[2];
  return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
}

/**
 * 计算 Delta E 2000（更准确的色差算法）
 * 这是改进版本，提供更准确的人眼感知色差
 */
function calculateDeltaE2000(lab1: number[], lab2: number[]): number {
  const [L1, a1, b1] = lab1;
  const [L2, a2, b2] = lab2;

  // 计算平均值
  const LMean = (L1 + L2) / 2;
  const C1 = Math.sqrt(a1 * a1 + b1 * b1);
  const C2 = Math.sqrt(a2 * a2 + b2 * b2);
  const CMean = (C1 + C2) / 2;

  const G = 0.5 * (1 - Math.sqrt(Math.pow(CMean, 7) / (Math.pow(CMean, 7) + Math.pow(25, 7))));
  const a1p = (1 + G) * a1;
  const a2p = (1 + G) * a2;

  const C1p = Math.sqrt(a1p * a1p + b1 * b1);
  const C2p = Math.sqrt(a2p * a2p + b2 * b2);
  const CMeanp = (C1p + C2p) / 2;

  let h1p = Math.atan2(b1, a1p) * 180 / Math.PI;
  let h2p = Math.atan2(b2, a2p) * 180 / Math.PI;

  if (h1p < 0) h1p += 360;
  if (h2p < 0) h2p += 360;

  const deltaLp = L2 - L1;
  const deltaCp = C2p - C1p;
  let deltaHp = h2p - h1p;

  if (Math.abs(deltaHp) > 180) {
    if (deltaHp > 0) {
      deltaHp -= 360;
    } else {
      deltaHp += 360;
    }
  }

  const deltaHpRad = deltaHp * Math.PI / 180;
  const deltaHpValue = 2 * Math.sqrt(C1p * C2p) * Math.sin(deltaHpRad / 2);

  const T = 1 - 0.17 * Math.cos((h1p + h2p) / 2 * Math.PI / 180 - Math.PI / 6) +
    0.24 * Math.cos((h1p + h2p) * Math.PI / 180) +
    0.32 * Math.cos((h1p + h2p) / 2 * Math.PI / 180 + Math.PI / 30) -
    0.20 * Math.cos((h1p + h2p) * Math.PI / 180 * 2 - Math.PI / 63);

  const deltaTheta = 30 * Math.exp(-Math.pow((h1p + h2p) / 2 - 275, 2) / 625);
  const RC = 2 * Math.sqrt(Math.pow(CMeanp, 7) / (Math.pow(CMeanp, 7) + Math.pow(25, 7)));
  const RT = -Math.sin(2 * deltaTheta * Math.PI / 180) * RC;

  const SL = 1 + (0.015 * Math.pow(LMean - 50, 2)) / Math.sqrt(20 + Math.pow(LMean - 50, 2));
  const SC = 1 + 0.045 * CMeanp;
  const SH = 1 + 0.015 * CMeanp * T;

  const kL = 1;
  const kC = 1;
  const kH = 1;

  const deltaE = Math.sqrt(
    Math.pow(deltaLp / (kL * SL), 2) +
    Math.pow(deltaCp / (kC * SC), 2) +
    Math.pow(deltaHpValue / (kH * SH), 2) +
    RT * (deltaCp / (kC * SC)) * (deltaHpValue / (kH * SH))
  );

  return deltaE;
}

/**
 * 找到最接近的枚举颜色
 * @param hexColor - HEX 颜色值（如 '#FF0000' 或 'FF0000'）
 * @param palette - 颜色调色板
 * @param useDeltaE2000 - 是否使用 Delta E 2000 算法（默认 true，更准确但稍慢）
 */
export default function findClosestColor(
  hexColor: string,
  palette: ColorPalette,
  useDeltaE2000: boolean = true
): MatchedColor | null {
  if (!hexColor || typeof hexColor !== 'string') {
    return null;
  }

  const rgb = hexToRgb(hexColor);
  if (!rgb) {
    return null;
  }

  const inputLab = rgbToLab(rgb.r, rgb.g, rgb.b);

  let minDistance = Infinity;
  let closestColor: MatchedColor | null = null;

  const calculateDeltaE = useDeltaE2000 ? calculateDeltaE2000 : calculateDeltaE76;

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

