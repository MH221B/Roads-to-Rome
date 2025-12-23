import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// https://vite.dev/config/
export default defineConfig(async () => {
  const monacoModule = await import('vite-plugin-monaco-editor')
  const monacoPlugin = (monacoModule as any).default?.default ?? (monacoModule as any).default ?? monacoModule

  return {
    plugins: [react(), tailwindcss(), monacoPlugin({})],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }
})