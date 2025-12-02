/**
 * 颜色分类（使用第三方库版本）
 * 根据LAB色彩空间计算色差，找到最接近的枚举颜色
 * 使用 chroma-js 库进行颜色转换和 Delta E 计算
 * 
 * 安装依赖: npm install chroma-js
 */

import chroma from 'chroma-js';
import type { MatchedColor } from './colorClassification';
import type { Color, ColorPalette } from './colorPalette';

/**
 * 使用 chroma-js 将 HEX 颜色转换为 LAB 色彩空间
 */
function hexToLab(hexColor: string): number[] | null {
  try {
    const color = chroma(hexColor);
    const lab = color.lab();
    return lab;
  } catch (error) {
    console.error(`无法解析颜色: ${hexColor}`, error);
    return null;
  }
}

/**
* 计算两个 LAB 颜色之间的 Delta E（色差）
* 使用 chroma-js 的 deltaE 方法，它实现了 Delta E 2000 算法（更准确）
*/
function calculateDeltaE(lab1: number[], lab2: number[]): number {
  try {
    const color1 = chroma.lab(lab1[0], lab1[1], lab1[2]);
    const color2 = chroma.lab(lab2[0], lab2[1], lab2[2]);
    // chroma.deltaE 使用 Delta E 2000 算法，比简单的欧几里得距离更准确
    return chroma.deltaE(color1, color2);
  } catch (error) {
    console.error('计算 Delta E 时出错:', error);
    // 降级到简单的欧几里得距离
    const deltaL = lab1[0] - lab2[0];
    const deltaA = lab1[1] - lab2[1];
    const deltaB = lab1[2] - lab2[2];
    return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
  }
}

/**
* 找到最接近的枚举颜色
* 使用第三方库 chroma-js 进行颜色转换和 Delta E 计算
*/
export default function findClosestColor(hexColor: string, palette: ColorPalette): MatchedColor | null {
  const inputLab = hexToLab(hexColor);
  if (!inputLab) {
    return null;
  }

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

