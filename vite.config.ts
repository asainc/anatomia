import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';

/** Converte caminhos relativos ao arquivo de configuração em caminhos absolutos. */
const obterCaminho = (relativo: string) =>
  fileURLToPath(new URL(relativo, import.meta.url));

export default defineConfig({
  root: obterCaminho('./web'),
  publicDir: obterCaminho('./public'),
  plugins: [react()],
  resolve: {alias: {'@': obterCaminho('./')}},
  css: {postcss: {plugins: [tailwindcss()]}},
  server: {watch: {usePolling: true}},
  build: {outDir: obterCaminho('./dist'), emptyOutDir: true},
});
