/**
 * FormLayer - Form field overlay layer
 * @module core/form/FormLayer
 *
 * Provides interactive form field overlays for PDF forms.
 */

import type {
	FormLayerInterface,
	AnyFormField,
	FormFieldChangeCallback,
	PdfDocumentInterface,
	Unsubscribe,
} from '../../types.js'
import { BaseLayer } from '../layers/BaseLayer.js'
import {
	Z_INDEX_FORM,
	CSS_CLASSES,
} from '../../constants.js'

/**
 * FormLayer - Interactive form fields
 *
 * @remarks
 * Creates HTML input overlays for PDF form fields.
 */
export class FormLayer extends BaseLayer implements FormLayerInterface {
	#document: PdfDocumentInterface | undefined
	#fields = new Map<number, AnyFormField[]>()
	#fieldElements = new Map<string, HTMLElement>()
	#changeListeners = new Set<FormFieldChangeCallback>()
	#highlightEnabled = false

	#currentPage = 0
	#currentScale = 1

	constructor(parent: HTMLElement) {
		super(parent, Z_INDEX_FORM, CSS_CLASSES.FORM_LAYER)

		const container = this.getContainer()
		container.style.overflow = 'hidden'
	}

	setDocument(doc: PdfDocumentInterface): void {
		this.#document = doc
		this.#scanForFields()
	}

	hasFormFields(): boolean {
		for (const fields of this.#fields.values()) {
			if (fields.length > 0) return true
		}
		return false
	}

	getAllFields(): readonly AnyFormField[] {
		const all: AnyFormField[] = []
		for (const fields of this.#fields.values()) {
			all.push(...fields)
		}
		return all
	}

	getFieldsOnPage(pageNumber: number): readonly AnyFormField[] {
		return this.#fields.get(pageNumber) ?? []
	}

	getFieldByName(name: string): AnyFormField | undefined {
		for (const fields of this.#fields.values()) {
			const field = fields.find(f => f.name === name)
			if (field) return field
		}
		return undefined
	}

	setFieldValue(fieldId: string, value: string): void {
		const field = this.#findFieldById(fieldId)
		if (!field) return

		// Update field value - create new field object
		const updatedField = this.#cloneFieldWithValue(field, value)
		this.#updateField(updatedField)

		// Update DOM element
		const element = this.#fieldElements.get(fieldId)
		if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
			element.value = value
		} else if (element instanceof HTMLSelectElement) {
			element.value = value
		}

