/**
 * AnnotationLayer - Annotation overlay layer
 * @module core/annotation/AnnotationLayer
 *
 * Provides annotation creation, display, and management.
 */

import type {
	AnnotationLayerInterface,
	AnyAnnotation,
	CreateAnnotationData,
	AnnotationAddCallback,
	AnnotationRemoveCallback,
	AnnotationSelectCallback,
	PdfDocumentInterface,
	Unsubscribe,
	Color,
} from '../../types.js'
import { BaseLayer } from '../layers/BaseLayer.js'
import {
	Z_INDEX_ANNOTATION,
	CSS_CLASSES,
	DEFAULT_TEXT_ANNOTATION_COLOR,
} from '../../constants.js'
import { generateAnnotationId, colorToCss } from '../../helpers.js'

/**
 * AnnotationLayer - Annotation management
 *
 * @remarks
 * Creates and manages annotations on PDF pages.
 */
export class AnnotationLayer extends BaseLayer implements AnnotationLayerInterface {
	#document: PdfDocumentInterface | undefined
	#annotations = new Map<number, AnyAnnotation[]>()
	#annotationElements = new Map<string, HTMLElement>()
	#selectedAnnotation: AnyAnnotation | undefined

	#addListeners = new Set<AnnotationAddCallback>()
	#removeListeners = new Set<AnnotationRemoveCallback>()
	#selectListeners = new Set<AnnotationSelectCallback>()

	#currentPage = 0
	#currentScale = 1

