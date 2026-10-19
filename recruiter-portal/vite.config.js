import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Recruiter portal — port 5175 matches backend RECRUITER_CLIENT_URL default.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    host: true,
  },
});
