# Chrome拡張機能 コーチングガイド

Chrome拡張機能の作り方を基礎から学ぶためのガイドです。

---

## 目次

1. [Chrome拡張機能とは](#1-chrome拡張機能とは)
2. [必要なファイル構成](#2-必要なファイル構成)
3. [manifest.json の書き方](#3-manifestjson-の書き方)
4. [拡張機能の種類と構成要素](#4-拡張機能の種類と構成要素)
5. [サンプル拡張機能の解説](#5-サンプル拡張機能の解説)
6. [開発の流れ（ローカルでのインストール方法）](#6-開発の流れローカルでのインストール方法)
7. [よくあるパターン集](#7-よくあるパターン集)

---

## 1. Chrome拡張機能とは

Chrome拡張機能は、Google Chromeブラウザの機能を拡張するプログラムです。  
HTML / CSS / JavaScript だけで作れるため、Web開発の知識があればすぐに始められます。

**できること例:**
- Webページのコンテンツを書き換える（文字を大きくする、色を変えるなど）
- ポップアップUIを表示する
- バックグラウンドで処理を実行する
- ブラウザのタブやブックマークを操作する

---

## 2. 必要なファイル構成

最小構成は **manifest.json の1ファイルだけ** です。  
実用的な拡張機能は以下のような構成になります。

```
my-extension/
├── manifest.json        # 必須: 拡張機能の設定ファイル
├── popup.html           # ツールバーアイコンをクリックしたときのUI
├── popup.js             # popup.html から読み込む JavaScript
├── content.js           # Webページに注入するスクリプト
├── background.js        # バックグラウンドで常駐するスクリプト
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

このリポジトリの `sample-extension/` フォルダに動くサンプルがあります。

---

## 3. manifest.json の書き方

`manifest.json` は拡張機能の「設計図」です。必ず必要です。

```json
{
  "manifest_version": 3,
  "name": "拡張機能の名前",
  "version": "1.0",
  "description": "拡張機能の説明",

  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },

  "content_scripts": [
    {
      "matches": ["https://*/*", "http://*/*"],
      "js": ["content.js"]
    }
  ],

  "background": {
    "service_worker": "background.js"
  },

  "permissions": ["storage", "tabs", "activeTab"],

  "host_permissions": ["https://*/*"]
}
```

### 重要フィールドの説明

| フィールド | 説明 |
|---|---|
| `manifest_version` | 現在は **3** を使う（2は廃止予定） |
| `name` | 拡張機能の名前（Chrome Web Storeに表示） |
| `version` | バージョン番号（`"1.0.0"` 形式） |
| `action` | ツールバーアイコンの設定 |
| `content_scripts` | どのページに・どのJSを注入するか |
| `background` | バックグラウンドで動くService Worker |
| `permissions` | 使用するChrome APIの権限 |
| `host_permissions` | アクセスするURLのパターン |

---

## 4. 拡張機能の種類と構成要素

### Popup（ポップアップ）
ツールバーのアイコンをクリックしたときに表示されるHTML画面。  
→ `popup.html` + `popup.js`

```
ユーザーがアイコンをクリック
       ↓
popup.html が表示される
       ↓
popup.js が動く
```

### Content Script（コンテントスクリプト）
**Webページ本体に注入される** JavaScript。  
ページのDOMを読み書きできる。

```
ユーザーがWebページを開く
       ↓
content.js が自動で実行される
       ↓
ページのHTMLを書き換えたりできる
```

### Service Worker（バックグラウンド）
ページやPopupが閉じていても動き続けるスクリプト。  
タブの状態監視・外部APIとの通信などに使う。

```
Chrome起動時 / 特定イベント時
       ↓
background.js が起動する
       ↓
タブ操作・通知・APIリクエストなど
```

### 3つの通信関係

```
┌─────────────┐   chrome.runtime.sendMessage   ┌──────────────────┐
│  popup.js   │ ──────────────────────────────> │  background.js   │
│             │ <────────────────────────────── │  (service worker)│
└─────────────┘   chrome.runtime.sendResponse   └──────────────────┘
       │                                                │
       │ chrome.tabs.sendMessage                        │
       v                                                v
┌─────────────┐                              ┌──────────────────┐
│ content.js  │ <────────────────────────── │   Chrome API     │
│ (Webページ内) │                              │  tabs/storage等  │
└─────────────┘                              └──────────────────┘
```

---

## 5. サンプル拡張機能の解説

`sample-extension/` には「ページの文字サイズを変更する」拡張機能のサンプルがあります。

**機能:**
- ポップアップに「文字を大きく」「文字を小さく」「リセット」ボタンがある
- クリックすると現在開いているページの文字サイズが変わる
- 設定はページをリロードしても記憶される（`chrome.storage` を使用）

**ファイル構成:**
```
sample-extension/
├── manifest.json   # MV3設定
├── popup.html      # UI（ボタン3つ）
├── popup.js        # ボタンのクリック処理
├── content.js      # ページのfont-sizeを変更する処理
└── icons/          # アイコン画像（SVGで代用）
```

---

## 6. 開発の流れ（ローカルでのインストール方法）

### 手順

1. **このリポジトリをクローン** またはフォルダを作る
   ```bash
   git clone <このリポジトリのURL>
   ```

2. **Chromeで拡張機能の管理ページを開く**
   - アドレスバーに `chrome://extensions/` と入力

3. **デベロッパーモードをONにする**
   - 右上のトグルをONにする

4. **「パッケージ化されていない拡張機能を読み込む」をクリック**

5. **`sample-extension` フォルダを選択**

6. **拡張機能がインストールされる**
   - ツールバーにアイコンが表示される

### コードを変更したら

- `chrome://extensions/` を開き、拡張機能のリロードボタン（↺）を押す
- Content Scriptの変更はページを再読み込みすると反映される

---

## 7. よくあるパターン集

### パターン1: 現在のタブのURLを取得する（popup.js内）

```javascript
const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
console.log(tab.url);
```

### パターン2: Content ScriptにメッセージをSend（popup.js → content.js）

```javascript
// popup.js
const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
chrome.tabs.sendMessage(tab.id, { action: "doSomething", value: 42 });
```

```javascript
// content.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "doSomething") {
    console.log("受け取った値:", message.value);
    sendResponse({ ok: true });
  }
});
```

### パターン3: データを保存・取得する（chrome.storage）

```javascript
// 保存
chrome.storage.local.set({ fontSize: 18 });

// 取得
const result = await chrome.storage.local.get("fontSize");
console.log(result.fontSize); // 18
```

### パターン4: ページのDOMを書き換える（content.js）

```javascript
// 全テキストの文字サイズを変更
document.body.style.fontSize = "20px";

// 特定の要素にクラスを追加
document.querySelectorAll("p").forEach(el => el.classList.add("highlight"));
```

### パターン5: 外部APIを叩く（background.js推奨）

```javascript
// background.js（Service Worker内ではfetchが使える）
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "fetchData") {
    fetch("https://api.example.com/data")
      .then(res => res.json())
      .then(data => sendResponse({ data }));
    return true; // 非同期応答のためtrueを返す
  }
});
```

---

## 参考リンク

- [Chrome Extension 公式ドキュメント](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 移行ガイド](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Chrome API リファレンス](https://developer.chrome.com/docs/extensions/reference/)
