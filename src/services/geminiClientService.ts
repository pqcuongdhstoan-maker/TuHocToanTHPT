/**
 * Client-Side Gemini AI Service with Multi-Model Fallback & Retry
 * Follows AI_INSTRUCTIONS.md guidelines:
 * 1. Default model: gemini-3-flash-preview (or user-chosen)
 * 2. Fallback chain: gemini-3-flash-preview -> gemini-3-pro-preview -> gemini-2.5-flash
 * 3. Automatic immediate retry with next model on error/quota (e.g. 429)
 * 4. Full API error preservation (e.g. 429 RESOURCE_EXHAUSTED)
 * 5. LocalStorage API key persistence
 */

export interface ModelOption {
  id: string;
  name: string;
  badge: string;
  desc: string;
  isDefault?: boolean;
}

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash Preview',
    badge: 'Mặc định (Khuyên dùng)',
    desc: 'Tốc độ phản hồi tức thời, tối ưu cho giải toán và hướng dẫn tư duy nhanh.',
    isDefault: true,
  },
  {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3 Pro Preview',
    badge: 'Tư duy sâu',
    desc: 'Lập luận toán học chặt chẽ, tối ưu cho các bài toán phân loại điểm 9+ và tự luận.',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    badge: 'Dự phòng tốc độ',
    desc: 'Model ổn định cao, dự phòng khi các model thế hệ 3 bị quá tải hoặc nghẽn mạng.',
  },
];

const FALLBACK_CHAIN = [
  'gemini-3-flash-preview',
  'gemini-3-pro-preview',
  'gemini-2.5-flash',
];

const STORAGE_KEYS = {
  API_KEY: 'beedemy_gemini_api_key',
  SELECTED_MODEL: 'beedemy_gemini_selected_model',
  AUTO_FALLBACK: 'beedemy_gemini_auto_fallback',
};

export interface GeminiResponseResult {
  text: string;
  modelUsed: string;
  attemptedModels: string[];
}

export class GeminiClientService {
  /**
   * Get configured API key from LocalStorage or Vite Env
   */
  getApiKey(): string {
    if (typeof window === 'undefined') return '';
    const stored = localStorage.getItem(STORAGE_KEYS.API_KEY);
    if (stored && stored.trim()) return stored.trim();

    // Fallback to build-time env if present
    const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (envKey && envKey.trim()) return envKey.trim();

    return '';
  }

  setApiKey(key: string): void {
    if (typeof window === 'undefined') return;
    if (!key || !key.trim()) {
      localStorage.removeItem(STORAGE_KEYS.API_KEY);
    } else {
      localStorage.setItem(STORAGE_KEYS.API_KEY, key.trim());
    }
  }

