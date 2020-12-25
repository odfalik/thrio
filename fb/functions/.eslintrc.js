module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  extends: [
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "tsconfig.json",
    sourceType: "module",
  },
  plugins: [
    "@typescript-eslint",
    "import",
  ],
  rules: {
    "@typescript-eslint/adjacent-overload-signatures": "warn",
    "@typescript-eslint/no-empty-function": "warn",
    "@typescript-eslint/no-empty-interface": "warn",
    "@typescript-eslint/no-floating-promises": "warn",
    "@typescript-eslint/no-namespace": "warn",
    "@typescript-eslint/no-unnecessary-type-assertion": "warn",
    "@typescript-eslint/prefer-for-of": "warn",
    "@typescript-eslint/triple-slash-reference": "warn",
    "@typescript-eslint/unified-signatures": "warn",
    "comma-dangle": ["warn", "always-multiline"],
    "constructor-super": "warn",
    "import/no-unresolved": [
      2, 
      { "caseSensitive": false }
    ],
    eqeqeq: ["warn", "always"],
    "import/no-deprecated": "warn",
    "import/no-extraneous-dependencies": "warn",
    "import/no-unassigned-import": "warn",
    "no-cond-assign": "warn",
    "no-duplicate-case": "warn",
    "no-duplicate-imports": "warn",
    "no-empty": [
      "warn",
      {
        allowEmptyCatch: true,
      },
    ],
    "no-invalid-this": "warn",
    "no-new-wrappers": "warn",
    "no-param-reassign": "warn",
    "no-redeclare": "warn",
    "no-sequences": "warn",
    "no-shadow": [
      "warn",
      {
        hoist: "all",
      },
    ],
    "no-throw-literal": "warn",
    "no-unsafe-finally": "warn",
    "no-unused-labels": "warn",
    "no-var": "warn",
    "no-void": "warn",
    "prefer-const": "warn",
  },
  settings: {
    jsdoc: {
      tagNamePreference: {
        returns: "return",
      },
    },
  },
};
