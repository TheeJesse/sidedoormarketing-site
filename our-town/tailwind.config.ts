import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f3f9f0',
          100: '#e3f2db',
          200: '#c4e4b8',
          300: '#98cf88',
          400: '#6ab55a',
          500: '#4a9a38',  // primary green
          600: '#3a7d2c',
          700: '#2f6324',
          800: '#284f1f',
          900: '#22421b',
        },
        earth: {
          50:  '#faf8f5',
          100: '#f2ede6',
          200: '#e4d9cc',
          300: '#d1bfa8',
          400: '#b89e80',
          500: '#a08060',
          600: '#866650',
          700: '#6f5244',
          800: '#5c453b',
          900: '#4d3a33',
        },
        bark: {
          50:  '#fdfcfb',
          100: '#f8f5f0',
          200: '#f0e9df',
          300: '#e4d5c3',
          400: '#d4bc9e',
          500: '#c4a47d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
    },
  },
  plugins: [],
}

export default config
