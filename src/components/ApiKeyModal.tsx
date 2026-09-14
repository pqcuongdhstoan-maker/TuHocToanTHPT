import React, { useState, useEffect } from 'react';
import {
  Key,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Cpu,
  RefreshCw,
  Sparkles,
  Zap,
  Brain,
  ShieldCheck,
  X,
  Copy,
  Trash2,
} from 'lucide-react';
import {
  geminiClientService,
  AVAILABLE_MODELS,
  ModelOption,
} from '../services/geminiClientService';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved?: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onKeySaved,
}) => {
  const [apiKey, setApiKey] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3-flash-preview');
  const [autoFallback, setAutoFallback] = useState<boolean>(true);

  // Testing connection state
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setApiKey(geminiClientService.getApiKey());
      setSelectedModel(geminiClientService.getSelectedModel());
      setAutoFallback(geminiClientService.isAutoFallbackEnabled());
      setTestStatus('idle');
      setTestMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      setTestStatus('error');
      setTestMessage('Vui lòng nhập API key trước khi kiểm tra.');
      return;
    }

    setTestStatus('testing');
    setTestMessage('Đang kết nối thử nghiệm đến Google Gemini API...');

    try {
      await geminiClientService.testApiKey(apiKey, selectedModel);
      setTestStatus('success');
      setTestMessage(`Kết nối thành công đến mô hình ${selectedModel}! Key hợp lệ.`);
    } catch (err: any) {
      setTestStatus('error');
      // Follow rule 3.1: Output original API error text
      setTestMessage(err.message || 'Lỗi không xác định khi kết nối đến Gemini API.');
    }
  };

  const handleSave = () => {
    geminiClientService.setApiKey(apiKey);
    geminiClientService.setSelectedModel(selectedModel);
    geminiClientService.setAutoFallbackEnabled(autoFallback);

    if (onKeySaved) {
      onKeySaved();
    }
    onClose();
  };

  const handleRemove = () => {
    geminiClientService.removeApiKey();
    setApiKey('');
    setTestStatus('idle');
    setTestMessage('');
    if (onKeySaved) {
      onKeySaved();
    }
  };

  const getModelIcon = (id: string) => {
    if (id.includes('pro')) return <Brain className="w-5 h-5 text-purple-600" />;
    if (id.includes('2.5')) return <ShieldCheck className="w-5 h-5 text-emerald-600" />;
    return <Zap className="w-5 h-5 text-blue-600" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full p-6 sm:p-8 space-y-6 my-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Thiết Lập Model & API Key Gemini
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cấu hình API Key cá nhân và mô hình AI để sử dụng toàn bộ tính năng Trợ lý Toán
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instructions banner: Get Key from Google AI Studio */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-4 space-y-3">
          <div className="flex items-start justify-between gap-2 flex-wrap sm:flex-nowrap">
            <div className="space-y-1">
              <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Hướng dẫn lấy API Key miễn phí (Google AI Studio)
              </span>
              <p className="text-xs text-slate-600 leading-relaxed">
                Mỗi tài khoản Google đều được cấp API Key hoàn toàn miễn phí với hạn mức sử dụng cao. Bạn chỉ cần truy cập và bấm <strong>"Create API key"</strong>.
              </p>
            </div>
            <a
              href="https://aistudio.google.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
            >
              <span>Lấy API key tại AI Studio</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Input API Key */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
              <span>Google Gemini API Key</span>
              <span className="text-rose-500">*</span>
            </label>
            {apiKey && (
              <button
                type="button"
                onClick={handleRemove}
                className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition"
              >
                <Trash2 className="w-3 h-3" />
                <span>Xóa key đã lưu</span>
              </button>
            )}
          </div>

          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setTestStatus('idle');
              }}
              placeholder="Dán mã API Key của bạn (ví dụ: AIzaSy...)"
              className="w-full pl-4 pr-24 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition"
                title={showKey ? 'Ẩn key' : 'Hiện key'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testStatus === 'testing' || !apiKey.trim()}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-blue-700 border border-slate-200 rounded-xl text-[11px] font-bold transition disabled:opacity-50 flex items-center gap-1 shadow-2xs"
              >
                {testStatus === 'testing' ? (
                  <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
                ) : (
                  <Cpu className="w-3 h-3 text-blue-600" />
                )}
                <span>Test</span>
              </button>
            </div>
          </div>

          {/* Connection Test Result */}
          {testStatus === 'success' && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{testMessage}</span>
            </div>
          )}

          {testStatus === 'error' && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs font-semibold text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="break-all">{testMessage}</span>
            </div>
          )}
        </div>

        {/* Model Selection (Cards layout as specified in AI_INSTRUCTIONS.md) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold uppercase text-slate-700 tracking-wider">
              Chọn Mô Hình AI Khởi Đầu (Cards)
            </label>
            <span className="text-[11px] text-slate-400 font-medium">
              Thứ tự ưu tiên chuẩn AI Studio
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {AVAILABLE_MODELS.map((model) => {
              const isSelected = selectedModel === model.id;
              return (
                <div
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/60 shadow-md shadow-blue-500/10'
                      : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-xl bg-white shadow-2xs">
                        {getModelIcon(model.id)}
                      </div>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          model.isDefault
                            ? 'bg-blue-100 text-blue-800'
                            : isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {model.badge}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900 leading-snug">
                        {model.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-3">
                        {model.desc}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] font-bold">
                    <div
                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <span className={isSelected ? 'text-blue-700 font-black' : 'text-slate-400'}>
                      {isSelected ? 'Đang chọn' : 'Chọn model này'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Auto Fallback Mechanism (AI_INSTRUCTIONS.md Section 1) */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-800">
                Tự động Chuyển đổi Model (Auto-Fallback & Retry)
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoFallback}
                onChange={(e) => setAutoFallback(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
            </label>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Nếu model hiện tại gặp lỗi quá tải quota (HTTP 429), hệ thống sẽ ngay lập tức tự động thử lại với model tiếp theo trong chuỗi dự phòng:{' '}
            <strong className="text-slate-700">gemini-3-flash-preview ➔ gemini-3-pro-preview ➔ gemini-2.5-flash</strong> mà không làm gián đoạn câu hỏi của bạn.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/25 flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Lưu & Áp dụng</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
