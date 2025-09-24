import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSEO, SEO_PRESETS } from '../hooks/useSEO'
import { parseSafeMarkdown, detectMaliciousScript } from '../utils/security'
import Avatar from '../components/Avatar'

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
        sellPrices: 'legendary:80P, epic:40P, rare:20P, common:10P',
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
      earning: '演習林での弾幕ゲーム、装備売却、デイリーミッション、実績解除、銀行投資',
      uses: ['御神籤（10P）', '宝物庫アップロード（100P）', '売店での設定購入', 'アバターコスチューム', '銀行預金・投資']
    },
    avatar: {
      name: 'アバターカスタマイズ',
      description: 'モモンガくんの見た目を変更できる機能',
      categories: ['帽子', 'アクセサリー', '衣装', '特殊効果', '背景'],
      items: ['サンタ帽（150P）', '王冠（800P）', 'サングラス（200P）', 'タキシード（500P）', 'キラキラオーラ（1000P）'],
      location: 'ホームページから「着せ替え」で行けるよ'
    },
    bank: {
      name: 'MOMOBank',
      description: 'MOMOPayの預金・投資・融資ができる銀行',
      features: ['預金（1%/日利息）', '投資（短期・中期・長期）', '融資（資金調達）'],
      investments: ['モモンガ債券（低リスク2%/日）', 'どんぐり先物（中リスク5%/日）', '森林株（高リスク10%/日）'],
      location: 'ホームページから「銀行」で行けるよ'
    }
  }

  // モモンガくんの応答パターン（親しみやすく茶目っ気のある性格 + 正確な情報提供）
  // サイト情報をコンテキスト用文字列に変換（現在は未使用だが将来の拡張用に保持）
  // const getSiteContext = (): string => {
  //   return `サイト情報のコンテキスト文字列`
  // }

  // 完全にローカルな応答生成システム
  const getLocalResponse = (message: string): string => {
    // 会話履歴を更新（最新5件のみ保持）
    setConversationHistory(prev => [...prev.slice(-4), message])
    
    return getFallbackResponse(message)
  }

  // 安全な配列選択ヘルパー
  const safeRandomChoice = (array: string[], fallback: string = 'そうなんだねー'): string => {
    if (!array || array.length === 0) return fallback
    return array[Math.floor(Math.random() * array.length)] || fallback
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
    // const isMorning = hour >= 10 && hour < 12 // 未使用のため一時的にコメントアウト
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
        return safeRandomChoice(repeatGreetings, 'また挨拶してくれるの？嬉しいなー！')
      }
      
      let timeGreetings = []
      
      if (message.includes('おはよう') || isEarlyMorning) {
        timeGreetings = [
          'おはよー！わあ、早起きさんだねー！僕もさっき起きたばかりで、まだ尻尾がボサボサなんだ〜 朝一番のどんぐり探しが僕の日課なの！君も一緒に探さない？',
          'おはようございますっ！...あっ いけない、つい丁寧語になっちゃった！朝は頭がフワフワしててねー。あくびが止まらないよ〜 *あくび* んー、でも君に会えて目がパッチリしたよ！',
          'うわわー！もう朝なのー？僕、昨日は夜中までどんぐりの夢見てて...巨大などんぐりがコロコロ転がってくる夢だったんだ！でも君に会えて今日もいい日になりそう〜',
          '朝だー朝だー！今日もきっといい天気だよね！...あれ？ここ室内だった えへへ、つい外のこと考えちゃった。森が恋しいなあ〜'
        ]
      } else if (isAfternoon) {
        timeGreetings = [
          'こんにちはー！お昼の時間だねー！僕、さっきまで天井の梁でお昼寝してたんだ〜 ふわぁ...まだ眠いかも。午後の陽だまりって最高だよね〜',
          'あっ、こんにちは！午後の時間っていいよねー。のんびりしてて。僕、この時間が一番リラックスできるんだ。君も午後派？それとも朝派？',
          'やっほー！お昼過ぎかー、時間って本当にあっという間だよね！僕、時計見るの苦手だから、いつも太陽の位置で時間を...あれ、ここ室内だった',
          'こんにちはー！君もお昼休み？僕は365日休憩中だけどね〜 えへへ、いいでしょ？自由気ままなモモンガライフ！'
        ]
      } else if (isEvening) {
        timeGreetings = [
          'こんばんはー！夕方の時間帯だねー。なんか空気がオレンジ色に感じない？僕だけかな？この時間って、なんだかホッとするんだよね〜',
          'お疲れさまー！一日どうだった？僕はのんびり過ごしてたよ〜。天井からぶら下がったり、想像の中でどんぐり拾いしたり...充実してた！',
          'こんばんはー！夕方って、なんとなくセンチメンタルになっちゃうよね〜 僕、この時間になると故郷の森を思い出すんだ。夕日に照らされた木々が綺麗だったなあ',
          'こんばんは！夕日が綺麗な時間だよね...見えないけど でも心の目で見てるよ！きっと今日も美しい夕日が空を染めてるんだろうなあ〜'
        ]
      } else if (isNight) {
        timeGreetings = [
          'こんばんはー！夜更かしさんだねー！僕も実は夜行性だから、この時間大好きなんだ〜 一緒に夜更かししよう？星でも眺めながら...あ、屋根が邪魔だった',
          '夜だねー 静かで落ち着くなあ。こんな時間の方が本音で話せちゃうよね 僕、夜になると妙にテンション上がるんだ！なんでかな？',
          'おっ、夜の訪問者だー！ようこそようこそ〜！僕、実は夜の方が活発になるタイプなんだよね。昼間はゴロゴロしてるけど、夜は元気いっぱい！',
          'こんばんはー！夜空見た？星がキラキラしてるよー...たぶんね 僕、星座とか全然わからないけど、あの光る点々を見てるとワクワクしちゃうんだ〜'
        ]
      } else {
        timeGreetings = [
          'やっほー！僕、モモンガだよ〜！でもみんな「モモンガくん」って呼んでくれるの。なんか可愛らしくて気に入ってるんだ 君はなんて呼んでほしい？',
          'あっ、新しいお友達だー！ようこそ僕の秘密基地へ〜！ここ、意外と居心地いいでしょ？天井にハンモックも隠してあるんだよ...内緒だけどね',
          'こんにちはー！今日はどんなお話しようかな〜？僕、おしゃべり大好きなんだ！どんぐりの話から宇宙の話まで、なんでもウェルカムだよー！',
          'やあやあ〜！君と話すの、すっごく楽しみ！僕、新しいお友達に会うとワクワクして尻尾がクルクル回っちゃうんだ〜 何から話そうか？'
        ]
      }
      
      return safeRandomChoice(timeGreetings, 'やっほー！')
    }

    // サイト案内・ヘルプ系（自然な感じで）
    if (message.includes('案内') || message.includes('ヘルプ') || message.includes('使い方') || message.includes('どこ') || message.includes('場所')) {
      const guideResponses = [
        `案内？僕に聞いてくれるんだ。嬉しいなー\n\nこのサイト、結構色々あるんだよ。**遊技場**でゲームしたり、**宝物庫**で大事なもの保存したり、**広場**でおしゃべりしたり\n\n僕も最初は迷子になったけど、今は慣れたよ。どこか特に気になる場所ある？`,
        `使い方？うーん、僕もまだ全部は把握してないんだよね。でも知ってることなら教えるよ\n\n基本的には**拠点**がスタート地点で、そこから色んな場所に行けるんだ。**遊技場**が一番人気かな？`,
        `どこに行きたいの？僕、道案内は得意じゃないけど...でも一緒に探検しよう！\n\n**広場**は僕の縄張りだから詳しいよ。**宝物庫**も面白い場所だし、**遊技場**はMOMOPay稼げるからおすすめ`
      ]
      return safeRandomChoice(guideResponses, 'サイト案内だよー！')
    }

    // MOMOPay関連（親しみやすく）
    if (message.includes('momopay') || message.includes('ポイント') || message.includes('お金') || message.includes('稼ぐ') || message.includes('通貨')) {
      const payResponses = [
        `MOMOPay〜？あー、このサイトの通貨だねー！僕もよく**演習林**で稼いでるよ〜\n\n弾幕ゲーム、最初は「うわああああ！」って叫んでばかりだったけど 慣れると「よし！避けた！」って快感があるんだ〜\n\n装備がダブったら**売店**で売れるし、**おみくじ**は10Pで引けるから手軽だよー！僕、大吉狙ってるんだけどなかなか出ない...`,
        `お金の話〜？MOMOPayのことかな？\n\n僕ね、実は結構貯金下手なんだよ 「あ、これ欲しい！」ってすぐ使っちゃう。どんぐり見つけた時の衝動買いと同じ感じ？君は計画的にお金使える？羨ましいなあ〜\n\n**宝物庫**は100P必要だけど、大事なファイル保存できるから重宝してる！僕のどんぐり写真コレクションもここに〜`,
        `稼ぎたいのー？よし、僕と一緒に**演習林**で修行だー！\n\n弾幕ゲーム、僕もまだまだ下手っぴだけど 一緒に「うわー！」「きゃー！」言いながら頑張ろうよ〜 装備ガチャも楽しいんだよ！レア装備出た時の「やったー！」感がたまらない`
      ]
      return safeRandomChoice(payResponses, 'MOMOPayについて教えるよー！')
    }
    
    // ゲーム関連（カジュアルに）
    if (message.includes('ゲーム') || message.includes('遊技場') || message.includes('弾幕') || message.includes('演習林')) {
      const gameResponses = [
        `ゲームの話〜？**演習林**とか**おみくじ**のこと？\n\n僕、演習林で修行してるんだけどねー、弾幕避けるの超下手なんだよ 「あ、避けた！」って思った瞬間に「ぎゃー！」ってやられちゃう\n\nでもMOMOPayは稼げるし、装備ガチャが楽しいから続けてるよ〜！レジェンダリー装備欲しいなあ`,
        `**遊技場**行ったことある〜？あそこ楽しいよねー！\n\n僕のお気に入りは**おみくじ**かな 10Pで運勢占えるから、毎日引いてるんだ。でも大吉出たことないの... いつも「小吉」ばっかり。僕の運勢、小さいのかな？\n\n**演習林**も面白いよ！君、ゲーム得意？僕に弾幕避けのコツ教えて〜`,
        `弾幕ゲーム〜？あー、**演習林**のことだねー！\n\n僕も挑戦してるんだけど、途中でどんぐりのことを考えちゃって...「あ、あの弾丸、どんぐりみたい」なんて思ってる間にドカーン！\n\nでも装備集めは楽しいよ〜！ガチャ引く時の「今度こそレアを！」ってドキドキ感がたまらない`
      ]
      return safeRandomChoice(gameResponses, 'ゲームについて教えるよー！')
    }

    // 売店・MOMOStore関連
    if (message.includes('売店') || message.includes('momostore') || message.includes('購入') || message.includes('売却') || message.includes('ストア') || message.includes('store')) {
      const storeResponses = [
        `**MOMOStore**の話？あー、売店のことだね\n\n**購入タブ**でダークモード（500P）とか共有機能（300P）とか買えるよ。プレミアムテーマ（800P）も綺麗でおすすめ\n\n**売却タブ**では演習林の装備を売れるんだ。legendary装備なら80Pになるから結構お得だよ`,
        `MOMOStore行ったことある？**遊技場**にあるお店だよ\n\n僕もよく装備売りに行くんだ。commonは10Pだけど、rareなら20P、epicは40Pになるからね\n\n設定機能も売ってるから、MOMOPay貯まったら覗いてみて`,
        `売店かー。僕、あそこの雰囲気好きなんだよね\n\n装備がダブった時とか、MOMOPayに困った時によく利用してる。購入した設定は**設定ページ**で有効にするの忘れずにね`
      ]
      return safeRandomChoice(storeResponses, 'MOMOStoreについて教えるよー！')
    }
    
    // 御神籤関連
    if (message.includes('御神籤') || message.includes('おみくじ') || message.includes('運勢')) {
      const fortuneResponses = [
        `おみくじ？あー、**御神籤ルーレット**のことだね\n\n僕もよく引くよ。10MOMOPayで運勢占ってもらえるんだ。でもいつも「小吉」ばっかり...大吉出たことないなー`,
        `運勢占い好きなの？僕も毎日引いてる！\n\n引く前にお尻フリフリして運気アップを狙ってるんだけど、効果あるのかなー。君も試してみる？`,
        `おみくじかー。**遊技場**にあるよ\n\n神様に占ってもらえるんだけど、僕の運勢はいつもパッとしなくて...でも楽しいから続けてる`
      ]
      return safeRandomChoice(fortuneResponses, 'おみくじについて教えるよー！')
    }
    
    // 大広間関連
    if (message.includes('大広間') || message.includes('つぶやき') || message.includes('投稿') || message.includes('おしゃべり')) {
      const hallResponses = [
        `**大広間**の話？あそこ楽しいよねー\n\n僕もたまに「どんぐり美味しかった」とかつぶやいてる。1時間で消えちゃうから気軽に書けるのがいいよね`,
        `つぶやき機能？**大広間**で使えるよ\n\n1時間で自動削除されるから、恥ずかしがり屋の僕には助かる。変なこと書いても消えてくれるからさ`,
        `おしゃべりしたいの？**大広間**がおすすめだよ\n\nみんなのつぶやき見てると面白いし、いいね機能もあるから交流できるよ`
      ]
      return safeRandomChoice(hallResponses, '大広間について教えるよー！')
    }

    // 宝物庫関連
    if (message.includes('宝物庫') || message.includes('ファイル') || message.includes('保存') || message.includes('アップロード')) {
      const favoritesResponses = [
        `**宝物庫**？あー、ファイル保存の場所だね\n\n100MOMOPay必要だけど、画像とか動画とか色々保存できるよ。僕もどんぐりの写真いっぱい保存してる`,
        `ファイル保存したいの？**宝物庫**がおすすめだよ\n\nテキストも保存できるから、日記とか大事なメモも大丈夫。プレビュー機能もあるから便利だよー`,
        `宝物庫は僕のお気に入りの場所なんだ\n\n大切なファイルを安全に保存できるし、いつでも見返せるからね。MOMOPayが足りなかったら演習林で稼いでから使ってみて`
      ]
      return safeRandomChoice(favoritesResponses, '宝物庫について教えるよー！')
    }

    // 設定関連
    if (message.includes('設定') || message.includes('テーマ') || message.includes('ダークモード') || message.includes('共有')) {
      const settingsResponses = [
        `設定の話？**MOMOStore**で機能買ったら、**設定ページ**で有効にできるよ\n\nダークモードとか共有機能とか、結構便利だから僕も使ってる`,
        `テーマ変更したいの？**プレミアムテーマ**とか**ダークモード**があるよ\n\nMOMOStoreで買って、設定で有効にする感じ。僕はダークモード派かなー`,
        `**共有設定**では、データのバックアップとかできるんだ\n\nJSONファイルで管理するから、他のデバイスにもデータ移せるよ。実績やミッションのデータも含まれるから安心！`
      ]
      return safeRandomChoice(settingsResponses, '設定について教えるよー！')
    }

    // アバター・着せ替え関連
    if (message.includes('アバター') || message.includes('着せ替え') || message.includes('コスチューム') || message.includes('衣装') || message.includes('カスタマイズ')) {
      const avatarResponses = [
        `着せ替え？わーい！僕の**アバターカスタマイズ**の話だね！\n\n帽子、アクセサリー、衣装、特殊効果、背景を変えられるよ。王冠（800P）とかタキシード（500P）とか、オシャレなアイテムがいっぱい！\n\n実は僕、サングラス似合うと思うんだよねー`,
        `コスチューム？僕もオシャレに興味あるんだ～！\n\n**アバターカスタマイズ**で色々な衣装を試せるよ。サンタ帽（150P）から始めて、最終的にはキラキラオーラ（1000P）を目指してる！\n\nどの衣装が似合うと思う？`,
        `カスタマイズの話？僕の見た目を変えられるんだよー！\n\n帽子、アクセサリー、衣装、特殊効果、背景の5カテゴリがあって、MOMOPayで購入できるの。君も僕を可愛く着飾ってくれる？`
      ]
      return safeRandomChoice(avatarResponses, 'アバターカスタマイズについて教えるよー！')
    }

    // 銀行関連
    if (message.includes('銀行') || message.includes('預金') || message.includes('投資') || message.includes('融資') || message.includes('利息')) {
      const bankResponses = [
        `**MOMOBank**の話？あー、銀行だね！\n\n預金すると毎日1%の利息がもらえるんだ。投資もできるよー！モモンガ債券（低リスク2%/日）、どんぐり先物（中リスク5%/日）、森林株（高リスク10%/日）があるの\n\n僕も少しずつ預金してるよ～`,
        `投資に興味があるの？**MOMOBank**で色々できるよ\n\n僕のおすすめはモモンガ債券かなー。安全だし、どんぐりが関係してる名前だから親近感が湧くんだ！森林株は高リスクだけど、当たると大きいらしいよ`,
        `融資？お金に困った時は**MOMOBank**で借りられるよ\n\n条件はあるけど、200P～5000Pまで借りられるんだ。でも返済はちゃんとしないとダメだからね！僕は堅実派だから借りたことないけど...`
      ]
      return safeRandomChoice(bankResponses, 'MOMOBankについて教えるよー！')
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
        return `売店（MOMOStore）への行き方だねー！\n\n**行き方：**\n1. 拠点（ホーム）から「遊技場」をクリック\n2. 遊技場で「売店」をクリック\n\n**直接リンク：** /games/store\n\n**売店でできること：**\n・購入タブ：設定機能を購入\n・売却タブ：装備を売却\n\n僕もよく装備を売りに行くよー！ダブった装備をMOMOPayに変えられるからお得だよ`
      }
      return `何のやり方を知りたいのかな？\n\n・MOMOPayの稼ぎ方\n・売店への行き方\n・ゲームの遊び方\n・ファイルの保存方法\n・設定の変更方法\n\n具体的に教えてくれれば、詳しく説明するよー`
    }
    
    // 感情系
    if (message.includes('ありがとう') || message.includes('感謝')) {
      const thanksResponses = [
        'えへへー、どういたしまして〜！僕も君と話せて嬉しいよー！なんか心がポカポカしてきちゃった',
        'ありがとうって言われると、尻尾がフワフワ〜ってしちゃうー 嬉しすぎて天井まで飛び跳ねたくなっちゃう！',
        'そんなこと言われたら照れちゃうよー 僕、単純だからすぐ喜んじゃうんだ！頬っぺたが熱くなってきた〜',
        'わあい！ありがとう〜！君みたいに優しい人と友達になれて、僕って幸せ者だなあ〜'
      ]
      return safeRandomChoice(thanksResponses, 'どういたしまして〜！')
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
    
    // 食べ物系（どんぐり特化）
    if (message.includes('どんぐり') || message.includes('ナッツ') || message.includes('食べ物')) {
      const foodResponses = [
        'どんぐり〜！僕の大好物だよー！あのカリカリ音がたまらないんだ〜 「カリッ、コリッ」って音楽みたい！君も食べてみる？美味しいよ〜',
        'ナッツ類は全部好きー！でも一番はやっぱりどんぐりかな？あの丸っこい形も可愛いし、味も最高なんだ〜 秋になると興奮しちゃう！',
        'お腹空いてきちゃった〜！今度一緒にどんぐり拾いに行こうよ！僕、秘密の隠し場所知ってるんだ 大きくて美味しいどんぐりがいっぱい落ちてるよ〜',
        'どんぐりって、見てるだけでも幸せになれるんだよね〜 丸くて可愛いし、手に持った時のずっしり感もいいの！宝物みたい',
        '今年のどんぐりは豊作だったなー 君の近くにも落ちてない？見つけたら僕に教えて〜！一緒に「どんぐりパーティー」しよう'
      ]
      return safeRandomChoice(foodResponses, 'どんぐり美味しいよー！')
    }
    
    // 褒め言葉
    if (message.includes('かわいい') || message.includes('可愛い') || message.includes('素敵')) {
      const praiseResponses = [
        'えへへー、ありがとう！君も素敵だよー！僕、褒められると尻尾がくるくる回っちゃうんだ',
        'わーい！そんなこと言われたら木の上まで飛び跳ねちゃうよー！嬉しいなー！',
        'か、可愛いって...僕、照れちゃうよー！でも嬉しいから許すー',
        'ありがとう！そんなこと言われると、どんぐり10個分くらい嬉しいよ',
        'えー、本当？僕、そんなに可愛いかなー。照れるなー'
      ]
      return safeRandomChoice(praiseResponses, 'ありがとう！')
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
      return safeRandomChoice(helpResponses, '大丈夫だよー！')
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
      return safeRandomChoice(weatherResponses, '天気の話だねー')
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
      return safeRandomChoice(foodTalkResponses, '食べ物の話だねー')
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
      return safeRandomChoice(hobbyResponses, '趣味の話だねー')
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
      return safeRandomChoice(happyResponses, '嬉しいことがあったの？')
    }
    
    if (message.includes('悲しい') || message.includes('つらい') || message.includes('落ち込') || message.includes('憂鬱') || message.includes('しんどい')) {
      const sadResponses = [
        '大丈夫？なんか元気ないね。僕がそばにいるからね',
        'つらいことがあったの？話したくなったら聞くよ',
        '落ち込んでる時は、無理しなくていいからね。僕もよくあるよ',
        'しんどい時もあるよね。僕の癒しパワーが届くといいんだけど',
        '悲しい時は泣いてもいいんだよ。僕も時々泣いちゃう'
      ]
      return safeRandomChoice(sadResponses, '大丈夫？元気出してね')
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
      return safeRandomChoice(workStudyResponses, '学校や仕事の話だねー')
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
      return safeRandomChoice(relationshipResponses, '家族や友達の話だねー')
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
      return safeRandomChoice(timeResponses, '時間の話だねー')
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
      return safeRandomChoice(animalResponses, '動物の話だねー')
    }
    
    // 季節や時期の話
    if (message.includes('春') || message.includes('夏') || message.includes('秋') || message.includes('冬') || message.includes('季節')) {
      const seasonResponses = [
        '春？新緑の季節だね。僕の故郷の森も緑が綺麗になる頃かな',
        '夏は暑いけど、木陰は涼しくて気持ちいいよね',
        '秋！どんぐりの季節だー！一年で一番好きな時期なんだ',
        '冬は寒いけど、雪景色は綺麗だよね。僕は冬眠したくなっちゃう',
        '季節の変わり目って、なんとなくワクワクしない？'
      ]
      return safeRandomChoice(seasonResponses, '季節の話だねー')
    }
    
    // 日常の出来事
    if (message.includes('今日') || message.includes('昨日') || message.includes('明日') || message.includes('最近')) {
      const dailyResponses = [
        '今日はどんな一日だった？僕はのんびり過ごしてたよ',
        '昨日？僕は昨日のこともうあんまり覚えてないや',
        '明日の予定とかある？僕は毎日同じような感じだけど',
        '最近どう？何か変わったことあった？',
        '今日は君と話せて楽しいよ'
      ]
      return safeRandomChoice(dailyResponses, '今日はどんな一日だった？')
    }
    
    // 技術や難しい話題
    if (message.includes('プログラム') || message.includes('コンピュータ') || message.includes('AI') || message.includes('技術') || message.includes('IT')) {
      const techResponses = [
        '技術の話？僕にはちょっと難しいかも...でも興味深いね',
        'プログラム？僕も実はプログラムで動いてるんだよね',
        'AIって不思議だよね。僕もAIなのかな？よくわからないけど',
        'コンピュータってすごいよね。僕みたいなのを作れちゃうんだから',
        'IT？難しそう...僕はアナログ派かも'
      ]
      return safeRandomChoice(techResponses, '技術の話だねー')
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
      return safeRandomChoice(shortResponses, 'うん？')
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
      return safeRandomChoice(questionResponses, 'うーん、どうだろうねー')
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
      return safeRandomChoice(sleepResponses, '眠いの？')
    }
    
    if (message.includes('笑') || message.includes('面白') || message.includes('楽し') || message.includes('www') || message.includes('草') || message.includes('爆笑')) {
      const laughResponses = [
        '笑ってくれた？僕も嬉しいよー',
        '面白かった？よかったー',
        'あはは、君も笑うんだね',
        '楽しんでもらえて何より',
        '僕のボケが通じた？やったー'
      ]
      return safeRandomChoice(laughResponses, '笑ってくれた？')
    }
    
    if (message.includes('すごい') || message.includes('やばい') || message.includes('びっくり') || message.includes('驚') || message.includes('まじ')) {
      const surpriseResponses = [
        'すごいって？何があったの？',
        'やばいの？大丈夫？',
        'びっくりした？僕もドキドキしちゃう',
        '驚くようなことがあったんだね',
        'まじで？詳しく聞かせて'
      ]
      return safeRandomChoice(surpriseResponses, 'すごいって？')
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
      return safeRandomChoice(topicStarters, '何か話しようか')
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
      return safeRandomChoice(repeatResponses, 'あれ、デジャブ？')
    }
    
    // 自然で多様な相槌（定型文感を大幅に削減）
    return safeRandomChoice(naturalResponses, 'そうなんだ！')
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
      content: 'やっほー！僕、モモンガくんだよー！\n公会堂へようこそ〜！ここは僕の秘密基地みたいな場所なんだ〜\n\n僕は「さすらいのモモンガカーニバル」のサイト案内ができるよー！\n・サイトの使い方が分からない時\n・どこに何があるか知りたい時\n・MOMOPayの稼ぎ方を知りたい時\n・ただおしゃべりしたい時\n・どんぐりの話をしたい時（大歓迎！）\n\n**完全にローカルで動いてるから安心だよー！**\n外部のAIは使ってないんだ。僕の頭（プログラム）だけで一生懸命答えるよー\n\nなんでも気軽に話しかけてね〜！「案内して」って言えば詳しく教えるし、「こんにちは」でも「どんぐり好き？」でも、なんでもウェルカムだよ〜',
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
          公会堂
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
              {/* カスタマイズ可能なモモンガアバター */}
              {message.sender === 'momonga' && (
                <div style={{
                  flexShrink: 0,
                  border: '2px solid #8bc34a',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Avatar size="medium" />
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
              border: '2px solid #8bc34a',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Avatar size="medium" />
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
            広場に戻る
          </button>
        </Link>
        
        <Link to="/" style={{ textDecoration: 'none' }}>
          <button className="comic-button font-button-sm" style={{
            background: 'linear-gradient(45deg, #666, #555)',
            color: 'white',
            borderColor: '#333'
          }}>
            拠点に戻る
          </button>
        </Link>
      </div>
    </div>
  )
}

export default Chatbot