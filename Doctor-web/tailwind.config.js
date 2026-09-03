/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6ff', 100: '#d9ecff', 500: '#0e7490', 600: '#0b5e75', 700: '#0a4d60', 900: '#0e2a47'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}
