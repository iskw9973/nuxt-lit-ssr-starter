// DSD 断片ジェネレータ。
//
// @lit-labs/ssr で各コンポーネントの DSD (Declarative Shadow DOM) 断片を生成し、
// demo/dist/snippets/<name>.html に 1 ファイルずつ書き出す。
//
// 出力された断片を、貼りたい HTML の好きな場所に手でコピペして使う。
// 貼り先には wc.js（hydration support 入りバンドル）を 1 度だけ読み込めばよい。
import { render } from "@lit-labs/ssr";
import { collectResult } from "@lit-labs/ssr/lib/render-result.js";
import { html, type TemplateResult } from "lit";
import { mkdir, writeFile } from "node:fs/promises";

import "../app/wc/lit-card";
import "../app/wc/lit-counter";

/**
 * 出力する断片の定義。
 * ファイル名（キー）→ コンポーネントの使い方（props / slot 内容）。
 */
const snippets: Record<string, TemplateResult> = {
  card: html`
    <lit-card elevated>
      <span slot="heading">カードのタイトル</span>
      <p>カードの本文テキスト。</p>
    </lit-card>
  `,
  counter: html`<lit-counter count="0" label="いいね"></lit-counter>`,
};

/** Lit テンプレートを SSR し、DSD を含む HTML 断片にする。 */
function ssr(template: TemplateResult): Promise<string> {
  return collectResult(render(template));
}

const outDir = new URL("../demo/dist/snippets/", import.meta.url);
await mkdir(outDir, { recursive: true });

for (const [name, template] of Object.entries(snippets)) {
  const fragment = (await ssr(template)).trim();
  await writeFile(new URL(`${name}.html`, outDir), `${fragment}\n`);
  console.log(`✓ demo/dist/snippets/${name}.html`);
}
