/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        'Text' : '#16306B',
        'primary-start': '#8432DF',
        'primary-mid':   '#C020D0',
        'primary-end':   '#FC0FC0',
        'background':    '#F4F6FE',
      },
      keyframes: {
        // Entrées
        'fade-up':      { '0%': {opacity:0, transform:'translateY(12px)'}, '100%': {opacity:1, transform:'translateY(0)'} },
        'scale-in':     { '0%': {opacity:0, transform:'scale(0.85)'},     '100%': {opacity:1, transform:'scale(1)'} },
        'slide-in-r':   { '0%': {opacity:0, transform:'translateX(16px)'}, '100%': {opacity:1, transform:'translateX(0)'} },
        'float-in':     { '0%': {opacity:0, transform:'translateY(8px) scale(0.98)'}, '100%': {opacity:1, transform:'translateY(0) scale(1)'} },
        // Sortie (si besoin)
        'slide-out-r':  { '0%': {opacity:1, transform:'translateX(0)'}, '100%': {opacity:0, transform:'translateX(100%)'} },
        // Donut (SVG stroke) → ring-fill
        'ring-fill':    { from: {'stroke-dashoffset':'var(--c)'}, to: {'stroke-dashoffset':'var(--offset)'} },
        // Donut (conic-gradient en div) → donut-fill (si tu l’utilises encore)
        'donut-fill':   { '0%': { background: 'conic-gradient(#7C3AED 0deg, transparent 0)' },
                          '100%':{ background: 'conic-gradient(#7C3AED var(--donut-angle), transparent 0)' } },
        // Barre de progression
        'grow-width':   { from: {width:'0'}, to: {width:'var(--target-width)'} },
        // Avatars
        'avatar-in':    { '0%': {opacity:0, transform:'translateY(4px) scale(0.9)'},
                          '100%':{opacity:1, transform:'translateY(0) scale(1)'} },
        // Spin lent (halo)
        spin:           { to: { transform:'rotate(360deg)' } },
      },
      animation: {
        'fade-up':      'fade-up .6s ease-out forwards',
        'scale-in':     'scale-in .5s ease-out forwards',
        'slide-in-r':   'slide-in-r .6s ease-out forwards',
        'float-in':     'float-in .5s ease-out forwards',
        'slide-out-r':  'slide-out-r .5s ease-in-out forwards',
        'ring-fill':    'ring-fill 1.4s cubic-bezier(.22,.9,.24,1) forwards',
        'donut-fill':   'donut-fill 1.5s ease-out forwards',
        'grow-width':   'grow-width 1.2s ease-out forwards',
        'avatar-in':    'avatar-in .35s ease-out both',
        'spin-slow':    'spin 8s linear infinite',
      },
    },
  },
  plugins: [require('tailwind-scrollbar')],
};
