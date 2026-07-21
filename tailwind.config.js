/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F7F6F2",
        ink: "#17181A",
        inksoft: "#55585E",
        rule: "#DEDBD3",
        signal: "#C81D2E",
        signaltint: "#F7E6E5",
      },
      fontFamily: {
        display: ['"Archivo Narrow"', "sans-serif"],
        sans: ['"IBM Plex Sans"', '"IBM Plex Sans Devanagari"', "sans-serif"],
        mono: ['"IBM Plex Mono"', "monospace"],
      },
    },
  },
  plugins: [],
};
