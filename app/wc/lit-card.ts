import { LitElement, css, html } from "lit";

/**
 * `<lit-card>` — slot と DSD の動作確認用のプレゼンテーショナルな Web Component。
 *
 * 名前付き slot (`heading`) とデフォルト slot を持ち、SSR 時に
 * `<template shadowrootmode="open">` として書き出される。
 */
export class LitCard extends LitElement {
  static properties = {
    elevated: { type: Boolean },
  };

  declare elevated: boolean;

  static styles = css`
    :host {
      display: block;
      font-family: system-ui, sans-serif;
      border: 1px solid #d0d7de;
      border-radius: 12px;
      padding: 20px 24px;
      background: #fff;
    }

    :host([elevated]) {
      box-shadow: 0 8px 24px rgba(140, 149, 159, 0.2);
      border-color: transparent;
    }

    .heading {
      margin: 0 0 8px;
      font-size: 18px;
      font-weight: 700;
    }

    ::slotted(p) {
      margin: 0;
      color: #57606a;
      line-height: 1.6;
    }
  `;

  constructor() {
    super();
    this.elevated = false;
  }

  render() {
    return html`
      <h3 class="heading"><slot name="heading">無題</slot></h3>
      <div class="body"><slot></slot></div>
    `;
  }
}

customElements.define("lit-card", LitCard);
