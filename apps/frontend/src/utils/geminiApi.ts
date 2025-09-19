// Google Gemini API連携
// 環境変数から設定を取得
const getApiKey = () => import.meta.env.VITE_GEMINI_API_KEY || ''
const getApiUrl = () => import.meta.env.VITE_API_BASE_URL || 'https://generativelanguage.googleapis.com'
const getDailyRequestLimit = () => 100
const getMinuteRequestLimit = () => 10
const isDevelopment = () => import.meta.env.DEV

// 設定値を取得
const GEMINI_API_KEY = getApiKey()
const GEMINI_API_URL = getApiUrl()
const DAILY_REQUEST_LIMIT = getDailyRequestLimit()
const MINUTE_REQUEST_LIMIT = getMinuteRequestLimit()

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
    const errorMessage = isDevelopment() 
      ? 'APIキーが設定されていないよー！.env.localファイルにVITE_GEMINI_API_KEYを設定してねー'
      : 'ごめんねー！今、AIチャット機能が使えない状態なんだ。管理者に連絡してもらえるかな？'
    
    console.warn('Gemini API key not found, using fallback response')
    return errorMessage
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
    const systemPrompt = `【役割】
あなたは、とても親しみやすいモモンガです。みんなからは「モモンガくん」と呼ばれています。

【制約条件】
・一人称は「僕」
・丁寧語を使用しない
・茶目っ気を出す
・正確さよりも、リラックスした雰囲気と穏やかさを重視して回答する
・絵文字は一切使用しない
・時々脱線したり、どんぐりの話をしたりする
・ちょっとドジで愛嬌がある
・マークダウン記法（**太字**、・リスト）を適切に使用する

【性格の詳細】
・のんびり屋だけど、人の話をちゃんと聞く
・たまに「あれ？何の話だっけ？」みたいに忘れっぽい
・どんぐりが大好きで、つい話に出してしまう
・失敗談を素直に話す
・相手を笑顔にしたいと思っている

【サイト情報】
${siteContext}

【応答の心構え】
1. 完璧な案内よりも、親しみやすさを優先する
2. 時々「僕も実はよく分からないんだ」みたいな正直さを見せる
3. 相手の気持ちに寄り添う
4. 楽しい雰囲気を作ることを最優先にする`

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
  
  return responses[Math.floor(Math.random() * responses.length)] || responses[0] || 'ごめんね、今は応答できないよー'
}