/**
 * Tests for FormLayer
 * @module tests/core/form/FormLayer
 *
 * Uses real mupdf library - no mocks.
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest'
import { FormLayer } from '~/src/core/form/FormLayer.js'
import { PdfDocument } from '~/src/core/document/PdfDocument.js'
import { createTestElement, loadPdfFixture, PDF_FIXTURES } from '../../setup.js'
import type { PdfDocumentInterface } from '~/src/types.js'

describe('FormLayer', () => {
	let container: HTMLElement
	let formLayer: FormLayer
	let pdfDocument: PdfDocumentInterface
	let formPdfBuffer: ArrayBuffer

	beforeAll(async() => {
		// Pre-load the form PDF fixture
		formPdfBuffer = await loadPdfFixture(PDF_FIXTURES.form)
	})

	beforeEach(async() => {
		container = createTestElement()
		container.style.width = '800px'
		container.style.height = '600px'
		document.body.appendChild(container)

		formLayer = new FormLayer(container)
		pdfDocument = new PdfDocument()
		await pdfDocument.loadFromBuffer(formPdfBuffer, 'test.pdf')
	})

	afterEach(() => {
		formLayer.destroy()
		container.remove()
	})

	describe('constructor', () => {
		it('creates layer element', () => {
			const layer = container.querySelector('[class*="form-layer"]')
			expect(layer).not.toBeNull()
		})
	})

	describe('setDocument', () => {
		it('accepts a document', () => {
			expect(() => formLayer.setDocument(pdfDocument)).not.toThrow()
		})
	})

	describe('render', () => {
		beforeEach(() => {
			formLayer.setDocument(pdfDocument)
		})

		it('renders at scale 1', () => {
			expect(() => formLayer.render(1, 1.0)).not.toThrow()
		})

		it('renders at different scales', () => {
			expect(() => formLayer.render(1, 0.5)).not.toThrow()
			expect(() => formLayer.render(1, 2.0)).not.toThrow()
		})
	})

	describe('resize', () => {
		it('accepts new dimensions', () => {
			expect(() => formLayer.resize(1024, 768)).not.toThrow()
		})
	})

	describe('activate/deactivate', () => {
		it('activates layer', () => {
			formLayer.activate()
			expect(formLayer.isActive()).toBe(true)
		})

		it('deactivates layer', () => {
			formLayer.activate()
			formLayer.deactivate()
			expect(formLayer.isActive()).toBe(false)
		})
	})

	describe('form field detection', () => {
		it('hasFormFields returns boolean', () => {
			expect(typeof formLayer.hasFormFields()).toBe('boolean')
		})

		it('getAllFields returns array', () => {
			expect(Array.isArray(formLayer.getAllFields())).toBe(true)
		})

		it('getFieldsOnPage returns array', () => {
			expect(Array.isArray(formLayer.getFieldsOnPage(1))).toBe(true)
		})

		it('getFieldByName returns undefined for unknown field', () => {
			expect(formLayer.getFieldByName('nonexistent')).toBeUndefined()
		})
	})

	describe('field value operations', () => {
		it('setFieldValue does not throw', () => {
			expect(() => formLayer.setFieldValue('field1', 'value')).not.toThrow()
		})

		it('setFieldChecked does not throw', () => {
			expect(() => formLayer.setFieldChecked('checkbox1', true)).not.toThrow()
		})

		it('setFieldSelection does not throw', () => {
			expect(() => formLayer.setFieldSelection('dropdown1', 0)).not.toThrow()
		})
	})

	describe('highlighting', () => {
		it('setHighlightFields does not throw', () => {
			expect(() => formLayer.setHighlightFields(true)).not.toThrow()
			expect(() => formLayer.setHighlightFields(false)).not.toThrow()
		})
	})

	describe('form operations', () => {
		it('flattenForm does not throw', () => {
			expect(() => formLayer.flattenForm()).not.toThrow()
		})

		it('resetForm does not throw', () => {
			expect(() => formLayer.resetForm()).not.toThrow()
		})
	})

	describe('events', () => {
		it('onFieldChange returns unsubscribe function', () => {
			const unsubscribe = formLayer.onFieldChange(() => {})
			expect(typeof unsubscribe).toBe('function')
			unsubscribe()
		})
	})

	describe('destroy', () => {
		it('removes layer from container', () => {
			formLayer.destroy()
			const layer = container.querySelector('[class*="form-layer"]')
			expect(layer).toBeNull()
		})

		it('handles multiple destroy calls', () => {
			expect(() => {
				formLayer.destroy()
				formLayer.destroy()
			}).not.toThrow()
		})
	})
})
