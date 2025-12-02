import React, { useState } from 'react';
import { Palette, Plus, Trash2, Edit2, Save, X, Download, FileUp } from 'lucide-react';

// 导入基础版本
import findClosestColorBasic from './colorClassification';
import { hexToRgb as hexToRgbBasic, rgbToLab as rgbToLabBasic, MatchedColor as MatchedColorBasic } from './colorClassification';

// 导入改进版本
import findClosestColorImproved from './colorClassification.improved';
import { hexToRgb as hexToRgbImproved, rgbToLab as rgbToLabImproved, MatchedColor as MatchedColorImproved } from './colorClassification.improved';

// 导入 chroma 版本
import findClosestColorChroma from './colorClassification.chroma';
import type { MatchedColor as MatchedColorChroma } from './colorClassification';

// 导入 colord 版本
import findClosestColorColord from './colorClassification.colord';
import type { MatchedColor as MatchedColorColord } from './colorClassification';

import type { ColorPalette } from './colorPalette';
import { INITIAL_COLOR_PALETTE } from './colorPalette';

// 实现方案类型
type ImplementationType = 'basic' | 'improved' | 'chroma' | 'colord';

type MatchedColor = MatchedColorBasic | MatchedColorImproved | MatchedColorChroma | MatchedColorColord;




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
    const [implementationType, setImplementationType] = useState<ImplementationType>('improved');

    // 根据选择的实现方案获取对应的函数
    const getImplementationFunctions = () => {
        switch (implementationType) {
            case 'basic':
                return {
                    findClosestColor: findClosestColorBasic,
                    hexToRgb: hexToRgbBasic,
                    rgbToLab: rgbToLabBasic,
                };
            case 'chroma':
                // chroma 版本没有导出 hexToRgb 和 rgbToLab，使用改进版本的作为后备
                return {
                    findClosestColor: findClosestColorChroma,
                    hexToRgb: hexToRgbImproved,
                    rgbToLab: rgbToLabImproved,
                };
            case 'colord':
                // colord 版本没有导出 hexToRgb 和 rgbToLab，使用改进版本的作为后备
                return {
                    findClosestColor: findClosestColorColord,
                    hexToRgb: hexToRgbImproved,
                    rgbToLab: rgbToLabImproved,
                };
            case 'improved':
            default:
                return {
                    findClosestColor: findClosestColorImproved,
                    hexToRgb: hexToRgbImproved,
                    rgbToLab: rgbToLabImproved,
                };
        }
    };

    React.useEffect(() => {
        const { findClosestColor } = getImplementationFunctions();
        const matched = findClosestColor(inputColor, colorPalette);
        setMatchedColor(matched);
    }, [inputColor, colorPalette, implementationType]);

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const color = e.target.value;
        setInputColor(color);
    };

    // 添加颜色到类别
    const addColorToCategory = (categoryKey: string, newColorHex: string) => {
        const { hexToRgb } = getImplementationFunctions();
        const rgb = hexToRgb(newColorHex);
        if (!rgb) return;

        setPendingColor({ categoryKey, color: newColorHex });
    };

    // 确认添加颜色
    const confirmAddColor = () => {
        if (!pendingColor) return;

        const { hexToRgb, rgbToLab } = getImplementationFunctions();
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
        const { hexToRgb, rgbToLab } = getImplementationFunctions();
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
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <Palette className="w-8 h-8 text-indigo-600" />
                            <h1 className="text-3xl font-bold text-gray-900">颜色聚合分组系统</h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <label className="text-sm font-medium text-gray-700">实现方案：</label>
                            <select
                                value={implementationType}
                                onChange={(e) => setImplementationType(e.target.value as ImplementationType)}
                                className="px-4 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-900 font-medium cursor-pointer hover:border-indigo-500 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="basic">基础版本 (Delta E 76)</option>
                                <option value="improved">改进版本 (Delta E 2000)</option>
                                <option value="chroma">Chroma.js 版本 (Delta E 2000)</option>
                                <option value="colord">Colord 版本 (Delta E 2000)</option>
                            </select>
                        </div>
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