		// Notify listeners
		for (const listener of this.#changeListeners) {
			listener(updatedField, value)
		}
	}

	setFieldChecked(fieldId: string, checked: boolean): void {
		const field = this.#findFieldById(fieldId)
		if (!field || (field.type !== 'checkbox' && field.type !== 'radio')) return

		// Update field - create new field object
		const updatedField = this.#cloneFieldWithValue(field, String(checked))
		this.#updateField(updatedField)

		// Update DOM element
		const element = this.#fieldElements.get(fieldId)
		if (element instanceof HTMLInputElement) {
			element.checked = checked
		}

		// Notify listeners
		for (const listener of this.#changeListeners) {
			listener(updatedField, checked)
		}
	}

	setFieldSelection(fieldId: string, optionIndex: number): void {
		const field = this.#findFieldById(fieldId)
		if (!field || field.type !== 'dropdown') return

		const value = field.options[optionIndex] ?? ''

		// Update field - create new field object
		const updatedField = this.#cloneFieldWithValue(field, value)
		this.#updateField(updatedField)

		// Update DOM element
		const element = this.#fieldElements.get(fieldId)
		if (element instanceof HTMLSelectElement) {
			element.selectedIndex = optionIndex
		}

		// Notify listeners
		for (const listener of this.#changeListeners) {
			listener(updatedField, value)
		}
	}

	setHighlightFields(enabled: boolean): void {
		this.#highlightEnabled = enabled
		this.#updateFieldHighlights()
	}

	flattenForm(): void {
		// TODO: Implement form flattening using mupdf
	}

	resetForm(): void {
		// Reset all fields to empty/default values
		for (const fields of this.#fields.values()) {
			for (const field of fields) {
				if (field.type === 'checkbox' || field.type === 'radio') {
					this.setFieldChecked(field.id, false)
				} else {
					this.setFieldValue(field.id, '')
				}
			}
		}
	}

	onFieldChange(callback: FormFieldChangeCallback): Unsubscribe {
		this.#changeListeners.add(callback)
		return () => this.#changeListeners.delete(callback)
	}

	protected onRender(pageNumber: number, scale: number): void {
		this.#currentPage = pageNumber
		this.#currentScale = scale
		this.#renderFieldOverlays()
	}

	protected onResize(_width: number, _height: number): void {
		if (this.#currentPage > 0) {
			this.#renderFieldOverlays()
		}
	}

	protected onActivate(): void {
		// Enable input on all field elements
		for (const element of this.#fieldElements.values()) {
			if (element instanceof HTMLInputElement ||
				element instanceof HTMLTextAreaElement ||
				element instanceof HTMLSelectElement) {
				element.disabled = false
			}
		}
	}

	protected onDeactivate(): void {
		// Disable input on all field elements
		for (const element of this.#fieldElements.values()) {
			if (element instanceof HTMLInputElement ||
				element instanceof HTMLTextAreaElement ||
				element instanceof HTMLSelectElement) {
				element.disabled = true
			}
		}
	}

	protected onDestroy(): void {
		this.#fields.clear()
		this.#fieldElements.clear()
		this.#changeListeners.clear()
	}

	#scanForFields(): void {
		if (!this.#document || !this.#document.isLoaded()) return

		// TODO: Implement actual PDF widget scanning using mupdf
		// For now, just clear fields
		this.#fields.clear()
	}

	#renderFieldOverlays(): void {
		const container = this.getContainer()
		container.innerHTML = ''
		this.#fieldElements.clear()

		const fields = this.getFieldsOnPage(this.#currentPage)

		for (const field of fields) {
			const element = this.#createFieldElement(field)
			if (element) {
				this.#positionElement(element, field)
				container.appendChild(element)
				this.#fieldElements.set(field.id, element)
			}
		}
	}

	#createFieldElement(field: AnyFormField): HTMLElement | undefined {
		let element: HTMLElement | undefined

		switch (field.type) {
			case 'text':
				element = this.#createTextInput(field)
				break
			case 'checkbox':
				element = this.#createCheckbox(field)
				break
			case 'radio':
				element = this.#createRadio(field)
				break
			case 'dropdown':
				element = this.#createDropdown(field)
				break
		}

		if (element) {
			element.id = field.id
			element.className = CSS_CLASSES.FORM_FIELD
			element.dataset.fieldType = field.type
		}

		return element
	}

	#createTextInput(field: AnyFormField): HTMLElement {
		if (field.type !== 'text') {
			return document.createElement('input')
		}

		if (field.isMultiline) {
			const textarea = document.createElement('textarea')
			textarea.value = field.value
			textarea.readOnly = field.isReadOnly
			textarea.addEventListener('change', () => {
				this.setFieldValue(field.id, textarea.value)
			})
			return textarea
		}

		const input = document.createElement('input')
		input.type = field.isPassword ? 'password' : 'text'
		input.value = field.value
		input.readOnly = field.isReadOnly

		if (field.maxLength !== undefined) {
			input.maxLength = field.maxLength
		}

		input.addEventListener('change', () => {
			this.setFieldValue(field.id, input.value)
		})

		return input
	}

	#createCheckbox(field: AnyFormField): HTMLElement {
		const input = document.createElement('input')
		input.type = 'checkbox'

		if (field.type === 'checkbox') {
			input.checked = field.isChecked
		}
		input.disabled = field.isReadOnly

		input.addEventListener('change', () => {
			this.setFieldChecked(field.id, input.checked)
		})

		return input
	}

	#createRadio(field: AnyFormField): HTMLElement {
		const input = document.createElement('input')
		input.type = 'radio'

		if (field.type === 'radio') {
			input.name = field.groupName
			input.checked = field.isSelected
		}
		input.disabled = field.isReadOnly

		input.addEventListener('change', () => {
			this.setFieldChecked(field.id, input.checked)
		})

		return input
	}

	#createDropdown(field: AnyFormField): HTMLElement {
		const select = document.createElement('select')
		select.disabled = field.isReadOnly

		if (field.type === 'dropdown') {
			for (let i = 0; i < field.options.length; i++) {
				const option = document.createElement('option')
				option.value = field.options[i] ?? ''
				option.textContent = field.options[i] ?? ''
				option.selected = i === field.selectedIndex
				select.appendChild(option)
			}
		}

		select.addEventListener('change', () => {
			this.setFieldSelection(field.id, select.selectedIndex)
		})

		return select
	}

	#positionElement(element: HTMLElement, field: AnyFormField): void {
		element.style.position = 'absolute'
		element.style.left = `${field.bounds.x * this.#currentScale}px`
		element.style.top = `${field.bounds.y * this.#currentScale}px`
		element.style.width = `${field.bounds.width * this.#currentScale}px`
		element.style.height = `${field.bounds.height * this.#currentScale}px`
	}

	#updateFieldHighlights(): void {
		for (const element of this.#fieldElements.values()) {
			if (this.#highlightEnabled) {
				element.style.outline = '2px solid rgba(0, 120, 215, 0.5)'
				element.style.backgroundColor = 'rgba(0, 120, 215, 0.1)'
			} else {
				element.style.outline = ''
				element.style.backgroundColor = ''
			}
		}
	}

	#findFieldById(fieldId: string): AnyFormField | undefined {
		for (const fields of this.#fields.values()) {
			const field = fields.find(f => f.id === fieldId)
			if (field) return field
		}
		return undefined
	}

	#cloneFieldWithValue(field: AnyFormField, value: string): AnyFormField {
		// Clone with new value based on type
		switch (field.type) {
			case 'text':
				return { ...field, value }
			case 'checkbox':
				return { ...field, value, isChecked: value === 'true' }
			case 'radio':
				return { ...field, value, isSelected: value === 'true' }
			case 'dropdown':
				return { ...field, value }
		}
	}

	#updateField(updatedField: AnyFormField): void {
		const pageFields = this.#fields.get(updatedField.pageNumber)
		if (pageFields) {
			const index = pageFields.findIndex(f => f.id === updatedField.id)
			if (index >= 0) {
				pageFields[index] = updatedField
			}
		}
	}
}
