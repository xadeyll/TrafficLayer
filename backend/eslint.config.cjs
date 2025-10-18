// backend/eslint.config.cjs
const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
	// що ігноруємо (замість .eslintignore)
	{
		ignores: ["**/node_modules/**", "**/logs/**", "**/dist/**", "**/build/**"],
	},

	{
		files: ["**/*.js"],
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "commonjs", // ← ми на CommonJS у Node
			globals: {
				...globals.node, // ← дає require, module, __dirname, process
				...globals.es2021,
			},
		},
		rules: {
			...js.configs.recommended.rules,
			"no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
			"no-console": "off",
		},
	},
];
