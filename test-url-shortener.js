// URL短縮機能のテストスクリプト
async function testUrlShortener() {
  const testData = "eyJmIjpbXSwidCI6W119"; // 空のデータの例
  
  try {
    console.log("🧪 URL短縮機能をテスト中...");
    
    // 短縮URL作成をテスト
    const shortenResponse = await fetch('http://localhost:8787/shorten', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: testData })
    });
    
    if (shortenResponse.ok) {
      const shortenResult = await shortenResponse.json();
      console.log("✅ 短縮URL作成成功:", shortenResult);
      
      // データ展開をテスト
      const expandResponse = await fetch(`http://localhost:8787/expand/${shortenResult.shortId}`);
      
      if (expandResponse.ok) {
        const expandResult = await expandResponse.json();
        console.log("✅ データ展開成功:", expandResult);
        
        if (expandResult.data === testData) {
          console.log("🎉 テスト完全成功！データが正しく保存・復元されました");
        } else {
          console.log("❌ データが一致しません");
        }
      } else {
        console.log("❌ データ展開失敗:", expandResponse.status);
      }
    } else {
      console.log("❌ 短縮URL作成失敗:", shortenResponse.status);
      
      // フォールバック機能のテスト
      console.log("🔄 フォールバック機能をテスト...");
      const currentUrl = "http://localhost:5173";
      const fallbackUrl = `${currentUrl}?d=${testData}`;
      console.log("📝 フォールバックURL:", fallbackUrl);
    }
  } catch (error) {
    console.error("❌ テスト中にエラーが発生:", error);
    console.log("🔄 フォールバック機能が動作します");
  }
}

// Node.jsで実行する場合
if (typeof window === 'undefined') {
  // fetch polyfillが必要な場合
  global.fetch = require('node-fetch');
  testUrlShortener();
}

// ブラウザのコンソールで実行する場合
if (typeof window !== 'undefined') {
  window.testUrlShortener = testUrlShortener;
  console.log("ブラウザのコンソールで testUrlShortener() を実行してください");
}