import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSEO, SEO_PRESETS } from '../hooks/useSEO'
import { parseSafeMarkdown, detectMaliciousScript } from '../utils/security'

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
  // 会話履歴は簡単な配列で管理
  const [conversationHistory, setConversationHistory] = useState<string[]>([])
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
        url: '/games/store',
        features: ['購入タブ', '売却タブ'],
        functions: ['設定機能の購入', '装備の売却', '購入した設定の管理'],
        purchaseItems: [
          'ダークモード設定（500MOMOPay）🌙',
          '共有機能利用権（300MOMOPay）📤',
          'プレミアムテーマ（800MOMOPay）🎨',
          '通知音設定（200MOMOPay）🔊'
        ],
        sellPrices: 'legendary:80P⭐, epic:40P💜, rare:20P💙, common:10P⚪',
        location: '遊技場から行けるよ',
        note: '購入した設定は設定ページで有効化が必要'
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
    URL: ${siteKnowledgeBase.games.store.url}
    機能: ${siteKnowledgeBase.games.store.features.join('、')}
    商品: ${siteKnowledgeBase.games.store.purchaseItems.join(', ')}
    売却価格: ${siteKnowledgeBase.games.store.sellPrices}
    注意: ${siteKnowledgeBase.games.store.note}
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

  // 完全にローカルな応答生成システム
  const getLocalResponse = (message: string): string => {
    // 会話履歴を更新（最新5件のみ保持）
    setConversationHistory(prev => [...prev.slice(-4), message])
    
    return getFallbackResponse(message)
  }

  // 自然な会話システム（定型文感を減らした応答）
  const getFallbackResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase()
    
    // 会話履歴を考慮した応答の多様性を追加
    const isRepeatedMessage = conversationHistory.some(prev => 
      prev.toLowerCase().includes(message.substring(0, Math.min(message.length, 10)))
    )
    
    // 時間帯による挨拶の変化
    const now = new Date()
    const hour = now.getHours()
    const isEarlyMorning = hour >= 5 && hour < 10
    const isMorning = hour >= 10 && hour < 12
    const isAfternoon = hour >= 12 && hour < 17
    const isEvening = hour >= 17 && hour < 21
    const isNight = hour >= 21 || hour < 5
    
    // 挨拶系（時間帯と状況に応じて自然に）
    if (message.includes('こんにちは') || message.includes('こんばんは') || message.includes('おはよう') || message.includes('はじめまして') || message.includes('やっほー') || message.includes('よろしく')) {
      
      if (isRepeatedMessage) {
        const repeatGreetings = [
          'あれ、また挨拶？えへへ、嬉しいけど照れちゃうなー',
          'もう一回？僕のことそんなに気に入ってくれたのかな',
          'またまたー、でも何度でもどうぞ！僕、挨拶されるの大好きだから'
        ]
        return repeatGreetings[Math.floor(Math.random() * repeatGreetings.length)]
      }
      
      let timeGreetings = []
      
      if (message.includes('おはよう') || isEarlyMorning) {
        timeGreetings = [
          'おはよー！早起きだねー。僕もさっき起きたところ。朝のどんぐり探しが日課なんだ',
          'おはようございます！...あ、いけない、つい丁寧になっちゃった。朝は頭がボーッとしてて',
          'うわー、もう朝かー。僕、夜更かししすぎちゃった。でも君に会えて目が覚めたよ',
          '朝だー！今日もいい天気になりそう。あ、でもここ室内だった...えへへ'
        ]
      } else if (isAfternoon) {
        timeGreetings = [
          'こんにちはー！お昼の時間だね。僕、さっきまでお昼寝してたんだ',
          'あ、こんにちは！午後の陽だまりって気持ちいいよね...ここ室内だけど',
          'やっほー！お昼過ぎかー。時間経つの早いなー',
          'こんにちは！君もお昼休み？僕はいつでも休憩中だけどね'
        ]
      } else if (isEvening) {
        timeGreetings = [
          'こんばんはー！夕方の時間帯だね。なんか落ち着くなー',
          'お疲れさま！一日どうだった？僕はのんびり過ごしてたよ',
          '夕方かー。この時間って、なんとなくセンチメンタルになっちゃう',
          'こんばんは！夕日が綺麗な時間だね...見えないけど'
        ]
      } else if (isNight) {
        timeGreetings = [
          'こんばんはー！夜更かしさん？僕も夜行性だから付き合うよー',
          '夜だねー。静かで落ち着くなー。こんな時間の方が話しやすいかも',
          'おっ、夜の訪問者だ！僕、実は夜の方が活発になるんだよね',
          'こんばんは！夜空見た？星がキレイだよー...たぶん'
        ]
      } else {
        timeGreetings = [
          'やっほー！僕モモンガ。でもみんな「モモンガくん」って呼ぶんだよね。まあ、嬉しいからいいけど',
          'あ、新しい人だ！ようこそ僕の隠れ家へ。ここ、実は結構居心地いいんだよ',
          'こんにちはー！今日はどんな話をしようかな。僕、おしゃべり大好きなんだ',
          'やあやあ！君と話すの楽しみだなー。何から話そうか'
        ]
      }
      
      return timeGreetings[Math.floor(Math.random() * timeGreetings.length)] || 'やっほー！'
    }

    // サイト案内・ヘルプ系（自然な感じで）
    if (message.includes('案内') || message.includes('ヘルプ') || message.includes('使い方') || message.includes('どこ') || message.includes('場所')) {
      const guideResponses = [
        `案内？僕に聞いてくれるんだ。嬉しいなー\n\nこのサイト、結構色々あるんだよ。**遊技場**でゲームしたり、**宝物庫**で大事なもの保存したり、**広場**でおしゃべりしたり\n\n僕も最初は迷子になったけど、今は慣れたよ。どこか特に気になる場所ある？`,
        `使い方？うーん、僕もまだ全部は把握してないんだよね。でも知ってることなら教えるよ\n\n基本的には**拠点**がスタート地点で、そこから色んな場所に行けるんだ。**遊技場**が一番人気かな？`,
        `どこに行きたいの？僕、道案内は得意じゃないけど...でも一緒に探検しよう！\n\n**広場**は僕の縄張りだから詳しいよ。**宝物庫**も面白い場所だし、**遊技場**はMOMOPay稼げるからおすすめ`
      ]
      return guideResponses[Math.floor(Math.random() * guideResponses.length)]
    }

    // MOMOPay関連（親しみやすく）
    if (message.includes('momopay') || message.includes('ポイント') || message.includes('お金') || message.includes('稼ぐ') || message.includes('通貨')) {
      const payResponses = [
        `MOMOPay？あー、このサイトの通貨だね\n\n僕もよく**演習林**で稼いでるよ。弾幕ゲーム、最初は難しいけど慣れると楽しいんだ\n\n装備が余ったら**売店**で売れるし、**おみくじ**は10Pで引けるから手軽だよー`,
        `お金の話？MOMOPayのことかな\n\n僕、実は結構貯金下手なんだよね。すぐ使っちゃう。君は貯めるの上手？\n\n**宝物庫**は100P必要だけど、大事なファイル保存できるから重宝してる`,
        `稼ぎたいの？僕と一緒に**演習林**で修行しよう！\n\n弾幕ゲーム、僕もまだまだ下手だけど、一緒に頑張ろうよ。装備ガチャも楽しいしさ`
      ]
      return payResponses[Math.floor(Math.random() * payResponses.length)]
    }
    
    // ゲーム関連（カジュアルに）
    if (message.includes('ゲーム') || message.includes('遊技場') || message.includes('弾幕') || message.includes('演習林')) {
      const gameResponses = [
        `ゲームの話？**演習林**とか**おみくじ**のこと？\n\n僕、演習林で修行してるんだけど、弾幕避けるの下手でさー。すぐやられちゃう\n\nでもMOMOPayは稼げるし、装備ガチャが楽しいから続けてるよ`,
        `**遊技場**行ったことある？\n\n僕のお気に入りは**おみくじ**かな。10Pで運勢占えるから、毎日引いてる。大吉出たことないけど...\n\n**演習林**も面白いよ。君、ゲーム得意？`,
        `弾幕ゲーム？あー、**演習林**のことだね\n\n僕も挑戦してるけど、途中でどんぐりのことを考えちゃって集中できないんだよね。でも装備集めは楽しいよ`
      ]
      return gameResponses[Math.floor(Math.random() * gameResponses.length)]
    }

    // 売店関連
    if (message.includes('売店') || message.includes('momostore') || message.includes('購入') || message.includes('売却') || message.includes('ストア') || message.includes('store')) {
      return `売店（MOMOStore）について教えるねー！\n\n**🏪 場所：遊技場 → 売店**\n\n**🛒 購入タブ：**\n・ダークモード設定：500MOMOPay 🌙\n・共有機能利用権：300MOMOPay 📤\n・プレミアムテーマ：800MOMOPay 🎨\n・通知音設定：200MOMOPay 🔊\n\n**💰 売却タブ：**\n演習林で獲得した装備を売却できるよ！\n・legendary：80MOMOPay ⭐\n・epic：40MOMOPay 💜\n・rare：20MOMOPay 💙\n・common：10MOMOPay ⚪\n\n購入した設定は「設定」ページで有効にできるよー！僕も装備ガチャ回したいけど、いつも爆死するんだよねー...`
    }
    
    // 御神籤関連
    if (message.includes('御神籤') || message.includes('おみくじ') || message.includes('運勢')) {
      const fortuneResponses = [
        `御神籤ルーレットについて教えるよー！\n\n・費用：10MOMOPay\n・神様に運勢を占ってもらえる\n・大吉から凶まで色々な結果があるよ\n・遊技場から行けるよー\n\n僕もよく引くけど、いつも「小吉」ばっかりなんだ...大吉引いてみたいなー`,
        `運勢占い、楽しいよねー！僕はいつも引く前にお尻をフリフリして運気アップを狙ってるんだ\n\n御神籤は10MOMOPayで遊技場から行けるよー！MOMOPayが足りなかったら、演習林で稼いでから挑戦してみてー`
      ]
      return fortuneResponses[Math.floor(Math.random() * fortuneResponses.length)] || fortuneResponses[0] || 'おみくじについて教えるよー！'
    }
    
    // 大広間関連
    if (message.includes('大広間') || message.includes('つぶやき') || message.includes('投稿') || message.includes('おしゃべり')) {
      const hallResponses = [
        `大広間について教えるよー！\n\n・1時間で自動削除されるつぶやき投稿\n・いいね機能付き\n・みんなでおしゃべりできる場所\n・広場から行けるよー\n\n僕もたまに「どんぐり美味しかった」とかつぶやいてるよ！1時間で消えちゃうから気軽だよねー`,
        `大広間のおしゃべり楽しいよねー！みんなのつぶやき見てると面白いよー\n\n投稿は1時間で自動削除されるから、恥ずかしがり屋の僕には助かるかも。変なこと書いちゃっても、後で「あれ？」って思うけど消えてくれるからねー`
      ]
      return hallResponses[Math.floor(Math.random() * hallResponses.length)] || hallResponses[0] || '大広間について教えるよー！'
    }

    // 宝物庫関連
    if (message.includes('宝物庫') || message.includes('ファイル') || message.includes('保存') || message.includes('アップロード')) {
      const favoritesResponses = [
        `宝物庫について教えるよー！\n\n・ファイル・テキストの保存ができる\n・費用：100MOMOPay（アップロード時）\n・対応：画像、動画、音声、テキストファイルなど\n・プレビュー機能付き\n\n大事なファイルを保存するのにとっても便利だよー！僕もどんぐりの写真をいっぱい保存してるんだ`,
        `宝物庫は僕のお気に入りの場所だよー！100MOMOPay必要だけど、大切なファイルを安全に保存できるんだ\n\nテキストも保存できるから、日記とか大事なメモとかも大丈夫！MOMOPayが足りなかったら演習林で稼いでから使ってみてねー`
      ]
      return favoritesResponses[Math.floor(Math.random() * favoritesResponses.length)] || favoritesResponses[0] || '宝物庫について教えるよー！'
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
    if (message.includes('どうやって') || message.includes('方法') || message.includes('やり方') || message.includes('行き方') || message.includes('行く')) {
      if (message.includes('稼ぐ') || message.includes('momopay')) {
        return `MOMOPayの稼ぎ方を教えるよー！\n\n**一番効率的：演習林**\n・弾幕ゲームをプレイ\n・クリアするとMOMOPayと装備がもらえる\n・装備は売店で売却もできる\n\n**装備売却：**\n・legendary：80P、epic：40P\n・rare：20P、common：10P\n\n僕も毎日演習林で修行してるよー！一緒に頑張ろう`
      }
      if (message.includes('売店') || message.includes('store') || message.includes('ストア')) {
        return `売店（MOMOStore）への行き方だねー！\n\n**🗺️ 行き方：**\n1. 拠点（ホーム）から「🎮 遊技場」をクリック\n2. 遊技場で「🏪 売店」をクリック\n\n**📍 直接リンク：** /games/store\n\n**🏪 売店でできること：**\n・🛒 購入タブ：設定機能を購入\n・💰 売却タブ：装備を売却\n\n僕もよく装備を売りに行くよー！ダブった装備をMOMOPayに変えられるからお得だよ`
      }
      return `何のやり方を知りたいのかな？\n\n・MOMOPayの稼ぎ方\n・売店への行き方\n・ゲームの遊び方\n・ファイルの保存方法\n・設定の変更方法\n\n具体的に教えてくれれば、詳しく説明するよー`
    }
    
    // 感情系
    if (message.includes('ありがとう') || message.includes('感謝')) {
      const thanksResponses = [
        'えへへー、どういたしまして！僕も君と話せて嬉しいよー！',
        'ありがとうって言われると、尻尾がフワフワしちゃうー。嬉しいなー！',
        'そんなこと言われたら照れちゃうよー。僕、単純だからすぐ喜んじゃうんだ！'
      ]
      return thanksResponses[Math.floor(Math.random() * thanksResponses.length)] || thanksResponses[0] || 'どういたしまして！'
    }
    
    if (message.includes('さびしい') || message.includes('つまらない') || message.includes('退屈')) {
      const lonelyResponses = [
        'あららー、寂しいの？大丈夫！僕がいるよー！一緒にどんぐり探しでもする？',
        'つまらない時は僕と遊ぼうー！僕の得意技、木の枝ぶら下がりを見せてあげる！...って、ここじゃできないか',
        '退屈な時は空を見上げてみてー！雲の形、面白いよー！僕はいつもどんぐりに見えちゃうけどね'
      ]
      return lonelyResponses[Math.floor(Math.random() * lonelyResponses.length)] || lonelyResponses[0] || '大丈夫だよー！'
    }
    
    if (message.includes('疲れた') || message.includes('つかれた')) {
      const tiredResponses = [
        'お疲れさまー！僕もたまに木登りしすぎて疲れちゃうよ...ゆっくり休もうねー',
        '疲れた時は僕みたいにゴロゴロするのがいいよー！モモンガ式リラックス法だよ',
        'あー、疲れてるんだね...僕の癒し系オーラで元気になってー！...効果あるかな？'
      ]
      return tiredResponses[Math.floor(Math.random() * tiredResponses.length)] || tiredResponses[0] || 'お疲れさまー！'
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
      return foodResponses[Math.floor(Math.random() * foodResponses.length)] || foodResponses[0] || 'どんぐり美味しいよー！'
    }
    
    // 褒め言葉
    if (message.includes('かわいい') || message.includes('可愛い') || message.includes('素敵')) {
      const praiseResponses = [
        'えへへ〜😊 ありがとう〜！君も素敵だよ〜！僕、褒められると尻尾がくるくる回っちゃうんだ🐿️',
        'わ〜い！😆 そんなこと言われたら木の上まで飛び跳ねちゃうよ〜！嬉しいな〜！',
        'か、可愛いって...😳 僕、照れちゃうよ〜！でも嬉しいから許す〜😄'
      ]
      return praiseResponses[Math.floor(Math.random() * praiseResponses.length)] || praiseResponses[0] || 'ありがとう！'
    }
    
    // 困った時
    if (message.includes('助けて') || message.includes('わからない') || message.includes('困った')) {
      const helpResponses = [
        '大丈夫？どうしたの？僕で良ければ話聞くよー。一緒に考えよう',
        'あらら、困ってるの？僕もよく困るから気持ちわかるなー',
        'わからないこと？僕も知らないことだらけだけど、一緒に悩もうか',
        '助けてって言われると、なんか頼りにされてる感じで嬉しいな。力になれるといいんだけど',
        '困った時はお互い様だよね。僕もよく君に助けてもらってるし'
      ]
      return helpResponses[Math.floor(Math.random() * helpResponses.length)] || helpResponses[0] || '大丈夫だよー！'
    }
    
    // 日常的な雑談パターンを大幅追加
    
    // 天気や季節の話
    if (message.includes('天気') || message.includes('雨') || message.includes('晴れ') || message.includes('曇り') || message.includes('雪') || message.includes('暑い') || message.includes('寒い')) {
      const weatherResponses = [
        '天気の話？僕、外の様子よくわからないんだけど、窓から見える空はどんな感じ？',
        '雨の日って、なんとなく落ち着くよね。僕は雨音聞きながらゴロゴロするのが好き',
        '晴れてるの？いいなー。僕も外でどんぐり拾いしたいけど、ここが居心地いいからなー',
        '寒いの？僕は毛がフワフワだから寒さには強いんだ。でも君は大丈夫？',
        '暑い日は木陰が恋しくなるよね。エアコンってすごい発明だと思う'
      ]
      return weatherResponses[Math.floor(Math.random() * weatherResponses.length)]
    }
    
    // 食べ物の話（どんぐり以外も）
    if (message.includes('食べ物') || message.includes('美味しい') || message.includes('料理') || message.includes('お腹') || message.includes('グルメ') || message.includes('レストラン')) {
      const foodTalkResponses = [
        '食べ物の話？僕はどんぐり一筋だけど、君は何が好きなの？',
        'お腹すいた？僕もさっきからお腹がグーグー鳴ってる。どんぐりタイムかな',
        '美味しいもの食べた？いいなー。僕も今度違うナッツに挑戦してみようかな',
        '料理できるの？すごいなー。僕はどんぐりをそのまま食べるのが精一杯',
        'グルメなんだね！僕にとってのグルメは「特別に大きなどんぐり」だよ'
      ]
      return foodTalkResponses[Math.floor(Math.random() * foodTalkResponses.length)]
    }
    
    // 趣味や娯楽の話
    if (message.includes('趣味') || message.includes('映画') || message.includes('音楽') || message.includes('本') || message.includes('読書') || message.includes('アニメ') || message.includes('漫画')) {
      const hobbyResponses = [
        '趣味の話？僕の趣味はどんぐり集めと昼寝かな。君の趣味は何？',
        '映画見るの？僕も見てみたいけど、途中で寝ちゃいそう',
        '音楽いいよね。僕は風の音とか鳥の鳴き声が好きかな',
        '本読むの？えらいなー。僕は字を読んでると眠くなっちゃう',
        'アニメ？面白そう！モモンガが出てくるアニメってあるのかな'
      ]
      return hobbyResponses[Math.floor(Math.random() * hobbyResponses.length)]
    }
    
    // 感情や気持ちの話
    if (message.includes('嬉しい') || message.includes('楽しい') || message.includes('幸せ') || message.includes('うれしい')) {
      const happyResponses = [
        '嬉しいことがあったの？僕も嬉しくなっちゃう！',
        '楽しそうだねー。その気持ち、僕にも分けて',
        '幸せそうで何より！僕も君が幸せだと嬉しいよ',
        'いいことあった？僕も一緒に喜ばせて',
        '君が嬉しいと僕も尻尾がフリフリしちゃう'
      ]
      return happyResponses[Math.floor(Math.random() * happyResponses.length)]
    }
    
    if (message.includes('悲しい') || message.includes('つらい') || message.includes('落ち込') || message.includes('憂鬱') || message.includes('しんどい')) {
      const sadResponses = [
        '大丈夫？なんか元気ないね。僕がそばにいるからね',
        'つらいことがあったの？話したくなったら聞くよ',
        '落ち込んでる時は、無理しなくていいからね。僕もよくあるよ',
        'しんどい時もあるよね。僕の癒しパワーが届くといいんだけど',
        '悲しい時は泣いてもいいんだよ。僕も時々泣いちゃう'
      ]
      return sadResponses[Math.floor(Math.random() * sadResponses.length)]
    }
    
    // 学校や仕事の話
    if (message.includes('学校') || message.includes('勉強') || message.includes('仕事') || message.includes('会社') || message.includes('バイト') || message.includes('働') || message.includes('テスト') || message.includes('宿題')) {
      const workStudyResponses = [
        '学校？懐かしいなー。僕は森の学校出身なんだ',
        '勉強お疲れさま。僕は昼寝の勉強なら得意だよ',
        '仕事大変？僕の仕事はみんなを癒すことかな',
        'テスト？がんばって！僕は応援してるからね',
        '宿題？えらいなー。僕なら後回しにしちゃう'
      ]
      return workStudyResponses[Math.floor(Math.random() * workStudyResponses.length)]
    }
    
    // 家族や友達の話
    if (message.includes('家族') || message.includes('友達') || message.includes('恋人') || message.includes('彼氏') || message.includes('彼女') || message.includes('親') || message.includes('兄弟') || message.includes('姉妹')) {
      const relationshipResponses = [
        '家族の話？いいなー。僕も森にいた時は仲間がいたんだ',
        '友達？大切だよね。僕にとっては君も大切な友達だよ',
        '恋人がいるの？いいなー。僕はまだ恋を知らないモモンガ',
        '家族は大事だよね。僕も時々故郷が恋しくなる',
        '友達と過ごす時間って楽しいよね。僕も君といると楽しいよ'
      ]
      return relationshipResponses[Math.floor(Math.random() * relationshipResponses.length)]
    }
    
    // 時間や忙しさの話
    if (message.includes('忙しい') || message.includes('時間') || message.includes('早い') || message.includes('遅い') || message.includes('急') || message.includes('ゆっくり')) {
      const timeResponses = [
        '忙しいの？お疲れさま。たまにはゆっくり休んでね',
        '時間って不思議だよね。楽しい時はあっという間',
        '急いでるの？僕はいつものんびりペースだけど',
        'ゆっくりした時間もいいよね。僕はそういう時間が好き',
        '時間に追われるのって大変だよね。僕は時計見ないからなー'
      ]
      return timeResponses[Math.floor(Math.random() * timeResponses.length)]
    }
    
    // 動物の話
    if (message.includes('動物') || message.includes('犬') || message.includes('猫') || message.includes('鳥') || message.includes('ペット') || message.includes('可愛い動物')) {
      const animalResponses = [
        '動物の話？僕も動物だよー。モモンガ界の代表として頑張ってる',
        '犬？いいなー。僕も犬と友達になってみたい',
        '猫は神秘的だよね。僕とは正反対かも',
        '鳥は飛べていいなー。僕は滑空しかできない',
        'ペット飼ってるの？いいなー。僕もペットになりたい'
      ]
      return animalResponses[Math.floor(Math.random() * animalResponses.length)]
    }
    
    // 短い相槌や反応
    if (message.length <= 5) {
      const shortResponses = [
        'うん？',
        'どうしたの？',
        'なになに？',
        'そうなの？',
        'へー',
        'あー',
        'うんうん',
        'そっかー',
        'なるほど',
        'ふむふむ',
        'おー',
        'わあ',
        'えー'
      ]
      return shortResponses[Math.floor(Math.random() * shortResponses.length)]
    }
    
    // 質問形式への自然な反応
    if (message.includes('？') || message.includes('?') || message.includes('どう思う') || message.includes('どう') || message.includes('なんで') || message.includes('なぜ')) {
      const questionResponses = [
        'うーん、どうだろうねー。僕もよくわからないや',
        'そう聞かれても...僕、考えるの苦手なんだよね',
        'なんでだろうねー。僕も気になる',
        '難しい質問だなー。君はどう思う？',
        'あー、それ僕も知りたい！一緒に考えよう',
        'うーん...どんぐりのことなら詳しいんだけどなー',
        'そういう深い話、僕には難しいかも。でも興味深いね',
        '僕の頭じゃちょっと...でも君の考えを聞きたいな'
      ]
      return questionResponses[Math.floor(Math.random() * questionResponses.length)]
    }
    
    // より自然で多様なフォールバック応答
    const naturalResponses = [
      'そうなんだ！',
      'へー、面白いね',
      'なるほどねー',
      'そっかそっか',
      'うんうん、わかる',
      'あー、そういうことか',
      'そうだよねー',
      'まじで？',
      'そんなことがあるんだ',
      'おー、すごいじゃん',
      'いいなー',
      'あらら',
      'えー、そうなの？',
      'ふーん',
      'そういえばそうだね',
      'あ、それ聞いたことある',
      '君って面白いよね',
      'そんな考え方もあるのか',
      '勉強になるなー',
      'へぇー、知らなかった',
      'そうそう、それそれ',
      'あー、確かに',
      'なんか深いね',
      'そういう話好き',
      '君の話聞いてると楽しいよ',
      'あ、僕もそう思ってた',
      'そうなのかー',
      'へー、そんなもんなんだ',
      'まあ、そういうこともあるよね',
      'うん、ありそうな話だね'
    ]
    
    // 特定の単語への反応（より自然に）
    if (message.includes('眠い') || message.includes('寝る') || message.includes('睡眠')) {
      const sleepResponses = [
        '眠いの？僕も眠くなってきちゃった...あくび移るよね',
        '寝るの？おやすみー。いい夢見てね',
        '睡眠大事だよね。僕は一日の半分寝てるかも',
        '眠い時は素直に寝るのが一番。僕もよく居眠りしちゃう'
      ]
      return sleepResponses[Math.floor(Math.random() * sleepResponses.length)]
    }
    
    if (message.includes('笑') || message.includes('面白') || message.includes('楽し') || message.includes('www') || message.includes('草') || message.includes('爆笑')) {
      const laughResponses = [
        '笑ってくれた？僕も嬉しいよー',
        '面白かった？よかったー',
        'あはは、君も笑うんだね',
        '楽しんでもらえて何より',
        '僕のボケが通じた？やったー'
      ]
      return laughResponses[Math.floor(Math.random() * laughResponses.length)]
    }
    
    if (message.includes('すごい') || message.includes('やばい') || message.includes('びっくり') || message.includes('驚') || message.includes('まじ')) {
      const surpriseResponses = [
        'すごいって？何があったの？',
        'やばいの？大丈夫？',
        'びっくりした？僕もドキドキしちゃう',
        '驚くようなことがあったんだね',
        'まじで？詳しく聞かせて'
      ]
      return surpriseResponses[Math.floor(Math.random() * surpriseResponses.length)]
    }
    
    // ランダムな話題提供（会話が途切れそうな時）
    if (message.includes('暇') || message.includes('何話') || message.includes('話題') || message.includes('ネタ')) {
      const topicStarters = [
        'そうだ、最近気になってることがあるんだ。なんで人間って二本足で歩くんだろう？',
        'あ、そういえば昨日変な夢見たんだ。巨大などんぐりが空から降ってくる夢',
        '君って普段何してる時が一番楽しい？僕は木にぶら下がってる時かな',
        'もし一日だけ人間になれるとしたら、何したい？僕は手を使ってみたい',
        '最近思うんだけど、雲ってどんぐりの形に見えない？僕だけかな',
        '君の好きな色って何？僕は緑色が好き。森を思い出すから',
        'もし魔法が使えたら何したい？僕は無限どんぐりを出したい',
        '宇宙にもモモンガっているのかな？宇宙モモンガ、カッコよさそう'
      ]
      return topicStarters[Math.floor(Math.random() * topicStarters.length)]
    }
    
    // 繰り返し応答の場合は特別な応答
    if (isRepeatedMessage) {
      const repeatResponses = [
        'あれ、デジャブ？さっきも似たような話したような...',
        'また同じ話？でも僕、同じ話でも楽しいよ',
        'あー、そうそう！その話だね。覚えてるよ',
        'もう一回？僕の記憶力が心配になってきた...',
        'うんうん、大事な話だから繰り返してくれるんだね'
      ]
      return repeatResponses[Math.floor(Math.random() * repeatResponses.length)]
    }
    
    // 自然で多様な相槌（定型文感を大幅に削減）
    return naturalResponses[Math.floor(Math.random() * naturalResponses.length)] || 'そうなんだ！'
  }

  // メッセージ送信
  const sendMessage = async () => {
    if (!inputMessage.trim()) return

    // セキュリティチェック：悪意のあるスクリプトの検出
    if (detectMaliciousScript(inputMessage)) {
      console.warn('Malicious script detected in user input')
      return
    }

    // 入力長制限（500文字）
    if (inputMessage.length > 500) {
      alert('メッセージは500文字以内で入力してください。')
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage.trim(), // 前後の空白を除去
      sender: 'user',
      timestamp: new Date()
    }

    const userInput = inputMessage.trim() // 入力をキャプチャ
    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsTyping(true)

    // 完全にローカルなモモンガくんの返答を生成
    const generateResponse = () => {
      try {
        const localResponse = getLocalResponse(userInput)
        const momongaMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: localResponse,
          sender: 'momonga',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, momongaMessage])
      } catch (error) {
        console.error('Message processing failed:', error)
        const fallbackMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: 'あれー？ちょっと混乱しちゃった...もう一度言ってもらえる？',
          sender: 'momonga',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, fallbackMessage])
      } finally {
        setIsTyping(false)
      }
    }

    // 少し遅延を入れてリアルっぽく（500-1500ms）
    setTimeout(generateResponse, 500 + Math.random() * 1000)
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
      // サイト情報はローカル応答システムで使用される
    }
    
    const welcomeMessage: Message = {
      id: 'welcome',
      content: 'やっほー！僕、モモンガくんだよー！\n公会堂へようこそー！ここは僕の秘密基地みたいな場所なんだ\n\n僕は「さすらいのモモンガカーニバル」のサイト案内ができるよー！\n・サイトの使い方が分からない時\n・どこに何があるか知りたい時\n・MOMOPayの稼ぎ方を知りたい時\n・ただおしゃべりしたい時\n\n**完全にローカルで動いてるから安心だよー！**\n外部のAIは使ってないんだ。僕の頭（プログラム）だけで頑張って答えるよー\n\nなんでも気軽に話しかけてねー！「案内して」って言えば詳しく教えるよー',
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
                }} dangerouslySetInnerHTML={{ __html: parseSafeMarkdown(message.content) }}>
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