import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'node:path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Garante que o alias '@' aponte para a pasta 'src'
      // Esta é a forma recomendada para projetos Vite com ES Modules
      '@': path.resolve(new URL('.', import.meta.url).pathname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})