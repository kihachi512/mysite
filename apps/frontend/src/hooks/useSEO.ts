import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  canonicalUrl?: string;
  iconUrl?: string;
  structuredData?: object;
  articleType?: 'website' | 'article' | 'game' | 'entertainment';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

export const useSEO = ({
  title,
  description,
  keywords,
  ogTitle,
  ogDescription,
  canonicalUrl,
  iconUrl,
  structuredData,
  articleType = 'website',
  author = 'さすらいのモモンガカーニバル',
  publishedTime,
  modifiedTime
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

      // メタディスクリプション（最適化）
      if (description) {
        const optimizedDesc = description.length > 160 
          ? description.substring(0, 157) + '...' 
          : description;
        updateMetaTag('description', optimizedDesc);
      }

      // キーワード（2024年基準：控えめに使用）
      if (keywords) {
        updateMetaTag('keywords', keywords);
      }

      // 必須メタタグ（2024年基準）- 既存のものがない場合のみ追加
      if (!document.querySelector('meta[name="viewport"]')) {
        updateMetaTag('viewport', 'width=device-width, initial-scale=1, shrink-to-fit=no');
      }
      updateMetaTag('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
      updateMetaTag('googlebot', 'index, follow');
      updateMetaTag('format-detection', 'telephone=no');
      updateMetaTag('theme-color', '#4caf50');
      updateMetaTag('color-scheme', 'light dark');

      // Open Graph（最新仕様）
      updatePropertyTag('og:site_name', 'さすらいのモモンガカーニバル');
      updatePropertyTag('og:type', articleType);
      updatePropertyTag('og:locale', 'ja_JP');
      updatePropertyTag('og:url', canonicalUrl || window.location.href);
      
      if (ogTitle) {
        updatePropertyTag('og:title', ogTitle);
      }
      if (ogDescription) {
        updatePropertyTag('og:description', ogDescription);
      }

      // Twitter Card（最新仕様）
      updatePropertyTag('twitter:card', 'summary_large_image');
      updatePropertyTag('twitter:site', '@momonga_carnival');
      updatePropertyTag('twitter:creator', '@momonga_carnival');
      
      if (ogTitle) {
        updatePropertyTag('twitter:title', ogTitle);
      }
      if (ogDescription) {
        updatePropertyTag('twitter:description', ogDescription);
      }

      // 記事メタデータ
      if (author) {
        updateMetaTag('author', author);
      }
      if (publishedTime) {
        updatePropertyTag('article:published_time', publishedTime);
      }
      if (modifiedTime) {
        updatePropertyTag('article:modified_time', modifiedTime);
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

      // アイコン設定（動的に変更可能）
      if (iconUrl && typeof iconUrl === 'string' && iconUrl.trim()) {
        try {
          // Open Graph画像の更新
          updatePropertyTag('og:image', iconUrl);
          updatePropertyTag('og:image:secure_url', `https://sasurai-momonga-carnival.com${iconUrl}`);
          
          // Twitter画像の更新
          updatePropertyTag('twitter:image', `https://sasurai-momonga-carnival.com${iconUrl}`);
          
          // favicon の動的更新
          const favicon = document.querySelector('link[rel="icon"][type="image/png"]') as HTMLLinkElement;
          if (favicon) {
            favicon.href = iconUrl;
          }
        } catch (e) {
          console.log('Icon update error:', e);
        }
      }

      // 構造化データ（JSON-LD）の追加（既存機能に影響なし）
      if (structuredData) {
        try {
          let structuredScript = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement;
          if (!structuredScript) {
            structuredScript = document.createElement('script');
            structuredScript.type = 'application/ld+json';
            document.head.appendChild(structuredScript);
          }
          structuredScript.textContent = JSON.stringify(structuredData);
        } catch (e) {
          console.log('Structured data update error:', e);
        }
      }
    } catch (e) {
      console.log('SEO update error:', e);
    }
  }, [title, description, keywords, ogTitle, ogDescription, canonicalUrl, iconUrl, structuredData, articleType, author, publishedTime, modifiedTime]);
};

