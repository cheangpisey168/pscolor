/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        palette: {
          100: '#F7F0DC', // Dominant light surface
          200: '#D9E4C8', // Secondary container
          300: '#A2B89B', // Structural accent
          400: '#52796F', // Deep hero contrast
        }
      }
    }
  },
  plugins: []
};
