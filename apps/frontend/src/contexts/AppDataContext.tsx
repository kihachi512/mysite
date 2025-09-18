import { createContext, useContext, type ReactNode, useState, useEffect } from 'react'

// Types
export type FavoriteItem = {
  id: string
  name: string
  kind: 'text' | 'file'
  text?: string
  dataUrl?: string
  mime?: string
  createdAt: string
}

export type Tweet = {
  id: string
  content: string
  createdAt: string
  likes: number
  likedBy: string[]
  expiresAt: string
}

// Context type
type AppDataContextType = {
  // Favorites
  favorites: FavoriteItem[]
  addFavorite: (favorite: FavoriteItem) => void
  removeFavorite: (id: string) => void
  
  // Tweets
  tweets: Tweet[]
  addTweet: (tweet: Tweet) => void
  likeTweet: (tweetId: string, userKey: string) => void
  cleanupExpiredTweets: () => void
  
  // MOMOPay Points
  momoPayPoints: number
  addMomoPayPoints: (points: number) => void
  spendMomoPayPoints: (points: number) => boolean
}

// Create context
const AppDataContext = createContext<AppDataContextType | undefined>(undefined)

// Provider component
export function AppDataProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [tweets, setTweets] = useState<Tweet[]>([])

  // Load data from localStorage on mount
  useEffect(() => {
    // Load favorites
    const savedFavorites = localStorage.getItem('favoriteUploads')
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites))
      } catch {
        setFavorites([])
      }
    }

    // Load tweets
    const savedTweets = localStorage.getItem('tweets')
    if (savedTweets) {
      try {
        const tweetsData = JSON.parse(savedTweets)
        // Filter out expired tweets
        const now = new Date().getTime()
        const validTweets = tweetsData.filter((tweet: Tweet) => {
          const expiresAt = new Date(tweet.expiresAt).getTime()
          return expiresAt > now
        })
        setTweets(validTweets)
      } catch {
        setTweets([])
      }
    }
  }, [])

  // Favorites helpers
  const addFavorite = (favorite: FavoriteItem) => {
    const updatedFavorites = [favorite, ...favorites]
    setFavorites(updatedFavorites)
    localStorage.setItem('favoriteUploads', JSON.stringify(updatedFavorites))
  }

  const removeFavorite = (id: string) => {
    const updatedFavorites = favorites.filter(item => item.id !== id)
    setFavorites(updatedFavorites)
    localStorage.setItem('favoriteUploads', JSON.stringify(updatedFavorites))
  }

  // Tweets helpers
  const addTweet = (tweet: Tweet) => {
    const updatedTweets = [tweet, ...tweets]
    setTweets(updatedTweets)
    localStorage.setItem('tweets', JSON.stringify(updatedTweets))
  }

  const likeTweet = (tweetId: string, userKey: string) => {
    const updatedTweets = tweets.map(tweet => {
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
    setTweets(updatedTweets)
    localStorage.setItem('tweets', JSON.stringify(updatedTweets))
  }

  const cleanupExpiredTweets = () => {
    const now = new Date().getTime()
    const validTweets = tweets.filter(tweet => {
      const expiresAt = new Date(tweet.expiresAt).getTime()
      return expiresAt > now
    })
    if (validTweets.length !== tweets.length) {
      setTweets(validTweets)
      localStorage.setItem('tweets', JSON.stringify(validTweets))
    }
  }

  const value: AppDataContextType = {
    favorites,
    addFavorite,
    removeFavorite,
    tweets,
    addTweet,
    likeTweet,
    cleanupExpiredTweets
  }

  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  )
}

// Custom hook to use the context
export function useAppData() {
  const context = useContext(AppDataContext)
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppDataProvider')
  }
  return context
}