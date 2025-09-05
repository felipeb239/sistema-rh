import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: require("globals").browser,
    },
    rules: {
      "no-unused-vars": "warn", // Mostra código inativo (variáveis/funções não usadas)
    },
  },
]);
