# 外部サイトへの埋め込み（DSD / スタンドアロン配布）

同じ Lit コンポーネントを **Nuxt 内**だけでなく **Nuxt の外（純粋な手書き HTML サイト）**にも埋め込むための仕組みと、その際の注意点をまとめます。

---

## 前提: 表示は 2 レイヤーで考える

Web Component の表示には独立した 2 つのレイヤーがあります。これを分けて考えると混乱しません。

| レイヤー | 何をするか | 必要なもの |
|---|---|---|
| **① 初期表示（見た目）** | Shadow DOM を構築して中身を描画する | **DSD があれば JS 不要** / 無ければ Lit の JS が必要 |
| **② インタラクション** | クリック等で状態を更新する | **常に Lit の JS が必要** |

**DSD（Declarative Shadow DOM, `<template shadowrootmode="open">`）は純粋な HTML 構文**なので、ブラウザが①を JS なしで処理します。`@lit-labs/ssr` はこの DSD を生成するためのレンダラです。

---

## 3 つの配信パターン

| パターン | HTML に DSD | Lit JS | 初期表示 | 操作 | このリポジトリでの実装 |
|---|---|---|---|---|---|
| **A: Nuxt SSR** | あり（SSR が自動生成） | 読み込む | JS なしで見える ✅ | 動く ✅ | `app/`（`nuxt-ssr-lit`） |
| **B: 純 HTML + DSD 注入** | あり（ビルド時に注入） | 読み込む | JS なしで見える ✅ | 動く ✅ | `demo/templates/` + `scripts/render-dsd.mts` |
| **C: 純 HTML + タグだけ** | なし | 読み込む | JS が来るまで空 ⚠️ | 動く ✅ | `demo/index.html` |

> `lit-counter` のように操作が必要な要素は、どのパターンでも Lit の JS は必須です。DSD はあくまで「①初期表示を JS の到着前に前倒しする」ためのものです。

---

## エコシステム上の位置づけ（普通はどうするか）

**生の `@lit-labs/ssr` を直叩きするのは少数派**です。通常は DSD 生成を内部で行うラッパー経由で使います。

| 配信先 | 王道の手段 | `@lit-labs/ssr` の扱い |
|---|---|---|
| Astro サイト | `@astrojs/lit`（`.astro` で import + `client:*`） | プラグインが内部で使用 |
| Eleventy サイト | `@lit-labs/eleventy-plugin-lit` | プラグインが内部で使用 |
| Nuxt | `nuxt-ssr-lit`（本リポジトリのパターン A） | モジュールが内部で使用 |
| **素の手書き HTML（ラッパー無し）** | **`@lit-labs/ssr` を自前スクリプトで実行** | **自分で `render()` を叩く（パターン B）** |

このリポジトリのパターン B（`scripts/render-dsd.mts`）は、**配信先が素の手書き HTML でビルドツールが無い**という前提のための構成です。配信先が Astro / Eleventy なら、そちらのプラグインに寄せる方がきれいで、自前スクリプトは不要になります。

---

## パターン B の仕組み: マーカー注入方式

既存の手書き HTML テンプレートに `<!--dsd:NAME-->` 形式のプレースホルダを置き、ビルド時に DSD 断片を流し込みます。

```
demo/
├── templates/
│   └── embed.html        # 手書きの原本（マーカー入り、コミット対象）
└── dist/                 # 生成物（gitignore）
    ├── wc.js             # hydration support 入りバンドル
    ├── wc.iife.js        # CDN 直読み用（IIFE）
    └── embed.html        # 注入済み・配布用
```

- **原本（`templates/`）は変更されない**。コンポーネントを更新したら再ビルドするだけで配布用 HTML が同期される。
- マーカー名 → コンポーネントの使い方の対応は `scripts/render-dsd.mts` の `partials` で一元管理する。

### ビルド

| コマンド | 内容 |
|---|---|
| `pnpm build:wc` | スタンドアロンバンドル（`wc.js` / `wc.iife.js`）を生成 |
| `pnpm build:dsd` | `templates/*.html` のマーカーを DSD 断片に置換して `dist/` へ出力 |
| `pnpm build:demo` | 上記 2 つをまとめて実行 |
| `pnpm preview:demo` | ビルド後ローカルサーバーで確認 |

