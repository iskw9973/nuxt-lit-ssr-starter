// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  // nuxt-ssr-lit: Lit 要素を Declarative Shadow DOM として SSR し、クライアントで hydration する
  modules: ["nuxt-ssr-lit"],

  // configKey は "ssrLit"。litElementPrefix に列挙したプレフィックスを持つカスタム要素が
  // 自動的に LitWrapper でラップされ、SSR される。
  ssrLit: {
    litElementPrefix: ["lit-"],
  },
});