// 各ページ用のSEO設定プリセット
export const SEO_PRESETS = {
  home: {
    title: 'ホーム',
    description: 'モモンガくんと一緒に楽しむ日本語エンターテイメントサイト。弾幕シューティングゲーム「演習林」でMOMOPayを稼ぎ、おみくじで運勢占い、公会堂でチャット。宝物庫でファイル管理も可能。完全無料で遊べる癒し系ゲームサイト。',
    keywords: 'モモンガ,弾幕ゲーム,シューティングゲーム,おみくじ,チャット,ファイル管理,日本語ゲーム,無料ゲーム,ブラウザゲーム,エンターテイメント,MOMOPay,演習林,公会堂,宝物庫,癒し系,カジュアルゲーム',
    ogTitle: 'さすらいのモモンガカーニバル | 弾幕ゲーム・おみくじ・チャット',
    ogDescription: 'モモンガくんと一緒に楽しむ癒し系エンターテイメントサイト。弾幕ゲーム、おみくじ、チャット機能を完全無料で楽しめます。',
    canonicalUrl: 'https://sasurai-momonga-carnival.com/',
    iconUrl: '/momonga-icon.png'
  },
  games: {
    title: '遊技場',
    description: '弾幕シューティングゲーム「演習林」やおみくじルーレットで遊んでMOMOPayを稼ごう！売店では便利機能を購入できます。装備ガチャでレア装備も獲得可能。',
    keywords: '遊技場,ゲーム,弾幕,シューティング,演習林,おみくじ,MOMOPay,売店,装備,ガチャ,レア,無料ゲーム,ブラウザゲーム',
    ogTitle: '遊技場 | さすらいのモモンガカーニバル',
    ogDescription: '弾幕シューティング、おみくじ、売店で楽しもう！MOMOPayを稼いで装備をゲット。',
    canonicalUrl: 'https://sasurai-momonga-carnival.com/games'
  },
  bulletHell: {
    title: '演習林 - 弾幕シューティングゲーム',
    description: '守護者として修行を積む本格弾幕シューティングゲーム。敵を倒してMOMOPayと装備を獲得！common、rare、epic、legendaryのレア装備ガチャで強化しよう。無敵時間、パワーアップ、ボス戦など充実の機能。',
    keywords: '演習林,弾幕,シューティング,ゲーム,MOMOPay,装備,ガチャ,守護者,無敵時間,パワーアップ,ボス戦,レア装備,common,rare,epic,legendary,無料シューティング',
    ogTitle: '演習林 - 弾幕シューティングゲーム | モモンガカーニバル',
    ogDescription: '本格弾幕シューティング！守護者として修行を積み、レア装備をゲットしよう。',
    canonicalUrl: 'https://sasurai-momonga-carnival.com/games/bullet-hell'
  },
  omikuji: {
    title: 'おみくじルーレット',
    description: '10MOMOPayで神様に運勢を占ってもらおう！大吉から凶まで様々な結果が待っています。今日の運勢をチェックして一日をスタート。',
    keywords: 'おみくじ,ルーレット,運勢,占い,大吉,凶,MOMOPay,今日の運勢,神様,無料占い',
    ogTitle: 'おみくじルーレット | モモンガカーニバル',
    ogDescription: '神様に運勢を占ってもらおう！大吉から凶まで、今日の運勢をチェック。',
    canonicalUrl: 'https://sasurai-momonga-carnival.com/games/omikuji'
  },
  store: {
    title: 'MOMOStore - 売店',
    description: 'MOMOPayで便利機能を購入したり、装備を売却したりできます。ダークモード（500P）、共有機能（300P）、プレミアムテーマ（800P）、通知音設定（200P）。装備売却でMOMOPayを稼ごう。',
    keywords: 'MOMOStore,売店,MOMOPay,ダークモード,共有機能,プレミアムテーマ,装備売却,通知音設定,購入,売却',
    ogTitle: 'MOMOStore - 売店 | モモンガカーニバル',
    ogDescription: 'MOMOPayで便利機能を購入！装備売却でMOMOPayも稼げます。',
    canonicalUrl: 'https://sasurai-momonga-carnival.com/games/store'
  },
  plaza: {
    title: '広場',
    description: 'みんなとおしゃべりしたり、モモンガくんとチャットしたりできる交流の場です。大広間でつぶやき、公会堂でAIチャット。コミュニティの中心地。',
    keywords: '広場,交流,おしゃべり,チャット,大広間,公会堂,つぶやき,コミュニティ,SNS,AI',
    ogTitle: '広場 | モモンガカーニバル',
    ogDescription: 'みんなとおしゃべり！大広間でつぶやき、公会堂でモモンガくんとチャット。',
    canonicalUrl: 'https://sasurai-momonga-carnival.com/plaza'
  },
  hall: {
    title: '大広間 - つぶやき',
    description: 'みんなでつぶやきを共有する大広間。今日あったことや思ったことを自由に投稿しましょう。1時間で自動削除されるので気軽に投稿できます。',
    keywords: '大広間,つぶやき,投稿,共有,交流,コミュニティ,SNS,自動削除,匿名,気軽',
    ogTitle: '大広間 - つぶやき | モモンガカーニバル',
    ogDescription: 'みんなでつぶやき共有！1時間で自動削除されるので気軽に投稿できます。',
    canonicalUrl: 'https://sasurai-momonga-carnival.com/plaza/hall'
  },
  chatbot: {
    title: '公会堂 - モモンガくんとチャット',
    description: 'モモンガくんとおしゃべりできる特別な場所。サイトの使い方やゲームのコツを教えてもらおう！AI搭載で自然な会話が楽しめます。',
    keywords: '公会堂,チャット,モモンガくん,会話,案内,ヘルプ,AI,人工知能,自然言語処理,サポート',
    ogTitle: '公会堂 - モモンガくんとチャット | モモンガカーニバル',
    ogDescription: 'モモンガくんとAIチャット！サイトの使い方やゲームのコツを教えてもらおう。',
    canonicalUrl: 'https://sasurai-momonga-carnival.com/plaza/chatbot'
  },
  favorites: {
    title: '宝物庫 - ファイル管理',
    description: '100MOMOPayでファイルや画像、テキストを安全に保存できます。プレビュー機能付きで管理も簡単。動画、音声ファイルにも対応。クラウドストレージのような使い方が可能。',
    keywords: '宝物庫,ファイル管理,保存,画像,テキスト,プレビュー,MOMOPay,動画,音声,クラウドストレージ,ファイルアップロード',
    ogTitle: '宝物庫 - ファイル管理 | モモンガカーニバル',
    ogDescription: 'ファイルを安全に保存！画像、動画、音声、テキストに対応。プレビュー機能付き。',
    canonicalUrl: 'https://sasurai-momonga-carnival.com/favorites'
  },
  settings: {
    title: '設定',
    description: 'サイトの各種設定を変更できます。一般設定やデータの共有設定、テーマ変更、機能管理など。購入した機能の有効化もここから。',
    keywords: '設定,一般設定,共有設定,データ管理,カスタマイズ,テーマ変更,機能管理,ダークモード,プレミアムテーマ',
    ogTitle: '設定 | モモンガカーニバル',
    ogDescription: 'サイトの設定を変更！テーマ変更、データ管理、機能管理など。',
    canonicalUrl: 'https://sasurai-momonga-carnival.com/settings'
  },
  generalSettings: {
    title: '一般設定',
    description: 'サイト全体の設定やデータ管理を行えます。テーマ変更（ダークモード、プレミアムテーマ）、通知音設定、データのリセットや削除が可能。',
    keywords: '一般設定,データ管理,リセット,削除,サイト設定,テーマ変更,ダークモード,プレミアムテーマ,通知音',
    ogTitle: '一般設定 | モモンガカーニバル',
    ogDescription: 'サイト全体の設定を管理。テーマ変更、データ管理、リセット機能など。',
    canonicalUrl: 'https://sasurai-momonga-carnival.com/settings/general'
  },
  shareSettings: {
    title: '共有設定',
    description: 'ゲームデータやMOMOPay、装備などのバックアップ・復元ができます。JSONファイルでデータ管理。他のデバイスへのデータ移行も簡単。',
    keywords: '共有設定,バックアップ,復元,データ,JSON,MOMOPay,装備,データ移行,エクスポート,インポート',
    ogTitle: '共有設定 | モモンガカーニバル',
    ogDescription: 'データのバックアップ・復元！JSONファイルで簡単データ管理。',
    canonicalUrl: 'https://sasurai-momonga-carnival.com/settings/share'
  },
  achievements: {
    title: '実績・トロフィー',
    description: 'カーニバルでの足跡を記録！ゲーム、ソーシャル、コレクション、特別実績を解除してMOMOPayや称号を獲得しよう。進捗確認と報酬システム搭載。',
    keywords: '実績,トロフィー,アチーブメント,足跡,記録,MOMOPay,称号,報酬,進捗,解除,ゲーム実績,コレクション',
    ogTitle: '実績・トロフィー | モモンガカーニバル',
    ogDescription: 'カーニバルでの実績を記録！様々な実績を解除してMOMOPayや称号を獲得。',
    canonicalUrl: 'https://sasurai-momonga-carnival.com/achievements'
  }
};