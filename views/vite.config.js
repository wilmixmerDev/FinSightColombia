import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Tailwind removido — diseño 100% Custom CSS en src/index.css
export default defineConfig({
  plugins: [
    react(),
  ],
})
