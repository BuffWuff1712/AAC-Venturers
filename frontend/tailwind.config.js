/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#09111f",
        coral: "#ff7a59",
        mint: "#9de5d6",
        sand: "#fff4d6",
      },
      boxShadow: {
        soft: "0 20px 45px rgba(15, 23, 42, 0.16)",
      },
      backgroundImage: {
        mesh: "radial-gradient(circle at top left, rgba(255,122,89,0.35), transparent 28%), radial-gradient(circle at 80% 20%, rgba(157,229,214,0.25), transparent 24%), linear-gradient(180deg, #0f172a 0%, #08111d 100%)",
      },
    },
  },
  plugins: [],
};
