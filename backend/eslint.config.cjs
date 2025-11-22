const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
	{
		ignores: ["**/node_modules/**", "**/logs/**", "**/dist/**", "**/build/**"],
	},

	{
		files: ["**/*.js"],
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "commonjs",
			globals: {
				...globals.node,
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
