/**
 * Documenta - Form Layer Implementation
 * @module core/form/FormLayer
 *
 * Provides form field detection and filling capabilities for PDF forms.
 */

import * as mupdf from 'mupdf'
import type {
	AnnotationColor,
	AnyFormField,
	CheckboxFormField,
	DropdownFormField,
	FormFieldChangeCallback,
	FormLayerInterface,
	FormLayerOptions,
	RadioFormField,
	Rectangle,
	TextFormField,
	Unsubscribe,
} from '../../types.js'
import { generateAnnotationId, mupdfRectToRectangle } from '../../helpers.js'
import { DEFAULT_FORM_HIGHLIGHT_COLOR } from '../../constants.js'

type ListenerMap<T> = Set<T>

/**
 * Form Layer implementation for PDF form filling
 */
export class FormLayerImpl implements FormLayerInterface {
	#document: mupdf.PDFDocument
	#fields: Map<string, AnyFormField> = new Map()
	#fieldsByPage: Map<number, string[]> = new Map()
	#highlightFields = false
	#highlightColor: AnnotationColor

	// UI elements
	#container: HTMLElement | null = null
	#overlayElement: HTMLDivElement | null = null
	#currentScale = 1
	#currentPageNumber = 0

	// Event listeners
	#fieldChangeListeners: ListenerMap<FormFieldChangeCallback> = new Set()
	#formSubmitListeners: ListenerMap<() => void> = new Set()

	constructor(document: mupdf.PDFDocument, options: FormLayerOptions = {}) {
		this.#document = document
		this.#highlightFields = options.highlightFields ?? false
		this.#highlightColor = options.highlightColor ?? DEFAULT_FORM_HIGHLIGHT_COLOR

		if (options.onFieldChange) {
			this.#fieldChangeListeners.add(options.onFieldChange)
		}
		if (options.onFormSubmit) {
			this.#formSubmitListeners.add(options.onFormSubmit)
		}

		// Scan document for form fields
		this.#scanFormFields()
	}

	// =========================================================================
	// Property Accessors
	// =========================================================================

	hasFormFields(): boolean {
		return this.#fields.size > 0
	}

