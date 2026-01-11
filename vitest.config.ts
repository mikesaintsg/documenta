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
			// Mock mupdf for testing since it uses WASM and top-level await
			'mupdf': resolve(__dirname, 'tests/__mocks__/mupdf.ts'),
		},
	},
	esbuild: {
		target: 'esnext',
	},
	optimizeDeps: {
		esbuildOptions: {
			target: 'esnext',
		},
	},
})
