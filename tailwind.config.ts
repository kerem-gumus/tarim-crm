import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // TarimCRM tema renkleri
        cay: {
          50: '#f0f9f0',
          100: '#dcf2dc',
          200: '#bce4bc',
          300: '#8fcf8f',
          400: '#5cb35c',
          500: '#3a9a3a',
          600: '#2b7a2b',
          700: '#246124',
          800: '#1f4d1f',
          900: '#1a401a',
        },
      },
    },
  },
  plugins: [],
};

export default config;
