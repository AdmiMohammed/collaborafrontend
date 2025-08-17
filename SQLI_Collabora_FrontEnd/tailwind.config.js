/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-start': '#8432DF',
        'primary-mid': '#C020D0',
        'primary-end': '#FC0FC0',
        'background': '#F4F6FE',
        // 'background': '#fbfaf8'
      },
      animation: {
        'slide-out-right': 'slideOutRight 0.5s ease-in-out forwards',
      },
      keyframes: {
        slideOutRight: {
          '0%': { transform: 'translateX(0)', opacity: 1 },
          '100%': { transform: 'translateX(100%)', opacity: 0 },
        },
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar'),
  ],
}