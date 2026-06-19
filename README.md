# nuxt-lit-ssr-starter

Nuxt 上で **Lit の Web Component を Declarative Shadow DOM (DSD) として SSR し、クライアントで hydration する**サイト制作基盤です。

[`nuxt-ssr-lit`](https://github.com/prashantpalikhe/nuxt-ssr-lit) を使い、`@lit-labs/ssr` の `LitElementRenderer` 経由で Lit 要素をサーバー側で `<template shadowrootmode="open">` として描画します。これにより JS の読み込み・実行を待たずに初期表示が完成し、その後 hydration で操作可能になります。

> **補足**: 当初リクエストにあった `nuxt-lit-ssr` は npm 上に存在しません。同等の機能を提供する実在パッケージ **`nuxt-ssr-lit`** を採用しています。

## 技術スタック

| 項目 | バージョン |
|------|-----------|
| Nuxt | 4.4.8 |
| Lit | 3.3.3 |
| nuxt-ssr-lit | 1.6.32 |
| Node.js | 20+（24 で動作確認） |
| パッケージマネージャ | pnpm |

> **Nuxt 4 について**: `nuxt-ssr-lit` は公式には Nuxt 3 向けモジュールですが、本リポジトリでは **Nuxt 4.4.8 で SSR・hydration が動作することを実機検証済み**です（[後述の注意点](#既知の注意点)あり）。

## セットアップ

```bash
pnpm install
```

## 開発・ビルド

```bash
pnpm dev        # 開発サーバー (http://localhost:3000)
pnpm build      # 本番ビルド
node .output/server/index.mjs   # 本番プレビュー
```

ブラウザでページのソースを表示すると、`lit-card` / `lit-counter` が `<template shadowrootmode="open">`（DSD）として描画されているのを確認できます。

### 外部サイト（Nuxt 外）への埋め込み

同じコンポーネントを純粋な手書き HTML サイトにも埋め込めます。スタンドアロンバンドルの生成と、既存 HTML への DSD 断片注入に対応しています。

```bash
pnpm build:demo     # wc.js バンドル + DSD 注入済み HTML を demo/dist/ に生成
pnpm preview:demo   # ビルドしてローカルサーバーで確認
```

仕組み・配信パターンの選び方・運用上の懸念点は **[docs/external-embedding.md](docs/external-embedding.md)** を参照してください。

## ディレクトリ構成

```
app/
├── app.vue                    # ルートシェル（<NuxtPage />）
├── pages/
│   └── index.vue              # Lit 要素を使うデモページ
├── plugins/
│   └── custom-elements.ts     # Web Component の登録（import するだけ）
└── wc/                        # Lit Web Component の定義
    ├── index.ts              # スタンドアロン配布バンドルのエントリ（hydration support 込み）
    ├── lit-counter.ts         # hydration デモ（インタラクティブ）
    └── lit-card.ts            # slot + DSD デモ（プレゼンテーショナル）
demo/
├── index.html                # 純 HTML 埋め込みデモ（タグだけ / パターン C）
└── dist/                     # 配布物（生成・gitignore）。snippets/ に DSD 断片
scripts/
└── render-dsd.mts            # @lit-labs/ssr で DSD 断片を生成するスクリプト
vite.lib.config.ts             # スタンドアロンバンドルの Vite 設定
nuxt.config.ts                 # nuxt-ssr-lit の設定
.npmrc                         # pnpm hoisting の回避設定（後述）
```

> 外部サイトへの埋め込みの詳細は [docs/external-embedding.md](docs/external-embedding.md) を参照。

## 仕組み

1. **要素定義** (`app/wc/*.ts`): `LitElement` を継承し、ファイル末尾で `customElements.define("lit-xxx", ...)` する。
2. **登録** (`app/plugins/custom-elements.ts`): universal プラグインで各定義ファイルを `import` するだけ。サーバー（`@lit-labs/ssr` の DOM shim 上）とクライアントの両方で `define` される。
3. **SSR** (`nuxt.config.ts`): `litElementPrefix` に列挙したプレフィックス（本基盤では `lit-`）を持つタグを `nuxt-ssr-lit` の Vite プラグインが自動で `LitWrapper` に包み、サーバーで DSD として描画する。
4. **Hydration**: SSR 出力には `defer-hydration="true"` が付与され、クライアントで JS が読み込まれると Lit が hydration し、イベントハンドラ等が有効になる。

---

## Web Component の追加手順

新しい Web Component を組み込むのは 3 ステップです。

### 1. 要素を定義する

`app/wc/` に Lit コンポーネントを作成します。**タグ名は必ず `lit-` プレフィックス**にしてください（`nuxt.config.ts` の `litElementPrefix` と一致させる必要があります）。

```ts
// app/wc/lit-badge.ts
import { LitElement, css, html } from "lit";

export class LitBadge extends LitElement {
  static properties = {
    text: { type: String },
  };

  declare text: string;

  static styles = css`
    :host {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 999px;
      background: #1f6feb;
      color: #fff;
      font: 600 12px system-ui, sans-serif;
    }
  `;

  constructor() {
    super();
    this.text = "";
  }

  render() {
    return html`<slot>${this.text}</slot>`;
  }
}

customElements.define("lit-badge", LitBadge);
```

### 2. 登録プラグインに import を追加する

```ts
// app/plugins/custom-elements.ts
import "~/wc/lit-counter";
import "~/wc/lit-card";
import "~/wc/lit-badge"; // ← 追加
```

### 3. テンプレートで使う

Vue の `.vue` テンプレート内でそのままカスタム要素として記述します。

```vue
<template>
  <!-- 属性として渡す（SSR される） -->
  <lit-badge text="New"></lit-badge>

  <!-- 動的バインドや slot も可能 -->
  <lit-badge :text="label">
    <strong>Beta</strong>
  </lit-badge>
</template>
```

これだけで、新しい要素も SSR（DSD）+ hydration の対象になります。

### 新しいプレフィックスを使いたい場合

`lit-` 以外のプレフィックス（例: 既存のデザインシステム接頭辞）を使う場合は `nuxt.config.ts` に追記します。

```ts
ssrLit: {
  litElementPrefix: ["lit-", "ds-"],
},
```

---

## 既知の注意点

### `.npmrc` の hoisting 設定は必須

本番ビルドで以下のエラーが出る既知の問題があります（[nuxt-ssr-lit#176](https://github.com/prashantpalikhe/nuxt-ssr-lit/issues/176)）。

```
The requested module 'vue' does not provide an export named 'default'
```

原因は、`nuxt-ssr-lit` がバンドルする `@vue/server-renderer` が pnpm の厳格な `node_modules` 配下で `vue` を default import してしまうことです。本リポジトリでは `.npmrc` で回避しています。**この設定を消すと本番ビルドが 500 になります。**

```ini
# .npmrc
public-hoist-pattern[]=@vue/server-renderer
```

### SSR 時に使えない DOM API がある

サーバー側は `@lit-labs/ssr` の軽量 DOM shim 上で描画されるため、以下はサーバーのライフサイクルでは動作しません（クライアント hydration 後は通常どおり動作）。

- slot に割り当てられた子要素・ノードの参照
- `CustomEvent` の dispatch
- `connectedCallback` 等でのイベントリスナ登録

インタラクティブな処理は hydration 後に実行される前提で実装してください。

## ライセンス

MIT
