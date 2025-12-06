import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/finanzas-app/',
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  // 'define' ya no es necesario para las variables de entorno con prefijo VITE_
  // Vite las expone automáticamente a `import.meta.env`.
  // Asegúrate de que tu variable en el archivo .env sea VITE_GEMINI_API_KEY.
  resolve: {
    alias: {
      // Es una mejor práctica apuntar '@' al directorio 'src'
      '@': path.resolve(__dirname, './src'),
    }
  }
});
