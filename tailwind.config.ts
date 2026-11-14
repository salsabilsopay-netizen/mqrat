import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: "#f1f6f4",
          100: "#e0ece6",
          200: "#c3dacd",
          300: "#9ec2af",
          400: "#74a38d",
          500: "#528670",
          600: "#153D32", // Primary Approved
          700: "#11332a",
          800: "#0e2922",
          900: "#0a1d18",
          950: "#050f0c",
        },
        ivory: {
          50: "#fdfcf9",
          100: "#faf8f2",
          200: "#F7F5EF", // Approved Ivory
          300: "#eeeae0",
          400: "#ded7c5",
          500: "#c9c0ab",
        },
        gold: {
          50: "#fbf9f4",
          100: "#f6f1e6",
          200: "#ebdcc4",
          300: "#dec39d",
          400: "#cca875",
          500: "#B69A65", // Approved Muted Gold
          600: "#9e814e",
          700: "#7d643c",
          800: "#635032",
        },
        sage: {
          50: "#f7f9f7",
          100: "#eef2ef",
          200: "#E5ECE6", // Approved Soft Sage
          300: "#d3ded5",
          400: "#b5c7b8",
        },
        charcoal: {
          50: "#f5f6f6",
          100: "#e5e7e6",
          200: "#cbcfcc",
          300: "#a9b1ac",
          400: "#7e8983",
          500: "#5d6761",
          600: "#47514c",
          700: "#38413c",
          800: "#28342F", // Approved Dark Typography
          900: "#1d2522",
        },
      },
      fontFamily: {
        sans: ["var(--font-ibm-plex-sans-arabic)", "sans-serif"],
        quran: ["var(--font-noto-naskh-arabic)", "serif"],
      },
      maxWidth: {
        content: "1240px",
      },
      borderRadius: {
        institutional: "14px",
      },
      boxShadow: {
        subtle: "0 2px 10px -2px rgba(21, 61, 50, 0.05), 0 1px 3px 0 rgba(21, 61, 50, 0.03)",
        card: "0 10px 30px -5px rgba(21, 61, 50, 0.06), 0 4px 6px -2px rgba(21, 61, 50, 0.03)",
        elevated: "0 20px 40px -10px rgba(21, 61, 50, 0.12), 0 6px 12px -3px rgba(21, 61, 50, 0.05)",
      },
    },
  },
  plugins: [],
};
export default config;
