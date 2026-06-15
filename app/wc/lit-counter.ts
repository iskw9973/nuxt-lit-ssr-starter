import { LitElement, css, html } from "lit";

/**
 * `<lit-counter>` — hydration の動作確認用のインタラクティブな Web Component。
 *
 * SSR 時には Declarative Shadow DOM (DSD) として初期状態が描画され、
 * クライアントで JS が読み込まれると nuxt-ssr-lit の hydrateSupport プラグインによって
 * hydration され、ボタンが操作可能になる。
 */
export class LitCounter extends LitElement {
  static properties = {
    count: { type: Number },
    label: { type: String },
  };

  declare count: number;
  declare label: string;

  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      font-family: system-ui, sans-serif;
      border: 1px solid #d0d7de;
      border-radius: 8px;
      padding: 12px 16px;
    }

    button {
      width: 36px;
      height: 36px;
      font-size: 18px;
      line-height: 1;
      border: 1px solid #d0d7de;
      border-radius: 6px;
      background: #f6f8fa;
      cursor: pointer;
    }

    button:hover {
      background: #eaeef2;
    }

    .value {
      min-width: 3ch;
      text-align: center;
      font-variant-numeric: tabular-nums;
      font-weight: 600;
    }

    .label {
      color: #57606a;
    }
  `;

  constructor() {
    super();
    this.count = 0;
    this.label = "Count";
  }

  #dec() {
    this.count -= 1;
  }

  #inc() {
    this.count += 1;
  }

  render() {
    return html`
      <span class="label">${this.label}</span>
      <button type="button" @click=${this.#dec} aria-label="decrement">−</button>
      <span class="value">${this.count}</span>
      <button type="button" @click=${this.#inc} aria-label="increment">＋</button>
    `;
  }
}

customElements.define("lit-counter", LitCounter);
