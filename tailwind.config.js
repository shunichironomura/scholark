/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    // Note: When using @tailwindcss/vite, you don't need to include the forms plugin here
    // as it will be handled by the Vite plugin
  ],
}