	constructor(parent: HTMLElement) {
		super(parent, Z_INDEX_ANNOTATION, CSS_CLASSES.ANNOTATION_LAYER)

		const container = this.getContainer()
		container.style.overflow = 'hidden'

		// Handle clicks for selection
		container.addEventListener('click', this.#handleClick.bind(this))
	}

	setDocument(doc: PdfDocumentInterface): void {
		this.#document = doc
		// TODO: Load existing annotations from document
	}

	getAnnotations(pageNumber: number): readonly AnyAnnotation[] {
		return this.#annotations.get(pageNumber) ?? []
	}

	getAnnotationById(id: string): AnyAnnotation | undefined {
		for (const annotations of this.#annotations.values()) {
			const annotation = annotations.find(a => a.id === id)
			if (annotation) return annotation
		}
		return undefined
	}

	addAnnotation(data: CreateAnnotationData): AnyAnnotation {
		const now = new Date()
		const color: Color = data.color ?? DEFAULT_TEXT_ANNOTATION_COLOR

		// Create base annotation with required properties
		const baseAnnotation = {
			id: generateAnnotationId(),
			pageNumber: data.pageNumber,
			bounds: { ...data.bounds },
			color,
			opacity: data.opacity ?? 1,
			contents: data.contents ?? '',
			author: undefined as string | undefined,
			createdAt: now,
			modifiedAt: now,
		}

		// Create annotation based on type with all required properties
		let annotation: AnyAnnotation

		switch (data.type) {
			case 'Text':
				annotation = {
					...baseAnnotation,
					type: 'Text',
					isOpen: false,
				}
				break
			case 'FreeText':
				annotation = {
					...baseAnnotation,
					type: 'FreeText',
					fontSize: 12,
					fontColor: color,
				}
				break
			case 'Highlight':
				annotation = {
					...baseAnnotation,
					type: 'Highlight',
					quadPoints: [],
				}
				break
			case 'Underline':
				annotation = {
					...baseAnnotation,
					type: 'Underline',
					quadPoints: [],
				}
				break
			case 'StrikeOut':
				annotation = {
					...baseAnnotation,
					type: 'StrikeOut',
					quadPoints: [],
				}
				break
			case 'Ink':
				annotation = {
					...baseAnnotation,
					type: 'Ink',
					inkList: [],
					strokeWidth: 2,
				}
				break
			case 'Square':
				annotation = {
					...baseAnnotation,
					type: 'Square',
					strokeWidth: 2,
				}
				break
			case 'Circle':
				annotation = {
					...baseAnnotation,
					type: 'Circle',
					strokeWidth: 2,
				}
				break
			default:
				// Default to Text annotation
				annotation = {
					...baseAnnotation,
					type: 'Text',
					isOpen: false,
				}
		}

		// Add to storage
		const pageAnnotations = this.#annotations.get(data.pageNumber) ?? []
		pageAnnotations.push(annotation)
		this.#annotations.set(data.pageNumber, pageAnnotations)

		// Render if on current page
		if (data.pageNumber === this.#currentPage) {
			this.#renderAnnotationElement(annotation)
		}

		// Notify listeners
		for (const listener of this.#addListeners) {
			listener(annotation)
		}

		return annotation
	}

	updateAnnotation(id: string, updates: Partial<AnyAnnotation>): void {
		const annotation = this.getAnnotationById(id)
		if (!annotation) return

		// Create updated annotation preserving type safety
		const updated = {
			...annotation,
			...updates,
			id: annotation.id, // Ensure ID doesn't change
			type: annotation.type, // Ensure type doesn't change
			modifiedAt: new Date(),
		} as AnyAnnotation

		// Update in storage
		const pageAnnotations = this.#annotations.get(annotation.pageNumber)
		if (pageAnnotations) {
			const index = pageAnnotations.findIndex(a => a.id === id)
			if (index >= 0) {
				pageAnnotations[index] = updated
			}
		}

		// Re-render if on current page
		if (annotation.pageNumber === this.#currentPage) {
			this.#removeAnnotationElement(id)
			this.#renderAnnotationElement(updated)
		}
	}

	removeAnnotation(id: string): void {
		const annotation = this.getAnnotationById(id)
		if (!annotation) return

		// Remove from storage
		const pageAnnotations = this.#annotations.get(annotation.pageNumber)
		if (pageAnnotations) {
			const index = pageAnnotations.findIndex(a => a.id === id)
			if (index >= 0) {
				pageAnnotations.splice(index, 1)
			}
		}

		// Remove DOM element
		this.#removeAnnotationElement(id)

		// Clear selection if this was selected
		if (this.#selectedAnnotation?.id === id) {
			this.deselectAnnotation()
		}

		// Notify listeners
		for (const listener of this.#removeListeners) {
			listener(id)
		}
	}

	selectAnnotation(id: string): void {
		const annotation = this.getAnnotationById(id)
		if (!annotation) return

		// Deselect previous
		if (this.#selectedAnnotation) {
			this.#setElementSelected(this.#selectedAnnotation.id, false)
		}

		// Select new
		this.#selectedAnnotation = annotation
		this.#setElementSelected(id, true)

		// Notify listeners
		for (const listener of this.#selectListeners) {
			listener(annotation)
		}
	}

	deselectAnnotation(): void {
		if (this.#selectedAnnotation) {
			this.#setElementSelected(this.#selectedAnnotation.id, false)
		}
		this.#selectedAnnotation = undefined

		// Notify listeners
		for (const listener of this.#selectListeners) {
			listener(undefined)
		}
	}

	getSelectedAnnotation(): AnyAnnotation | undefined {
		return this.#selectedAnnotation
	}

	onAnnotationAdd(callback: AnnotationAddCallback): Unsubscribe {
		this.#addListeners.add(callback)
		return () => this.#addListeners.delete(callback)
	}

	onAnnotationRemove(callback: AnnotationRemoveCallback): Unsubscribe {
		this.#removeListeners.add(callback)
		return () => this.#removeListeners.delete(callback)
	}

	onAnnotationSelect(callback: AnnotationSelectCallback): Unsubscribe {
		this.#selectListeners.add(callback)
		return () => this.#selectListeners.delete(callback)
	}

	protected onRender(pageNumber: number, scale: number): void {
		this.#currentPage = pageNumber
		this.#currentScale = scale
		this.#renderAnnotations()
	}

	protected onResize(_width: number, _height: number): void {
		if (this.#currentPage > 0) {
			this.#renderAnnotations()
		}
	}

	protected onActivate(): void {
		const container = this.getContainer()
		container.style.cursor = 'pointer'
	}

	protected onDeactivate(): void {
		const container = this.getContainer()
		container.style.cursor = 'default'
		this.deselectAnnotation()
	}

	protected onDestroy(): void {
		this.#annotations.clear()
		this.#annotationElements.clear()
		this.#addListeners.clear()
		this.#removeListeners.clear()
		this.#selectListeners.clear()
	}

	#renderAnnotations(): void {
		const container = this.getContainer()
		container.innerHTML = ''
		this.#annotationElements.clear()

		const annotations = this.getAnnotations(this.#currentPage)

		for (const annotation of annotations) {
			this.#renderAnnotationElement(annotation)
		}
	}

	#renderAnnotationElement(annotation: AnyAnnotation): void {
		const container = this.getContainer()

		const element = document.createElement('div')
		element.id = annotation.id
		element.className = CSS_CLASSES.ANNOTATION
		element.dataset.type = annotation.type

		// Position and size
		element.style.position = 'absolute'
		element.style.left = `${annotation.bounds.x * this.#currentScale}px`
		element.style.top = `${annotation.bounds.y * this.#currentScale}px`
		element.style.width = `${annotation.bounds.width * this.#currentScale}px`
		element.style.height = `${annotation.bounds.height * this.#currentScale}px`

		// Style based on type
		this.#styleAnnotationElement(element, annotation)

		// Selection state
		if (this.#selectedAnnotation?.id === annotation.id) {
			element.classList.add(CSS_CLASSES.ANNOTATION_SELECTED)
		}

		container.appendChild(element)
		this.#annotationElements.set(annotation.id, element)
	}

