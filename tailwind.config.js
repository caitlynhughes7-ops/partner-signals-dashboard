/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          50: '#f6f7f9',
          100: '#eceef2',
          200: '#d5dae3',
          300: '#b0bac9',
          400: '#8494ab',
          500: '#647691',
          600: '#4f5f78',
          700: '#414d61',
          800: '#394252',
          900: '#242b36',
        },
        accent: {
          50: '#eef4ff',
          100: '#dbe6fe',
          200: '#bed3fe',
          300: '#91b6fd',
          400: '#5d90fa',
          500: '#3769f6',
          600: '#214aeb',
          700: '#1a38d8',
          800: '#1c30af',
          900: '#1d2f8a',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 24, 40, 0.04), 0 8px 24px -12px rgba(16, 24, 40, 0.12)',
      },
    },
  },
  plugins: [],
};
