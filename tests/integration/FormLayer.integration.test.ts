/**
 * Form Layer Integration Tests
 *
 * Tests form field interactions simulating real user scenarios.
 * Uses real mupdf library - no mocks.
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest'
import { FormLayer } from '~/src/core/form/FormLayer.js'
import { createTestElement, createLoadedPdfDocument, PDF_FIXTURES } from '../setup.js'
import type { AnyFormField, PdfDocumentInterface } from '~/src/types.js'

describe('FormLayer Integration', () => {
	let container: HTMLElement
	let formLayer: FormLayer
	let pdfDocument: PdfDocumentInterface

	beforeAll(async() => {
		// Pre-load document for tests that need it
		pdfDocument = await createLoadedPdfDocument(PDF_FIXTURES.form)
	})

	beforeEach(() => {
		container = createTestElement()
		container.style.width = '800px'
		container.style.height = '600px'
		document.body.appendChild(container)

		formLayer = new FormLayer(container)
		formLayer.activate()
		formLayer.render(1, 1.0)
		formLayer.resize(800, 600)
	})

	afterEach(() => {
		formLayer.destroy()
		container.remove()
	})

	describe('Form Field Detection', () => {
		it('should return false for hasFormFields without document', () => {
			expect(formLayer.hasFormFields()).toBe(false)
		})

		it('should return empty array for getAllFields', () => {
			expect(formLayer.getAllFields().length).toBe(0)
		})

		it('should return empty array for getFieldsOnPage', () => {
			expect(formLayer.getFieldsOnPage(1).length).toBe(0)
		})

		it('should return undefined for getFieldByName', () => {
			expect(formLayer.getFieldByName('nonexistent')).toBeUndefined()
		})
	})

	describe('Form Field Values', () => {
		it('should not throw when setting text field value', () => {
			expect(() => formLayer.setFieldValue('field1', 'test value')).not.toThrow()
		})

		it('should not throw when setting checkbox state', () => {
			expect(() => formLayer.setFieldChecked('checkbox1', true)).not.toThrow()
		})

		it('should not throw when setting dropdown selection', () => {
			expect(() => formLayer.setFieldSelection('dropdown1', 0)).not.toThrow()
		})
	})

	describe('Field Highlighting', () => {
		it('should toggle field highlighting', () => {
			expect(() => formLayer.setHighlightFields(true)).not.toThrow()
			expect(() => formLayer.setHighlightFields(false)).not.toThrow()
		})
	})

	describe('Form Operations', () => {
		it('should not throw on flattenForm', () => {
			expect(() => formLayer.flattenForm()).not.toThrow()
		})

		it('should not throw on resetForm', () => {
			expect(() => formLayer.resetForm()).not.toThrow()
		})
	})

	describe('Event Subscriptions', () => {
		it('should allow subscribing to field changes', () => {
			const changes: { field: AnyFormField, value: string | boolean }[] = []
			const unsubscribe = formLayer.onFieldChange((field, value) => {
				changes.push({ field, value })
			})

			expect(typeof unsubscribe).toBe('function')
			unsubscribe()
		})

		it('should allow unsubscribing from field changes', () => {
			let callCount = 0
			const unsubscribe = formLayer.onFieldChange(() => {
				callCount++
			})

			unsubscribe()
			expect(callCount).toBe(0)
		})
	})

	describe('Layer Lifecycle', () => {
		it('should activate and deactivate', () => {
			expect(formLayer.isActive()).toBe(true)

			formLayer.deactivate()
			expect(formLayer.isActive()).toBe(false)

			formLayer.activate()
			expect(formLayer.isActive()).toBe(true)
		})

		it('should handle resize', () => {
			expect(() => formLayer.resize(1024, 768)).not.toThrow()
		})

		it('should handle page changes', () => {
			formLayer.render(1, 1.0)
			formLayer.render(2, 1.5)
			formLayer.render(1, 2.0)

			expect(formLayer.isActive()).toBe(true)
		})

		it('should clean up on destroy', () => {
			formLayer.destroy()
			// After destroy, container should no longer have layer element
			expect(container.querySelector('[class*="form-layer"]')).toBeNull()
		})
	})

	describe('Document Integration', () => {
		it('should accept document', () => {
			expect(() => formLayer.setDocument(pdfDocument)).not.toThrow()
		})

		it('should update after document load', () => {
			formLayer.setDocument(pdfDocument)
			formLayer.render(1, 1.0)

			expect(formLayer.isActive()).toBe(true)
		})
	})
})
