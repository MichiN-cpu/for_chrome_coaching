// content.js
// Webページに注入されるスクリプト
// popup.js からメッセージを受け取ってページのフォントサイズを変更する

const STORAGE_KEY = "fontSizeOffset"; // chrome.storage に保存するキー
const DEFAULT_OFFSET = 0;             // デフォルトのオフセット値（px）

// ---- ページ読み込み時: 保存済みのオフセットを適用 ----
chrome.storage.local.get(STORAGE_KEY, (result) => {
  const offset = result[STORAGE_KEY] ?? DEFAULT_OFFSET;
  if (offset !== 0) {
    applyOffset(offset);
  }
});

// ---- 現在のbody font-size（数値）を取得 ----
function getBaseFontSize() {
  const computed = window.getComputedStyle(document.body).fontSize;
  return parseFloat(computed); // "16px" → 16
}

// ---- body にオフセット分を上乗せして適用 ----
function applyOffset(offset) {
  // body の元々のfont-sizeを基準に上乗せする
  // data属性で元のサイズを記憶しておく
  if (!document.body.dataset.originalFontSize) {
    document.body.dataset.originalFontSize = getBaseFontSize();
  }
  const original = parseFloat(document.body.dataset.originalFontSize);
  const newSize = Math.max(8, original + offset); // 最小8pxに制限
  document.body.style.fontSize = `${newSize}px`;
  return newSize;
}

// ---- popup.js からのメッセージを処理 ----
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  chrome.storage.local.get(STORAGE_KEY, (result) => {
    let offset = result[STORAGE_KEY] ?? DEFAULT_OFFSET;

    switch (message.action) {
      case "increase":
        offset += message.value ?? 2;
        break;
      case "decrease":
        offset -= message.value ?? 2;
        break;
      case "reset":
        offset = DEFAULT_OFFSET;
        // リセット時は元のフォントサイズに戻す
        document.body.style.fontSize = "";
        delete document.body.dataset.originalFontSize;
        chrome.storage.local.set({ [STORAGE_KEY]: offset });
        sendResponse({ fontSize: getBaseFontSize() });
        return; // 早期リターン
      case "getSize":
        sendResponse({ fontSize: getBaseFontSize() });
        return;
    }

    // 変更をページに適用
    const newSize = applyOffset(offset);

    // chrome.storage に保存（ページリロード後も保持）
    chrome.storage.local.set({ [STORAGE_KEY]: offset });

    sendResponse({ fontSize: newSize });
  });

  // 非同期で sendResponse を呼ぶので true を返す
  return true;
});
