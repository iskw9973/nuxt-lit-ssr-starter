<script setup lang="ts">
// このページの Lit カスタム要素 (lit-*) は nuxt-ssr-lit によって
// Declarative Shadow DOM として SSR され、クライアントで hydration される。
</script>

<template>
  <main class="page">
    <header class="hero">
      <h1>Nuxt × Lit SSR Starter</h1>
      <p>Lit Web Component を Declarative Shadow DOM で SSR し、Nuxt に組み込む基盤です。</p>
    </header>

    <section class="demo">
      <h2>lit-card（slot + DSD）</h2>
      <lit-card elevated>
        <span slot="heading">サーバーで描画されたカード</span>
        <p>
          このカードは <code>&lt;template shadowrootmode="open"&gt;</code> としてサーバーで
          描画されています。ページのソースを表示すると DSD が確認できます。
        </p>
      </lit-card>
    </section>

    <section class="demo">
      <h2>lit-counter（hydration）</h2>
      <p>初期値はサーバーで描画され、JS 読み込み後にボタンが動作します。</p>
      <lit-counter :count="3" label="いいね"></lit-counter>
    </section>
  </main>
</template>

<style scoped>
.page {
  max-width: 760px;
  margin: 0 auto;
  padding: 48px 24px 80px;
  font-family: system-ui, sans-serif;
  color: #1f2328;
}

.hero h1 {
  margin: 0 0 8px;
  font-size: 32px;
}

.hero p {
  margin: 0 0 32px;
  color: #57606a;
}

.demo {
  margin-top: 40px;
}

.demo h2 {
  font-size: 20px;
  margin-bottom: 12px;
}

code {
  background: #eff1f3;
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 0.9em;
}
</style>
