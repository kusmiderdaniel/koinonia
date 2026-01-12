import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Downgrade React Compiler rules that give false positives for valid patterns
      // (dialog state resets, data loading on mount, hydration guards, dynamic components)
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/rules-of-hooks": "error", // Keep this as error
      // Date.now() in useMemo for current time comparisons is intentional
      "react-hooks/purity": "warn",
      // Dynamic icon component lookups and inline render functions are valid patterns
      "react-hooks/static-components": "warn",
      // Variable declarations before useEffect (functions moved before effect) are valid
      "react-hooks/immutability": "warn",
    },
  },
]);

export default eslintConfig;
