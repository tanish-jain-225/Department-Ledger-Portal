import nextConfig from "eslint-config-next";

const config = [
  {
    // Ignore generated build artifacts and coverage reports.
    // coverage/ files contain Istanbul-injected eslint-disable directives
    // that would otherwise generate spurious "unused directive" warnings.
    ignores: ["node_modules/**", ".next/**", "coverage/**"],
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
