import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Disable import ordering for now
      'import/order': 'off',
      
      // Allow unused vars with underscore prefix
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      
      // Change any to warning instead of error
      '@typescript-eslint/no-explicit-any': 'warn',
      
      // Allow unescaped entities in JSX
      'react/no-unescaped-entities': 'warn',
    },
  },
];

export default eslintConfig;
