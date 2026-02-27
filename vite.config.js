import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/Chess_Engine/', 
  plugins: [react()],
  test: {
    testTimeout: 0
  }
})