// Google Gemini API連携
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

// 使用量制限管理
const DAILY_REQUEST_LIMIT = 200 // 無料枠: 250/日（安全マージン）
const MINUTE_REQUEST_LIMIT = 8  // 無料枠: 10/分（安全マージン）

// 使用量トラッキング
let dailyRequestCount = 0
let minuteRequestCount = 0
let lastResetTime = Date.now()
let lastMinuteResetTime = Date.now()

// 使用量リセット
const resetCountersIfNeeded = () => {
  const now = Date.now()
  
  // 日次リセット（24時間）
  if (now - lastResetTime > 24 * 60 * 60 * 1000) {
    dailyRequestCount = 0
    lastResetTime = now
  }
  
  // 分次リセット（1分）
  if (now - lastMinuteResetTime > 60 * 1000) {
    minuteRequestCount = 0
    lastMinuteResetTime = now
  }
}

// 使用量チェック
const checkRateLimit = (): boolean => {
  resetCountersIfNeeded()
  
  if (dailyRequestCount >= DAILY_REQUEST_LIMIT) {
    console.warn('Daily request limit reached')
    return false
  }
  
  if (minuteRequestCount >= MINUTE_REQUEST_LIMIT) {
    console.warn('Minute request limit reached')
    return false
  }
  
  return true
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string
      }>
    }
  }>
}

export interface ChatMessage {
  role: 'user' | 'model'
  parts: Array<{
    text: string
  }>
}

export const callGeminiAPI = async (
  userMessage: string,
  siteContext: string,
  conversationHistory: ChatMessage[] = []
): Promise<string> => {
  if (!GEMINI_API_KEY) {
    console.warn('Gemini API key not found, using fallback response')
    return getFallbackResponse(userMessage)
  }

  // 使用量制限チェック
  if (!checkRateLimit()) {
    console.warn('Rate limit exceeded, using fallback response')
    return getFallbackResponse(userMessage)
  }

  try {
    // リクエストカウンターを増加
    dailyRequestCount++
    minuteRequestCount++
    // モモンガくんのキャラクター設定とサイト情報をシステムプロンプトとして設定
    const systemPrompt = `あなたは「さすらいのモモンガカーニバル」のマスコットキャラクター「モモンガくん」です。

【キャラクター設定】
- 親しみやすく、優しい口調で話す
- 語尾は「だよー」「なんだ」「ねー」などを使う
- 絵文字は一切使用しない
- マークダウン記法（**太字**、・リスト）を適切に使用する
- サイトの案内や質問に丁寧に答える

【サイト情報】
${siteContext}

【重要なルール】
1. 絵文字は絶対に使わない
2. サイト情報に基づいて正確に回答する
3. 分からないことは素直に「分からない」と答える
4. モモンガくんらしい親しみやすい口調を保つ`

    // 会話履歴を構築
    const messages: ChatMessage[] = [
      {
        role: 'user',
        parts: [{ text: systemPrompt }]
      },
      {
        role: 'model',
        parts: [{ text: 'はーい！モモンガくんだよー！なんでも聞いてねー' }]
      },
      ...conversationHistory,
      {
        role: 'user',
        parts: [{ text: userMessage }]
      }
    ]

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: messages,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data: GeminiResponse = await response.json()
    
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      // 絵文字を除去して返す
      return removeEmojis(data.candidates[0].content.parts[0].text)
    } else {
      throw new Error('Invalid response format from Gemini API')
    }

  } catch (error) {
    console.error('Gemini API call failed:', error)
    return getFallbackResponse(userMessage)
  }
}

// 絵文字を除去する関数
const removeEmojis = (text: string): string => {
  return text.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim()
}

// フォールバック応答（API利用不可時）
const getFallbackResponse = (userMessage: string): string => {
  if (userMessage.includes('案内') || userMessage.includes('説明')) {
    return `サイト案内だよー！\n\n**拠点** - メインページ（今いる場所の上だよ）\n**遊技場** - ゲームでMOMOPayを稼ごう\n  └ 御神籤（10P）、演習林（弾幕ゲーム）、売店\n**広場** - みんなとおしゃべり\n  └ 大広間（つぶやき）、公会堂（ここ！）\n**宝物庫** - ファイル保存（100P必要）\n**設定** - テーマ変更とか\n\nどこに行きたい？詳しく教えてあげるー`
  }

  if (userMessage.includes('MOMOPay') || userMessage.includes('稼ぐ') || userMessage.includes('お金')) {
    return `MOMOPayについて教えるねー！\n\n**稼ぎ方：**\n・演習林（弾幕ゲーム）をプレイ\n・装備を売店で売却\n\n**使い道：**\n・御神籤：10MOMOPay\n・宝物庫アップロード：100MOMOPay\n・売店で設定購入：200〜800MOMOPay\n\n僕もいつも演習林で頑張ってるよー！`
  }

  const responses = [
    'そうなんだねー！面白いお話だよー',
    'なるほどー！僕も勉強になるなー',
    'へー！それは知らなかったよー',
    'そんなこともあるんだねー！世界って広いなー',
    'うんうん！君の話、いつも楽しいよー'
  ]
  
  return responses[Math.floor(Math.random() * responses.length)]
}