import React, { useState } from 'react';
import { Palette, Plus, Trash2, Edit2, Save, X, Download, FileUp } from 'lucide-react';

// 定义类型
interface Color {
  hex: string;
  lab: number[];
}

interface ColorCategory {
  name: string;
  colors: Color[];
}

interface ColorPalette {
  [key: string]: ColorCategory;
}

interface MatchedColor {
  key: string;
  name: string;
  hex: string;
  lab: number[];
  distance: number;
}

// 初始颜色调色板定义
const INITIAL_COLOR_PALETTE: ColorPalette = {
  BLACK: {
    name: '黑色',
    colors: [
      { hex: '#000000', lab: [0, 0, 0] },
      { hex: '#1a1a1a', lab: [10, 0, 0] },
      { hex: '#333333', lab: [21, 0, 0] }
    ]
  },
  WHITE: {
    name: '白色',
    colors: [
      { hex: '#FFFFFF', lab: [100, 0, 0] },
      { hex: '#F8F8F8', lab: [97.5, 0, 0] },
      { hex: '#F0F0F0', lab: [94.5, 0, 0] }
    ]
  },
  GRAY: {
    name: '灰色',
    colors: [
      { hex: '#808080', lab: [53.59, 0, 0] },
      { hex: '#A0A0A0', lab: [65, 0, 0] },
      { hex: '#606060', lab: [41, 0, 0] }
    ]
  },
  RED: {
    name: '红色',
    colors: [
      { hex: '#FF0000', lab: [53.24, 80.09, 67.20] },
      { hex: '#DC143C', lab: [47.48, 68.76, 48.23] },
      { hex: '#B22222', lab: [38.28, 57.43, 41.91] }
    ]
  },
  PINK: {
    name: '粉色',
    colors: [
      { hex: '#FFC0CB', lab: [83.26, 24.39, 3.76] },
      { hex: '#FF69B4', lab: [62.66, 62.42, -7.90] },
      { hex: '#FFB6C1', lab: [80.42, 28.34, 5.12] }
    ]
  },
  ORANGE: {
    name: '橙色',
    colors: [
      { hex: '#FFA500', lab: [74.93, 23.93, 78.95] },
      { hex: '#FF8C00', lab: [67.54, 32.62, 76.93] },
      { hex: '#FF7F50', lab: [67.29, 43.97, 51.43] }
    ]
  },
  YELLOW: {
    name: '黄色',
    colors: [
      { hex: '#FFFF00', lab: [97.14, -21.55, 94.48] },
      { hex: '#FFD700', lab: [86.93, -4.88, 86.02] },
      { hex: '#FFEB3B', lab: [94.45, -15.69, 90.35] }
    ]
  },
  GREEN: {
    name: '绿色',
    colors: [
      { hex: '#008000', lab: [46.23, -51.70, 49.90] },
      { hex: '#00FF00', lab: [87.73, -86.18, 83.18] },
      { hex: '#228B22', lab: [50.59, -51.39, 49.90] }
    ]
  },
  BLUE: {
    name: '蓝色',
    colors: [
      { hex: '#0000FF', lab: [32.30, 79.19, -107.86] },
      { hex: '#1E90FF', lab: [61.11, 18.86, -60.69] },
      { hex: '#4169E1', lab: [53.24, 36.86, -71.55] }
    ]
  },
  PURPLE: {
    name: '紫色',
    colors: [
      { hex: '#800080', lab: [29.78, 58.94, -36.50] },
      { hex: '#9370DB', lab: [59.39, 32.66, -45.68] },
      { hex: '#8B008B', lab: [28.57, 62.84, -40.50] }
    ]
  },
  CYAN: {
    name: '青色',
    colors: [
      { hex: '#00FFFF', lab: [91.11, -48.09, -14.14] },
      { hex: '#00CED1', lab: [61.01, -34.89, -8.48] },
      { hex: '#48D1CC', lab: [73.95, -31.08, -6.71] }
    ]
  },
  BROWN: {
    name: '棕色',
    colors: [
      { hex: '#A52A2A', lab: [36.05, 45.43, 38.15] },
      { hex: '#8B4513', lab: [35.64, 31.79, 28.24] },
      { hex: '#D2691E', lab: [49.86, 31.37, 38.61] }
    ]
  },
  GOLD: {
    name: '金色',
    colors: [
      { hex: '#FFD700', lab: [86.93, -4.88, 86.02] },
      { hex: '#DAA520', lab: [66.77, 2.86, 56.91] },
      { hex: '#B8860B', lab: [56.58, 6.45, 49.60] }
    ]
  },
  BEIGE: {
    name: '米色',
    colors: [
      { hex: '#F5F5DC', lab: [91.73, -0.96, 9.44] },
      { hex: '#FFE4B5', lab: [91.37, 2.23, 29.97] },
      { hex: '#FAEBD7', lab: [92.16, 0.21, 14.18] }
    ]
  },
  DARK_BLUE: {
    name: '深蓝色',
    colors: [
      { hex: '#00008B', lab: [18.43, 31.36, -56.98] },
      { hex: '#000080', lab: [17.73, 32.30, -79.19] },
      { hex: '#191970', lab: [12.92, 21.24, -50.87] }
    ]
  }
};

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
function rgbToLab(r: number, g: number, b: number): number[] {
  const [x, y, z] = rgbToXyz(r, g, b);
  return xyzToLab(x, y, z);
}