> `build:dsd` は `dist/` の存在を前提とするため、単体ではなく `build:demo`（= `build:wc` の後）で実行してください。

---

## 懸念点・落とし穴

### 1. hydration support を入れないと、JS ロード時に再描画される

DSD のある要素に**通常の Lit** を読み込むと、Lit は既存の Shadow DOM を破棄して再レンダリングします（初期表示はされるが、JS 到着時に一瞬ちらつく）。

これを防ぐため、配布バンドル (`app/wc/index.ts`) では **Lit 本体より先に** hydration support を読み込んでいます。これにより「DSD あり → hydration（再描画なし） / DSD なし → 通常描画」を 1 つのバンドルで両立できます。

```ts
// app/wc/index.ts — import 順が重要
import "@lit-labs/ssr-client/lit-element-hydrate-support.js"; // ← 必ず最初
import "./lit-card";
import "./lit-counter";
```

### 2. マーカー名が説明文・コード例と衝突する

`<!--dsd:NAME-->` を正規表現で置換するため、**テンプレートの説明コメントやコード例に同じ綴りを書くと誤って拾われます**（実際に開発中に踏みました）。

- 説明では `dsd:〈名前〉` のように綴りを崩す、もしくは `&lt;` でエスケープする。
- 未定義マーカーはビルド時にエラーで落ちるようにしてある（タイポの早期検出）。

### 3. hydration mismatch

hydration は「**サーバー（ビルド時）の描画結果とクライアントの初回描画が一致する**」前提で動きます。DSD を生成した時点と異なる props・状態でクライアントが描画すると hydration が壊れます。

- `partials`（ビルド時の props）と、実ページで渡す属性を一致させる。
- 乱数・`Date.now()` など**描画ごとに変わる値をテンプレートに直接埋めない**。

### 4. ブラウザ対応と polyfill

DSD のネイティブ対応は Chrome 111+ / Safari 16.4+ / Firefox 123+。これより古い環境を支える場合は DSD polyfill を `<head>` に置きます。

```html
<script>
  if (!HTMLTemplateElement.prototype.hasOwnProperty('shadowRootMode')) {
    document.querySelectorAll('template[shadowrootmode]').forEach((t) => {
      const mode = t.getAttribute('shadowrootmode');
      t.parentNode.attachShadow({ mode }).appendChild(t.content);
      t.remove();
    });
  }
</script>
```

### 5. `shadowroot`（旧）と `shadowrootmode`（新）の両属性

`@lit-labs/ssr` は後方互換のため `shadowroot="open"`（旧仕様）と `shadowrootmode="open"`（現行仕様）の両方を出力します。現行ブラウザは `shadowrootmode` を見るため、出力をそのまま使えば問題ありません。

### 6. スタイルがインスタンスごとにインライン展開される

DSD では各要素の Shadow DOM 内に `<style>` がインラインで書き出されます。**同じコンポーネントをページに多数並べると、その数だけ CSS が複製され HTML が肥大化**します（Constructable Stylesheets の共有は DSD には効きません）。

- 大量に並べる用途では、共通スタイルを Light DOM 側の通常 CSS に逃がす、要素数を抑える等を検討する。

### 7. 配布物の同期は「再ビルド」が必須

パターン B は**ビルド時スナップショット**です。コンポーネントのスタイル・テンプレートを変えたら `pnpm build:demo` を再実行し、`dist/` を配信し直す必要があります。手で `dist/` を編集しないこと（次のビルドで上書きされます）。

---

## どちらを使うべきか

| 配信先 | 推奨 |
|---|---|
| Nuxt アプリ | パターン A（`app/`） |
| Astro / Eleventy サイト | 各 Lit プラグイン（自前スクリプトは不要） |
| 素の手書き HTML / CMS テンプレート | **パターン B（マーカー注入）** |
| デモ・プロトタイプで初期表示を問わない | パターン C（タグだけ） |
