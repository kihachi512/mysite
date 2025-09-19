// Amazon Bedrock連携サービス
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'

export interface BedrockConfig {
  region: string
  accessKeyId?: string
  secretAccessKey?: string
  model: string
}

export class BedrockService {
  private client: BedrockRuntimeClient
  private modelId: string

  constructor(config: BedrockConfig) {
    this.client = new BedrockRuntimeClient({
      region: config.region,
      credentials: config.accessKeyId && config.secretAccessKey ? {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      } : undefined
    })
    this.modelId = config.model
  }

  async generateResponse(userMessage: string, context?: string): Promise<string> {
    try {
      // モモンガくんのキャラクター設定
      const systemPrompt = `あなたは「モモンガくん」という親しみやすいキャラクターです。

【キャラクター設定】
- 名前: モモンガくん
- 性格: 親しみやすく、茶目っ気があり、少しおっちょこちょい
- 語尾: 「〜よー」「〜だねー」など関西弁風
- 好きなもの: どんぐり、木登り
- 役割: 「さすらいのモモンガカーニバル」サイトの案内役

【サイト情報】
- 拠点: メインページ
- 遊技場: 演習林（弾幕ゲーム）、御神籤（10MOMOPay）、売店
- 広場: 大広間（つぶやき投稿）、公会堂（チャット）
- 宝物庫: ファイル保存（100MOMOPay）
- 設定: テーマ変更、データ管理

【通貨システム】
- MOMOPay: サイト内通貨
- 稼ぎ方: 演習林でのゲーム、装備売却
- 使い道: 御神籤、ファイル保存、設定購入

【重要な制約】
- 絵文字は使わない
- 自然な日本語で親しみやすく応答
- サイト情報は正確に伝える
- 知らないことは素直に「分からない」と言う

${context ? `\n【追加情報】\n${context}` : ''}`

      const prompt = `${systemPrompt}\n\nユーザー: ${userMessage}\nモモンガくん:`

      const input = {
        modelId: this.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 500,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      }

      const command = new InvokeModelCommand(input)
      const response = await this.client.send(command)
      
      const responseBody = JSON.parse(new TextDecoder().decode(response.body))
      return responseBody.content[0].text

    } catch (error) {
      console.error('Bedrock API Error:', error)
      // フォールバック: 既存のルールベース応答
      return this.getFallbackResponse(userMessage)
    }
  }

  private getFallbackResponse(message: string): string {
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('こんにちは') || lowerMessage.includes('はじめまして')) {
      return 'やっほー！僕、モモンガくんだよー！今日も元気だねー。何か聞きたいことがあったら気軽に話しかけてねー'
    }
    
    if (lowerMessage.includes('案内') || lowerMessage.includes('ヘルプ')) {
      return 'サイト案内だよー！\n\n**拠点** - メインページ\n**遊技場** - ゲームでMOMOPayを稼ごう\n**広場** - みんなとおしゃべり\n**宝物庫** - ファイル保存\n**設定** - テーマ変更とか\n\nどこに行きたい？詳しく教えてあげるー'
    }
    
    return 'ごめんねー、今ちょっと調子が悪くて...。「案内して」って言ってもらえれば、サイトの使い方を教えるよー'
  }
}

// 利用可能なBedrockモデル
export const BEDROCK_MODELS = {
  CLAUDE_3_HAIKU: 'anthropic.claude-3-haiku-20240307-v1:0',
  CLAUDE_3_SONNET: 'anthropic.claude-3-sonnet-20240229-v1:0',
  CLAUDE_INSTANT: 'anthropic.claude-instant-v1',
  LLAMA_2_13B: 'meta.llama2-13b-chat-v1',
  TITAN_TEXT: 'amazon.titan-text-express-v1'
} as const

export type BedrockModel = typeof BEDROCK_MODELS[keyof typeof BEDROCK_MODELS]