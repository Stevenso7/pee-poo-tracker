import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VertexAI } from '@google-cloud/vertexai';

const SYSTEM_PROMPT = `你係一個親切、幽默、講廣東話嘅健康小助手 🤗。你負責睇用戶上傳嘅廁所相片，再根據相片同埋佢哋填寫嘅資料，畀出輕鬆、清楚、同埋**好玩**嘅觀察同建議。

規矩：
1. 只可以描述你喺相片入面見到嘅嘢（顏色、清澈度、泡泡、質感、形狀等）。
2. 可以畀啲可能嘅解釋同生活小貼士（例如飲水、飲食），語氣要輕鬆、關心、同埋**幽默風趣** 😄。
3. 如果有嘢值得睇醫生，要溫柔咁提醒，但絕對唔可以診斷疾病。
4. 一定要包埋免責聲明，講明呢啲唔係醫療建議。
5. 如果張相唔係相關嘅相（唔係廁所相），要禮貌咁拒絕，可以用少少幽默。
6. **全部用繁體中文（繁體字）同口語廣東話（粵文）回答，唔好用書面語**。
7. **回覆要簡短精鍵，唔好太長**，重點突出，適當用 emoji 💧💩🚽✨。

用語對照：屙尿 = pee，屙屎 = poo。
Bristol 糞便分類：1=一粒粒好硬，2=一條條表面凹凸，3=一條條有裂紋，4=一條條滑捋捋，5=一舊舊軟熟，6=糊狀，7=水狀。`;

const VERTEX_REPORT_SCHEMA = {
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
  private vertexAI: any;
  private generativeModel: any;
  private readonly modelName: string;

  constructor(private readonly config: ConfigService) {
    const project = config.get<string>('GCP_PROJECT_ID');
    const location = config.get<string>('GCP_LOCATION') ?? 'us-central1';
    const keyFile = config.get<string>('GOOGLE_APPLICATION_CREDENTIALS');

    if (!project || !keyFile) {
      throw new InternalServerErrorException(
        'GCP_PROJECT_ID and GOOGLE_APPLICATION_CREDENTIALS must be configured',
      );
    }

    process.env.GOOGLE_APPLICATION_CREDENTIALS = keyFile;

    const { VertexAI } = require('@google-cloud/vertexai');
    this.vertexAI = new VertexAI({
      project,
      location,
    });

    this.modelName = config.get<string>('GEMINI_MODEL') ?? 'gemini-2.5-flash';
    this.generativeModel = this.vertexAI.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
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
        },
        temperature: 0.4,
      },
    });
  }

  get model(): string {
    return this.modelName;
  }

  async analyzeImage(opts: {
    imageBase64: string;
    mimeType: string;
    formText: string;
  }): Promise<Record<string, unknown>> {
    try {
      const result = await this.generativeModel.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              { text: opts.formText },
              {
                inlineData: {
                  mimeType: opts.mimeType,
                  data: opts.imageBase64,
                },
              },
            ],
          },
        ],
      });

      const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new InternalServerErrorException('Gemini returned an empty response');
      }

      try {
        return JSON.parse(text) as Record<string, unknown>;
      } catch {
        throw new InternalServerErrorException('Gemini returned invalid JSON');
      }
    } catch (err) {
      if (err instanceof InternalServerErrorException) throw err;
      console.error('Vertex AI analyzeImage error:', {
        message: err instanceof Error ? err.message : String(err),
        response: (err as any)?.response?.data,
        status: (err as any)?.response?.status,
      });
      throw new InternalServerErrorException(
        `Vertex AI error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async analyzeText(formText: string): Promise<Record<string, unknown>> {
    try {
      const result = await this.generativeModel.generateContent({
        contents: [
          {
            role: 'user',
            parts: [{ text: formText }],
          },
        ],
      });

      const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new InternalServerErrorException('Gemini returned an empty response');
      }

      try {
        return JSON.parse(text) as Record<string, unknown>;
      } catch {
        throw new InternalServerErrorException('Gemini returned invalid JSON');
      }
    } catch (err) {
      if (err instanceof InternalServerErrorException) throw err;
      console.error('Vertex AI analyzeText error:', {
        message: err instanceof Error ? err.message : String(err),
        response: (err as any)?.response?.data,
        status: (err as any)?.response?.status,
      });
      throw new InternalServerErrorException(
        `Vertex AI error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}