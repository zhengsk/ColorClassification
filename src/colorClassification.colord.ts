/**
 * 颜色分类（使用 colord 库版本）
 * 根据LAB色彩空间计算色差，找到最接近的枚举颜色
 * 使用 colord 库进行颜色转换
 * 
 * 安装依赖: 
 *   npm install colord
 *   npm install colord/plugins/lab (如果需要 LAB 支持，但 colord 2.x 已内置 LAB)
 * 
 * 注意：colord 是一个轻量级（~1.7KB）且高性能的颜色处理库
 */

import { colord } from 'colord';
import type { MatchedColor } from './colorClassification';
import type { Color, ColorPalette } from './colorPalette';

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
function rgbToLab(r: number, g: number, b: number): number[] {
  const [x, y, z] = rgbToXyz(r, g, b);
  return xyzToLab(x, y, z);
}

/**
 * 使用 colord 将 HEX 颜色转换为 LAB 色彩空间
 * colord 库本身不直接支持 LAB，所以我们先转换为 RGB，再转换为 LAB
 */
function hexToLab(hexColor: string): number[] | null {
  try {
    const color = colord(hexColor);
    if (!color.isValid()) {
      console.error(`无效的颜色值: ${hexColor}`);
      return null;
    }

    // 使用 colord 转换为 RGB，然后转换为 LAB
    const rgb = color.toRgb();
    return rgbToLab(rgb.r, rgb.g, rgb.b);
  } catch (error) {
    console.error(`无法解析颜色: ${hexColor}`, error);
    return null;
  }
}

/**
 * 计算 Delta E 76（简单的欧几里得距离）
 * colord 库本身不提供 Delta E 计算，所以我们自己实现
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
 * 使用 colord 库进行颜色转换
 * 
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

  const inputLab = hexToLab(hexColor);
  if (!inputLab) {
    return null;
  }

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

/**
 * 可选：动态计算调色板中颜色的 LAB 值
 * 如果调色板中只有 HEX 值，可以使用此函数计算 LAB 值
 */
export function computeLabForPalette(palette: ColorPalette): ColorPalette {
  const computedPalette: ColorPalette = {};

  Object.entries(palette).forEach(([key, colorCategory]) => {
    computedPalette[key] = {
      name: colorCategory.name,
      colors: colorCategory.colors.map((color) => {
        // 如果已经有 LAB 值，直接使用；否则从 HEX 计算
        if (color.lab && color.lab.length === 3) {
          return color;
        }
        const lab = hexToLab(color.hex);
        return {
          hex: color.hex,
          lab: lab || [0, 0, 0]
        };
      })
    };
  });

  return computedPalette;
}