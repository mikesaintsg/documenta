import parser from '@typescript-eslint/parser'
import tseslint from '@typescript-eslint/eslint-plugin'

/** Shared formatting rules - auto-fixable with --fix */
const formattingRules = {
	'indent': ['error', 'tab', { SwitchCase: 1 }],
	'quotes': ['error', 'single', { avoidEscape: true }],
	'semi': ['error', 'never'],
	'comma-dangle': ['error', 'always-multiline'],
	'no-trailing-spaces': 'error',
	'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0, maxBOF: 0 }],
	'eol-last': ['error', 'always'],
	'object-curly-spacing': ['error', 'always'],
	'array-bracket-spacing': ['error', 'never'],
	'space-before-function-paren': ['error', 'never'],
	'keyword-spacing': ['error', { before: true, after: true }],
	'space-infix-ops': 'error',
	'arrow-spacing': ['error', { before: true, after: true }],
} as const

/** Shared TypeScript language options */
const typescriptLanguageOptions = {
	parser,
	ecmaVersion: 'latest' as const,
	sourceType: 'module' as const,
}

export default [
	// Global ignores
	{
		ignores: ['dist/**', 'node_modules/**', '*.html'],
	},

	// Type definition files - formatting only, no unused vars check
	{
		files: ['**/types.ts', '**/*.d.ts'],
		languageOptions: typescriptLanguageOptions,
		plugins: { '@typescript-eslint': tseslint },
		rules: {
			...formattingRules,
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': 'off',
		},
	},

	// All other TypeScript/JavaScript files
	{
		files: ['**/*.{js,ts}'],
		ignores: ['**/types.ts', '**/*.d.ts'],
		languageOptions: {
			...typescriptLanguageOptions,
			parserOptions: { project: './tsconfig.json' },
		},
		plugins: { '@typescript-eslint': tseslint },
		rules: {
			...formattingRules,

			// TypeScript-specific rules
			'@typescript-eslint/no-explicit-any': 'error',
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': ['error', {
				varsIgnorePattern: '^_',
				argsIgnorePattern: '^_',
				ignoreRestSiblings: true,
			}],

			// Code quality rules
			'no-console': 'warn',
			'no-debugger': 'error',
			'no-var': 'error',
			'prefer-const': 'error',
			'no-mixed-spaces-and-tabs': 'error',
		},
	},
]
