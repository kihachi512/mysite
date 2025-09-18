import { createContext, useContext, type ReactNode, useState, useEffect } from 'react'
import { apiClient, FallbackStorage, type FavoriteItem, type Tweet } from '../lib/api'

// Re-export types for convenience
export type { FavoriteItem, Tweet }

// Context type
type AppDataContextType = {
  // Favorites
  favorites: FavoriteItem[]
  addFavorite: (favorite: Omit<FavoriteItem, 'id' | 'createdAt'>) => Promise<void>
  removeFavorite: (id: string) => Promise<void>
  loadingFavorites: boolean
  errorFavorites: string | null
  
  // Tweets
  tweets: Tweet[]
  addTweet: (content: string) => Promise<void>
  likeTweet: (tweetId: string, userKey: string) => Promise<void>
  loadingTweets: boolean
  errorTweets: string | null
  
  // Refresh data
  refreshData: () => Promise<void>
}

// Create context
const AppDataContext = createContext<AppDataContextType | undefined>(undefined)

// Provider component
export function AppDataProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [loadingFavorites, setLoadingFavorites] = useState(false)
  const [loadingTweets, setLoadingTweets] = useState(false)
  const [errorFavorites, setErrorFavorites] = useState<string | null>(null)
  const [errorTweets, setErrorTweets] = useState<string | null>(null)

  // Load data from API or fallback to localStorage
  const loadData = async () => {
    // Load favorites
    setLoadingFavorites(true)
    setErrorFavorites(null)
    try {
      const favoritesData = await apiClient.getFavorites()
      setFavorites(favoritesData)
    } catch (error) {
      console.warn('Failed to load favorites from API, using localStorage:', error)
      const fallbackFavorites = FallbackStorage.getFavorites()
      setFavorites(fallbackFavorites)
      setErrorFavorites('Using offline data')
    } finally {
      setLoadingFavorites(false)
    }

    // Load tweets
    setLoadingTweets(true)
    setErrorTweets(null)
    try {
      const tweetsData = await apiClient.getTweets()
      setTweets(tweetsData)
    } catch (error) {
      console.warn('Failed to load tweets from API, using localStorage:', error)
      const fallbackTweets = FallbackStorage.getTweets()
      setTweets(fallbackTweets)
      setErrorTweets('Using offline data')
    } finally {
      setLoadingTweets(false)
    }
  }

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [])

  // Favorites helpers
  const addFavorite = async (favorite: Omit<FavoriteItem, 'id' | 'createdAt'>) => {
    const newFavorite: FavoriteItem = {
      ...favorite,
      id: `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString()
    }

    try {
      await apiClient.createFavorite(favorite)
      setFavorites(prev => [newFavorite, ...prev])
    } catch (error) {
      console.warn('Failed to save favorite to API, using localStorage:', error)
      // Fallback to localStorage
      const updatedFavorites = [newFavorite, ...favorites]
      setFavorites(updatedFavorites)
      FallbackStorage.setFavorites(updatedFavorites)
    }
  }

  const removeFavorite = async (id: string) => {
    try {
      await apiClient.deleteFavorite(id)
      setFavorites(prev => prev.filter(item => item.id !== id))
    } catch (error) {
      console.warn('Failed to delete favorite from API, using localStorage:', error)
      // Fallback to localStorage
      const updatedFavorites = favorites.filter(item => item.id !== id)
      setFavorites(updatedFavorites)
      FallbackStorage.setFavorites(updatedFavorites)
    }
  }

  // Tweets helpers
  const addTweet = async (content: string) => {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours
    const newTweet: Tweet = {
      id: `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      content,
      createdAt: now.toISOString(),
      likes: 0,
      likedBy: [],
      expiresAt: expiresAt.toISOString()
    }

    try {
      await apiClient.createTweet(content)
      setTweets(prev => [newTweet, ...prev])
    } catch (error) {
      console.warn('Failed to save tweet to API, using localStorage:', error)
      // Fallback to localStorage
      const updatedTweets = [newTweet, ...tweets]
      setTweets(updatedTweets)
      FallbackStorage.setTweets(updatedTweets)
    }
  }

  const likeTweet = async (tweetId: string, userKey: string) => {
    const tweet = tweets.find(t => t.id === tweetId)
    if (!tweet) return

    const isLiked = tweet.likedBy.includes(userKey)
    const newLikes = isLiked ? Math.max(0, tweet.likes - 1) : tweet.likes + 1
    const newLikedBy = isLiked 
      ? tweet.likedBy.filter(id => id !== userKey)
      : [...tweet.likedBy, userKey]

    const updatedTweet = { ...tweet, likes: newLikes, likedBy: newLikedBy }
    const updatedTweets = tweets.map(t => t.id === tweetId ? updatedTweet : t)
    setTweets(updatedTweets)

    try {
      await apiClient.updateTweetLikes(tweetId, newLikes, newLikedBy)
    } catch (error) {
      console.warn('Failed to update tweet likes on API, using localStorage:', error)
      // Fallback to localStorage
      FallbackStorage.setTweets(updatedTweets)
    }
  }

  const refreshData = async () => {
    await loadData()
  }

  const value: AppDataContextType = {
    favorites,
    addFavorite,
    removeFavorite,
    loadingFavorites,
    errorFavorites,
    tweets,
    addTweet,
    likeTweet,
    loadingTweets,
    errorTweets,
    refreshData
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