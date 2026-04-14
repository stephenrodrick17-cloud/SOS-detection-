/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontSize: {
        'xs': ['1.25rem', { lineHeight: '1.75rem' }],   /* 20px */
        'sm': ['1.5rem', { lineHeight: '2rem' }],       /* 24px */
        'base': ['1.75rem', { lineHeight: '2.25rem' }], /* 28px */
        'lg': ['2rem', { lineHeight: '2.5rem' }],       /* 32px */
        'xl': ['2.5rem', { lineHeight: '3rem' }],       /* 40px */
        '2xl': ['3rem', { lineHeight: '3.5rem' }],      /* 48px */
        '3xl': ['3.5rem', { lineHeight: '4rem' }],      /* 56px */
      },
      colors: {
        slate: {
          750: '#1e293b',
          850: '#0f172a',
        }
      }
    },
  },
  plugins: [],
}
