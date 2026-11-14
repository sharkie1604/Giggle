/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        finn: '#4CB8C4',
        jake: '#FFD700',
        bubblegum: '#F781BE',
        bmo: '#5BA4A4',
        ink: '#0F0F0F',
        paper: '#FFFDF7',
      },
      boxShadow: {
        brutal: '4px 4px 0px #0F0F0F',
        'brutal-lg': '8px 8px 0px #0F0F0F',
        'brutal-sm': '2px 2px 0px #0F0F0F',
      },
      borderWidth: {
        3: '3px',
        4: '4px',
      },
      fontFamily: {
        heading: ['Fredoka', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
