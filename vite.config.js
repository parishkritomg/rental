import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // This exposes the server to your network
    port: 5174,
    allowedHosts: [
      '561a4937678e.ngrok-free.app',
      '.ngrok-free.app', // Allow all ngrok subdomains
      'localhost'
    ]
  }
})