	getAllFields(): readonly AnyFormField[] {
		return Array.from(this.#fields.values())
	}

	getFieldsOnPage(pageNumber: number): readonly AnyFormField[] {
		const fieldIds = this.#fieldsByPage.get(pageNumber) ?? []
		return fieldIds
			.map(id => this.#fields.get(id))
			.filter((f): f is AnyFormField => f !== undefined)
	}

	getFieldByName(name: string): AnyFormField | undefined {
		for (const field of this.#fields.values()) {
			if (field.name === name) {
				return field
			}
		}
		return undefined
	}

	// =========================================================================
	// Field Value Management
	// =========================================================================

	setFieldValue(fieldId: string, value: string): void {
		const field = this.#fields.get(fieldId)
		if (!field || field.isReadOnly) return

		if (field.type === 'text') {
			this.#updateTextField(field, value)
		} else if (field.type === 'dropdown') {
			// For dropdown, find the option index
			const optionIndex = (field as DropdownFormField).options.indexOf(value)
			if (optionIndex !== -1) {
				this.setFieldSelection(fieldId, optionIndex)
			}
		}
	}

	setFieldChecked(fieldId: string, checked: boolean): void {
		const field = this.#fields.get(fieldId)
		if (!field || field.isReadOnly) return

		if (field.type === 'checkbox') {
			this.#updateCheckboxField(field as CheckboxFormField, checked)
		} else if (field.type === 'radio') {
			this.#updateRadioField(field as RadioFormField, checked)
		}
	}

	setFieldSelection(fieldId: string, optionIndex: number): void {
		const field = this.#fields.get(fieldId)
		if (!field || field.isReadOnly || field.type !== 'dropdown') return

		this.#updateDropdownField(field as DropdownFormField, optionIndex)
	}

	// =========================================================================
	// Field Display
	// =========================================================================

	setHighlightFields(enabled: boolean): void {
		this.#highlightFields = enabled
		this.#updateFieldHighlights()
	}

	// =========================================================================
	// Form Operations
	// =========================================================================

	flattenForm(): void {
		// Flatten form fields into regular PDF content
		const pageCount = this.#document.countPages()
		for (let i = 0; i < pageCount; i++) {
			const page = this.#document.loadPage(i)
			// In mupdf, we create annotations to represent flattened form fields
			// This is a simplified approach - full implementation would use proper flattening
			page.destroy()
		}

		// Clear all fields after flattening
		this.#fields.clear()
		this.#fieldsByPage.clear()
	}

	resetForm(): void {
		// Reset all fields to their default values
		for (const field of this.#fields.values()) {
			switch (field.type) {
				case 'text':
					this.setFieldValue(field.id, '')
					break
				case 'checkbox':
					this.setFieldChecked(field.id, false)
					break
				case 'radio':
					this.setFieldChecked(field.id, false)
					break
				case 'dropdown':
					this.setFieldSelection(field.id, 0)
					break
			}
		}
	}

	// =========================================================================
	// Rendering
	// =========================================================================

	render(pageNumber: number, container: HTMLElement, scale: number): void {
		this.#container = container
		this.#currentScale = scale
		this.#currentPageNumber = pageNumber

		// Create or update overlay
		if (!this.#overlayElement) {
			this.#overlayElement = this.#createOverlayElement()
			container.appendChild(this.#overlayElement)
		}

		// Clear existing field elements
		this.#overlayElement.innerHTML = ''

		// Get page dimensions
		const page = this.#document.loadPage(pageNumber - 1)
		const bounds = page.getBounds()
		const width = bounds[2] - bounds[0]
		const height = bounds[3] - bounds[1]
		page.destroy()

		this.#overlayElement.style.width = `${width * scale}px`
		this.#overlayElement.style.height = `${height * scale}px`

		// Render field overlays
		const fields = this.getFieldsOnPage(pageNumber)
		for (const field of fields) {
			this.#renderFieldOverlay(field, scale)
		}
	}

	// =========================================================================
	// Event Subscriptions
	// =========================================================================

	onFieldChange(callback: FormFieldChangeCallback): Unsubscribe {
		this.#fieldChangeListeners.add(callback)
		return () => this.#fieldChangeListeners.delete(callback)
	}

	onFormSubmit(callback: () => void): Unsubscribe {
		this.#formSubmitListeners.add(callback)
		return () => this.#formSubmitListeners.delete(callback)
	}

	// =========================================================================
	// Lifecycle
	// =========================================================================

	destroy(): void {
		if (this.#overlayElement && this.#overlayElement.parentNode) {
			this.#overlayElement.parentNode.removeChild(this.#overlayElement)
		}

		this.#overlayElement = null
		this.#container = null
		this.#fields.clear()
		this.#fieldsByPage.clear()
		this.#fieldChangeListeners.clear()
		this.#formSubmitListeners.clear()
	}

	// =========================================================================
	// Private Methods
	// =========================================================================

	#scanFormFields(): void {
		const pageCount = this.#document.countPages()

		for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
			const page = this.#document.loadPage(pageIndex)
			const pageNumber = pageIndex + 1

			// Get all widgets (form fields) on the page
			const widgets = page.getWidgets()

			for (const widget of widgets) {
				const field = this.#createFieldFromWidget(widget, pageNumber)
				if (field) {
					this.#fields.set(field.id, field)

					let pageFields = this.#fieldsByPage.get(pageNumber)
					if (!pageFields) {
						pageFields = []
						this.#fieldsByPage.set(pageNumber, pageFields)
					}
					pageFields.push(field.id)
				}
			}

			page.destroy()
		}
	}

	#createFieldFromWidget(widget: mupdf.PDFWidget, pageNumber: number): AnyFormField | null {
		const id = generateAnnotationId()
		const bounds = mupdfRectToRectangle(widget.getBounds())
		const fieldType = widget.getFieldType()
		const name = widget.getLabel() || widget.getName() || `field_${id}`
		const value = widget.getValue() || ''
		const isReadOnly = widget.isReadOnly()

		const base = {
			id,
			pageNumber,
			name,
			bounds,
			value,
			isReadOnly,
			isRequired: false,
		}

		switch (fieldType) {
			case 'text':
				return {
					...base,
					type: 'text' as const,
					maxLength: widget.getMaxLen() ?? undefined,
					isMultiline: widget.isMultiline(),
					isPassword: widget.isPassword(),
				} as TextFormField

			case 'checkbox':
				return {
					...base,
					type: 'checkbox' as const,
					isChecked: value === 'Yes' || value === 'On',
				} as CheckboxFormField

			case 'radiobutton':
				return {
					...base,
					type: 'radio' as const,
					groupName: name,
					isSelected: value === 'Yes' || value === 'On',
				} as RadioFormField

			case 'combobox':
			case 'listbox': {
				const options = widget.getOptions()
				return {
					...base,
					type: 'dropdown' as const,
					options: options,
					selectedIndex: options.findIndex(o => o === value),
				} as DropdownFormField
			}

			default:
				return null
		}
	}

