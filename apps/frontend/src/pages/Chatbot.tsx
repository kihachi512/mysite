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

  // モモンガくんの応答パターン
  const getResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase()
    
    // 挨拶系
    if (message.includes('こんにちは') || message.includes('こんばんは') || message.includes('おはよう') || message.includes('はじめまして')) {
      return 'こんにちは！🐿️ モモンガくんだよ！今日も元気いっぱいだね！何かお話しようか？'
    }
    
    // ゲーム関連
    if (message.includes('ゲーム') || message.includes('遊技場') || message.includes('弾幕') || message.includes('演習林')) {
      return '遊技場は楽しいよね！🎮 演習林での修行はどう？弾幕をかわすのは得意かな？御神籤も引いてみてね！'
    }
    
    if (message.includes('御神籤') || message.includes('おみくじ') || message.includes('運勢')) {
      return '御神籤は運試しにぴったりだよ！🎋 今日の運勢はどうかな？MOMOPayも貯まるからお得だよ～'
    }
    
    // MOMOPay関連
    if (message.includes('momopay') || message.includes('ポイント') || message.includes('お金') || message.includes('売店')) {
      return 'MOMOPayは大切だよね！💰 演習林で修行したり、御神籤を引いたりすると貯まるよ。売店で素敵なアイテムも買えるしね！'
    }
    
    // 大広間関連
    if (message.includes('大広間') || message.includes('つぶやき') || message.includes('投稿')) {
      return '大広間でのおしゃべりは楽しいよね！🐦 1時間で自動削除されるから、気軽につぶやけるのがいいところだよ～'
    }
    
    // 感情系
    if (message.includes('ありがとう') || message.includes('感謝')) {
      return 'どういたしまして！😊 モモンガくんはいつでもみんなの味方だよ！また何かあったら話しかけてね～'
    }
    
    if (message.includes('さびしい') || message.includes('つまらない') || message.includes('退屈')) {
      return '大丈夫だよ！🌟 モモンガくんがついてるからね！遊技場で遊んだり、大広間でおしゃべりしたりして元気出そう！'
    }
    
    if (message.includes('疲れた') || message.includes('つかれた')) {
      return 'お疲れさま！😌 たまには休憩も大切だよ。ゆっくりしていってね。モモンガくんがそばにいるから安心して～'
    }
    
    // 質問系
    if (message.includes('何') && (message.includes('できる') || message.includes('する'))) {
      return 'モモンガくんは色んなことができるよ！🐿️ おしゃべりしたり、ゲームのコツを教えたり、応援したり...何でも聞いてね！'
    }
    
    if (message.includes('どこ') || message.includes('場所')) {
      return 'ここは公会堂だよ！🏛️ 広場の一角にある特別な場所なんだ。モモンガくんとゆっくりお話しできる場所だよ～'
    }
    
    // 食べ物系
    if (message.includes('どんぐり') || message.includes('ナッツ') || message.includes('食べ物')) {
      return 'どんぐりは大好物だよ！🌰 カリカリして美味しいんだ～。君は何が好きかな？'
    }
    
    // 褒め言葉
    if (message.includes('かわいい') || message.includes('可愛い') || message.includes('素敵')) {
      return 'ありがとう！😊 モモンガくんも君のこと大好きだよ～！一緒にいると楽しいね！'
    }
    
    // 困った時
    if (message.includes('助けて') || message.includes('わからない') || message.includes('困った')) {
      return '大丈夫！モモンガくんが助けるよ！💪 何に困ってるか詳しく教えてね。一緒に解決しよう！'
    }
    
    // デフォルト応答
    const defaultResponses = [
      'なるほど～！🐿️ それは面白いね！もっと詳しく教えて？',
      'そうなんだ！😊 モモンガくんも勉強になるよ～',
      'へぇ～！✨ 君といるといつも新しい発見があるね！',
      'それは興味深いね！🌟 モモンガくんも気になるな～',
      'うんうん！😄 もっとお話ししようよ～',
      'そういうのもあるんだね！🐿️ 世界は広いな～',
      'なるほどなるほど！😊 君の話はいつも楽しいよ！'
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

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsTyping(true)

    // モモンガくんの応答（少し遅延を入れてリアルっぽく）
    setTimeout(() => {
      const response = getResponse(inputMessage)
      const momongaMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'momonga',
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, momongaMessage])
      setIsTyping(false)
    }, 1000 + Math.random() * 1500) // 1-2.5秒のランダムな遅延
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
      content: 'こんにちは！🐿️ モモンガくんだよ！\n公会堂へようこそ～！何でも気軽に話しかけてね！',
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
                  モモンガくんが考え中... 🤔
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