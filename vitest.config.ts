import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
	test: {
		include: ['tests/**/*.test.ts'],
		browser: {
			enabled: true,
			provider: 'playwright',
			instances: [
				{ browser: 'chromium' },
			],
		},
		setupFiles: ['./tests/setup.ts'],
	},
	resolve: {
		alias: {
			'~/src': resolve(__dirname, 'src'),
		},
	},
	esbuild: {
		target: 'esnext',
	},
	optimizeDeps: {
		exclude: ['mupdf'],
		esbuildOptions: {
			target: 'esnext',
		},
	},
})
