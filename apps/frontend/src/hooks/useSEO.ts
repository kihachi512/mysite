import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  canonicalUrl?: string;
}

export const useSEO = ({
  title,
  description,
  keywords,
  ogTitle,
  ogDescription,
  canonicalUrl
}: SEOProps) => {
  useEffect(() => {
    try {
      // タイトルの設定
      if (title && typeof title === 'string' && title.trim()) {
        document.title = `${title.trim()} | さすらいのモモンガカーニバル`;
      }

      // メタタグの動的更新
      const updateMetaTag = (name: string, content: string) => {
        try {
          if (!name || !content || typeof name !== 'string' || typeof content !== 'string') return;
          
          let meta = document.querySelector(`meta[name="${CSS.escape(name)}"]`) as HTMLMetaElement;
          if (!meta) {
            meta = document.createElement('meta');
            meta.name = name;
            document.head.appendChild(meta);
          }
          meta.content = content.trim();
        } catch (e) {
          console.log('Meta tag update error:', e);
        }
      };

      const updatePropertyTag = (property: string, content: string) => {
        try {
          if (!property || !content || typeof property !== 'string' || typeof content !== 'string') return;
          
          let meta = document.querySelector(`meta[property="${CSS.escape(property)}"]`) as HTMLMetaElement;
          if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute('property', property);
            document.head.appendChild(meta);
          }
          meta.content = content.trim();
        } catch (e) {
          console.log('Property tag update error:', e);
        }
      };

    // メタディスクリプション
    if (description) {
      updateMetaTag('description', description);
    }

    // キーワード
    if (keywords) {
      updateMetaTag('keywords', keywords);
    }

    // Open Graph
    if (ogTitle) {
      updatePropertyTag('og:title', ogTitle);
    }
    if (ogDescription) {
      updatePropertyTag('og:description', ogDescription);
    }

    // Twitter
    if (ogTitle) {
      updatePropertyTag('twitter:title', ogTitle);
    }
    if (ogDescription) {
      updatePropertyTag('twitter:description', ogDescription);
    }

      // カノニカルURL
      if (canonicalUrl && typeof canonicalUrl === 'string' && canonicalUrl.trim()) {
        try {
          let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
          if (!canonical) {
            canonical = document.createElement('link');
            canonical.rel = 'canonical';
            document.head.appendChild(canonical);
          }
          canonical.href = canonicalUrl.trim();
        } catch (e) {
          console.log('Canonical URL update error:', e);
        }
      }
    } catch (e) {
      console.log('SEO update error:', e);
    }
  }, [title, description, keywords, ogTitle, ogDescription, canonicalUrl]);
};

// 各ページ用のSEO設定プリセット
export const SEO_PRESETS = {
  home: {
    title: 'ホーム',
    description: 'モモンガくんと一緒に楽しむ日本語エンターテイメントサイト。弾幕ゲーム、おみくじ、チャット機能を無料で楽しめます。',
    keywords: 'モモンガ,ホーム,メイン,弾幕ゲーム,おみくじ,チャット',
    canonicalUrl: 'https://sasurai-momonga-carnival.com/'
  },
  games: {
    title: '遊技場',
    description: '弾幕シューティングゲーム「演習林」やおみくじルーレットで遊んでMOMOPayを稼ごう！売店では便利機能を購入できます。',
    keywords: '遊技場,ゲーム,弾幕,シューティング,演習林,おみくじ,MOMOPay,売店',
    canonicalUrl: 'https://sasurai-momonga-carnival.com/games'
  },
  bulletHell: {
    title: '演習林 - 弾幕シューティングゲーム',
    description: '守護者として修行を積む弾幕シューティングゲーム。敵を倒してMOMOPayと装備を獲得しよう！レア装備ガチャも楽しめます。',
    keywords: '演習林,弾幕,シューティング,ゲーム,MOMOPay,装備,ガチャ,守護者',
    canonicalUrl: 'https://sasurai-momonga-carnival.com/games/bullet-hell'
  },
  omikuji: {
    title: 'おみくじルーレット',
    description: '10MOMOPayで神様に運勢を占ってもらおう！大吉から凶まで様々な結果が待っています。',
    keywords: 'おみくじ,ルーレット,運勢,占い,大吉,凶,MOMOPay',
    canonicalUrl: 'https://sasurai-momonga-carnival.com/games/omikuji'
  },
  store: {
    title: 'MOMOStore - 売店',
    description: 'MOMOPayで便利機能を購入したり、装備を売却したりできます。ダークモード、共有機能、プレミアムテーマなど。',
    keywords: 'MOMOStore,売店,MOMOPay,ダークモード,共有機能,プレミアムテーマ,装備売却',
    canonicalUrl: 'https://sasurai-momonga-carnival.com/games/store'
  },
  plaza: {
    title: '広場',
    description: 'みんなとおしゃべりしたり、モモンガくんとチャットしたりできる交流の場です。大広間と公会堂があります。',
    keywords: '広場,交流,おしゃべり,チャット,大広間,公会堂,つぶやき',
    canonicalUrl: 'https://sasurai-momonga-carnival.com/plaza'
  },
  hall: {
    title: '大広間 - つぶやき',
    description: 'みんなでつぶやきを共有する大広間。今日あったことや思ったことを自由に投稿しましょう。',
    keywords: '大広間,つぶやき,投稿,共有,交流,コミュニティ',
    canonicalUrl: 'https://sasurai-momonga-carnival.com/plaza/hall'
  },
  chatbot: {
    title: '公会堂 - モモンガくんとチャット',
    description: 'モモンガくんとおしゃべりできる特別な場所。サイトの使い方やゲームのコツを教えてもらおう！',
    keywords: '公会堂,チャット,モモンガくん,会話,案内,ヘルプ',
    canonicalUrl: 'https://sasurai-momonga-carnival.com/plaza/chatbot'
  },
  favorites: {
    title: '宝物庫 - ファイル管理',
    description: '100MOMOPayでファイルや画像、テキストを安全に保存できます。プレビュー機能付きで管理も簡単。',
    keywords: '宝物庫,ファイル管理,保存,画像,テキスト,プレビュー,MOMOPay',
    canonicalUrl: 'https://sasurai-momonga-carnival.com/favorites'
  },
  settings: {
    title: '設定',
    description: 'サイトの各種設定を変更できます。一般設定やデータの共有設定など。',
    keywords: '設定,一般設定,共有設定,データ管理,カスタマイズ',
    canonicalUrl: 'https://sasurai-momonga-carnival.com/settings'
  },
  generalSettings: {
    title: '一般設定',
    description: 'サイト全体の設定やデータ管理を行えます。設定のリセットや削除も可能です。',
    keywords: '一般設定,データ管理,リセット,削除,サイト設定',
    canonicalUrl: 'https://sasurai-momonga-carnival.com/settings/general'
  },
  shareSettings: {
    title: '共有設定',
    description: 'ゲームデータやMOMOPay、装備などのバックアップ・復元ができます。JSONファイルでデータ管理。',
    keywords: '共有設定,バックアップ,復元,データ,JSON,MOMOPay,装備',
    canonicalUrl: 'https://sasurai-momonga-carnival.com/settings/share'
  }
};