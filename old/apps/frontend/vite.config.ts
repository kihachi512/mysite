import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // パフォーマンス最適化
  build: {
    // チャンク分割によるキャッシュ最適化
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          utils: ['framer-motion', 'lucide-react']
        }
      }
    },
    // ファイルサイズ制限の調整
    chunkSizeWarningLimit: 1000,
    // ソースマップの生成（本番では false に）
    sourcemap: process.env.NODE_ENV === 'development'
  },
  
  // 開発サーバー設定
  server: {
    port: 3000,
    host: true, // ネットワークアクセス許可
    open: true, // 自動でブラウザを開く
  },
  
  // プレビューサーバー設定
  preview: {
    port: 4173,
    host: true
  },
  
  // 環境変数の設定
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString())
  }
})
