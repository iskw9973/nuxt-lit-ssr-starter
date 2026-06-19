// スタンドアロン配布バンドルのエントリポイント。
//
// hydration support を Lit 本体より先に読み込むことで、
// - DSD あり要素: サーバー生成の Shadow DOM を再利用して hydration（再描画なし）
// - DSD なし要素: 通常どおりクライアントで描画
// の両方を 1 つのバンドルで賄える。
import "@lit-labs/ssr-client/lit-element-hydrate-support.js";

import "./lit-card";
import "./lit-counter";
