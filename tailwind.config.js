/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: '#7928CA',
          pink: '#FF0080',
          blue: '#0070F3',
          amber: '#F5A623',
          yellow: '#FEE140',
          cyan: '#00DFD8',
          dark: '#0B0F19',
          card: '#161F30',
          border: 'rgba(255, 255, 255, 0.12)'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Calistoga', 'Playfair Display', 'Georgia', 'serif'],
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 4s ease-in-out infinite',
        'glow': 'glow 2.5s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        glow: {
          '0%': { filter: 'drop-shadow(0 0 15px rgba(121, 40, 202, 0.4))' },
          '100%': { filter: 'drop-shadow(0 0 25px rgba(255, 0, 128, 0.6))' }
        }
      }
    },
  },
  plugins: [],
}
