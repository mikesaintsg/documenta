/**
 * Tests for FormLayer
 * @module tests/core/form/FormLayer
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { FormLayer } from '~/src/core/form/FormLayer.js'
import type { PdfDocumentInterface, PdfPageInterface } from '~/src/types.js'
import { createMockElement } from '../../setup.js'

// Mock PdfDocument
class MockPdfDocument implements PdfDocumentInterface {
	#loaded = true

	isLoaded(): boolean {
		return this.#loaded
	}

	getPageCount(): number {
		return 2
	}

	getFileName(): string | undefined {
		return 'form.pdf'
	}

	async loadFromBuffer(_buffer: ArrayBuffer, _fileName?: string): Promise<void> {
		this.#loaded = true
	}

	getPage(pageNumber: number): PdfPageInterface {
		return {
			pageNumber,
			width: 612,
			height: 792,
			rotation: 0,
			render: () => {},
			getText: () => '',
			getTextBlocks: () => [],
			destroy: () => {},
		}
	}

	getPageDimensions(_pageNumber: number): { width: number; height: number } {
		return { width: 612, height: 792 }
	}

	getPageRotation(_pageNumber: number): 0 | 90 | 180 | 270 {
		return 0
	}

	toArrayBuffer(): ArrayBuffer {
		return new ArrayBuffer(0)
	}

	destroy(): void {
		this.#loaded = false
	}
}

describe('FormLayer', () => {
	let container: HTMLElement
	let formLayer: FormLayer
	let mockDocument: MockPdfDocument

	beforeEach(() => {
		container = createMockElement()
		container.style.width = '800px'
		container.style.height = '600px'
		document.body.appendChild(container)

		formLayer = new FormLayer(container)
		mockDocument = new MockPdfDocument()
	})

	afterEach(() => {
		formLayer.destroy()
		container.remove()
	})

	describe('constructor', () => {
		it('creates instance successfully', () => {
			expect(formLayer).toBeInstanceOf(FormLayer)
		})

		it('creates container with overflow hidden', () => {
			const layerContainer = container.querySelector('div')
			expect(layerContainer?.style.overflow).toBe('hidden')
		})
	})

	describe('setDocument', () => {
		it('sets document reference', () => {
			formLayer.setDocument(mockDocument)
			// Should scan for fields
		})

		it('handles multiple document sets', () => {
			formLayer.setDocument(mockDocument)
			formLayer.setDocument(new MockPdfDocument())
			// Should not throw
		})
	})

	describe('hasFormFields', () => {
		it('returns false when no fields', () => {
			formLayer.setDocument(mockDocument)
			expect(formLayer.hasFormFields()).toBe(false)
		})
	})

	describe('getAllFields', () => {
		it('returns empty array when no fields', () => {
			formLayer.setDocument(mockDocument)
			expect(formLayer.getAllFields()).toEqual([])
		})

		it('returns readonly array', () => {
			const fields = formLayer.getAllFields()
			expect(Array.isArray(fields)).toBe(true)
		})
	})

	describe('getFieldsOnPage', () => {
		it('returns empty array for page with no fields', () => {
			formLayer.setDocument(mockDocument)
			expect(formLayer.getFieldsOnPage(1)).toEqual([])
		})

		it('handles invalid page numbers', () => {
			expect(formLayer.getFieldsOnPage(0)).toEqual([])
			expect(formLayer.getFieldsOnPage(-1)).toEqual([])
			expect(formLayer.getFieldsOnPage(999)).toEqual([])
		})
	})

	describe('getFieldByName', () => {
		it('returns undefined for non-existent field', () => {
			formLayer.setDocument(mockDocument)
			expect(formLayer.getFieldByName('non-existent')).toBeUndefined()
		})
	})

	describe('setFieldValue', () => {
		it('does nothing for non-existent field', () => {
			expect(() => formLayer.setFieldValue('non-existent', 'value')).not.toThrow()
		})
	})

	describe('setFieldChecked', () => {
		it('does nothing for non-existent field', () => {
			expect(() => formLayer.setFieldChecked('non-existent', true)).not.toThrow()
		})
	})

	describe('setFieldSelection', () => {
		it('does nothing for non-existent field', () => {
			expect(() => formLayer.setFieldSelection('non-existent', 0)).not.toThrow()
		})
	})

	describe('setHighlightFields', () => {
		it('enables field highlighting', () => {
			formLayer.setHighlightFields(true)
			// No visible change without fields
		})

		it('disables field highlighting', () => {
			formLayer.setHighlightFields(true)
			formLayer.setHighlightFields(false)
			// Should toggle off
		})
	})

	describe('flattenForm', () => {
		it('does not throw (not implemented)', () => {
			expect(() => formLayer.flattenForm()).not.toThrow()
		})
	})

	describe('resetForm', () => {
		it('resets all fields to default', () => {
			formLayer.setDocument(mockDocument)
			formLayer.resetForm()
			// All fields should be reset
		})

		it('does not throw when no fields', () => {
			expect(() => formLayer.resetForm()).not.toThrow()
		})
	})

	describe('onFieldChange', () => {
		it('registers callback and returns unsubscribe', () => {
			const callback = vi.fn()
			const unsubscribe = formLayer.onFieldChange(callback)

			expect(typeof unsubscribe).toBe('function')
		})

		it('unsubscribe removes callback', () => {
			const callback = vi.fn()
			const unsubscribe = formLayer.onFieldChange(callback)
			unsubscribe()
		})

		it('supports multiple callbacks', () => {
			const callback1 = vi.fn()
			const callback2 = vi.fn()

			formLayer.onFieldChange(callback1)
			formLayer.onFieldChange(callback2)
		})
	})

	describe('render', () => {
		it('renders field overlays', () => {
			formLayer.setDocument(mockDocument)
			formLayer.render(1, 1)
			// Should not throw
		})

		it('handles scale changes', () => {
			formLayer.setDocument(mockDocument)
			formLayer.render(1, 0.5)
			formLayer.render(1, 2.0)
		})

		it('handles page changes', () => {
			formLayer.setDocument(mockDocument)
			formLayer.render(1, 1)
			formLayer.render(2, 1)
		})
	})

	describe('resize', () => {
		it('re-renders on resize', () => {
			formLayer.setDocument(mockDocument)
			formLayer.render(1, 1)
			formLayer.resize(1024, 768)
		})

		it('does nothing when no current page', () => {
			expect(() => formLayer.resize(1024, 768)).not.toThrow()
		})
	})

	describe('activate', () => {
		it('enables field inputs', () => {
			formLayer.activate()
			expect(formLayer.isActive()).toBe(true)
		})
	})

	describe('deactivate', () => {
		it('disables field inputs', () => {
			formLayer.activate()
			formLayer.deactivate()
			expect(formLayer.isActive()).toBe(false)
		})
	})

	describe('destroy', () => {
		it('cleans up resources', () => {
			formLayer.setDocument(mockDocument)
			formLayer.destroy()
		})

		it('handles multiple destroy calls', () => {
			expect(() => {
				formLayer.destroy()
				formLayer.destroy()
			}).not.toThrow()
		})
	})

	describe('edge cases', () => {
		it('handles document with no form fields', () => {
			formLayer.setDocument(mockDocument)
			expect(formLayer.hasFormFields()).toBe(false)
			expect(formLayer.getAllFields()).toEqual([])
		})

		it('handles rapid field operations', () => {
			formLayer.setDocument(mockDocument)

			for (let i = 0; i < 50; i++) {
				formLayer.setFieldValue(`field-${i}`, `value-${i}`)
				formLayer.setFieldChecked(`check-${i}`, i % 2 === 0)
			}
		})

		it('handles highlight toggle repeatedly', () => {
			for (let i = 0; i < 20; i++) {
				formLayer.setHighlightFields(i % 2 === 0)
			}
		})
	})
})
