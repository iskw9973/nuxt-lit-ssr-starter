// DSD 注入エンジン。
//
// 既存の手書き HTML テンプレート (demo/templates/*.html) に置かれた
// `<!--dsd:NAME-->` マーカーを、@lit-labs/ssr で生成した DSD 断片に置換し、
// demo/dist/ へ出力する。
//
// 原本テンプレートは変更されないため、コンポーネントを更新したら
// `pnpm build:dsd` を再実行するだけで配布用 HTML が同期される。
import { render } from "@lit-labs/ssr";
import { collectResult } from "@lit-labs/ssr/lib/render-result.js";
import { html, type TemplateResult } from "lit";
import { readFile, writeFile, readdir } from "node:fs/promises";

import "../app/wc/lit-card";
import "../app/wc/lit-counter";

/**
 * マーカー名 → 注入する Lit テンプレートの対応。
 * コンポーネントの「使い方（props / slot 内容）」をここで一元管理する。
 */
const partials: Record<string, TemplateResult> = {
  card: html`
    <lit-card elevated>
      <span slot="heading">サーバーで描画されたカード</span>
      <p>
        この断片には <code>&lt;template shadowrootmode="open"&gt;</code> が含まれます。
        JS を無効化しても表示されるのが DSD の利点です。
      </p>
    </lit-card>
  `,
  counter: html`<lit-counter count="3" label="いいね"></lit-counter>`,
};

/** Lit テンプレートを SSR し、DSD を含む HTML 断片にする。 */
function ssr(template: TemplateResult): Promise<string> {
  return collectResult(render(template));
}

const templatesDir = new URL("../demo/templates/", import.meta.url);
const distDir = new URL("../demo/dist/", import.meta.url);

// 断片を事前に全て生成しておく。
const fragments = new Map<string, string>();
for (const [name, template] of Object.entries(partials)) {
  fragments.set(name, await ssr(template));
}

const files = (await readdir(templatesDir)).filter((f) => f.endsWith(".html"));

for (const file of files) {
  let source = await readFile(new URL(file, templatesDir), "utf8");

  // <!--dsd:NAME--> を順次置換。使われたマーカーを記録する。
  source = source.replace(/<!--dsd:([\w-]+)-->/g, (match, name: string) => {
    const fragment = fragments.get(name);
    if (fragment === undefined) {
      throw new Error(`${file}: 未定義の DSD マーカー <!--dsd:${name}--> です`);
    }
    return fragment;
  });

  await writeFile(new URL(file, distDir), source);
  console.log(`✓ ${file} → demo/dist/${file}`);
}
