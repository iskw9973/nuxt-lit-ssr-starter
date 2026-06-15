/**
 * Lit Web Component の登録プラグイン。
 *
 * universal プラグイン（サーバー / クライアント両方で実行）として動作し、
 * 各要素ファイルを import するだけで module トップの `customElements.define()` が走る。
 *
 * - サーバー: nuxt-ssr-lit が適用する @lit-labs/ssr の DOM shim 上で define され、
 *   DSD として SSR される。
 * - クライアント: 同じ定義が登録され、hydration される。
 *
 * 新しい Web Component を追加したら、ここに import を一行足すだけでよい。
 */
import { defineNuxtPlugin } from "#app";

import "~/wc/lit-counter";
import "~/wc/lit-card";

export default defineNuxtPlugin(() => {});
