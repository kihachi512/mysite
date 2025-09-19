// Bedrock連携用カスタムフック
import { useState, useCallback } from 'react'
import { BedrockService, BedrockConfig, BEDROCK_MODELS } from '../services/bedrockService'

export interface UseBedrockOptions {
  enabled: boolean
  config?: BedrockConfig
}

export const useBedrock = (options: UseBedrockOptions) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bedrockService, setBedrockService] = useState<BedrockService | null>(null)

  // Bedrockサービス初期化
  const initializeBedrock = useCallback((config: BedrockConfig) => {
    try {
      const service = new BedrockService(config)
      setBedrockService(service)
      setError(null)
      return true
    } catch (err) {
      setError(`Bedrock初期化エラー: ${err instanceof Error ? err.message : '不明なエラー'}`)
      return false
    }
  }, [])

  // AI応答生成
  const generateResponse = useCallback(async (userMessage: string, context?: string): Promise<string> => {
    if (!options.enabled) {
      throw new Error('Bedrock連携が無効です')
    }

    if (!bedrockService) {
      if (options.config) {
        const initialized = initializeBedrock(options.config)
        if (!initialized) {
          throw new Error('Bedrockサービスの初期化に失敗しました')
        }
      } else {
        throw new Error('Bedrock設定が見つかりません')
      }
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await bedrockService!.generateResponse(userMessage, context)
      return response
    } catch (err) {
      const errorMessage = `AI応答生成エラー: ${err instanceof Error ? err.message : '不明なエラー'}`
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [options.enabled, options.config, bedrockService, initializeBedrock])

  // デフォルト設定
  const getDefaultConfig = useCallback((): BedrockConfig => {
    return {
      region: 'us-east-1', // Bedrockが利用可能なリージョン
      model: BEDROCK_MODELS.CLAUDE_3_HAIKU, // コスト効率の良いモデル
    }
  }, [])

  // 設定検証
  const validateConfig = useCallback((config: BedrockConfig): boolean => {
    if (!config.region || !config.model) {
      setError('region と model は必須です')
      return false
    }

    // 利用可能なモデルかチェック
    const availableModels = Object.values(BEDROCK_MODELS)
    if (!availableModels.includes(config.model as any)) {
      setError(`サポートされていないモデル: ${config.model}`)
      return false
    }

    return true
  }, [])

  return {
    isLoading,
    error,
    generateResponse,
    initializeBedrock,
    getDefaultConfig,
    validateConfig,
    isInitialized: !!bedrockService
  }
}