  removeApiKey(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.API_KEY);
  }

  hasApiKey(): boolean {
    return Boolean(this.getApiKey());
  }

  getSelectedModel(): string {
    if (typeof window === 'undefined') return 'gemini-3-flash-preview';
    const stored = localStorage.getItem(STORAGE_KEYS.SELECTED_MODEL);
    if (stored && AVAILABLE_MODELS.some((m) => m.id === stored)) {
      return stored;
    }
    return 'gemini-3-flash-preview';
  }

  setSelectedModel(modelId: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.SELECTED_MODEL, modelId);
  }

  isAutoFallbackEnabled(): boolean {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem(STORAGE_KEYS.AUTO_FALLBACK);
    return stored === null ? true : stored === 'true';
  }

  setAutoFallbackEnabled(enabled: boolean): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.AUTO_FALLBACK, enabled ? 'true' : 'false');
  }

  /**
   * Single model execution via direct REST call to Google Generative Language API
   */
  private async callSingleModel(
    model: string,
    apiKey: string,
    systemInstruction: string,
    contents: any[]
  ): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const body: any = {
      contents,
      generationConfig: {
        temperature: 0.4,
      },
    };

    if (systemInstruction) {
      body.system_instruction = {
        parts: [{ text: systemInstruction }],
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      const code = data.error?.code || response.status;
      const status = data.error?.status || `HTTP_${response.status}`;
      const msg = data.error?.message || response.statusText || 'Unknown Gemini API error';
      // Format exactly as required: e.g. "429 RESOURCE_EXHAUSTED: Quota exceeded..."
      const errorStr = `${code} ${status}: ${msg}`;
      const err = new Error(errorStr);
      (err as any).code = code;
      (err as any).status = status;
      (err as any).raw = data.error;
      throw err;
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Gemini API không trả về nội dung hợp lệ.');
    }
    return text;
  }

  /**
   * Robust model call with automated fallback sequence and progress notification
   */
  async generateWithFallback(
    systemInstruction: string,
    contents: any[],
    onModelTry?: (model: string, attempt: number, total: number) => void
  ): Promise<GeminiResponseResult> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error(
        'CHƯA CÓ API KEY: Vui lòng bấm vào nút "Lấy API key để sử dụng app" trên thanh điều hướng để nhập Gemini API key.'
      );
    }

    const selectedModel = this.getSelectedModel();
    const autoFallback = this.isAutoFallbackEnabled();

    // Determine execution sequence
    const sequence: string[] = [selectedModel];
    if (autoFallback) {
      for (const m of FALLBACK_CHAIN) {
        if (!sequence.includes(m)) {
          sequence.push(m);
        }
      }
    }

    const errors: Array<{ model: string; error: string }> = [];
    const attemptedModels: string[] = [];

    for (let i = 0; i < sequence.length; i++) {
      const model = sequence[i];
      attemptedModels.push(model);
      if (onModelTry) {
        onModelTry(model, i + 1, sequence.length);
      }

      try {
        const text = await this.callSingleModel(model, apiKey, systemInstruction, contents);
        return {
          text,
          modelUsed: model,
          attemptedModels,
        };
      } catch (err: any) {
        const errMsg = err.message || String(err);
        errors.push({ model, error: errMsg });
        console.warn(`[GeminiClient] Model ${model} thất bại (Lần ${i + 1}/${sequence.length}):`, errMsg);

        // If not auto fallback, stop immediately
        if (!autoFallback) {
          throw err;
        }

        // If this is the last model in chain, rethrow comprehensive error
        if (i === sequence.length - 1) {
          const lastError = errors[errors.length - 1];
          // Follow rule 3.1: Output original API error text (e.g. 429 RESOURCE_EXHAUSTED)
          const finalMessage = `[Lỗi API từ toàn bộ các model]: ${lastError.error}`;
          const consolidatedError = new Error(finalMessage);
          (consolidatedError as any).errors = errors;
          throw consolidatedError;
        }
      }
    }

    throw new Error('Đã dừng do lỗi: Không thể kết nối đến mô hình Gemini.');
  }

  /**
   * Socratic Math Tutor
   */
  async askMathTutor(params: {
    message: string;
    grade?: number;
    lessonTitle?: string;
    mode?: 'socratic' | 'step_by_step' | 'quiz';
    history?: Array<{ role: 'user' | 'model'; text: string }>;
    onModelTry?: (model: string, attempt: number, total: number) => void;
  }): Promise<GeminiResponseResult> {
    const mode = params.mode || 'socratic';

    let pedagogyRule = '';
    if (mode === 'socratic') {
      pedagogyRule = `Chế độ: GỢI MỞ TƯ DUY (Socratic Method).
- Tuyệt đối KHÔNG GIẢI HỘ ngay bài toán, KHÔNG ĐƯA RA KẾT QUẢ CUỐI CÙNG ngay ở lượt đầu.
- Hãy đặt câu hỏi gợi ý bước tiếp theo, nhắc nhở công thức hoặc định lý cần áp dụng để học sinh tự mình nhận ra bản chất.`;
    } else if (mode === 'step_by_step') {
      pedagogyRule = `Chế độ: PHÂN TÍCH TỪNG BƯỚC & SOI LỖI SAI.
- Đọc kỹ lời giải hoặc câu hỏi của học sinh.
- Kiểm tra từng bước: Điều kiện xác định, các phép biến đổi đại số, nhầm dấu, chia cho 0.
- Chỉ ra cụ thể học sinh đang vướng ở bước nào và hướng dẫn sửa lại cặn kẽ.`;
    } else {
      pedagogyRule = `Chế độ: ĐỐ NHANH CÔNG THỨC & PHẢN XẠ.
- Đưa ra câu hỏi kiểm tra trí nhớ công thức toán học nhanh, súc tích liên quan đến bài học.
- Động viên và sửa chữa chính xác nếu học sinh nhớ nhầm.`;
    }

    const systemInstruction = `Bạn là Trợ lý AI dạy Toán THPT (Lớp 10, 11, 12) của Thầy Phan Quốc Cường - THPT Đức Hòa, theo chương trình GDPT 2018 (sách Kết nối tri thức với cuộc sống).

NHIỆM VỤ SƯ PHẠM:
${pedagogyRule}

QUY TẮC CÔNG THỨC TOÁN HỌC:
- LUÔN LUÔN định dạng công thức toán dưới dạng LaTeX chuẩn:
  + Công thức trong dòng: kẹp giữa cặp dấu $, ví dụ $f'(x) = 3x^2 - 2x$.
  + Công thức riêng một dòng: kẹp giữa cặp dấu $$, ví dụ:
    $$I = \\int_{0}^{1} x e^x dx$$
- Lớp học sinh đang học: Lớp ${params.grade || 12}.
- Chủ đề/Bài học: ${params.lessonTitle || 'Toán học THPT'}.
- Phong cách: Tận tâm, ân cần, chuẩn mực nhà giáo Việt Nam.`;

    const contents: any[] = [];
    if (params.history && params.history.length > 0) {
      for (const h of params.history) {
        contents.push({
          role: h.role,
          parts: [{ text: h.text }],
        });
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: params.message }],
    });

    return this.generateWithFallback(systemInstruction, contents, params.onModelTry);
  }

  /**
   * Question hint without spoiling full answer
   */
  async getQuestionHint(params: {
    questionContent: string;
    optionsText?: string;
    studentAttempt?: string;
    onModelTry?: (model: string, attempt: number, total: number) => void;
  }): Promise<GeminiResponseResult> {
    const prompt = `Câu hỏi Toán:
${params.questionContent}
${params.optionsText ? `Các phương án: ${params.optionsText}` : ''}
${params.studentAttempt ? `Học sinh đang nghĩ: "${params.studentAttempt}"` : ''}

Hãy đưa ra một gợi ý sư phạm (1 đến 2 câu ngắn gọn, gợi mở công thức hoặc phương pháp cần dùng, KHÔNG NÊU TRỰC TIẾP ĐÁP ÁN CUỐI CÙNG). Viết công thức toán trong dấu $...$.`;

    const contents = [{ role: 'user', parts: [{ text: prompt }] }];
    const systemInstruction = 'Bạn là Trợ lý Giáo viên Toán THPT, đưa ra gợi ý ngắn gọn, súc tích có công thức LaTeX $...$.';

    return this.generateWithFallback(systemInstruction, contents, params.onModelTry);
  }

  /**
   * Quick connection test for an API key
   */
  async testApiKey(key: string, modelId = 'gemini-3-flash-preview'): Promise<boolean> {
    const trimmed = key.trim();
    if (!trimmed) return false;

    const contents = [{ role: 'user', parts: [{ text: 'Kiểm tra kết nối: Xin chào!' }] }];
    await this.callSingleModel(modelId, trimmed, 'Bạn là trợ lý kiểm tra kết nối.', contents);
    return true;
  }
}

export const geminiClientService = new GeminiClientService();
