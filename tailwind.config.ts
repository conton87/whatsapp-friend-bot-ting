import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1e88e5',
          dark: '#1565c0',
          light: '#90caf9'
        }
      }
    }
  },
  plugins: []
};

export default config;
