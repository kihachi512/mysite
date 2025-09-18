export interface Env {
  URL_SHORTENER: KVNamespace;
}

// ローカル開発用のKVモック
class MockKV {
  private storage = new Map<string, { value: string; expiration?: number }>();

  async get(key: string): Promise<string | null> {
    const item = this.storage.get(key);
    if (!item) return null;
    
    // 有効期限チェック
    if (item.expiration && Date.now() > item.expiration) {
      this.storage.delete(key);
      return null;
    }
    
    return item.value;
  }

  async put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void> {
    const expiration = options?.expirationTtl ? Date.now() + (options.expirationTtl * 1000) : undefined;
    this.storage.set(key, { value, expiration });
  }
}

interface ShortUrlRequest {
  data: string;
}

interface ShortUrlResponse {
  shortId: string;
  shortUrl: string;
}

interface ExpandUrlResponse {
  data: string;
}

// ランダムな短いIDを生成
function generateShortId(length: number = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ローカル開発用のモックKVインスタンス
const mockKV = new MockKV();

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // ローカル開発時はモックKVを使用
    const kv = env?.URL_SHORTENER || mockKV;
    const url = new URL(request.url);
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      if (request.method === 'POST' && url.pathname === '/shorten') {
        // URL短縮API
        const body = await request.json() as ShortUrlRequest;
        
        if (!body.data) {
          return new Response(JSON.stringify({ error: 'Data is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // 短いIDを生成（重複チェック付き）
        let shortId: string;
        let attempts = 0;
        do {
          shortId = generateShortId();
          attempts++;
          if (attempts > 10) {
            // 10回試行して重複する場合は長いIDを生成
            shortId = generateShortId(12);
            break;
          }
        } while (await kv.get(shortId) !== null);

        // データを保存（24時間の有効期限）
        await kv.put(shortId, body.data, {
          expirationTtl: 24 * 60 * 60 // 24 hours
        });

        const response: ShortUrlResponse = {
          shortId,
          shortUrl: `${url.origin}/s/${shortId}`
        };

        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } else if (request.method === 'GET' && url.pathname.startsWith('/s/')) {
        // 短縮URL展開（リダイレクト）
        const shortId = url.pathname.substring(3); // Remove '/s/'
        
        if (!shortId) {
          return new Response('Invalid short URL', { 
            status: 400,
            headers: corsHeaders
          });
        }

        const data = await kv.get(shortId);
        
        if (!data) {
          return new Response('Short URL not found or expired', { 
            status: 404,
            headers: corsHeaders
          });
        }

        // フロントエンドにリダイレクト（データをクエリパラメータに含める）
        const redirectUrl = `${url.origin}?d=${encodeURIComponent(data)}`;
        
        return Response.redirect(redirectUrl, 302);

      } else if (request.method === 'GET' && url.pathname.startsWith('/expand/')) {
        // データ展開API（リダイレクトではなくJSONで返す）
        const shortId = url.pathname.substring(8); // Remove '/expand/'
        
        if (!shortId) {
          return new Response(JSON.stringify({ error: 'Invalid short ID' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const data = await kv.get(shortId);
        
        if (!data) {
          return new Response(JSON.stringify({ error: 'Short URL not found or expired' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const response: ExpandUrlResponse = { data };

        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } else {
        return new Response('Not Found', { 
          status: 404,
          headers: corsHeaders
        });
      }

    } catch (error) {
      console.error('Error:', error);
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  },
};