// Hex转RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
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
function findClosestColor(hexColor: string, palette: ColorPalette): MatchedColor | null {
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

// 演示组件
export default function ColorSearchDemo() {
  const [inputColor, setInputColor] = useState('#FF6B9D');
  const [matchedColor, setMatchedColor] = useState<MatchedColor | null>(null);
  const [colorPalette, setColorPalette] = useState<ColorPalette>(INITIAL_COLOR_PALETTE);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportJson, setExportJson] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [pendingColor, setPendingColor] = useState<{ categoryKey: string, color: string } | null>(null);

  React.useEffect(() => {
    const matched = findClosestColor(inputColor, colorPalette);
    setMatchedColor(matched);
  }, [inputColor, colorPalette]);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setInputColor(color);
  };

  // 添加颜色到类别
  const addColorToCategory = (categoryKey: string, newColorHex: string) => {
    const rgb = hexToRgb(newColorHex);
    if (!rgb) return;

    setPendingColor({ categoryKey, color: newColorHex });
  };

  // 确认添加颜色
  const confirmAddColor = () => {
    if (!pendingColor) return;

    const rgb = hexToRgb(pendingColor.color);
    if (!rgb) return;

    const lab = rgbToLab(rgb.r, rgb.g, rgb.b);

    setColorPalette(prev => ({
      ...prev,
      [pendingColor.categoryKey]: {
        ...prev[pendingColor.categoryKey],
        colors: [...prev[pendingColor.categoryKey].colors, { hex: pendingColor.color, lab }]
      }
    }));

    setPendingColor(null);
  };

  // 取消添加颜色
  const cancelAddColor = () => {
    setPendingColor(null);
  };

  // 删除颜色
  const deleteColor = (categoryKey: string, colorIndex: number) => {
    setColorPalette(prev => ({
      ...prev,
      [categoryKey]: {
        ...prev[categoryKey],
        colors: prev[categoryKey].colors.filter((_, idx) => idx !== colorIndex)
      }
    }));
  };

  // 修改颜色
  const updateColor = (categoryKey: string, colorIndex: number, newHex: string) => {
    const rgb = hexToRgb(newHex);
    if (!rgb) return;

    const lab = rgbToLab(rgb.r, rgb.g, rgb.b);

    setColorPalette(prev => ({
      ...prev,
      [categoryKey]: {
        ...prev[categoryKey],
        colors: prev[categoryKey].colors.map((color, idx) =>
          idx === colorIndex ? { hex: newHex, lab } : color
        )
      }
    }));
  };

  // 删除类别
  const deleteCategory = (categoryKey: string) => {
    const { [categoryKey]: _, ...rest } = colorPalette;
    setColorPalette(rest);
  };

  // 重命名类别
  const renameCategory = (categoryKey: string, newName: string) => {
    setColorPalette(prev => ({
      ...prev,
      [categoryKey]: {
        ...prev[categoryKey],
        name: newName
      }
    }));
    setEditingCategory(null);
  };

  // 添加新类别
  const addNewCategory = () => {
    if (!newCategoryName.trim()) return;

    const categoryKey = newCategoryName.toUpperCase().replace(/\s+/g, '_');
    setColorPalette(prev => ({
      ...prev,
      [categoryKey]: {
        name: newCategoryName,
        colors: [{ hex: '#808080', lab: [53.59, 0, 0] }]
      }
    }));
    setNewCategoryName('');
    setShowAddCategory(false);
  };

  // 显示导出配置
  const showExportConfig = () => {
    const dataStr = JSON.stringify(colorPalette, null, 2);
    setExportJson(dataStr);
    setShowExportModal(true);
    setCopySuccess(false);
  };

  // 复制配置到剪贴板
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(exportJson);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err: any) {
      alert('复制失败，请手动选择复制');
    }
  };

  // 下载为文件
  const downloadConfig = () => {
    const dataBlob = new Blob([exportJson], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `color-palette-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 导入配置
  const importConfig = () => {
    try {
      const parsed = JSON.parse(importJson);
      // 验证数据结构
      if (typeof parsed === 'object' && parsed !== null) {
        let isValid = true;
        Object.values(parsed).forEach((category: any) => {
          if (!category.name || !Array.isArray(category.colors)) {
            isValid = false;
          }
        });

        if (isValid) {
          setColorPalette(parsed as ColorPalette);
          setShowImportModal(false);
          setImportJson('');
          alert('配置导入成功！');
        } else {
          alert('JSON 格式不正确，请检查数据结构');
        }
      } else {
        alert('JSON 格式不正确');
      }
    } catch (error: any) {
      alert('JSON 解析失败，请检查格式：' + error.message);
    }
  };

  // 通过文件导入
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result as string;
        const parsed = JSON.parse(result);
        setColorPalette(parsed as ColorPalette);
        alert('配置导入成功！');
      } catch (error: any) {
        alert('文件解析失败：' + error.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <Palette className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">颜色聚合分组系统</h1>
          </div>

          {/* 颜色选择器 */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              选择或输入颜色（模拟从图片提取）
            </label>
            <div className="flex gap-4 items-center">
              <input
                type="color"
                value={inputColor}
                onChange={handleColorChange}
                className="w-24 h-24 rounded-lg cursor-pointer border-2 border-gray-300"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={inputColor}
                  onChange={handleColorChange}
                  placeholder="#FF6B9D"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg font-mono"
                />
                <p className="text-sm text-gray-500 mt-2">
                  提示：在实际应用中，这个颜色来自图片提取算法
                </p>
              </div>
            </div>
          </div>

          {/* 匹配结果 */}
          {matchedColor && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">匹配结果</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-2">原始颜色</p>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-16 h-16 rounded-lg border-2 border-white shadow-lg"
                      style={{ backgroundColor: inputColor }}
                    />
                    <div>
                      <p className="font-mono text-sm">{inputColor}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">枚举颜色</p>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-16 h-16 rounded-lg border-2 border-white shadow-lg"
                      style={{ backgroundColor: matchedColor.hex }}
                    />
                    <div>
                      <p className="font-semibold text-lg">{matchedColor.name}</p>
                      <p className="font-mono text-sm text-gray-600">{matchedColor.hex}</p>
                      <p className="text-xs text-gray-500">
                        色差: {matchedColor.distance?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 调色板管理 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">颜色调色板管理</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <FileUp className="w-4 h-4" />
                  导入
                </button>
                <button
                  onClick={showExportConfig}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  导出
                </button>
                <button
                  onClick={() => setShowAddCategory(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  添加类别
                </button>
              </div>
            </div>

            {/* 添加新类别表单 */}
            {showAddCategory && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="输入新类别名称（例如：淡蓝）"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    onKeyPress={(e) => e.key === 'Enter' && addNewCategory()}
                  />
                  <button
                    onClick={addNewCategory}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setShowAddCategory(false);
                      setNewCategoryName('');
                    }}
                    className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* 导入配置模态框 */}
            {showImportModal && (
              <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-900 mb-3">导入配置</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">方式一：上传 JSON 文件</label>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileImport}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-700"
                    />
                  </div>
                  <div className="border-t border-green-300 pt-3">
                    <label className="block text-sm text-gray-700 mb-2">方式二：粘贴 JSON 配置</label>
                    <textarea
                      value={importJson}
                      onChange={(e) => setImportJson(e.target.value)}
                      placeholder='粘贴 JSON 配置内容...'
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm h-32"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={importConfig}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        导入
                      </button>
                      <button
                        onClick={() => {
                          setShowImportModal(false);
                          setImportJson('');
                        }}
                        className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 导出配置模态框 */}
            {showExportModal && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-3">导出配置</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">配置 JSON（可直接复制或下载）</label>
                    <textarea
                      value={exportJson}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm h-64 bg-white"
                      onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={copyToClipboard}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      {copySuccess ? '已复制!' : '复制到剪贴板'}
                    </button>
                    <button
                      onClick={downloadConfig}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      下载为文件
                    </button>
                    <button
                      onClick={() => {
                        setShowExportModal(false);
                        setExportJson('');
                      }}
                      className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors"
                    >
                      关闭
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {Object.entries(colorPalette).map(([key, colorCategory]) => (
                <div key={key} className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    {editingCategory === key ? (
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          defaultValue={colorCategory.name}
                          className="px-3 py-1 border border-gray-300 rounded"
                          onBlur={(e) => renameCategory(key, (e.target as HTMLInputElement).value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              renameCategory(key, (e.target as HTMLInputElement).value);
                            }
                          }}
                          autoFocus
                        />
                      </div>
                    ) : (
                      <h3 className="font-semibold text-gray-700 text-lg">{colorCategory.name}</h3>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingCategory(key)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                        title="重命名类别"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`确定要删除"${colorCategory.name}"类别吗？`)) {
                            deleteCategory(key);
                          }
                        }}
                        className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                        title="删除类别"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-8 gap-3">
                    {colorCategory.colors.map((color, idx) => (
                      <div key={idx} className="relative group">
                        <input
                          type="color"
                          value={color.hex}
                          onChange={(e) => updateColor(key, idx, e.target.value)}
                          className="w-full h-auto aspect-square rounded-lg cursor-pointer border-2 border-gray-300 hover:border-indigo-500 transition-all"
                        />
                        <button
                          onClick={() => deleteColor(key, idx)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                        >
                          <X className="w-4 h-4 mx-auto" />
                        </button>
                        <p className="text-xs text-center mt-1 font-mono text-gray-600">
                          {color.hex}
                        </p>
                      </div>
                    ))}
                    {/* 添加新颜色按钮 */}
                    <div className="flex items-center justify-center">
                      {pendingColor?.categoryKey === key ? (
                        <div className="w-full flex flex-col items-center gap-2">
                          <div
                            className="w-full h-auto aspect-square rounded-lg border-2 border-indigo-500"
                            style={{ backgroundColor: pendingColor.color }}
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={confirmAddColor}
                              className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                            >
                              确认
                            </button>
                            <button
                              onClick={cancelAddColor}
                              className="px-2 py-1 bg-gray-400 text-white text-xs rounded hover:bg-gray-500"
                            >
                              取消
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="relative w-full h-auto aspect-square" style={{ marginTop: -20, position: 'relative' }}>
                          <input
                            type="color"
                            className='w-full h-auto aspect-square rounded-lg cursor-pointer border-2 border-dashed border-gray-400 hover:border-indigo-500 transition-all opacity-20 hover:opacity-40 focus:opacity-100'
                            onBlur={(e) => addColorToCategory(key, e.target.value)}

                            title="添加新颜色"
                          />
                          <Plus className="w-8 h-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 技术说明 */}
          <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">使用说明</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 点击颜色方块可直接修改颜色</li>
              <li>• 点击 ✕ 按钮删除颜色（悬停时显示）</li>
              <li>• 点击虚线方块添加新颜色到该类别</li>
              <li>• 点击编辑图标可重命名类别</li>
              <li>• 点击删除图标可删除整个类别</li>
              <li>• 点击"导出"按钮可复制配置或下载为 JSON 文件</li>
              <li>• 点击"导入"按钮可从文件或粘贴 JSON 恢复配置</li>
              <li>• 所有修改会实时影响颜色匹配结果</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
