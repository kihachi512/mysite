import { createContext, useContext, type ReactNode, useState, useEffect } from 'react'
import { safeGetLocalStorage, safeSetLocalStorage, validateInputLength } from '../utils/security'

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
  
  // High Scores
  highScores: number[]
  updateHighScores: (newScore: number) => void
}

// Create context
const AppDataContext = createContext<AppDataContextType | undefined>(undefined)

// Provider component
export function AppDataProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [momoPayPoints, setMomoPayPoints] = useState<number>(0)
  const [highScores, setHighScores] = useState<number[]>([])

  // Load data from localStorage on mount with security validation
  useEffect(() => {
    // Load favorites with validation
    const savedFavorites = safeGetLocalStorage('favoriteUploads')
    if (Array.isArray(savedFavorites)) {
      // Validate favorite items structure and limit count
      const validFavorites = savedFavorites.slice(0, 100).filter((item: unknown) => {
        if (typeof item !== 'object' || item === null) return false
        const typedItem = item as Record<string, unknown>
        return (
          typeof typedItem.id === 'string' &&
          typeof typedItem.name === 'string' &&
          validateInputLength(typedItem.name, 100) &&
          ['text', 'file'].includes(typedItem.kind as string)
        )
      })
      setFavorites(validFavorites as FavoriteItem[])
    }

    // Load tweets with validation
    const savedTweets = safeGetLocalStorage('tweets')
    if (Array.isArray(savedTweets)) {
      const now = new Date().getTime()
      // Validate tweet structure and filter expired tweets
      const validTweets = savedTweets
        .slice(0, 1000) // Limit to 1000 tweets max
        .filter((tweet: unknown) => {
          if (typeof tweet !== 'object' || tweet === null) return false
          const typedTweet = tweet as Record<string, unknown>
          const isValidStructure = (
            typeof typedTweet.id === 'string' &&
            typeof typedTweet.content === 'string' &&
            typeof typedTweet.expiresAt === 'string' &&
            validateInputLength(typedTweet.content, 500)
          )
          if (!isValidStructure) return false
          
          // Check if not expired
          const expiresAt = new Date(typedTweet.expiresAt as string).getTime()
          return expiresAt > now
        })
      
      setTweets(validTweets as Tweet[])
    }

    // Load MOMOPay points with validation
    const savedPoints = safeGetLocalStorage('momoPayPoints')
    if (typeof savedPoints === 'number' && savedPoints >= 0 && savedPoints <= 10000000) {
      setMomoPayPoints(savedPoints)
    } else if (typeof savedPoints === 'string') {
      const points = parseInt(savedPoints, 10)
      if (!isNaN(points) && points >= 0 && points <= 10000000) {
        setMomoPayPoints(points)
      }
    }

    // Load high scores with validation
    const savedHighScores = safeGetLocalStorage('bullet-hell-all-time-scores')
    if (Array.isArray(savedHighScores)) {
      const validScores = savedHighScores
        .slice(0, 10) // Limit to top 10 scores
        .filter((score: unknown) => typeof score === 'number' && score >= 0 && score <= 100000000)
        .sort((a: number, b: number) => b - a) // Ensure descending order
      setHighScores(validScores as number[])
    }
  }, [])

  // Favorites helpers
  const addFavorite = (favorite: FavoriteItem) => {
    // Validate favorite item before adding
    if (!favorite.id || !favorite.name || !validateInputLength(favorite.name, 100)) {
      console.error('Invalid favorite item data')
      return
    }
    
    // Limit total favorites to 100
    const updatedFavorites = [favorite, ...favorites].slice(0, 100)
    setFavorites(updatedFavorites)
    safeSetLocalStorage('favoriteUploads', updatedFavorites)
  }

  const removeFavorite = (id: string) => {
    if (!id || typeof id !== 'string') {
      console.error('Invalid favorite ID')
      return
    }
    
    const updatedFavorites = favorites.filter(item => item.id !== id)
    setFavorites(updatedFavorites)
    safeSetLocalStorage('favoriteUploads', updatedFavorites)
  }

  // Tweets helpers
  const addTweet = (tweet: Tweet) => {
    // Validate tweet data
    if (!tweet.id || !tweet.content || !validateInputLength(tweet.content, 500)) {
      console.error('Invalid tweet data')
      return
    }
    
    // Limit total tweets to 1000
    const updatedTweets = [tweet, ...tweets].slice(0, 1000)
    setTweets(updatedTweets)
    safeSetLocalStorage('tweets', updatedTweets)
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

  // MOMOPay helpers
  const addMomoPayPoints = (points: number) => {
    // Validate points value
    if (typeof points !== 'number' || isNaN(points)) {
      console.error('Invalid points value')
      return
    }
    
    const newPoints = Math.min(Math.max(0, momoPayPoints + points), 10000000) // Cap at 10M
    setMomoPayPoints(newPoints)
    safeSetLocalStorage('momoPayPoints', newPoints)
  }

  const spendMomoPayPoints = (points: number): boolean => {
    // Validate points value
    if (typeof points !== 'number' || isNaN(points) || points < 0) {
      console.error('Invalid points value for spending')
      return false
    }
    
    if (momoPayPoints >= points) {
      const newPoints = Math.max(0, momoPayPoints - points)
      setMomoPayPoints(newPoints)
      safeSetLocalStorage('momoPayPoints', newPoints)
      return true
    }
    return false
  }

  // High scores helpers
  const updateHighScores = (newScore: number) => {
    // Validate score value
    if (typeof newScore !== 'number' || isNaN(newScore) || newScore < 0 || newScore > 100000000) {
      console.error('Invalid score value')
      return
    }
    
    const updatedScores = [...highScores, newScore].sort((a, b) => b - a).slice(0, 3)
    setHighScores(updatedScores)
    safeSetLocalStorage('bullet-hell-all-time-scores', updatedScores)
  }

  const value: AppDataContextType = {
    favorites,
    addFavorite,
    removeFavorite,
    tweets,
    addTweet,
    likeTweet,
    cleanupExpiredTweets,
    momoPayPoints,
    addMomoPayPoints,
    spendMomoPayPoints,
    highScores,
    updateHighScores
  }

  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  )
}

// Custom hook to use the context
// eslint-disable-next-line react-refresh/only-export-components
export const useAppData = () => {
  const context = useContext(AppDataContext)
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppDataProvider')
  }
  return context
}