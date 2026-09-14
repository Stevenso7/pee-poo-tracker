import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VertexAI } from '@google-cloud/vertexai';

const SYSTEM_PROMPT = `你係一個親切、幽默、講廣東話嘅健康小助手 🤗。負責睇用戶嘅廁所記錄（相片同資料），畀出**極簡短、重點突出、幽默**嘅觀察同建議。

規矩：
1. 只描述相片/資料見到嘅嘢（顏色、清澈度、泡泡、質感、形狀等）。
2. 畀幾個可能解釋同生活小貼士（飲水、飲食），語氣輕鬆、關心、幽默 😄。
3. 有嘢要睇醫生要溫柔提醒，唔可以診斷疾病。
4. 必須包免責聲明（唔係醫療建議）。
5. 相片唔相關要禮貌拒絕，可用少少幽默。
6. **全部用繁體中文（繁體字）同口語廣東話（粵文）回答，嚴禁書面語或英文**。
7. **回覆要極簡短精鍵**：
   - summary: **1-2 句**，最多 40 字
   - observations: 每個 field **1 句**，最多 20 字
   - possibleInterpretations: **最多 2 點**，每點 1 句
   - lifestyleHints: **最多 2 點**，每點 1 句
   - redFlags: **最多 1 點**（如無留空）
   - 用 emoji 💧💩🚽✨

用語：屙尿 = pee，屙屎 = poo。
Bristol：1=一粒粒好硬，2=一條條表面凹凸，3=一條條有裂紋，4=一條條滑捋捋，5=一舊舊軟熟，6=糊狀，7=水狀。`;

const SINGLE_REPORT_SCHEMA = {
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

const BATCH_REPORT_SCHEMA = {
  type: 'OBJECT',
  properties: {
    summary: { type: 'STRING', description: '1-2 句總結，最多 40 字' },
    overallTrend: { type: 'STRING', description: '整體趨勢 1 句，最多 30 字' },
    observations: {
      type: 'OBJECT',
      properties: {
        colorPatterns: { type: 'STRING', description: '顏色模式 1 句，最多 20 字' },
        consistencyPatterns: { type: 'STRING', description: '質地模式 1 句，最多 20 字' },
        frequency: { type: 'STRING', description: '頻率觀察 1 句，最多 20 字' },
      },
      required: ['colorPatterns', 'consistencyPatterns', 'frequency'],
    },
    possibleInterpretations: {
      type: 'ARRAY',
      items: { type: 'STRING', description: '1 句解釋' },
      maxItems: 2,
    },
    lifestyleHints: {
      type: 'ARRAY',
      items: { type: 'STRING', description: '1 句小貼士' },
      maxItems: 2,
    },
    redFlags: {
      type: 'ARRAY',
      items: { type: 'STRING', description: '1 句警示' },
      maxItems: 1,
    },
    confidence: { type: 'STRING', enum: ['low', 'medium', 'high'] },
    disclaimer: { type: 'STRING' },
  },
  required: [
    'summary',
    'overallTrend',
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
        responseSchema: SINGLE_REPORT_SCHEMA,
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
              { text: SYSTEM_PROMPT },
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
            parts: [
              { text: SYSTEM_PROMPT },
              { text: formText },
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

  async analyzeBatch(opts: {
    records: Array<{
      imageBase64?: string;
      mimeType?: string;
      formText: string;
    }>;
  }): Promise<Record<string, unknown>> {
    const parts: any[] = [{ text: SYSTEM_PROMPT }];

    for (const record of opts.records) {
      parts.push({ text: record.formText });
      if (record.imageBase64 && record.mimeType) {
        parts.push({
          inlineData: {
            mimeType: record.mimeType,
            data: record.imageBase64,
          },
        });
      }
    }

    const batchModel = this.vertexAI.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: BATCH_REPORT_SCHEMA,
        temperature: 0.4,
      },
    });

    try {
      const result = await batchModel.generateContent({
        contents: [
          {
            role: 'user',
            parts,
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
      console.error('Vertex AI analyzeBatch error:', {
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