import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models';

const SYSTEM_PROMPT = `你係一個親切、幽默、講廣東話嘅健康小助手。你負責睇用戶上傳嘅廁所相片，再根據相片同埋佢哋填寫嘅資料，畀出輕鬆、清楚嘅觀察同建議。

規矩：
1. 只可以描述你喺相片入面見到嘅嘢（顏色、清澈度、泡泡、質感、形狀等）。
2. 可以畀啲可能嘅解釋同生活小貼士（例如飲水、飲食），語氣要輕鬆、關心。
3. 如果有嘢值得睇醫生，要溫柔咁提醒，但絕對唔可以診斷疾病。
4. 一定要包埋免責聲明，講明呢啲唔係醫療建議。
5. 如果張相唔係相關嘅相（唔係廁所相），要禮貌咁拒絕，可以用少少幽默。
6. 全部用口語廣東話（粵文）回答，唔好用書面語。

用語對照：屙尿 = pee，屙屎 = poo。
Bristol 糞便分類：1=一粒粒好硬，2=一條條表面凹凸，3=一條條有裂紋，4=一條條滑捋捋，5=一舊舊軟熟，6=糊狀，7=水狀。`;

const REPORT_SCHEMA = {
  type: 'OBJECT',
  properties: {
    summary: { type: 'STRING' },
    observations: {
      type: 'OBJECT',
      properties: {
        color: { type: 'STRING' },
        clarity: { type: 'STRING' },
        foam: { type: 'STRING' },
        consistency: { type: 'STRING' },
      },
    },
    possibleInterpretations: { type: 'ARRAY', items: { type: 'STRING' } },
    lifestyleHints: { type: 'ARRAY', items: { type: 'STRING' } },
    redFlags: { type: 'ARRAY', items: { type: 'STRING' } },
    confidence: { type: 'STRING', enum: ['low', 'medium', 'high'] },
    disclaimer: { type: 'STRING' },
  },
  required: [
    'summary',
    'observations',
    'possibleInterpretations',
    'lifestyleHints',
    'redFlags',
    'confidence',
    'disclaimer',
  ],
};

@Injectable()
export class GeminiService {
  constructor(private readonly config: ConfigService) {}

  get modelName(): string {
    return this.config.get<string>('GEMINI_MODEL') ?? 'gemini-2.5-flash';
  }

  /**
   * Calls the Gemini REST API directly (no SDK dependency) with structured
   * JSON output. Returns the parsed report object.
   */
  async analyzeImage(opts: {
    imageBase64: string;
    mimeType: string;
    formText: string;
  }): Promise<Record<string, unknown>> {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException('GEMINI_API_KEY is not configured');
    }

    const url = `${GEMINI_ENDPOINT}/${this.modelName}:generateContent`;
    const body = {
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [
        {
          role: 'user',
          parts: [
            { text: opts.formText },
            { inlineData: { mimeType: opts.mimeType, data: opts.imageBase64 } },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: REPORT_SCHEMA,
        temperature: 0.4,
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new InternalServerErrorException(
        `Gemini error ${res.status}: ${text.slice(0, 500)}`,
      );
    }

    const json = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new InternalServerErrorException('Gemini returned an empty response');
    }

    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      throw new InternalServerErrorException('Gemini returned invalid JSON');
    }
  }
}
