// API client for server-side data synchronization

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://your-api-gateway-url.amazonaws.com/prod'

export interface ApiError {
  error: string
  message?: string
}

export interface FavoriteItem {
  id: string
  name: string
  kind: 'text' | 'file'
  text?: string
  dataUrl?: string
  mime?: string
  createdAt: string
}

export interface Tweet {
  id: string
  content: string
  createdAt: string
  likes: number
  likedBy: string[]
  expiresAt: string
}

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Favorites API
  async getFavorites(): Promise<FavoriteItem[]> {
    return this.request<FavoriteItem[]>('/api/favorites')
  }

  async createFavorite(favorite: Omit<FavoriteItem, 'id' | 'createdAt'>): Promise<{ id: string }> {
    return this.request<{ id: string }>('/api/favorites', {
      method: 'POST',
      body: JSON.stringify(favorite),
    })
  }

  async deleteFavorite(id: string): Promise<{ ok: boolean }> {
    return this.request<{ ok: boolean }>(`/api/favorites?id=${id}`, {
      method: 'DELETE',
    })
  }

  // Tweets API
  async getTweets(): Promise<Tweet[]> {
    return this.request<Tweet[]>('/api/tweets')
  }

  async createTweet(content: string): Promise<{ id: string }> {
    return this.request<{ id: string }>('/api/tweets', {
      method: 'POST',
      body: JSON.stringify({ content }),
    })
  }

  async updateTweetLikes(id: string, likes: number, likedBy: string[]): Promise<{ ok: boolean }> {
    return this.request<{ ok: boolean }>('/api/tweets', {
      method: 'PUT',
      body: JSON.stringify({ id, likes, likedBy }),
    })
  }
}

export const apiClient = new ApiClient()

// Fallback to localStorage when API is not available
export class FallbackStorage {
  private static getStorageKey(type: 'favorites' | 'tweets'): string {
    return type === 'favorites' ? 'favoriteUploads' : 'tweets'
  }

  static getFavorites(): FavoriteItem[] {
    try {
      const data = localStorage.getItem(this.getStorageKey('favorites'))
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  }

  static setFavorites(favorites: FavoriteItem[]): void {
    try {
      localStorage.setItem(this.getStorageKey('favorites'), JSON.stringify(favorites))
    } catch (error) {
      console.error('Failed to save favorites to localStorage:', error)
    }
  }

  static getTweets(): Tweet[] {
    try {
      const data = localStorage.getItem(this.getStorageKey('tweets'))
      const tweets = data ? JSON.parse(data) : []
      // Filter out expired tweets
      const now = new Date().getTime()
      return tweets.filter((tweet: Tweet) => {
        const expiresAt = new Date(tweet.expiresAt).getTime()
        return expiresAt > now
      })
    } catch {
      return []
    }
  }

  static setTweets(tweets: Tweet[]): void {
    try {
      localStorage.setItem(this.getStorageKey('tweets'), JSON.stringify(tweets))
    } catch (error) {
      console.error('Failed to save tweets to localStorage:', error)
    }
  }
}