	#styleAnnotationElement(element: HTMLElement, annotation: AnyAnnotation): void {
		const color = colorToCss(annotation.color, annotation.opacity)

		switch (annotation.type) {
			case 'Highlight':
			case 'Underline':
			case 'StrikeOut':
				element.style.backgroundColor = color
				element.style.mixBlendMode = 'multiply'
				break
			case 'Square':
				element.style.border = `${annotation.strokeWidth}px solid ${color}`
				element.style.backgroundColor = 'transparent'
				break
			case 'Circle':
				element.style.border = `${annotation.strokeWidth}px solid ${color}`
				element.style.borderRadius = '50%'
				element.style.backgroundColor = 'transparent'
				break
			case 'Text':
			case 'FreeText':
				element.style.backgroundColor = colorToCss(annotation.color, 0.2)
				element.style.border = `1px solid ${color}`
				if (annotation.contents) {
					element.textContent = annotation.contents
					element.style.padding = '4px'
					element.style.fontSize = annotation.type === 'FreeText'
						? `${annotation.fontSize * this.#currentScale}px`
						: `${12 * this.#currentScale}px`
					element.style.overflow = 'hidden'
				}
				break
			case 'Ink':
				// Ink annotations need canvas rendering
				element.style.pointerEvents = 'none'
				break
		}
	}

	#removeAnnotationElement(id: string): void {
		const element = this.#annotationElements.get(id)
		if (element) {
			element.remove()
			this.#annotationElements.delete(id)
		}
	}

	#setElementSelected(id: string, selected: boolean): void {
		const element = this.#annotationElements.get(id)
		if (element) {
			if (selected) {
				element.classList.add(CSS_CLASSES.ANNOTATION_SELECTED)
			} else {
				element.classList.remove(CSS_CLASSES.ANNOTATION_SELECTED)
			}
		}
	}

	#handleClick(e: MouseEvent): void {
		const target = e.target as HTMLElement

		// Check if clicked on an annotation
		if (target.classList.contains(CSS_CLASSES.ANNOTATION)) {
			this.selectAnnotation(target.id)
		} else if (target === this.getContainer()) {
			// Clicked on container background
			this.deselectAnnotation()
		}
	}
}
