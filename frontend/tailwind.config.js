/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#8B0000',  // Color burdeos
        'secondary': '#101010', // Negro
        'light': '#f5f5dc',    // Color crema
      }
    },
  },
  plugins: [],
}