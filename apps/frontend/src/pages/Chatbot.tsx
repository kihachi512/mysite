import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'

type Message = {
  id: string
  content: string
  sender: 'user' | 'momonga'
  timestamp: Date
}

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // モモンガくんの応答パターン（親しみやすく茶目っ気のある性格）
  const getResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase()
    
    // 挨拶系
    if (message.includes('こんにちは') || message.includes('こんばんは') || message.includes('おはよう') || message.includes('はじめまして')) {
      const greetings = [
        'やっほー！🐿️ 僕、モモンガくんだよ！今日も元気だね〜 何して遊ぶ？',
        'こんにちは〜！😄 僕と一緒に楽しい時間を過ごそうよ！何か面白い話ある？',
        'おーい！👋 モモンガくんだよ〜！今日はどんな冒険が待ってるかな？'
      ]
      return greetings[Math.floor(Math.random() * greetings.length)]
    }
    
    // ゲーム関連
    if (message.includes('ゲーム') || message.includes('遊技場') || message.includes('弾幕') || message.includes('演習林')) {
      const gameResponses = [
        '遊技場、最高だよね！🎮 僕も演習林で弾幕かわしてるけど...実は結構下手なんだ〜😅 でも楽しいからオッケー！',
        '演習林での修行、どう？僕はいつも途中でどんぐり拾いに夢中になっちゃうんだ〜🌰 集中力ないのかな？笑',
        'あ〜、弾幕ゲーム！僕もやるよ〜！でもね、たまに画面見てるとクラクラしちゃって...モモンガの目には刺激が強すぎるのかも？😵‍💫'
      ]
      return gameResponses[Math.floor(Math.random() * gameResponses.length)]
    }
    
    if (message.includes('御神籤') || message.includes('おみくじ') || message.includes('運勢')) {
      const fortuneResponses = [
        '御神籤！僕も大好き〜🎋 でもね、いつも「小吉」ばっかりなんだ...大吉引いてみたいなぁ〜',
        '運勢占い？僕の今日の運勢は「どんぐり運」が最高だよ！...って、そんな運勢あるのかな？😆',
        'おみくじはワクワクするよね〜！僕はいつも引く前にお尻をフリフリして運気アップを狙ってるんだ🐿️'
      ]
      return fortuneResponses[Math.floor(Math.random() * fortuneResponses.length)]
    }
    
    // MOMOPay関連
    if (message.includes('momopay') || message.includes('ポイント') || message.includes('お金') || message.includes('売店')) {
      const payResponses = [
        'MOMOPay！僕の財布事情も厳しいんだよね〜💸 でも売店のどんぐりシューターは絶対欲しい！',
        'ポイント貯めるの大変だよね〜！僕はいつも散財しちゃう...どんぐり見ると我慢できないんだ🌰',
        '売店でお買い物〜♪ 僕も装備ガチャ回したいけど、いつも爆死するんだよね...運悪いのかな？😅'
      ]
      return payResponses[Math.floor(Math.random() * payResponses.length)]
    }
    
    // 大広間関連
    if (message.includes('大広間') || message.includes('つぶやき') || message.includes('投稿')) {
      const hallResponses = [
        '大広間のおしゃべり楽しいよね〜🐦 僕もたまに「どんぐり美味しかった」とかつぶやいてるよ！',
        '1時間で消えちゃうから気軽だよね〜！僕は恥ずかしがり屋だから、消えるのは助かるかも😊',
        'みんなのつぶやき見てると面白いよ〜！僕もたまに変なこと書いちゃって、後で「あれ？」って思うんだ😅'
      ]
      return hallResponses[Math.floor(Math.random() * hallResponses.length)]
    }
    
    // 感情系
    if (message.includes('ありがとう') || message.includes('感謝')) {
      const thanksResponses = [
        'えへへ〜😊 どういたしまして！僕も君と話せて嬉しいよ〜！',
        'ありがとうって言われると、尻尾がフワフワしちゃう〜🐿️ 嬉しいな〜！',
        'そんなこと言われたら照れちゃうよ〜😳 僕、単純だからすぐ喜んじゃうんだ！'
      ]
      return thanksResponses[Math.floor(Math.random() * thanksResponses.length)]
    }
    
    if (message.includes('さびしい') || message.includes('つまらない') || message.includes('退屈')) {
      const lonelyResponses = [
        'あらら〜、寂しいの？😟 大丈夫！僕がいるよ〜！一緒にどんぐり探しでもする？',
        'つまらない時は僕と遊ぼう〜！僕の得意技、木の枝ぶら下がりを見せてあげる！...って、ここじゃできないか😅',
        '退屈な時は空を見上げてみて〜！雲の形、面白いよ〜！僕はいつもどんぐりに見えちゃうけどね🌰'
      ]
      return lonelyResponses[Math.floor(Math.random() * lonelyResponses.length)]
    }
    
    if (message.includes('疲れた') || message.includes('つかれた')) {
      const tiredResponses = [
        'お疲れさま〜！😌 僕もたまに木登りしすぎて疲れちゃうよ...ゆっくり休もうね〜',
        '疲れた時は僕みたいにゴロゴロするのがいいよ〜！モモンガ式リラックス法だよ🐿️',
        'あ〜、疲れてるんだね...僕の癒し系オーラで元気になって〜！...効果あるかな？😅'
      ]
      return tiredResponses[Math.floor(Math.random() * tiredResponses.length)]
    }
    
    // 質問系
    if (message.includes('何') && (message.includes('できる') || message.includes('する'))) {
      return '僕ができること？🐿️ おしゃべりと、木登りと、どんぐり集めと...あ、でも一番得意なのは君を笑顔にすることかな〜😄 えへへ〜'
    }
    
    if (message.includes('どこ') || message.includes('場所')) {
      return 'ここは公会堂だよ〜🏛️ 僕の秘密基地みたいな場所なんだ！実は天井にハンモック隠してあるんだよ...内緒だけどね😉'
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
    
    // デフォルト応答（茶目っ気を加えた）
    const defaultResponses = [
      'ほうほう〜🐿️ それは面白そうだね〜！僕の好奇心がムズムズしちゃうよ〜',
      'そうなんだ〜！😄 僕も勉強になるな〜！君って物知りだね〜',
      'へぇ〜！✨ 僕の小さな脳みそがフル回転してるよ〜！煙出てきそう😅',
      'それ興味深いな〜🌟 僕ももっと知りたくなっちゃった〜！詳しく教えて〜',
      'うんうん〜！😊 君の話、いつも楽しいよ〜！僕のお気に入りタイムだ〜',
      'そんなこともあるんだね〜🐿️ 世界って広いな〜！僕の知らないことがいっぱい〜',
      'なるほどなるほど〜😆 僕の頭の中のどんぐりがカラカラ鳴ってるよ〜'
    ]
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)]
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

    // モモンガくんの応答（少し遅延を入れてリアルっぽく）
    const timeoutId = setTimeout(() => {
      const response = getResponse(userInput)
      const momongaMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'momonga',
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, momongaMessage])
      setIsTyping(false)
    }, 1000 + Math.random() * 1500) // 1-2.5秒のランダムな遅延

    // クリーンアップ用にtimeoutIdを返す（実際は使用しないが、良いプラクティス）
    return () => clearTimeout(timeoutId)
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
    const welcomeMessage: Message = {
      id: 'welcome',
      content: 'やっほー！🐿️ 僕、モモンガくんだよ〜！\n公会堂へようこそ〜！ここは僕の秘密基地みたいな場所なんだ😄\n何でも気軽に話しかけてね〜！どんぐりの話でも、ゲームの話でも、なんでもオッケーだよ〜♪',
      sender: 'momonga',
      timestamp: new Date()
    }
    setMessages([welcomeMessage])
  }, [])

  return (
    <div style={{ 
      color: 'white', 
      padding: 'min(20px, 4vw)', 
      maxWidth: '800px', 
      margin: '0 auto',
      height: 'calc(100vh - 200px)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* ヘッダー */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div className="comic-text" style={{ 
          fontSize: 'clamp(1.4rem, 4.5vw, 2rem)', 
          marginBottom: '8px', 
          textShadow: '3px 3px 0px #2e7d32, 6px 6px 0px #1b5e20, 0 0 15px rgba(255,255,255,0.3)', 
          color: '#fff3e0'
        }}>
          🏛️ 公会堂 🏛️
        </div>
        <div className="comic-text" style={{ 
          fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)', 
          color: '#c8e6c9'
        }}>
          モモンガくんとおしゃべりしよう！
        </div>
      </div>

      {/* チャット画面 */}
      <div className="comic-card" style={{
        background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.2), rgba(123, 31, 162, 0.1))',
        borderColor: '#9c27b0',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '16px',
        marginBottom: '16px'
      }}>
        {/* メッセージ一覧 */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          marginBottom: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
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
                  fontSize: '1.5rem',
                  flexShrink: 0
                }}>
                  🐿️
                </div>
              )}
              
              {/* メッセージバブル */}
              <div className="comic-card" style={{
                background: message.sender === 'user' 
                  ? 'linear-gradient(135deg, rgba(66, 165, 245, 0.3), rgba(33, 150, 243, 0.2))'
                  : 'linear-gradient(135deg, rgba(76, 175, 80, 0.3), rgba(139, 195, 74, 0.2))',
                borderColor: message.sender === 'user' ? '#2196f3' : '#8bc34a',
                padding: '12px 16px',
                maxWidth: '70%',
                wordBreak: 'break-word'
              }}>
                <div className="comic-text" style={{
                  color: '#fff3e0',
                  fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
                  lineHeight: '1.4',
                  whiteSpace: 'pre-wrap'
                }}>
                  {message.content}
                </div>
                <div style={{
                  fontSize: '0.7rem',
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
              <div style={{ fontSize: '1.5rem' }}>🐿️</div>
              <div className="comic-card" style={{
                background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.3), rgba(139, 195, 74, 0.2))',
                borderColor: '#8bc34a',
                padding: '12px 16px'
              }}>
                <div className="comic-text" style={{
                  color: '#fff3e0',
                  fontSize: 'clamp(0.9rem, 2.5vw, 1rem)'
                }}>
                  モモンガくんが考え中だよ〜... 🤔💭
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* 入力欄 */}
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'flex-end'
        }}>
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="モモンガくんに話しかけてみよう..."
            rows={2}
            maxLength={500}
            className="comic-input"
            style={{
              flex: 1,
              padding: '12px',
              borderColor: 'rgba(255,255,255,0.4)',
              background: 'rgba(255,255,255,0.05)',
              color: 'white',
              fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
              resize: 'none'
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className="comic-button"
            style={{
              padding: '12px 16px',
              background: (!inputMessage.trim() || isTyping) 
                ? 'linear-gradient(45deg, #666, #555)' 
                : 'linear-gradient(45deg, #9c27b0, #7b1fa2)',
              color: 'white',
              borderColor: (!inputMessage.trim() || isTyping) ? '#333' : '#4a148c',
              fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
              minWidth: '60px'
            }}
          >
            送信
          </button>
        </div>
      </div>

      {/* ナビゲーションボタン */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        justifyContent: 'center', 
        flexWrap: 'wrap'
      }}>
        <Link to="/plaza" style={{ textDecoration: 'none' }}>
          <button className="comic-button" style={{
            padding: '10px 20px',
            fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
            background: 'linear-gradient(45deg, #4caf50, #45a049)',
            color: 'white',
            borderColor: '#2e7d32'
          }}>
            🏛️ 広場に戻る
          </button>
        </Link>
        
        <Link to="/" style={{ textDecoration: 'none' }}>
          <button className="comic-button" style={{
            padding: '10px 20px',
            fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
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