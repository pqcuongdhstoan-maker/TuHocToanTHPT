import React, { useState } from 'react';
import MathView from './MathView';
import { Eye, Plus, Sparkles, HelpCircle } from 'lucide-react';

interface MathToolbarProps {
  onInsert: (formula: string) => void;
}

export const MathToolbar: React.FC<MathToolbarProps> = ({ onInsert }) => {
  const [activeCategory, setActiveCategory] = useState<'co_ban' | 'giai_tich' | 'hinh_hoc' | 'dai_so'>('co_ban');
  const [testFormula, setTestFormula] = useState<string>('\\frac{-b \\pm \\sqrt{\\Delta}}{2a}');
  const [showTester, setShowTester] = useState<boolean>(false);

  const mathTemplates = {
    co_ban: [
      { label: 'Phân số', latex: '\\frac{a}{b}', preview: '\\frac{a}{b}' },
      { label: 'Căn bậc 2', latex: '\\sqrt{x}', preview: '\\sqrt{x}' },
      { label: 'Căn bậc n', latex: '\\sqrt[n]{x}', preview: '\\sqrt[n]{x}' },
      { label: 'Lũy thừa', latex: 'x^{2}', preview: 'x^{2}' },
      { label: 'Chỉ số', latex: 'x_{1}', preview: 'x_{1}' },
      { label: 'Cộng trừ', latex: '\\pm', preview: '\\pm' },
      { label: 'Vô cùng', latex: '\\infty', preview: '\\infty' },
      { label: 'Độ (°)', latex: '^{\\circ}', preview: '90^{\\circ}' },
      { label: 'Khác', latex: '\\neq', preview: '\\neq' },
      { label: 'Lớn hơn bằng', latex: '\\ge', preview: '\\ge' },
      { label: 'Nhỏ hơn bằng', latex: '\\le', preview: '\\le' },
      { label: 'Xấp xỉ', latex: '\\approx', preview: '\\approx' },
    ],
    giai_tich: [
      { label: 'Đạo hàm bậc 1', latex: "f'(x)", preview: "f'(x)" },
      { label: 'Đạo hàm bậc 2', latex: "y''", preview: "y''" },
      { label: 'Tích phân xác định', latex: '\\int_{a}^{b} f(x)\\,dx', preview: '\\int_{a}^{b} f(x)\\,dx' },
      { label: 'Nguyên hàm', latex: '\\int f(x)\\,dx', preview: '\\int f(x)\\,dx' },
      { label: 'Giới hạn', latex: '\\lim_{x \\to x_0} f(x)', preview: '\\lim_{x \\to x_0} f(x)' },
      { label: 'Lôgarit tự nhiên', latex: '\\ln(x)', preview: '\\ln(x)' },
      { label: 'Lôgarit cơ số a', latex: '\\log_a(x)', preview: '\\log_a(x)' },
      { label: 'Hàm số e^x', latex: 'e^{x}', preview: 'e^{x}' },
      { label: 'Hệ 2 PT', latex: '\\begin{cases} ax + by = c \\\\ dx + ey = f \\end{cases}', preview: '\\begin{cases} a \\\\ b \\end{cases}' },
    ],
    hinh_hoc: [
      { label: 'Vectơ', latex: '\\vec{u}', preview: '\\vec{u}' },
      { label: 'Vectơ AB', latex: '\\overrightarrow{AB}', preview: '\\overrightarrow{AB}' },
      { label: 'Độ dài vectơ', latex: '|\\vec{u}|', preview: '|\\vec{u}|' },
      { label: 'Tích vô hướng', latex: '\\vec{u} \\cdot \\vec{v}', preview: '\\vec{u} \\cdot \\vec{v}' },
      { label: 'Góc', latex: '\\widehat{ABC}', preview: '\\widehat{ABC}' },
      { label: 'Tam giác', latex: '\\Delta ABC', preview: '\\Delta' },
      { label: 'Vuông góc', latex: '\\perp', preview: '\\perp' },
      { label: 'Song song', latex: '\\parallel', preview: '\\parallel' },
      { label: 'Mặt phẳng (P)', latex: '(\\alpha)', preview: '(\\alpha)' },
      { label: 'Tọa độ Oxyz', latex: 'A(x_A; y_A; z_A)', preview: '(x; y; z)' },
    ],
    dai_so: [
      { label: 'Thuộc', latex: '\\in', preview: '\\in' },
      { label: 'Không thuộc', latex: '\\notin', preview: '\\notin' },
      { label: 'Con', latex: '\\subset', preview: '\\subset' },
      { label: 'Hợp', latex: '\\cup', preview: '\\cup' },
      { label: 'Giao', latex: '\\cap', preview: '\\cap' },
      { label: 'Tập rỗng', latex: '\\emptyset', preview: '\\emptyset' },
      { label: 'Tập số thực R', latex: '\\mathbb{R}', preview: '\\mathbb{R}' },
      { label: 'Chỉnh hợp A_n^k', latex: 'A_n^k', preview: 'A_n^k' },
      { label: 'Tổ hợp C_n^k', latex: 'C_n^k', preview: 'C_n^k' },
      { label: 'Giai thừa n!', latex: 'n!', preview: 'n!' },
      { label: 'Tổng xích ma', latex: '\\sum_{i=1}^{n} x_i', preview: '\\sum' },
    ],
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
      {/* Category selector */}
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">Chèn công thức:</span>
          <button
            type="button"
            onClick={() => setActiveCategory('co_ban')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
              activeCategory === 'co_ban'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Cơ bản
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('giai_tich')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
              activeCategory === 'giai_tich'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Giải tích & PT
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('hinh_hoc')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
              activeCategory === 'hinh_hoc'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Hình học & Vectơ
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('dai_so')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
              activeCategory === 'dai_so'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tập hợp & Tổ hợp
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowTester(!showTester)}
          className="flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 font-medium px-2 py-1 bg-blue-50 rounded border border-blue-200"
        >
          <Eye className="w-3.5 h-3.5" />
          {showTester ? 'Ẩn xem thử' : 'Xem thử công thức'}
        </button>
      </div>

      {/* Buttons grid with visual formula render */}
      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
        {mathTemplates[activeCategory].map((tmpl, idx) => (
          <button
            key={idx}
            type="button"
            title={`Chèn: ${tmpl.label}`}
            onClick={() => onInsert(`$${tmpl.latex}$`)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-blue-50 hover:border-blue-300 border border-slate-200 rounded-md shadow-2xs text-xs font-medium text-slate-700 transition"
          >
            <span className="font-serif text-slate-900">
              <MathView text={`$${tmpl.preview}$`} inline />
            </span>
            <span className="text-[10px] text-slate-600 border-l border-slate-200 pl-1">{tmpl.label}</span>
          </button>
        ))}
      </div>

      {/* Live tester helper */}
      {showTester && (
        <div className="mt-2 pt-2 border-t border-slate-200 bg-white p-2.5 rounded-md border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Xem trước công thức thời gian thực:
            </span>
            <button
              type="button"
              onClick={() => onInsert(`$${testFormula}$`)}
              className="text-blue-700 hover:underline font-medium flex items-center gap-0.5"
            >
              <Plus className="w-3 h-3" /> Chèn vào vị trí con trỏ
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input
              type="text"
              value={testFormula}
              onChange={(e) => setTestFormula(e.target.value)}
              placeholder="Nhập mã LaTeX (ví dụ: \frac{1}{2})"
              className="px-2.5 py-1 text-xs border border-slate-300 rounded font-mono focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
            />
            <div className="px-2.5 py-1 bg-slate-50 rounded border border-slate-200 min-h-[30px] flex items-center justify-center">
              <MathView text={`$${testFormula}$`} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MathToolbar;
