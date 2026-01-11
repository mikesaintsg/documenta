/**
 * Tests for AnnotationLayer
 * @module tests/core/annotation/AnnotationLayer
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AnnotationLayer } from '~/src/core/annotation/AnnotationLayer.js'
import type { PdfDocumentInterface, PdfPageInterface, CreateAnnotationData, AnyAnnotation, AnnotationType, Color } from '~/src/types.js'
import { createMockElement } from '../../setup.js'

// Mock PdfDocument
class MockPdfDocument implements PdfDocumentInterface {
	#loaded = true

	isLoaded(): boolean {
		return this.#loaded
	}

	getPageCount(): number {
		return 3
	}

	getFileName(): string | undefined {
		return 'annotated.pdf'
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

describe('AnnotationLayer', () => {
	let container: HTMLElement
	let annotationLayer: AnnotationLayer
	let mockDocument: MockPdfDocument

	beforeEach(() => {
		container = createMockElement()
		container.style.width = '800px'
		container.style.height = '600px'
		document.body.appendChild(container)

		annotationLayer = new AnnotationLayer(container)
		mockDocument = new MockPdfDocument()
		annotationLayer.setDocument(mockDocument)
	})

	afterEach(() => {
		annotationLayer.destroy()
		container.remove()
	})

	describe('constructor', () => {
		it('creates instance successfully', () => {
			expect(annotationLayer).toBeInstanceOf(AnnotationLayer)
		})

		it('creates container with overflow hidden', () => {
			const layerContainer = container.querySelector('div')
			expect(layerContainer?.style.overflow).toBe('hidden')
		})
	})

	describe('setDocument', () => {
		it('sets document reference', () => {
			const newDoc = new MockPdfDocument()
			annotationLayer.setDocument(newDoc)
		})
	})

	describe('getAnnotations', () => {
		it('returns empty array for page with no annotations', () => {
			expect(annotationLayer.getAnnotations(1)).toEqual([])
		})

		it('returns annotations after adding', () => {
			const data: CreateAnnotationData = {
				type: 'Text',
				pageNumber: 1,
				bounds: { x: 100, y: 100, width: 50, height: 50 },
			}

			annotationLayer.addAnnotation(data)
			const annotations = annotationLayer.getAnnotations(1)

			expect(annotations.length).toBe(1)
		})

		it('returns readonly array', () => {
			const annotations = annotationLayer.getAnnotations(1)
			expect(Array.isArray(annotations)).toBe(true)
		})
	})

	describe('getAnnotationById', () => {
		it('returns undefined for non-existent id', () => {
			expect(annotationLayer.getAnnotationById('non-existent')).toBeUndefined()
		})

		it('returns annotation by id', () => {
			const data: CreateAnnotationData = {
				type: 'Highlight',
				pageNumber: 1,
				bounds: { x: 100, y: 100, width: 200, height: 20 },
			}

			const annotation = annotationLayer.addAnnotation(data)
			const found = annotationLayer.getAnnotationById(annotation.id)

			expect(found).toBeDefined()
			expect(found?.id).toBe(annotation.id)
		})
	})

	describe('addAnnotation', () => {
		it('creates Text annotation', () => {
			const data: CreateAnnotationData = {
				type: 'Text',
				pageNumber: 1,
				bounds: { x: 100, y: 100, width: 50, height: 50 },
				contents: 'Note',
			}

			const annotation = annotationLayer.addAnnotation(data)

			expect(annotation.type).toBe('Text')
			expect(annotation.contents).toBe('Note')
		})

		it('creates FreeText annotation', () => {
			const data: CreateAnnotationData = {
				type: 'FreeText',
				pageNumber: 1,
				bounds: { x: 100, y: 100, width: 200, height: 100 },
				contents: 'Free text content',
			}

			const annotation = annotationLayer.addAnnotation(data)

			expect(annotation.type).toBe('FreeText')
		})

		it('creates Highlight annotation', () => {
			const data: CreateAnnotationData = {
				type: 'Highlight',
				pageNumber: 1,
				bounds: { x: 100, y: 100, width: 200, height: 20 },
			}

			const annotation = annotationLayer.addAnnotation(data)

			expect(annotation.type).toBe('Highlight')
		})

		it('creates Underline annotation', () => {
			const data: CreateAnnotationData = {
				type: 'Underline',
				pageNumber: 1,
				bounds: { x: 100, y: 100, width: 200, height: 20 },
			}

			const annotation = annotationLayer.addAnnotation(data)

			expect(annotation.type).toBe('Underline')
		})

		it('creates StrikeOut annotation', () => {
			const data: CreateAnnotationData = {
				type: 'StrikeOut',
				pageNumber: 1,
				bounds: { x: 100, y: 100, width: 200, height: 20 },
			}

			const annotation = annotationLayer.addAnnotation(data)

			expect(annotation.type).toBe('StrikeOut')
		})

		it('creates Ink annotation', () => {
			const data: CreateAnnotationData = {
				type: 'Ink',
				pageNumber: 1,
				bounds: { x: 100, y: 100, width: 200, height: 200 },
			}

			const annotation = annotationLayer.addAnnotation(data)

			expect(annotation.type).toBe('Ink')
		})

		it('creates Square annotation', () => {
			const data: CreateAnnotationData = {
				type: 'Square',
				pageNumber: 1,
				bounds: { x: 100, y: 100, width: 100, height: 100 },
			}

			const annotation = annotationLayer.addAnnotation(data)

			expect(annotation.type).toBe('Square')
		})

		it('creates Circle annotation', () => {
			const data: CreateAnnotationData = {
				type: 'Circle',
				pageNumber: 1,
				bounds: { x: 100, y: 100, width: 100, height: 100 },
			}

			const annotation = annotationLayer.addAnnotation(data)

			expect(annotation.type).toBe('Circle')
		})

		it('generates unique id', () => {
			const data: CreateAnnotationData = {
				type: 'Text',
				pageNumber: 1,
				bounds: { x: 100, y: 100, width: 50, height: 50 },
			}

			const annotation1 = annotationLayer.addAnnotation(data)
			const annotation2 = annotationLayer.addAnnotation(data)

			expect(annotation1.id).not.toBe(annotation2.id)
		})

		it('applies custom color', () => {
			const color: Color = { r: 255, g: 0, b: 0 }
			const data: CreateAnnotationData = {
				type: 'Highlight',
				pageNumber: 1,
				bounds: { x: 100, y: 100, width: 200, height: 20 },
				color,
			}

			const annotation = annotationLayer.addAnnotation(data)

			expect(annotation.color).toEqual(color)
		})

		it('applies custom opacity', () => {
			const data: CreateAnnotationData = {
				type: 'Highlight',
				pageNumber: 1,
				bounds: { x: 100, y: 100, width: 200, height: 20 },
				opacity: 0.5,
			}

			const annotation = annotationLayer.addAnnotation(data)

			expect(annotation.opacity).toBe(0.5)
		})

		it('sets timestamps', () => {
			const before = new Date()
			const data: CreateAnnotationData = {
				type: 'Text',
				pageNumber: 1,
				bounds: { x: 100, y: 100, width: 50, height: 50 },
			}

			const annotation = annotationLayer.addAnnotation(data)
			const after = new Date()

			expect(annotation.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
			expect(annotation.createdAt.getTime()).toBeLessThanOrEqual(after.getTime())
		})

		it('notifies add listeners', () => {
			const callback = vi.fn()
			annotationLayer.onAnnotationAdd(callback)

			const data: CreateAnnotationData = {
				type: 'Text',
				pageNumber: 1,
				bounds: { x: 100, y: 100, width: 50, height: 50 },
			}

			annotationLayer.addAnnotation(data)

			expect(callback).toHaveBeenCalledTimes(1)
		})
	})

	describe('updateAnnotation', () => {
		it('updates annotation contents', () => {
			const data: CreateAnnotationData = {
				type: 'Text',
				pageNumber: 1,
				bounds: { x: 100, y: 100, width: 50, height: 50 },
				contents: 'Original',
			}

			const annotation = annotationLayer.addAnnotation(data)
			annotationLayer.updateAnnotation(annotation.id, { contents: 'Updated' })

			const updated = annotationLayer.getAnnotationById(annotation.id)
			expect(updated?.contents).toBe('Updated')
		})

		it('updates modifiedAt timestamp', () => {
			const data: CreateAnnotationData = {
				type: 'Text',
				pageNumber: 1,
				bounds: { x: 100, y: 100, width: 50, height: 50 },
			}

			const annotation = annotationLayer.addAnnotation(data)
			const originalModified = annotation.modifiedAt

			// Wait a bit
			annotationLayer.updateAnnotation(annotation.id, { contents: 'Changed' })

			const updated = annotationLayer.getAnnotationById(annotation.id)
			expect(updated?.modifiedAt.getTime()).toBeGreaterThanOrEqual(originalModified.getTime())
		})

		it('does nothing for non-existent id', () => {
			expect(() => annotationLayer.updateAnnotation('non-existent', { contents: 'test' })).not.toThrow()
		})

		it('preserves annotation type', () => {
			const data: CreateAnnotationData = {
				type: 'Highlight',
				pageNumber: 1,
				bounds: { x: 100, y: 100, width: 200, height: 20 },
			}

			const annotation = annotationLayer.addAnnotation(data)
			annotationLayer.updateAnnotation(annotation.id, { contents: 'Test' })

			const updated = annotationLayer.getAnnotationById(annotation.id)
			expect(updated?.type).toBe('Highlight')
		})
	})

	describe('removeAnnotation', () => {
		it('removes annotation', () => {
			const data: CreateAnnotationData = {
				type: 'Text',
				pageNumber: 1,
				bounds: { x: 100, y: 100, width: 50, height: 50 },
			}

			const annotation = annotationLayer.addAnnotation(data)
			annotationLayer.removeAnnotation(annotation.id)

			expect(annotationLayer.getAnnotationById(annotation.id)).toBeUndefined()
		})

		it('notifies remove listeners', () => {
			const callback = vi.fn()
			annotationLayer.onAnnotationRemove(callback)

			const data: CreateAnnotationData = {
				type: 'Text',
				pageNumber: 1,
				bounds: { x: 100, y: 100, width: 50, height: 50 },
			}

			const annotation = annotationLayer.addAnnotation(data)
			annotationLayer.removeAnnotation(annotation.id)

			expect(callback).toHaveBeenCalledWith(annotation.id)
		})

		it('does nothing for non-existent id', () => {
			expect(() => annotationLayer.removeAnnotation('non-existent')).not.toThrow()
		})

		it('clears selection if removed annotation was selected', () => {
			const data: CreateAnnotationData = {
				type: 'Text',
				pageNumber: 1,
				bounds: { x: 100, y: 100, width: 50, height: 50 },
			}

			const annotation = annotationLayer.addAnnotation(data)
			annotationLayer.selectAnnotation(annotation.id)
			annotationLayer.removeAnnotation(annotation.id)

			expect(annotationLayer.getSelectedAnnotation()).toBeUndefined()
		})
	})

	describe('selectAnnotation', () => {
		it('selects annotation by id', () => {
			const data: CreateAnnotationData = {
				type: 'Text',
				pageNumber: 1,
				bounds: { x: 100, y: 100, width: 50, height: 50 },
			}

			const annotation = annotationLayer.addAnnotation(data)
			annotationLayer.selectAnnotation(annotation.id)

			expect(annotationLayer.getSelectedAnnotation()?.id).toBe(annotation.id)
		})

		it('deselects previous selection', () => {
			const data: CreateAnnotationData = {
				type: 'Text',
				pageNumber: 1,
				bounds: { x: 100, y: 100, width: 50, height: 50 },
			}

			const annotation1 = annotationLayer.addAnnotation(data)
			const annotation2 = annotationLayer.addAnnotation({
				...data,
				bounds: { x: 200, y: 100, width: 50, height: 50 },
			})

			annotationLayer.selectAnnotation(annotation1.id)
			annotationLayer.selectAnnotation(annotation2.id)

			expect(annotationLayer.getSelectedAnnotation()?.id).toBe(annotation2.id)
		})

		it('notifies select listeners', () => {
			const callback = vi.fn()
			annotationLayer.onAnnotationSelect(callback)

			const data: CreateAnnotationData = {
				type: 'Text',
				pageNumber: 1,
				bounds: { x: 100, y: 100, width: 50, height: 50 },
			}

			const annotation = annotationLayer.addAnnotation(data)
			annotationLayer.selectAnnotation(annotation.id)

			expect(callback).toHaveBeenCalledWith(expect.objectContaining({ id: annotation.id }))
		})

		it('does nothing for non-existent id', () => {
			expect(() => annotationLayer.selectAnnotation('non-existent')).not.toThrow()
			expect(annotationLayer.getSelectedAnnotation()).toBeUndefined()
		})
	})

	describe('deselectAnnotation', () => {
		it('clears selection', () => {
			const data: CreateAnnotationData = {
				type: 'Text',
				pageNumber: 1,
				bounds: { x: 100, y: 100, width: 50, height: 50 },
			}

			const annotation = annotationLayer.addAnnotation(data)
			annotationLayer.selectAnnotation(annotation.id)
			annotationLayer.deselectAnnotation()

			expect(annotationLayer.getSelectedAnnotation()).toBeUndefined()
		})

		it('notifies select listeners with undefined', () => {
			const callback = vi.fn()
			annotationLayer.onAnnotationSelect(callback)

			const data: CreateAnnotationData = {
				type: 'Text',
				pageNumber: 1,
				bounds: { x: 100, y: 100, width: 50, height: 50 },
			}

			const annotation = annotationLayer.addAnnotation(data)
			annotationLayer.selectAnnotation(annotation.id)
			callback.mockClear()

			annotationLayer.deselectAnnotation()

			expect(callback).toHaveBeenCalledWith(undefined)
		})

		it('does nothing when no selection', () => {
			expect(() => annotationLayer.deselectAnnotation()).not.toThrow()
		})
	})

	describe('getSelectedAnnotation', () => {
		it('returns undefined when no selection', () => {
			expect(annotationLayer.getSelectedAnnotation()).toBeUndefined()
		})

		it('returns selected annotation', () => {
			const data: CreateAnnotationData = {
				type: 'Text',
				pageNumber: 1,
				bounds: { x: 100, y: 100, width: 50, height: 50 },
			}

			const annotation = annotationLayer.addAnnotation(data)
			annotationLayer.selectAnnotation(annotation.id)

			expect(annotationLayer.getSelectedAnnotation()).toBeDefined()
		})
	})

	describe('event subscriptions', () => {
		describe('onAnnotationAdd', () => {
			it('returns unsubscribe function', () => {
				const unsubscribe = annotationLayer.onAnnotationAdd(() => {})
				expect(typeof unsubscribe).toBe('function')
			})

			it('unsubscribe removes callback', () => {
				const callback = vi.fn()
				const unsubscribe = annotationLayer.onAnnotationAdd(callback)
				unsubscribe()

				annotationLayer.addAnnotation({
					type: 'Text',
					pageNumber: 1,
					bounds: { x: 100, y: 100, width: 50, height: 50 },
				})

				expect(callback).not.toHaveBeenCalled()
			})
		})

		describe('onAnnotationRemove', () => {
			it('returns unsubscribe function', () => {
				const unsubscribe = annotationLayer.onAnnotationRemove(() => {})
				expect(typeof unsubscribe).toBe('function')
			})
		})

		describe('onAnnotationSelect', () => {
			it('returns unsubscribe function', () => {
				const unsubscribe = annotationLayer.onAnnotationSelect(() => {})
				expect(typeof unsubscribe).toBe('function')
			})
		})
	})

	describe('render', () => {
		it('renders annotations for page', () => {
			annotationLayer.addAnnotation({
				type: 'Highlight',
				pageNumber: 1,
				bounds: { x: 100, y: 100, width: 200, height: 20 },
			})

			annotationLayer.render(1, 1)

			// Annotation elements should be created
			const annotationElements = container.querySelectorAll('[data-type]')
			expect(annotationElements.length).toBe(1)
		})

		it('clears annotations from other pages', () => {
			annotationLayer.addAnnotation({
				type: 'Highlight',
				pageNumber: 1,
				bounds: { x: 100, y: 100, width: 200, height: 20 },
			})
			annotationLayer.addAnnotation({
				type: 'Square',
				pageNumber: 2,
				bounds: { x: 100, y: 100, width: 100, height: 100 },
			})

			annotationLayer.render(2, 1)

			const annotationElements = container.querySelectorAll('[data-type]')
			expect(annotationElements.length).toBe(1)
		})

		it('handles scale changes', () => {
			annotationLayer.addAnnotation({
				type: 'Highlight',
				pageNumber: 1,
				bounds: { x: 100, y: 100, width: 200, height: 20 },
			})

			expect(() => {
				annotationLayer.render(1, 0.5)
				annotationLayer.render(1, 2.0)
			}).not.toThrow()
		})
	})

	describe('resize', () => {
		it('re-renders annotations', () => {
			annotationLayer.addAnnotation({
				type: 'Highlight',
				pageNumber: 1,
				bounds: { x: 100, y: 100, width: 200, height: 20 },
			})
			annotationLayer.render(1, 1)

			annotationLayer.resize(1024, 768)
		})

		it('does nothing when no current page', () => {
			expect(() => annotationLayer.resize(1024, 768)).not.toThrow()
		})
	})

	describe('activate', () => {
		it('sets cursor to pointer', () => {
			annotationLayer.activate()

			const layerContainer = container.querySelector('div')
			expect(layerContainer?.style.cursor).toBe('pointer')
		})
	})

	describe('deactivate', () => {
		it('sets cursor to default', () => {
			annotationLayer.activate()
			annotationLayer.deactivate()

			const layerContainer = container.querySelector('div')
			expect(layerContainer?.style.cursor).toBe('default')
		})

		it('deselects annotation', () => {
			const annotation = annotationLayer.addAnnotation({
				type: 'Text',
				pageNumber: 1,
				bounds: { x: 100, y: 100, width: 50, height: 50 },
			})
			annotationLayer.activate() // Must be active first
			annotationLayer.selectAnnotation(annotation.id)

			annotationLayer.deactivate()

			expect(annotationLayer.getSelectedAnnotation()).toBeUndefined()
		})
	})

	describe('destroy', () => {
		it('cleans up resources', () => {
			annotationLayer.addAnnotation({
				type: 'Text',
				pageNumber: 1,
				bounds: { x: 100, y: 100, width: 50, height: 50 },
			})

			annotationLayer.destroy()
		})

		it('handles multiple destroy calls', () => {
			expect(() => {
				annotationLayer.destroy()
				annotationLayer.destroy()
			}).not.toThrow()
		})
	})

	describe('edge cases', () => {
		it('handles many annotations', () => {
			for (let i = 0; i < 100; i++) {
				annotationLayer.addAnnotation({
					type: 'Text',
					pageNumber: 1,
					bounds: { x: 10 + i * 5, y: 10 + i * 5, width: 50, height: 50 },
				})
			}

			expect(annotationLayer.getAnnotations(1).length).toBe(100)
		})

		it('handles all annotation types', () => {
			const types: AnnotationType[] = ['Text', 'FreeText', 'Highlight', 'Underline', 'StrikeOut', 'Ink', 'Square', 'Circle']

			for (const type of types) {
				const annotation = annotationLayer.addAnnotation({
					type,
					pageNumber: 1,
					bounds: { x: 100, y: 100, width: 100, height: 100 },
				})

				expect(annotation.type).toBe(type)
			}
		})

		it('handles rapid selection changes', () => {
			const annotations: AnyAnnotation[] = []
			for (let i = 0; i < 10; i++) {
				annotations.push(annotationLayer.addAnnotation({
					type: 'Text',
					pageNumber: 1,
					bounds: { x: 10 + i * 50, y: 100, width: 40, height: 40 },
				}))
			}

			for (let i = 0; i < 50; i++) {
				const randomIndex = i % annotations.length
				annotationLayer.selectAnnotation(annotations[randomIndex]!.id)
			}
		})
	})
})
