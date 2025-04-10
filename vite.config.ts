// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// URL de tu backend API
const backendApiUrl = 'http://localhost:5176'; // Asegúrate que el puerto sea correcto

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Mantener esto para los subdominios si aún los usas para algo
    port: 5173, // Puerto del frontend
    strictPort: true,

    // --- AÑADIR CONFIGURACIÓN DEL PROXY ---
    proxy: {
      // Cualquier petición que empiece con '/api' será redirigida al backend
      '/api': {
        target: backendApiUrl, // La URL base de tu backend
        changeOrigin: true, // Necesario para hosts virtuales
        // secure: false, // Descomentar si tu backend usa HTTPS con certificado inválido (no aplica aquí)
         // Opcional: Reescribir ruta si es necesario (aquí no parece necesario)
        // rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
    // ------------------------------------
  }
})