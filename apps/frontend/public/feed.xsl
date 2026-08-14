<?xml version="1.0" encoding="UTF-8"?>
<!--
  RSS をブラウザで直接開いたときの見た目です。
  購読ソフトはこのファイルを無視して、feed.xml の中身だけを読みます。
-->
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" encoding="UTF-8" indent="yes" />

  <xsl:template match="/">
    <html lang="ja">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title><xsl:value-of select="rss/channel/title" />｜更新の購読</title>
        <meta name="robots" content="noindex" />
        <link rel="icon" href="favicon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="crossorigin" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&amp;family=Zen+Maru+Gothic:wght@400;500;700&amp;display=swap" rel="stylesheet" />
        <style>
          :root {
            --font: "Poppins", "Zen Maru Gothic", "Hiragino Maru Gothic ProN", "Yu Gothic",
              "Noto Sans JP", system-ui, sans-serif;
            color-scheme: light dark;
            --paper: #fbfbfa;
            --ink: #14140f;
            --ink-soft: #4a4a44;
            --ink-faint: #8a8a82;
            --rule: rgba(20, 20, 15, 0.14);
            --rule-soft: rgba(20, 20, 15, 0.07);
          }

          @media (prefers-color-scheme: dark) {
            :root {
              --paper: #111110;
              --ink: #eeeee8;
              --ink-soft: #b4b4ac;
              --ink-faint: #83837b;
              --rule: rgba(238, 238, 232, 0.18);
              --rule-soft: rgba(238, 238, 232, 0.09);
            }
          }

          * { box-sizing: border-box; }

          body {
            margin: 0 auto;
            padding: 72px 24px 96px;
            max-width: 46rem;
            background: var(--paper);
            color: var(--ink);
            font-family: var(--font);
            font-size: 16px;
            line-height: 1.95;
            letter-spacing: 0.04em;
            -webkit-font-smoothing: antialiased;
          }

          a { color: inherit; }

          .kicker {
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.3em;
            color: var(--ink-faint);
            margin: 0 0 6px;
          }

          h1 {
            font-size: 22px;
            font-weight: 700;
            letter-spacing: 0.12em;
            margin: 0 0 28px;
            padding-bottom: 14px;
            border-bottom: 1px solid var(--rule);
          }

          p { margin: 0 0 1.4em; color: var(--ink-soft); }

          .note {
            font-size: 13px;
            line-height: 1.9;
            color: var(--ink-faint);
            border-left: 1px solid var(--rule);
            padding-left: 16px;
            margin: 0 0 40px;
          }

          .item {
            padding: 18px 2px;
            border-top: 1px solid var(--rule-soft);
          }

          .item:last-of-type { border-bottom: 1px solid var(--rule-soft); }

          .item h2 { font-size: 17px; font-weight: 500; letter-spacing: 0.06em; margin: 0 0 2px; }

          .item h2 a { text-decoration: none; border-bottom: 1px solid var(--rule); padding-bottom: 2px; }

          .item .date { font-size: 12px; letter-spacing: 0.14em; color: var(--ink-faint); }

          .item .summary { font-size: 14px; color: var(--ink-soft); margin: 6px 0 0; }

          .home {
            display: inline-block;
            margin-top: 40px;
            font-size: 13px;
            letter-spacing: 0.12em;
            text-decoration: none;
            border-bottom: 1px solid var(--rule);
            padding-bottom: 2px;
          }
        </style>
      </head>
      <body>
        <p class="kicker">FEED</p>
        <h1>更新の購読</h1>

        <p>このページは、更新をお知らせするための一覧（RSS）です。</p>

        <p class="note">
          いま見えているアドレスを、お使いの購読ソフト（Feedly、Inoreader など）に
          登録しておくと、新しい作品を公開したときに手元に届きます。
          登録せずに、ときどきここを開いて確かめる使い方でも構いません。
        </p>

        <xsl:for-each select="rss/channel/item">
          <div class="item">
            <h2><a href="{link}"><xsl:value-of select="title" /></a></h2>
            <div class="date"><xsl:value-of select="substring(pubDate, 1, 16)" /></div>
            <p class="summary"><xsl:value-of select="description" /></p>
          </div>
        </xsl:for-each>

        <a class="home" href="{rss/channel/link}">齊藤智都のホームページへ</a>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
