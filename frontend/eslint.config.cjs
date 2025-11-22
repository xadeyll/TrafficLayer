const js = require("@eslint/js");
const globals = require("globals");
const react = require("eslint-plugin-react");

module.exports = [
	{
		ignores: ["**/node_modules/**", "**/dist/**", "**/build/**", "**/logs/**"],
	},
	{
		files: ["**/*.{js,jsx}"],
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "module",
			globals: { ...globals.browser, ...globals.es2021 },
			parserOptions: { ecmaFeatures: { jsx: true } },
		},
		plugins: { react },
		rules: {
			...js.configs.recommended.rules,
			...react.configs.recommended.rules,
			"react/react-in-jsx-scope": "off",
			"react/prop-types": "off",
			"no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
			"no-console": "off",
			"no-empty": ["warn", { allowEmptyCatch: true }],
		},
		settings: { react: { version: "detect" } },
	},
];