	#createOverlayElement(): HTMLDivElement {
		const overlay = document.createElement('div')
		overlay.className = 'documenta-form-layer'
		overlay.style.cssText = `
			position: absolute;
			top: 0;
			left: 0;
			pointer-events: auto;
			z-index: 15;
		`
		return overlay
	}

	#renderFieldOverlay(field: AnyFormField, scale: number): void {
		if (!this.#overlayElement) return

		const element = document.createElement('div')
		element.className = `form-field form-field-${field.type}`
		element.dataset.fieldId = field.id

		element.style.cssText = `
			position: absolute;
			left: ${field.bounds.x * scale}px;
			top: ${field.bounds.y * scale}px;
			width: ${field.bounds.width * scale}px;
			height: ${field.bounds.height * scale}px;
			box-sizing: border-box;
			${this.#highlightFields ? `background-color: rgba(${this.#highlightColor.r * 255}, ${this.#highlightColor.g * 255}, ${this.#highlightColor.b * 255}, 0.3);` : ''}
		`

		switch (field.type) {
			case 'text':
				this.#renderTextField(element, field as TextFormField, scale)
				break
			case 'checkbox':
				this.#renderCheckboxField(element, field as CheckboxFormField, scale)
				break
			case 'radio':
				this.#renderRadioField(element, field as RadioFormField, scale)
				break
			case 'dropdown':
				this.#renderDropdownField(element, field as DropdownFormField, scale)
				break
		}

		this.#overlayElement.appendChild(element)
	}

	#renderTextField(container: HTMLElement, field: TextFormField, scale: number): void {
		const input = field.isMultiline
			? document.createElement('textarea')
			: document.createElement('input')

		if (!field.isMultiline && input instanceof HTMLInputElement) {
			input.type = field.isPassword ? 'password' : 'text'
			if (field.maxLength) {
				input.maxLength = field.maxLength
			}
		}

		input.value = field.value
		input.disabled = field.isReadOnly
		input.style.cssText = `
			width: 100%;
			height: 100%;
			border: 1px solid #ccc;
			padding: 2px 4px;
			font-size: ${Math.max(10, 12 * scale)}px;
			background: ${field.isReadOnly ? '#f5f5f5' : 'white'};
			box-sizing: border-box;
			resize: none;
		`

		input.addEventListener('change', () => {
			this.#updateTextField(field, input.value)
		})

		container.appendChild(input)
	}

	#renderCheckboxField(container: HTMLElement, field: CheckboxFormField, _scale: number): void {
		const checkbox = document.createElement('input')
		checkbox.type = 'checkbox'
		checkbox.checked = field.isChecked
		checkbox.disabled = field.isReadOnly
		checkbox.style.cssText = `
			width: 100%;
			height: 100%;
			cursor: ${field.isReadOnly ? 'default' : 'pointer'};
		`

		checkbox.addEventListener('change', () => {
			this.#updateCheckboxField(field, checkbox.checked)
		})

		container.appendChild(checkbox)
	}

	#renderRadioField(container: HTMLElement, field: RadioFormField, _scale: number): void {
		const radio = document.createElement('input')
		radio.type = 'radio'
		radio.name = field.groupName
		radio.checked = field.isSelected
		radio.disabled = field.isReadOnly
		radio.style.cssText = `
			width: 100%;
			height: 100%;
			cursor: ${field.isReadOnly ? 'default' : 'pointer'};
		`

		radio.addEventListener('change', () => {
			this.#updateRadioField(field, radio.checked)
		})

		container.appendChild(radio)
	}

	#renderDropdownField(container: HTMLElement, field: DropdownFormField, scale: number): void {
		const select = document.createElement('select')
		select.disabled = field.isReadOnly
		select.style.cssText = `
			width: 100%;
			height: 100%;
			font-size: ${Math.max(10, 12 * scale)}px;
			background: ${field.isReadOnly ? '#f5f5f5' : 'white'};
		`

		for (let i = 0; i < field.options.length; i++) {
			const option = document.createElement('option')
			option.value = String(i)
			option.textContent = field.options[i] ?? ''
			option.selected = i === field.selectedIndex
			select.appendChild(option)
		}

		select.addEventListener('change', () => {
			this.#updateDropdownField(field, parseInt(select.value, 10))
		})

		container.appendChild(select)
	}

	#updateTextField(field: TextFormField, newValue: string): void {
		// Update in PDF
		const page = this.#document.loadPage(field.pageNumber - 1)
		const widgets = page.getWidgets()

		for (const widget of widgets) {
			const widgetBounds = mupdfRectToRectangle(widget.getBounds())
			if (this.#boundsMatch(widgetBounds, field.bounds)) {
				widget.setTextValue(newValue)
				widget.update()
				break
			}
		}
		page.destroy()

		// Update local state
		const updatedField: TextFormField = { ...field, value: newValue }
		this.#fields.set(field.id, updatedField)

		this.#emitFieldChange(updatedField, newValue)
	}

	#updateCheckboxField(field: CheckboxFormField, checked: boolean): void {
		const page = this.#document.loadPage(field.pageNumber - 1)
		const widgets = page.getWidgets()

		for (const widget of widgets) {
			const widgetBounds = mupdfRectToRectangle(widget.getBounds())
			if (this.#boundsMatch(widgetBounds, field.bounds)) {
				widget.toggle()
				widget.update()
				break
			}
		}
		page.destroy()

		const updatedField: CheckboxFormField = { ...field, isChecked: checked, value: checked ? 'Yes' : 'Off' }
		this.#fields.set(field.id, updatedField)

		this.#emitFieldChange(updatedField, checked)
	}

	#updateRadioField(field: RadioFormField, selected: boolean): void {
		const page = this.#document.loadPage(field.pageNumber - 1)
		const widgets = page.getWidgets()

		for (const widget of widgets) {
			const widgetBounds = mupdfRectToRectangle(widget.getBounds())
			if (this.#boundsMatch(widgetBounds, field.bounds)) {
				widget.toggle()
				widget.update()
				break
			}
		}
		page.destroy()

		const updatedField: RadioFormField = { ...field, isSelected: selected, value: selected ? 'Yes' : 'Off' }
		this.#fields.set(field.id, updatedField)

		this.#emitFieldChange(updatedField, selected)
	}

	#updateDropdownField(field: DropdownFormField, optionIndex: number): void {
		const page = this.#document.loadPage(field.pageNumber - 1)
		const widgets = page.getWidgets()

		const selectedOption = field.options[optionIndex] ?? ''

		for (const widget of widgets) {
			const widgetBounds = mupdfRectToRectangle(widget.getBounds())
			if (this.#boundsMatch(widgetBounds, field.bounds)) {
				widget.setChoiceValue(selectedOption)
				widget.update()
				break
			}
		}
		page.destroy()

		const updatedField: DropdownFormField = { ...field, selectedIndex: optionIndex, value: selectedOption }
		this.#fields.set(field.id, updatedField)

		this.#emitFieldChange(updatedField, selectedOption)
	}

	#boundsMatch(a: Rectangle, b: Rectangle): boolean {
		const epsilon = 1
		return (
			Math.abs(a.x - b.x) < epsilon &&
			Math.abs(a.y - b.y) < epsilon &&
			Math.abs(a.width - b.width) < epsilon &&
			Math.abs(a.height - b.height) < epsilon
		)
	}

	#updateFieldHighlights(): void {
		if (!this.#overlayElement) return

		const fieldElements = this.#overlayElement.querySelectorAll('.form-field')
		for (const element of fieldElements) {
			if (element instanceof HTMLElement) {
				if (this.#highlightFields) {
					element.style.backgroundColor = `rgba(${this.#highlightColor.r * 255}, ${this.#highlightColor.g * 255}, ${this.#highlightColor.b * 255}, 0.3)`
				} else {
					element.style.backgroundColor = 'transparent'
				}
			}
		}
	}

	// =========================================================================
	// Event Emitters
	// =========================================================================

	#emitFieldChange(field: AnyFormField, newValue: string | boolean): void {
		for (const callback of this.#fieldChangeListeners) {
			callback(field, newValue)
		}
	}

	#emitFormSubmit(): void {
		for (const callback of this.#formSubmitListeners) {
			callback()
		}
	}
}
