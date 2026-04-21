import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // Vue não é external no dev server — o devkit é uma app Vue normal.
  // O build IIFE (build.mjs) tem sua própria config e continua inalterado.
})
