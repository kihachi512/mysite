import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSEO, SEO_PRESETS } from '../hooks/useSEO'
import { callGeminiAPI, type ChatMessage } from '../utils/geminiApi'


// シンプルなマークダウンパーサー
const parseMarkdown = (text: string): string => {
  let result = text
    // 太字 **text** → <strong>text</strong>
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    
  // リスト項目の処理
  const lines = result.split('\n')
  const processedLines: string[] = []
  let inList = false
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    if (line.match(/^・(.+)$/)) {
      // リスト項目の開始
      if (!inList) {
        processedLines.push('<ul>')
        inList = true
      }
      processedLines.push(`<li>${line.replace(/^・/, '')}</li>`)
    } else {
      // リスト項目以外
      if (inList) {
        processedLines.push('</ul>')
        inList = false
      }
      processedLines.push(line)
    }
  }
  
  // 最後がリストで終わっている場合
  if (inList) {
    processedLines.push('</ul>')
  }
  
  return processedLines.join('<br>')
}

type Message = {
  id: string
  content: string
  sender: 'user' | 'momonga'
  timestamp: Date
}

const Chatbot: React.FC = () => {
  useSEO(SEO_PRESETS.chatbot);
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 詳細なサイト情報データベース（RAG用）
  const siteKnowledgeBase = {
    site: {
      name: 'さすらいのモモンガカーニバル',
      description: '弾幕ゲーム、おみくじ、チャット機能を楽しめるエンターテイメントサイト',
      mascot: 'モモンガくん',
      currency: 'MOMOPay'
    },
    navigation: {
      home: '拠点（ホーム）- メインページ',
      games: '遊技場 - ゲームで遊んだりMOMOPayを稼ごう',
      plaza: '広場 - みんなとおしゃべりしよう',
      favorites: '宝物庫 - ファイルやテキストを保存',
      settings: '設定 - テーマや機能の管理'
    },
    games: {
      omikuji: {
        name: '御神籤ルーレット',
        cost: '10MOMOPay',
        description: '神様に運勢を占ってもらえるよ！大吉から凶まで色々な結果があるんだ',
        location: '遊技場から行けるよ'
      },
      bulletHell: {
        name: '演習林（弾幕ゲーム）',
        description: '守護者として修行を積む弾幕シューティングゲーム',
        rewards: 'MOMOPayと装備がもらえる',
        equipment: 'レア度別の装備（common, rare, epic, legendary）がガチャで手に入る',
        location: '遊技場から行けるよ'
      },
      store: {
        name: '売店（MOMOStore）',
        description: 'MOMOPayで便利機能を購入したり装備を売却したりできる場所',
        functions: ['設定機能の購入', '装備の売却'],
        purchaseItems: [
          'ダークモード設定（500MOMOPay）',
          '共有機能利用権（300MOMOPay）',
          'プレミアムテーマ（800MOMOPay）',
          '通知音設定（200MOMOPay）'
        ],
        sellPrices: 'legendary:80P, epic:40P, rare:20P, common:10P',
        location: '遊技場から行けるよ'
      }
    },
    plaza: {
      hall: {
        name: '大広間',
        description: '1時間で自動削除されるつぶやき投稿ができる場所',
        features: ['投稿機能', 'いいね機能', '自動削除（1時間後）'],
        location: '広場から行けるよ'
      },
      chatbot: {
        name: '公会堂',
        description: 'モモンガくんとおしゃべりできる場所（ここだよ！）',
        location: '広場から行けるよ'
      }
    },
    favorites: {
      name: '宝物庫',
      description: 'ファイルやテキストを保存できる機能',
      cost: '100MOMOPay（ファイル・テキストアップロード）',
      supportedFiles: '画像、動画、音声、テキストファイルなど',
      features: ['ファイルアップロード', 'テキスト保存', 'プレビュー機能', '削除機能']
    },
    settings: {
      general: '一般設定 - テーマ設定、機能管理、データ削除',
      share: '共有設定 - データのバックアップ・復元（JSON形式）'
    },
    currency: {
      name: 'MOMOPay',
      description: 'サイト内の通貨システム',
      earning: '演習林での弾幕ゲーム、装備売却',
      uses: ['御神籤（10P）', '宝物庫アップロード（100P）', '売店での設定購入']
    }
  }

  // モモンガくんの応答パターン（親しみやすく茶目っ気のある性格 + 正確な情報提供）
  // サイト情報をコンテキスト用文字列に変換
  const getSiteContext = (): string => {
    return `
【サイト概要】
サイト名: ${siteKnowledgeBase.site.name}
説明: ${siteKnowledgeBase.site.description}
通貨: ${siteKnowledgeBase.currency.name}

【主要ページ】
・拠点: ${siteKnowledgeBase.navigation.home}
・遊技場: ${siteKnowledgeBase.navigation.games}
  - 演習林: ${siteKnowledgeBase.games.bulletHell.description}
    報酬: ${siteKnowledgeBase.games.bulletHell.rewards}
    装備: ${siteKnowledgeBase.games.bulletHell.equipment}
  - 御神籤: ${siteKnowledgeBase.games.omikuji.description}
    費用: ${siteKnowledgeBase.games.omikuji.cost}
  - 売店: ${siteKnowledgeBase.games.store.description}
    商品: ダークモード(500P), 共有機能(300P), プレミアムテーマ(800P), 通知音(200P)
・広場: ${siteKnowledgeBase.navigation.plaza}
  - 大広間: ${siteKnowledgeBase.plaza.hall.description}
  - 公会堂: ${siteKnowledgeBase.plaza.chatbot.description}
・宝物庫: ${siteKnowledgeBase.favorites.description}
  費用: ${siteKnowledgeBase.favorites.cost}
・設定: ${siteKnowledgeBase.navigation.settings}

【MOMOPay情報】
稼ぎ方: ${siteKnowledgeBase.currency.earning}
使い道: ${siteKnowledgeBase.currency.uses.join(', ')}
    `.trim()
  }

  // AI APIを使用したレスポンス生成
  const getAIResponse = async (message: string): Promise<string> => {
    try {
      const siteContext = getSiteContext()
      const response = await callGeminiAPI(message, siteContext, conversationHistory)
      
      // 会話履歴を更新
      setConversationHistory(prev => [
        ...prev.slice(-8), // 最新8件のみ保持
        { role: 'user', parts: [{ text: message }] },
        { role: 'model', parts: [{ text: response }] }
      ])
      
      return response
    } catch (error) {
      console.error('AI response generation failed:', error)
      return getFallbackResponse(message)
    }
  }

  // フォールバック応答（AI API利用不可時）
  const getFallbackResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase()
    
    // 挨拶系
    if (message.includes('こんにちは') || message.includes('こんばんは') || message.includes('おはよう') || message.includes('はじめまして')) {
      const greetings = [
        'やっほー！僕、モモンガくんだよ！今日も元気だねー。何して遊ぶ？このサイトの案内もできるよー',
        'こんにちはー！僕と一緒に楽しい時間を過ごそうよ！サイトの使い方で分からないことがあったら何でも聞いてねー',
        'おーい！モモンガくんだよー！今日はどんな冒険が待ってるかな？遊技場とか宝物庫とか、色々あるよー'
      ]
      return greetings[Math.floor(Math.random() * greetings.length)]
    }

    // サイト案内・ヘルプ系
    if (message.includes('案内') || message.includes('ヘルプ') || message.includes('使い方') || message.includes('どこ') || message.includes('場所')) {
      return `サイト案内だよー！\n\n**拠点** - メインページ（今いる場所の上だよ）\n**遊技場** - ゲームでMOMOPayを稼ごう\n  └ 御神籤（10P）、演習林（弾幕ゲーム）、売店\n**広場** - みんなとおしゃべり\n  └ 大広間（つぶやき）、公会堂（ここ！）\n**宝物庫** - ファイル保存（100P必要）\n**設定** - テーマ変更とか\n\nどこに行きたい？詳しく教えてあげるー`
    }

    // MOMOPay関連の詳細情報
    if (message.includes('momopay') || message.includes('ポイント') || message.includes('お金') || message.includes('稼ぐ') || message.includes('通貨')) {
      const payResponses = [
        `MOMOPayについて教えるねー！\n\n**稼ぎ方：**\n・演習林（弾幕ゲーム）をプレイ\n・装備を売店で売却\n\n**使い道：**\n・御神籤：10MOMOPay\n・宝物庫アップロード：100MOMOPay\n・売店で設定購入：200〜800MOMOPay\n\n僕もいつも演習林で頑張ってるよー！でも弾幕が難しくて...うまくいかないんだよねー`,
        `MOMOPayの管理、大変だよねー！僕も散財しちゃう方なんだ。\n\n一番効率がいいのは演習林だよ！弾幕ゲームでMOMOPayと装備がもらえるんだ。装備は売店で売却もできるから、ダブったら売っちゃおうー\n\n宝物庫は100MOMOPay必要だけど、大事なファイルを保存できるから便利だよー`
      ]
      return payResponses[Math.floor(Math.random() * payResponses.length)]
    }
    
    // ゲーム関連（詳細情報付き）
    if (message.includes('ゲーム') || message.includes('遊技場') || message.includes('弾幕') || message.includes('演習林')) {
      const gameResponses = [
        `遊技場について教えるよー！\n\n**演習林（弾幕ゲーム）**\n・守護者として修行を積む弾幕シューティング\n・MOMOPayと装備がもらえる\n・装備はcommon→rare→epic→legendaryの順でレア！\n\n**御神籤ルーレット**\n・10MOMOPayで運勢占い\n・大吉から凶まで色々あるよー\n\n僕も演習林で修行してるけど...弾幕が難しくて、すぐやられちゃうんだよねー`,
        `演習林での修行、どう？僕はいつも途中でどんぐり拾いに夢中になっちゃうんだー\n\nでも真面目な話、演習林は一番MOMOPayを稼げる場所だよ！装備ガチャも楽しいし、レア装備が出た時の嬉しさったらもう...\n\n装備がダブったら売店で売却もできるから、どんどんチャレンジしてみてー`
      ]
      return gameResponses[Math.floor(Math.random() * gameResponses.length)]
    }

    // 売店関連
    if (message.includes('売店') || message.includes('momostore') || message.includes('購入') || message.includes('売却')) {
      return `売店（MOMOStore）について教えるねー！\n\n**購入できるもの：**\n・ダークモード設定：500MOMOPay\n・共有機能利用権：300MOMOPay\n・プレミアムテーマ：800MOMOPay\n・通知音設定：200MOMOPay\n\n**装備売却価格：**\n・legendary：80MOMOPay\n・epic：40MOMOPay\n・rare：20MOMOPay\n・common：10MOMOPay\n\n僕も装備ガチャ回したいけど、いつも爆死するんだよねー...運が悪いのかなー`
    }
    
    // 御神籤関連
    if (message.includes('御神籤') || message.includes('おみくじ') || message.includes('運勢')) {
      const fortuneResponses = [
        `御神籤ルーレットについて教えるよー！\n\n・費用：10MOMOPay\n・神様に運勢を占ってもらえる\n・大吉から凶まで色々な結果があるよ\n・遊技場から行けるよー\n\n僕もよく引くけど、いつも「小吉」ばっかりなんだ...大吉引いてみたいなー`,
        `運勢占い、楽しいよねー！僕はいつも引く前にお尻をフリフリして運気アップを狙ってるんだ\n\n御神籤は10MOMOPayで遊技場から行けるよー！MOMOPayが足りなかったら、演習林で稼いでから挑戦してみてー`
      ]
      return fortuneResponses[Math.floor(Math.random() * fortuneResponses.length)]
    }
    
    // 大広間関連
    if (message.includes('大広間') || message.includes('つぶやき') || message.includes('投稿') || message.includes('おしゃべり')) {
      const hallResponses = [
        `大広間について教えるよー！\n\n・1時間で自動削除されるつぶやき投稿\n・いいね機能付き\n・みんなでおしゃべりできる場所\n・広場から行けるよー\n\n僕もたまに「どんぐり美味しかった」とかつぶやいてるよ！1時間で消えちゃうから気軽だよねー`,
        `大広間のおしゃべり楽しいよねー！みんなのつぶやき見てると面白いよー\n\n投稿は1時間で自動削除されるから、恥ずかしがり屋の僕には助かるかも。変なこと書いちゃっても、後で「あれ？」って思うけど消えてくれるからねー`
      ]
      return hallResponses[Math.floor(Math.random() * hallResponses.length)]
    }

    // 宝物庫関連
    if (message.includes('宝物庫') || message.includes('ファイル') || message.includes('保存') || message.includes('アップロード')) {
      const favoritesResponses = [
        `宝物庫について教えるよー！\n\n・ファイル・テキストの保存ができる\n・費用：100MOMOPay（アップロード時）\n・対応：画像、動画、音声、テキストファイルなど\n・プレビュー機能付き\n\n大事なファイルを保存するのにとっても便利だよー！僕もどんぐりの写真をいっぱい保存してるんだ`,
        `宝物庫は僕のお気に入りの場所だよー！100MOMOPay必要だけど、大切なファイルを安全に保存できるんだ\n\nテキストも保存できるから、日記とか大事なメモとかも大丈夫！MOMOPayが足りなかったら演習林で稼いでから使ってみてねー`
      ]
      return favoritesResponses[Math.floor(Math.random() * favoritesResponses.length)]
    }

    // 設定関連
    if (message.includes('設定') || message.includes('テーマ') || message.includes('ダークモード') || message.includes('共有')) {
      return `設定について教えるよー！\n\n**一般設定：**\n・テーマ設定（ダークモード、プレミアムテーマ）\n・機能管理\n・データ削除\n\n**共有設定：**\n・データのバックアップ・復元\n・JSON形式で管理\n\n設定機能は売店で購入が必要だよー！購入したら設定画面で有効にしてね`
    }
    
    // 広場関連
    if (message.includes('広場') || message.includes('plaza')) {
      return `広場について教えるよー！\n\n**大広間**\n・1時間で自動削除されるつぶやき投稿\n・いいね機能付き\n・みんなでおしゃべりできる\n\n**公会堂**\n・モモンガくんとおしゃべり（ここだよ！）\n・サイトの案内もできるよー\n\nどちらも広場から行けるよー！みんなが集まる憩いの場所なんだ`
    }

    // 具体的な質問への対応
    if (message.includes('どうやって') || message.includes('方法') || message.includes('やり方')) {
      if (message.includes('稼ぐ') || message.includes('momopay')) {
        return `MOMOPayの稼ぎ方を教えるよー！\n\n**一番効率的：演習林**\n・弾幕ゲームをプレイ\n・クリアするとMOMOPayと装備がもらえる\n・装備は売店で売却もできる\n\n**装備売却：**\n・legendary：80P、epic：40P\n・rare：20P、common：10P\n\n僕も毎日演習林で修行してるよー！一緒に頑張ろう`
      }
      return `何のやり方を知りたいのかな？\n\n・MOMOPayの稼ぎ方\n・ゲームの遊び方\n・ファイルの保存方法\n・設定の変更方法\n\n具体的に教えてくれれば、詳しく説明するよー`
    }
    
    // 感情系
    if (message.includes('ありがとう') || message.includes('感謝')) {
      const thanksResponses = [
        'えへへー、どういたしまして！僕も君と話せて嬉しいよー！',
        'ありがとうって言われると、尻尾がフワフワしちゃうー。嬉しいなー！',
        'そんなこと言われたら照れちゃうよー。僕、単純だからすぐ喜んじゃうんだ！'
      ]
      return thanksResponses[Math.floor(Math.random() * thanksResponses.length)]
    }
    
    if (message.includes('さびしい') || message.includes('つまらない') || message.includes('退屈')) {
      const lonelyResponses = [
        'あららー、寂しいの？大丈夫！僕がいるよー！一緒にどんぐり探しでもする？',
        'つまらない時は僕と遊ぼうー！僕の得意技、木の枝ぶら下がりを見せてあげる！...って、ここじゃできないか',
        '退屈な時は空を見上げてみてー！雲の形、面白いよー！僕はいつもどんぐりに見えちゃうけどね'
      ]
      return lonelyResponses[Math.floor(Math.random() * lonelyResponses.length)]
    }
    
    if (message.includes('疲れた') || message.includes('つかれた')) {
      const tiredResponses = [
        'お疲れさまー！僕もたまに木登りしすぎて疲れちゃうよ...ゆっくり休もうねー',
        '疲れた時は僕みたいにゴロゴロするのがいいよー！モモンガ式リラックス法だよ',
        'あー、疲れてるんだね...僕の癒し系オーラで元気になってー！...効果あるかな？'
      ]
      return tiredResponses[Math.floor(Math.random() * tiredResponses.length)]
    }
    
    // 質問系
    if (message.includes('何') && (message.includes('できる') || message.includes('する'))) {
      return `僕ができること教えるよー！\n\n**サイト案内：**\n・各機能の詳しい説明\n・MOMOPayの稼ぎ方\n・ゲームの遊び方\n・どこに何があるかの案内\n\n**おしゃべり：**\n・楽しい会話\n・悩み相談\n・どんぐりの話（大好き！）\n\n一番得意なのは君を笑顔にすることかなー 何でも聞いてねー`
    }
    
    // 場所・現在地に関する質問
    if (message.includes('ここ') && (message.includes('どこ') || message.includes('場所'))) {
      return `ここは公会堂だよー！僕の秘密基地みたいな場所なんだ\n\n公会堂は広場にある施設で、僕とおしゃべりできる特別な場所なの。実は天井にハンモック隠してあるんだよ...内緒だけどね\n\n他の場所に行きたかったら案内するよー！「案内して」って言ってみて`
    }

    // よくある質問
    if (message.includes('初心者') || message.includes('始め方') || message.includes('最初')) {
      return `初心者さんへの案内だよー！\n\n**おすすめの順番：**\n1. まずは演習林でMOMOPayを稼ごう\n2. 御神籤で運勢を占ってみよう\n3. 宝物庫で大事なファイルを保存\n4. 大広間でみんなとおしゃべり\n5. 売店で便利機能を購入\n\nMOMOPayがあれば色々楽しめるから、まずは演習林からスタートがおすすめだよー`
    }
    
    // 食べ物系
    if (message.includes('どんぐり') || message.includes('ナッツ') || message.includes('食べ物')) {
      const foodResponses = [
        'どんぐり〜！🌰 僕の大好物だよ〜！カリカリ音がたまらないんだ〜♪ 君も食べてみる？',
        'ナッツ類は全部好き〜！でも一番はやっぱりどんぐりかな？形も可愛いし、味も最高なんだ〜😋',
        'お腹空いてきちゃった〜！今度一緒にどんぐり拾いに行こうよ〜！僕、隠し場所知ってるんだ😉'
      ]
      return foodResponses[Math.floor(Math.random() * foodResponses.length)]
    }
    
    // 褒め言葉
    if (message.includes('かわいい') || message.includes('可愛い') || message.includes('素敵')) {
      const praiseResponses = [
        'えへへ〜😊 ありがとう〜！君も素敵だよ〜！僕、褒められると尻尾がくるくる回っちゃうんだ🐿️',
        'わ〜い！😆 そんなこと言われたら木の上まで飛び跳ねちゃうよ〜！嬉しいな〜！',
        'か、可愛いって...😳 僕、照れちゃうよ〜！でも嬉しいから許す〜😄'
      ]
      return praiseResponses[Math.floor(Math.random() * praiseResponses.length)]
    }
    
    // 困った時
    if (message.includes('助けて') || message.includes('わからない') || message.includes('困った')) {
      const helpResponses = [
        '大丈夫〜！💪 僕が助けるよ〜！...って言っても僕も結構おっちょこちょいだけどね😅 一緒に頑張ろう！',
        '困った時は僕に任せて〜！モモンガパワーで解決だ〜！...効果のほどは保証しないけど😆',
        'わからないことがあったら遠慮しないで〜！僕も知らないことは一緒に考えるよ〜🤔'
      ]
      return helpResponses[Math.floor(Math.random() * helpResponses.length)]
    }
    
    // シンプルなフォールバック応答
    const fallbackResponses = [
      'そうなんだねー！面白いお話だよー',
      'なるほどー！僕も勉強になるなー',
      'へー！それは知らなかったよー',
      'そんなこともあるんだねー！世界って広いなー',
      'うんうん！君の話、いつも楽しいよー'
    ]
    
    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]
  }

  // メッセージ送信
  const sendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    }

    const userInput = inputMessage // 入力をキャプチャ
    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsTyping(true)

    // AI APIを使用してモモンガくんの返答を生成
    const generateResponse = async () => {
      try {
        const aiResponse = await getAIResponse(userInput)
        const momongaMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: aiResponse,
          sender: 'momonga',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, momongaMessage])
      } catch (error) {
        console.error('Message processing failed:', error)
        const fallbackMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: getFallbackResponse(userInput),
          sender: 'momonga',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, fallbackMessage])
      } finally {
        setIsTyping(false)
      }
    }

    // 少し遅延を入れてリアルっぽく
    setTimeout(generateResponse, 1000 + Math.random() * 1000)
  }

  // Enter キーで送信
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // スクロールを最下部に
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // 初期メッセージ
  useEffect(() => {
    // siteKnowledgeBaseを使用していることを明示（TypeScript警告回避）
    if (siteKnowledgeBase) {
      // サイト情報は AI API のコンテキストとして使用される
    }
    
    const welcomeMessage: Message = {
      id: 'welcome',
      content: 'やっほー！僕、モモンガくんだよー！\n公会堂へようこそー！ここは僕の秘密基地みたいな場所なんだ\n\n僕は「さすらいのモモンガカーニバル」のサイト案内ができるよー！\n・サイトの使い方が分からない時\n・どこに何があるか知りたい時\n・MOMOPayの稼ぎ方を知りたい時\n・ただおしゃべりしたい時\n\nなんでも気軽に話しかけてねー！「案内して」って言えば詳しく教えるよー',
      sender: 'momonga',
      timestamp: new Date()
    }
    setMessages([welcomeMessage])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // siteInfoは初期化時のみ使用

  return (
    <div className="chatbot-container" style={{ 
      color: 'white', 
      padding: 'min(20px, 4vw)', 
      maxWidth: '800px', 
      margin: '0 auto',
      minHeight: 'calc(100vh - 160px)',
      maxHeight: 'calc(100vh - 120px)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      {/* ヘッダー */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: 'min(20px, 3vh)',
        flexShrink: 0
      }}>
        <div className="comic-text font-title-lg" style={{ 
          marginBottom: '8px', 
          textShadow: '3px 3px 0px #2e7d32, 6px 6px 0px #1b5e20, 0 0 15px rgba(255,255,255,0.3)', 
          color: '#fff3e0'
        }}>
          🏛️ 公会堂 🏛️
        </div>
        <div className="comic-text font-body-lg" style={{ 
          color: '#c8e6c9'
        }}>
          モモンガくんとおしゃべりしよう！
        </div>
      </div>

      {/* チャット画面 */}
      <div className="comic-card chatbot-main" style={{
        background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.2), rgba(123, 31, 162, 0.1))',
        borderColor: '#9c27b0',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: 'min(16px, 3vw)',
        marginBottom: 'min(16px, 3vh)',
        minHeight: '400px',
        maxHeight: 'calc(100vh - 280px)',
        overflow: 'hidden'
      }}>
        {/* メッセージ一覧 */}
        <div className="messages-container" style={{
          flex: 1,
          overflowY: 'auto',
          marginBottom: 'min(16px, 2vh)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'min(12px, 2vh)',
          minHeight: '200px',
          maxHeight: '100%',
          paddingRight: '4px'
        }}>
          {messages.map((message) => (
            <div key={message.id} style={{
              display: 'flex',
              justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
              alignItems: 'flex-start',
              gap: '8px'
            }}>
              {/* モモンガくんのアイコン */}
              {message.sender === 'momonga' && (
                <div style={{
                  width: '32px',
                  height: '32px',
                  flexShrink: 0,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '2px solid #8bc34a'
                }}>
                  <img 
                    src="/momonga-icon.png" 
                    alt="モモンガくん" 
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-size: 20px;">🐿️</div>';
                      }
                    }}
                  />
                </div>
              )}
              
              {/* メッセージバブル */}
              <div className="comic-card message-bubble" style={{
                background: message.sender === 'user' 
                  ? 'linear-gradient(135deg, rgba(66, 165, 245, 0.3), rgba(33, 150, 243, 0.2))'
                  : 'linear-gradient(135deg, rgba(76, 175, 80, 0.3), rgba(139, 195, 74, 0.2))',
                borderColor: message.sender === 'user' ? '#2196f3' : '#8bc34a',
                padding: 'min(12px 16px, 3vw 4vw)',
                maxWidth: 'min(70%, 400px)',
                minWidth: 'min(200px, 50vw)',
                wordBreak: 'break-word',
                position: 'relative'
              }}>
                <div className="comic-text font-body-md" style={{
                  color: '#fff3e0',
                  lineHeight: '1.4'
                }} dangerouslySetInnerHTML={{ __html: parseMarkdown(message.content) }}>
                </div>
                <div className="font-body-xs" style={{
                  color: 'rgba(255,255,255,0.6)',
                  marginTop: '4px',
                  textAlign: 'right'
                }}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {/* ユーザーのアイコン */}
              {message.sender === 'user' && (
                <div style={{
                  fontSize: '1.5rem',
                  flexShrink: 0
                }}>
                  👤
                </div>
              )}
            </div>
          ))}

          {/* タイピングインジケーター */}
          {isTyping && (
            <div style={{
              display: 'flex',
              justifyContent: 'flex-start',
              alignItems: 'flex-start',
              gap: '8px'
            }}>
              <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '2px solid #8bc34a'
            }}>
              <img 
                src="/momonga-icon.png" 
                alt="モモンガくん" 
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-size: 20px;">🐿️</div>';
                  }
                }}
              />
            </div>
              <div className="comic-card" style={{
                background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.3), rgba(139, 195, 74, 0.2))',
                borderColor: '#8bc34a',
                padding: '12px 16px'
              }}>
                <div className="comic-text font-body-md" style={{
                  color: '#fff3e0'
                }}>
                  モモンガくんが考え中だよー...
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* 入力欄 */}
        <div className="input-area" style={{
          display: 'flex',
          gap: 'min(8px, 2vw)',
          alignItems: 'flex-end',
          flexShrink: 0,
          padding: '4px 0'
        }}>
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="モモンガくんに話しかけてみよう..."
            rows={2}
            maxLength={500}
            className="comic-input font-body-md"
            style={{
              flex: 1,
              padding: 'min(12px, 3vw)',
              borderColor: 'rgba(255,255,255,0.4)',
              background: 'rgba(255,255,255,0.05)',
              color: 'white',
              resize: 'none',
              minHeight: '50px',
              maxHeight: '100px'
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className="comic-button font-button-sm"
            style={{
              background: (!inputMessage.trim() || isTyping) 
                ? 'linear-gradient(45deg, #666, #555)' 
                : 'linear-gradient(45deg, #9c27b0, #7b1fa2)',
              color: 'white',
              borderColor: (!inputMessage.trim() || isTyping) ? '#333' : '#4a148c',
              minWidth: 'min(80px, 20vw)',
              flexShrink: 0
            }}
          >
            送信
          </button>
        </div>
      </div>

      {/* ナビゲーションボタン */}
      <div className="navigation-buttons" style={{ 
        display: 'flex', 
        gap: 'min(12px, 3vw)', 
        justifyContent: 'center', 
        flexWrap: 'wrap',
        flexShrink: 0,
        padding: 'min(8px, 2vw) 0'
      }}>
        <Link to="/plaza" style={{ textDecoration: 'none' }}>
          <button className="comic-button font-button-sm" style={{
            background: 'linear-gradient(45deg, #4caf50, #45a049)',
            color: 'white',
            borderColor: '#2e7d32'
          }}>
            🏛️ 広場に戻る
          </button>
        </Link>
        
        <Link to="/" style={{ textDecoration: 'none' }}>
          <button className="comic-button font-button-sm" style={{
            background: 'linear-gradient(45deg, #666, #555)',
            color: 'white',
            borderColor: '#333'
          }}>
            🏠 拠点に戻る
          </button>
        </Link>
      </div>
    </div>
  )
}

export default Chatbot