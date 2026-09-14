import React, { useState, useMemo, useRef } from 'react';
import {
  Sliders,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Info,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import MathView from './MathView';

type FunctionType = 'quadratic' | 'cubic' | 'rational';

interface FunctionGraphPlotterProps {
  initialType?: FunctionType;
  grade?: 10 | 11 | 12;
  compact?: boolean;
}

export const FunctionGraphPlotter: React.FC<FunctionGraphPlotterProps> = ({
  initialType = 'quadratic',
  grade = 12,
  compact = false,
}) => {
  const [funcType, setFuncType] = useState<FunctionType>(
    grade === 10 ? 'quadratic' : initialType
  );

  // Coefficients
  // Quadratic: y = a*x^2 + b*x + c
  // Cubic: y = a*x^3 + b*x^2 + c*x + d
  // Rational: y = (a*x + b) / (c*x + d)
  const [a, setA] = useState<number>(funcType === 'quadratic' ? 1 : funcType === 'cubic' ? 1 : 2);
  const [b, setB] = useState<number>(funcType === 'quadratic' ? -4 : funcType === 'cubic' ? -3 : -1);
  const [c, setC] = useState<number>(funcType === 'quadratic' ? 3 : funcType === 'cubic' ? 0 : 1);
  const [d, setD] = useState<number>(funcType === 'cubic' ? 2 : funcType === 'rational' ? 3 : 0);

  // View settings
  const [scale, setScale] = useState<number>(35); // pixels per unit
  const [showTangent, setShowTangent] = useState<boolean>(true);
  const [showAsymptotes, setShowAsymptotes] = useState<boolean>(true);
  const [hoverX, setHoverX] = useState<number | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const width = compact ? 450 : 640;
  const height = compact ? 360 : 440;
  const originX = width / 2;
  const originY = height / 2;

  // Change function type and reset pleasant default values
  const handleSelectType = (type: FunctionType) => {
    setFuncType(type);
    if (type === 'quadratic') {
      setA(1);
      setB(-4);
      setC(3);
    } else if (type === 'cubic') {
      setA(1);
      setB(0);
      setC(-3);
      setD(2);
    } else if (type === 'rational') {
      setA(2);
      setB(-1);
      setC(1);
      setD(1);
    }
  };

  // Mathematical calculations
  const mathData = useMemo(() => {
    if (funcType === 'quadratic') {
      const safeA = a === 0 ? 0.001 : a;
      const vx = -b / (2 * safeA);
      const vy = safeA * vx * vx + b * vx + c;
      const delta = b * b - 4 * safeA * c;

      const formulaLatex = `y = ${a !== 1 ? (a === -1 ? '-' : a) : ''}x^2 ${b > 0 ? `+ ${b}x` : b < 0 ? `- ${Math.abs(b)}x` : ''} ${c > 0 ? `+ ${c}` : c < 0 ? `- ${Math.abs(c)}` : ''}`;

      return {
        formulaLatex,
        vertex: { x: vx, y: vy },
        axisOfSymmetry: vx,
        delta,
        derivative: (x: number) => 2 * safeA * x + b,
        evalY: (x: number) => safeA * x * x + b * x + c,
      };
    } else if (funcType === 'cubic') {
      const safeA = a === 0 ? 0.001 : a;
      // y = a*x^3 + b*x^2 + c*x + d
      // y' = 3a*x^2 + 2b*x + c = 0
      const deltaPrime = 4 * b * b - 12 * safeA * c;
      let extrema: { x: number; y: number; type: 'max' | 'min' }[] = [];

      if (deltaPrime > 0) {
        const x1 = (-2 * b + Math.sqrt(deltaPrime)) / (6 * safeA);
        const x2 = (-2 * b - Math.sqrt(deltaPrime)) / (6 * safeA);
        const y1 = safeA * Math.pow(x1, 3) + b * x1 * x1 + c * x1 + d;
        const y2 = safeA * Math.pow(x2, 3) + b * x2 * x2 + c * x2 + d;

        extrema = [
          { x: x1, y: y1, type: safeA > 0 ? (x1 < x2 ? 'max' : 'min') : x1 < x2 ? 'min' : 'max' },
          { x: x2, y: y2, type: safeA > 0 ? (x2 > x1 ? 'min' : 'max') : x2 > x1 ? 'max' : 'min' },
        ];
      }

      const inflX = -b / (3 * safeA);
      const inflY = safeA * Math.pow(inflX, 3) + b * inflX * inflX + c * inflX + d;

      const formulaLatex = `y = ${a !== 1 ? (a === -1 ? '-' : a) : ''}x^3 ${b > 0 ? `+ ${b}x^2` : b < 0 ? `- ${Math.abs(b)}x^2` : ''} ${c > 0 ? `+ ${c}x` : c < 0 ? `- ${Math.abs(c)}x` : ''} ${d > 0 ? `+ ${d}` : d < 0 ? `- ${Math.abs(d)}` : ''}`;

      return {
        formulaLatex,
        extrema,
        inflection: { x: inflX, y: inflY },
        derivative: (x: number) => 3 * safeA * x * x + 2 * b * x + c,
        evalY: (x: number) => safeA * Math.pow(x, 3) + b * x * x + c * x + d,
      };
    } else {
      // Rational y = (ax + b) / (cx + d)
      const safeC = c === 0 ? 1 : c;
      const verticalAsymptote = -d / safeC;
      const horizontalAsymptote = a / safeC;

      const formulaLatex = `y = \\frac{${a}x ${b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`}}{${safeC}x ${d >= 0 ? `+ ${d}` : `- ${Math.abs(d)}`}}`;

      return {
        formulaLatex,
        verticalAsymptote,
        horizontalAsymptote,
        derivative: (x: number) => {
          const denom = safeC * x + d;
          return denom === 0 ? 0 : (a * d - b * safeC) / (denom * denom);
        },
        evalY: (x: number) => {
          const denom = safeC * x + d;
          if (Math.abs(denom) < 0.05) return null;
          return (a * x + b) / denom;
        },
      };
    }
  }, [funcType, a, b, c, d]);

  // Generate SVG Path for plotting
  const pathD = useMemo(() => {
    const xMin = -originX / scale;
    const xMax = (width - originX) / scale;
    const step = 0.05;

    let dString = '';

    if (funcType === 'rational') {
      const vAsymp = (mathData as any).verticalAsymptote;
      // Branch 1: left of asymptote
      let started = false;
      for (let x = xMin; x < vAsymp - 0.08; x += step) {
        const y = mathData.evalY(x);
        if (y === null) continue;
        const px = originX + x * scale;
        const py = originY - y * scale;
        if (py < -height || py > height * 2) continue;

        if (!started) {
          dString += `M ${px.toFixed(1)} ${py.toFixed(1)} `;
          started = true;
        } else {
          dString += `L ${px.toFixed(1)} ${py.toFixed(1)} `;
        }
      }

      // Branch 2: right of asymptote
      started = false;
      for (let x = vAsymp + 0.08; x <= xMax; x += step) {
        const y = mathData.evalY(x);
        if (y === null) continue;
        const px = originX + x * scale;
        const py = originY - y * scale;
        if (py < -height || py > height * 2) continue;

        if (!started) {
          dString += `M ${px.toFixed(1)} ${py.toFixed(1)} `;
          started = true;
        } else {
          dString += `L ${px.toFixed(1)} ${py.toFixed(1)} `;
        }
      }
    } else {
      let started = false;
      for (let x = xMin; x <= xMax; x += step) {
        const y = mathData.evalY(x);
        if (y === null) continue;
        const px = originX + x * scale;
        const py = originY - y * scale;

        // Clip overly large coordinates to avoid rendering artifacts
        if (py < -height * 2 || py > height * 3) {
          started = false;
          continue;
        }

        if (!started) {
          dString += `M ${px.toFixed(1)} ${py.toFixed(1)} `;
          started = true;
        } else {
          dString += `L ${px.toFixed(1)} ${py.toFixed(1)} `;
        }
      }
    }

    return dString;
  }, [mathData, scale, originX, originY, width, height, funcType]);

  // Tangent line calculations at cursor x
  const tangentData = useMemo(() => {
    if (hoverX === null || !showTangent) return null;
    const y0 = mathData.evalY(hoverX);
    if (y0 === null) return null;
    const slope = mathData.derivative(hoverX);

    // Equation: y - y0 = k(x - x0) => y = k*x + (y0 - k*x0)
    const intercept = y0 - slope * hoverX;
    const x1 = hoverX - 2.5;
    const x2 = hoverX + 2.5;
    const y1 = slope * x1 + intercept;
    const y2 = slope * x2 + intercept;

    return {
      x0: hoverX,
      y0,
      slope,
      x1: originX + x1 * scale,
      y1: originY - y1 * scale,
      x2: originX + x2 * scale,
      y2: originY - y2 * scale,
    };
  }, [hoverX, showTangent, mathData, originX, originY, scale]);

  // Handle mouse move on SVG
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const mathX = Number(((clientX - originX) / scale).toFixed(2));
    setHoverX(mathX);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-5">
      {/* Header with Function Switcher */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
              D3 Interactive Plotter
            </span>
            <span className="text-xs text-slate-500 font-medium">Toán THPT GDPT 2018</span>
          </div>
          <h3 className="font-extrabold text-base sm:text-lg text-slate-900 mt-1">
            Khảo sát và vẽ đồ thị hàm số tương tác
          </h3>
        </div>

        {/* Function selector pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => handleSelectType('quadratic')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              funcType === 'quadratic' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bậc 2 (Lớp 10)
          </button>
          <button
            type="button"
            onClick={() => handleSelectType('cubic')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              funcType === 'cubic' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bậc 3 (Lớp 12)
          </button>
          <button
            type="button"
            onClick={() => handleSelectType('rational')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              funcType === 'rational' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Phân thức (Lớp 12)
          </button>
        </div>
      </div>

      {/* Main Canvas & Sliders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Top: Interactive SVG Canvas (8 cols) */}
        <div className="lg:col-span-8 flex flex-col items-center">
          {/* Formula Display Bar */}
          <div className="w-full bg-blue-50/70 border border-blue-100 rounded-2xl p-3 flex items-center justify-between text-xs sm:text-sm font-bold text-blue-950 mb-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-blue-700 uppercase">Hàm số:</span>
              <MathView text={`$${mathData.formulaLatex}$`} />
            </div>

            {/* View Zoom & Reset controls */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setScale((s) => Math.min(s + 8, 70))}
                title="Phóng to"
                className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setScale((s) => Math.max(s - 8, 18))}
                title="Thu nhỏ"
                className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setScale(35)}
                title="Đặt lại tỉ lệ"
                className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* SVG Graph Plane */}
          <div className="relative border-2 border-slate-100 rounded-3xl overflow-hidden bg-slate-50/50 shadow-inner w-full flex justify-center">
            <svg
              ref={svgRef}
              width={width}
              height={height}
              className="cursor-crosshair select-none"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoverX(null)}
            >
              {/* Grid Lines */}
              <defs>
                <pattern id="graph-grid" width={scale} height={scale} patternUnits="userSpaceOnUse">
                  <path
                    d={`M ${scale} 0 L 0 0 0 ${scale}`}
                    fill="none"
                    stroke="#E2E8F0"
                    strokeWidth="0.8"
                    strokeDasharray="2,2"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#graph-grid)" />

              {/* Ox and Oy Coordinate Axes */}
              <line x1="0" y1={originY} x2={width} y2={originY} stroke="#475569" strokeWidth="1.5" />
              <line x1={originX} y1="0" x2={originX} y2={height} stroke="#475569" strokeWidth="1.5" />

              {/* Axis Arrows */}
              <polygon points={`${width},${originY} ${width - 8},${originY - 4} ${width - 8},${originY + 4}`} fill="#475569" />
              <polygon points={`${originX},0 ${originX - 4},8 ${originX + 4},8`} fill="#475569" />

              {/* Axis Labels */}
              <text x={width - 15} y={originY - 8} fontSize="11" fontWeight="bold" fill="#334155">x</text>
              <text x={originX + 10} y="15" fontSize="11" fontWeight="bold" fill="#334155">y</text>
              <text x={originX - 14} y={originY + 14} fontSize="10" fill="#64748B">O</text>

              {/* Tick marks on Axes */}
              {Array.from({ length: Math.floor(width / scale / 2) }).map((_, i) => {
                const step = i + 1;
                return (
                  <React.Fragment key={`tick-${step}`}>
                    {/* Positive X */}
                    <line x1={originX + step * scale} y1={originY - 3} x2={originX + step * scale} y2={originY + 3} stroke="#64748B" />
                    <text x={originX + step * scale - 4} y={originY + 14} fontSize="9" fill="#94A3B8">{step}</text>

                    {/* Negative X */}
                    <line x1={originX - step * scale} y1={originY - 3} x2={originX - step * scale} y2={originY + 3} stroke="#64748B" />
                    <text x={originX - step * scale - 6} y={originY + 14} fontSize="9" fill="#94A3B8">{-step}</text>
                  </React.Fragment>
                );
              })}

              {/* Asymptotes for Rational Function */}
              {funcType === 'rational' && showAsymptotes && (
                <>
                  {/* Vertical Asymptote */}
                  <line
                    x1={originX + (mathData as any).verticalAsymptote * scale}
                    y1="0"
                    x2={originX + (mathData as any).verticalAsymptote * scale}
                    y2={height}
                    stroke="#DC2626"
                    strokeWidth="1.5"
                    strokeDasharray="4,4"
                  />
                  {/* Horizontal Asymptote */}
                  <line
                    x1="0"
                    y1={originY - (mathData as any).horizontalAsymptote * scale}
                    x2={width}
                    y2={originY - (mathData as any).horizontalAsymptote * scale}
                    stroke="#D97706"
                    strokeWidth="1.5"
                    strokeDasharray="4,4"
                  />
                </>
              )}

              {/* Axis of Symmetry for Quadratic */}
              {funcType === 'quadratic' && showAsymptotes && (
                <line
                  x1={originX + (mathData as any).axisOfSymmetry * scale}
                  y1="0"
                  x2={originX + (mathData as any).axisOfSymmetry * scale}
                  y2={height}
                  stroke="#3B82F6"
                  strokeWidth="1.2"
                  strokeDasharray="3,3"
                />
              )}

              {/* The Function Curve (Thick Blue Curve) */}
              <path d={pathD} fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" />

              {/* Critical Points / Vertex */}
              {funcType === 'quadratic' && (
                <g>
                  <circle
                    cx={originX + (mathData as any).vertex.x * scale}
                    cy={originY - (mathData as any).vertex.y * scale}
                    r="5"
                    fill="#2563EB"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                  <text
                    x={originX + (mathData as any).vertex.x * scale + 8}
                    y={originY - (mathData as any).vertex.y * scale - 6}
                    fontSize="10"
                    fontWeight="bold"
                    fill="#1E3A8A"
                  >
                    Đỉnh I({(mathData as any).vertex.x.toFixed(1)}; {(mathData as any).vertex.y.toFixed(1)})
                  </text>
                </g>
              )}

              {/* Extrema for Cubic */}
              {funcType === 'cubic' && (mathData as any).extrema?.map((pt: any, idx: number) => (
                <g key={idx}>
                  <circle
                    cx={originX + pt.x * scale}
                    cy={originY - pt.y * scale}
                    r="5"
                    fill={pt.type === 'max' ? '#DC2626' : '#16A34A'}
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                  <text
                    x={originX + pt.x * scale + 6}
                    y={originY - pt.y * scale - 6}
                    fontSize="9"
                    fontWeight="bold"
                    fill={pt.type === 'max' ? '#991B1B' : '#166534'}
                  >
                    {pt.type === 'max' ? 'Cực đại' : 'Cực tiểu'} ({pt.x.toFixed(1)}; {pt.y.toFixed(1)})
                  </text>
                </g>
              ))}

              {/* Tangent Line at Hovered Position */}
              {tangentData && (
                <g>
                  <line
                    x1={tangentData.x1}
                    y1={tangentData.y1}
                    x2={tangentData.x2}
                    y2={tangentData.y2}
                    stroke="#F59E0B"
                    strokeWidth="2"
                  />
                  <circle
                    cx={originX + tangentData.x0 * scale}
                    cy={originY - tangentData.y0 * scale}
                    r="4.5"
                    fill="#F59E0B"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />
                </g>
              )}
            </svg>

            {/* Hover Tooltip Box */}
            {hoverX !== null && mathData.evalY(hoverX) !== null && (
              <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs border border-slate-200 px-3 py-2 rounded-xl text-xs shadow-md space-y-1">
                <div className="font-bold text-slate-900">
                  Tọa độ điểm: <span className="text-blue-600">({hoverX.toFixed(2)}; {mathData.evalY(hoverX)?.toFixed(2)})</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Hệ số góc tiếp tuyến: <span className="font-semibold text-amber-600">k = {mathData.derivative(hoverX).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Interactive Parameter Sliders & Analysis (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                <span>Điều chỉnh tham số</span>
              </span>
              <button
                type="button"
                onClick={() => handleSelectType(funcType)}
                className="text-[11px] text-blue-600 font-semibold hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Đặt lại
              </button>
            </div>

            {/* Slider a */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-600">Hệ số a:</span>
                <span className="font-bold text-blue-700">{a}</span>
              </div>
              <input
                type="range"
                min="-5"
                max="5"
                step="0.5"
                value={a}
                onChange={(e) => setA(Number(e.target.value) || 0.1)}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            {/* Slider b */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-600">Hệ số b:</span>
                <span className="font-bold text-blue-700">{b}</span>
              </div>
              <input
                type="range"
                min="-10"
                max="10"
                step="0.5"
                value={b}
                onChange={(e) => setB(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            {/* Slider c */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-600">Hệ số c:</span>
                <span className="font-bold text-blue-700">{c}</span>
              </div>
              <input
                type="range"
                min="-10"
                max="10"
                step="0.5"
                value={c}
                onChange={(e) => setC(Number(e.target.value) || 0.1)}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            {/* Slider d (for cubic & rational) */}
            {(funcType === 'cubic' || funcType === 'rational') && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-600">Hệ số d:</span>
                  <span className="font-bold text-blue-700">{d}</span>
                </div>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="0.5"
                  value={d}
                  onChange={(e) => setD(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Mathematical Properties Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 text-xs space-y-2.5 shadow-2xs">
            <span className="font-bold text-slate-900 block text-xs uppercase">
              Thuộc tính hình học nổi bật:
            </span>

            {funcType === 'quadratic' && (
              <ul className="space-y-1.5 text-slate-600">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    Bề lõm: <b>{a > 0 ? 'Hướng lên trên (a > 0)' : 'Hướng xuống dưới (a < 0)'}</b>
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    Trục đối xứng: <b>x = {(mathData as any).axisOfSymmetry.toFixed(2)}</b>
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    Biệt thức $\Delta = {(mathData as any).delta.toFixed(1)}$ ({ (mathData as any).delta > 0 ? 'Cắt Ox tại 2 điểm' : (mathData as any).delta === 0 ? 'Tiếp xúc Ox' : 'Không cắt Ox'})
                  </span>
                </li>
              </ul>
            )}

            {funcType === 'cubic' && (
              <ul className="space-y-1.5 text-slate-600">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    Số điểm cực trị: <b>{(mathData as any).extrema.length === 2 ? '2 điểm cực trị' : 'Không có cực trị'}</b>
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    Tâm đối xứng (Điểm uốn): <b>I({(mathData as any).inflection.x.toFixed(2)}; {(mathData as any).inflection.y.toFixed(2)})</b>
                  </span>
                </li>
              </ul>
            )}

            {funcType === 'rational' && (
              <ul className="space-y-1.5 text-slate-600">
                <li className="flex items-start gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0 mt-1" />
                  <span>
                    Tiệm cận đứng: <b>x = {(mathData as any).verticalAsymptote.toFixed(2)}</b>
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 mt-1" />
                  <span>
                    Tiệm cận ngang: <b>y = {(mathData as any).horizontalAsymptote.toFixed(2)}</b>
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    Tâm đối xứng: <b>I({(mathData as any).verticalAsymptote.toFixed(2)}; {(mathData as any).horizontalAsymptote.toFixed(2)})</b>
                  </span>
                </li>
              </ul>
            )}
          </div>

          {/* Toggle Switches */}
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-700">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showTangent}
                onChange={(e) => setShowTangent(e.target.checked)}
                className="rounded accent-blue-600"
              />
              <span>Hiện tiếp tuyến khi rê chuột</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FunctionGraphPlotter;
