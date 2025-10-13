import type { Config } from 'tailwindcss';
import daisyui from 'daisyui';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f1f6ff',
          100: '#dbe7ff',
          200: '#b6ceff',
          300: '#8ab0ff',
          400: '#5b8dff',
          500: '#3268f7',
          600: '#1f4ed4',
          700: '#183ea9',
          800: '#173783',
          900: '#172f68'
        }
      },
      boxShadow: {
        card: '0 10px 30px -15px rgba(31, 78, 212, 0.35)'
      }
    }
  },
  plugins: [daisyui]
};

export default config;
