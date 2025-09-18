import { createContext, useContext, type ReactNode } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'

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
  setFavorites: (favorites: FavoriteItem[] | ((prev: FavoriteItem[]) => FavoriteItem[])) => void
  addFavorite: (favorite: FavoriteItem) => void
  removeFavorite: (id: string) => void
  
  // Tweets
  tweets: Tweet[]
  setTweets: (tweets: Tweet[] | ((prev: Tweet[]) => Tweet[])) => void
  addTweet: (tweet: Tweet) => void
  likeTweet: (tweetId: string, userKey: string) => void
  cleanupExpiredTweets: () => void
}

// Create context
const AppDataContext = createContext<AppDataContextType | undefined>(undefined)

// Provider component
export function AppDataProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useLocalStorage<FavoriteItem[]>('favoriteUploads', [])
  const [tweets, setTweets] = useLocalStorage<Tweet[]>('tweets', [])

  // Favorites helpers
  const addFavorite = (favorite: FavoriteItem) => {
    setFavorites(prev => [favorite, ...prev])
  }

  const removeFavorite = (id: string) => {
    setFavorites(prev => prev.filter(item => item.id !== id))
  }

  // Tweets helpers
  const addTweet = (tweet: Tweet) => {
    setTweets(prev => [tweet, ...prev])
  }

  const likeTweet = (tweetId: string, userKey: string) => {
    setTweets(prev => prev.map(tweet => {
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
    }))
  }

  const cleanupExpiredTweets = () => {
    const now = new Date().getTime()
    setTweets(prev => {
      const validTweets = prev.filter(tweet => {
        const expiresAt = new Date(tweet.expiresAt).getTime()
        return expiresAt > now
      })
      return validTweets
    })
  }

  const value: AppDataContextType = {
    favorites,
    setFavorites,
    addFavorite,
    removeFavorite,
    tweets,
    setTweets,
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