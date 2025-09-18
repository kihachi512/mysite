import React, { useCallback, useState, useEffect } from 'react'

type Tweet = {
  id: string
  content: string
  createdAt: string
  likes: number
  likedBy: string[]
  expiresAt: string
}

const TWEETS_KEY = 'tweets'
const TWEET_EXPIRY_HOURS = 24

const Tweets: React.FC = () => {
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [newTweet, setNewTweet] = useState('')
  const [userName, setUserName] = useState('')

  // Load tweets from localStorage
  const loadTweets = useCallback(() => {
    if (typeof window === 'undefined') return []
    const saved = localStorage.getItem(TWEETS_KEY)
    if (!saved) return []
    try {
      const parsed = JSON.parse(saved)
      if (!Array.isArray(parsed)) return []
      
      // Filter out expired tweets
      const now = new Date().getTime()
      const validTweets = parsed.filter((tweet: Tweet) => {
        const expiresAt = new Date(tweet.expiresAt).getTime()
        return expiresAt > now
      })
      
      // Sort by creation time (newest first)
      return validTweets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } catch {
      return []
    }
  }, [])

  // Save tweets to localStorage
  const saveTweets = useCallback((tweets: Tweet[]) => {
    if (typeof window === 'undefined') return
    localStorage.setItem(TWEETS_KEY, JSON.stringify(tweets))
  }, [])

  // Load tweets on component mount
  useEffect(() => {
    setTweets(loadTweets())
  }, [loadTweets])

  // Auto-cleanup expired tweets every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTweets(prev => {
        const now = new Date().getTime()
        const validTweets = prev.filter(tweet => {
          const expiresAt = new Date(tweet.expiresAt).getTime()
          return expiresAt > now
        })
        if (validTweets.length !== prev.length) {
          saveTweets(validTweets)
        }
        return validTweets
      })
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [saveTweets])

  const generateId = () => `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTweet.trim() || !userName.trim()) return

    const now = new Date()
    const expiresAt = new Date(now.getTime() + TWEET_EXPIRY_HOURS * 60 * 60 * 1000)

    const tweet: Tweet = {
      id: generateId(),
      content: newTweet.trim(),
      createdAt: now.toISOString(),
      likes: 0,
      likedBy: [],
      expiresAt: expiresAt.toISOString()
    }

    const updatedTweets = [tweet, ...tweets]
    setTweets(updatedTweets)
    saveTweets(updatedTweets)
    setNewTweet('')
  }

  const handleLike = (tweetId: string) => {
    const userKey = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    
    setTweets(prev => {
      const updated = prev.map(tweet => {
        if (tweet.id === tweetId) {
          const isLiked = tweet.likedBy.includes(userKey)
          if (isLiked) {
            // Unlike
            return {
              ...tweet,
              likes: Math.max(0, tweet.likes - 1),
              likedBy: tweet.likedBy.filter(id => id !== userKey)
            }
          } else {
            // Like
            return {
              ...tweet,
              likes: tweet.likes + 1,
              likedBy: [...tweet.likedBy, userKey]
            }
          }
        }
        return tweet
      })
      saveTweets(updated)
      return updated
    })
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date().getTime()
    const tweetTime = new Date(dateString).getTime()
    const diffMs = now - tweetTime
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMinutes < 1) return 'たった今'
    if (diffMinutes < 60) return `${diffMinutes}分前`
    if (diffHours < 24) return `${diffHours}時間前`
    return `${diffDays}日前`
  }

  const formatExpiry = (expiresAt: string) => {
    const now = new Date().getTime()
    const expiryTime = new Date(expiresAt).getTime()
    const diffMs = expiryTime - now
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (diffHours > 0) return `あと${diffHours}時間${diffMinutes}分で削除`
    if (diffMinutes > 0) return `あと${diffMinutes}分で削除`
    return 'まもなく削除'
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2 className="comic-text" style={{ 
          color: '#fff3e0', 
          textShadow: '3px 3px 0px #2e7d32, 6px 6px 0px #1b5e20, 0 0 15px rgba(255,255,255,0.3)', 
          fontSize: '2.4rem', 
          marginBottom: '12px' 
        }}>
          🐦 森のつぶやき 🐦
        </h2>
        <p className="comic-text" style={{ color: '#c8e6c9', fontSize: '1.3rem', textShadow: '2px 2px 0px rgba(0,0,0,0.5)' }}>
          24時間で自動削除されるつぶやき
        </p>
      </div>

      {/* Tweet Form */}
      <div className="comic-card" style={{ 
        background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(139, 195, 74, 0.1))', 
        padding: '24px', 
        borderColor: '#8bc34a', 
        marginBottom: '24px' 
      }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="名前（必須）"
            required
            className="comic-input"
            style={{
              padding: '12px',
              borderColor: 'rgba(255,255,255,0.4)',
              background: 'rgba(255,255,255,0.05)',
              color: 'white',
              fontSize: '1.1rem'
            }}
          />
          <textarea
            value={newTweet}
            onChange={(e) => setNewTweet(e.target.value)}
            placeholder="何かつぶやいてみよう..."
            rows={3}
            maxLength={280}
            required
            className="comic-input"
            style={{
              padding: '12px',
              borderColor: 'rgba(255,255,255,0.4)',
              background: 'rgba(255,255,255,0.05)',
              color: 'white',
              fontSize: '1.1rem',
              resize: 'vertical'
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
              {newTweet.length}/280
            </span>
            <button
              type="submit"
              className="comic-button"
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(45deg, #66bb6a, #4caf50)',
                color: 'white',
                fontSize: '1.1rem',
                borderColor: '#2e7d32'
              }}
            >
              🐦 つぶやく
            </button>
          </div>
        </form>
      </div>

      {/* Tweets List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {tweets.length === 0 ? (
          <div className="comic-card" style={{ 
            textAlign: 'center', 
            color: '#c8e6c9', 
            padding: '48px', 
            background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(139, 195, 74, 0.05))', 
            borderColor: '#8bc34a',
            borderStyle: 'dashed'
          }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>🐦</div>
            <div className="comic-text" style={{ fontSize: '1.2rem' }}>まだつぶやきがありません</div>
            <div className="comic-text" style={{ fontSize: '1rem', marginTop: '8px' }}>最初のつぶやきを投稿してみよう！</div>
          </div>
        ) : (
          tweets.map((tweet) => (
            <div key={tweet.id} className="comic-card" style={{ 
              background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(139, 195, 74, 0.1))', 
              color: '#fff3e0', 
              padding: '20px', 
              borderColor: '#8bc34a'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div className="comic-text" style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                  {userName || '匿名ユーザー'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <div className="comic-text" style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
                    {formatTimeAgo(tweet.createdAt)}
                  </div>
                  <div className="comic-text" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                    {formatExpiry(tweet.expiresAt)}
                  </div>
                </div>
              </div>
              
              <div style={{ marginBottom: '12px', lineHeight: '1.5' }}>
                {tweet.content}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  onClick={() => handleLike(tweet.id)}
                  className="comic-button"
                  style={{
                    background: 'linear-gradient(45deg, #ff6b6b, #f44336)',
                    color: 'white',
                    padding: '8px 16px',
                    fontSize: '0.9rem',
                    borderColor: '#d32f2f',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  ❤️ {tweet.likes}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Tweets