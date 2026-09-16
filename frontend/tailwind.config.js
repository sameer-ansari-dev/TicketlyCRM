/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        crm: {
          dark: "#0b1120",
          card: "#111827",
          border: "#1f2937",
          accent: "#3b82f6",
        },
      },
    },
  },
  plugins: [],
};
