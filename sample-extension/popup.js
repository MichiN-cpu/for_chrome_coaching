// popup.js
// ポップアップが開かれたときに実行されるスクリプト

const STEP = 2; // 1回の操作で変化するpx数

// ---- 現在のサイズを表示 ----
async function updateDisplay(size) {
  document.getElementById("current-size").textContent = size ?? "--";
}

// ---- Content Scriptにメッセージを送る ----
async function sendToContentScript(action, value) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  try {
    const response = await chrome.tabs.sendMessage(tab.id, { action, value });
    if (response?.fontSize !== undefined) {
      await updateDisplay(response.fontSize);
    }
  } catch (e) {
    // Content Scriptがまだ読み込まれていない場合（chrome://などのページ）
    console.warn("Content Scriptへの送信に失敗:", e.message);
  }
}

// ---- 初期化: 現在のフォントサイズを取得して表示 ----
async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  try {
    const response = await chrome.tabs.sendMessage(tab.id, { action: "getSize" });
    updateDisplay(response?.fontSize);
  } catch {
    updateDisplay(null);
  }
}

// ---- ボタンのイベントリスナーを登録 ----
document.getElementById("btn-larger").addEventListener("click", () => {
  sendToContentScript("increase", STEP);
});

document.getElementById("btn-smaller").addEventListener("click", () => {
  sendToContentScript("decrease", STEP);
});

document.getElementById("btn-reset").addEventListener("click", () => {
  sendToContentScript("reset");
});

// ポップアップが開かれた時に現在値を取得
init();
