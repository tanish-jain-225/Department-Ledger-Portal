import nextConfig from "eslint-config-next";

const config = [
  {
    ignores: ["node_modules/**", ".next/**"],
  },
  ...nextConfig,
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/static-components": "off",
    },
  },
];

export default config;
