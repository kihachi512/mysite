export interface Env {
  URL_SHORTENER: KVNamespace;
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

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
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
        } while (await env.URL_SHORTENER.get(shortId) !== null);

        // データを保存（24時間の有効期限）
        await env.URL_SHORTENER.put(shortId, body.data, {
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

        const data = await env.URL_SHORTENER.get(shortId);
        
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

        const data = await env.URL_SHORTENER.get(shortId);
        
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