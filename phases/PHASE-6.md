# Phase 6: Advanced Features

> **Status:** ⏳ Pending
> **Started:** —
> **Target:** —
> **Depends on:** Phase 4 (Text Layer) ⏳ Pending, Phase 5 (Drawing Layer) ⏳ Pending

## Objective

Implement form filling, annotations, and page management.  By end of phase, the library is feature-complete with all Tier 1-3 functionality. 

## Deliverables

| # | Deliverable | Status | Assignee |
|---|-------------|--------|----------|
| 6.1 | Form layer | ⏳ Pending | — |
| 6.2 | Annotation layer | ⏳ Pending | — |
| 6.3 | Page management | ⏳ Pending | — |
| 6.4 | Showcase demo | ⏳ Pending | — |
| 6.5 | Documentation | ⏳ Pending | — |
| 6.6 | Integration tests | ⏳ Pending | — |

**Status Legend:**
- ✅ Done
- 🔄 Active
- ⏳ Pending

## Current Focus: 6.1 Form Layer

### Requirements

1. Detect form fields in PDF
2. Render interactive HTML overlays
3. Support text, checkbox, radio, dropdown fields
4. Flatten form on save (optional)

### Interface Contract

```typescript
export type FormFieldType = 'text' | 'checkbox' | 'radio' | 'dropdown'

export interface FormField {
	readonly id: string
	readonly pageNumber: number
	readonly type: FormFieldType
	readonly name: string
	readonly bounds: Rectangle
	readonly value: string
	readonly isReadOnly: boolean
}

export interface TextFormField extends FormField {
	readonly type:  'text'
	readonly maxLength: number | undefined
	readonly isMultiline: boolean
	readonly isPassword: boolean
}

export interface CheckboxFormField extends FormField {
	readonly type: 'checkbox'
	readonly isChecked: boolean
}

export interface RadioFormField extends FormField {
	readonly type:  'radio'
	readonly groupName: string
	readonly isSelected: boolean
}

export interface DropdownFormField extends FormField {
	readonly type: 'dropdown'
	readonly options:  readonly string[]
	readonly selectedIndex: number
}

export type AnyFormField = TextFormField | CheckboxFormField | RadioFormField | DropdownFormField

export type FormFieldChangeCallback = (field:  AnyFormField, newValue: string | boolean) => void

export interface FormLayerInterface extends Layer {
	hasFormFields(): boolean
	getAllFields(): readonly AnyFormField[]
	getFieldsOnPage(pageNumber: number): readonly AnyFormField[]
	getFieldByName(name: string): AnyFormField | undefined

	setFieldValue(fieldId: string, value: string): void
	setFieldChecked(fieldId:  string, checked: boolean): void
	setFieldSelection(fieldId: string, optionIndex: number): void

	setHighlightFields(enabled: boolean): void
	flattenForm(): void
	resetForm(): void

	onFieldChange(callback: FormFieldChangeCallback): Unsubscribe
}
```

### Implementation Checklist

- [ ] Create `src/core/form/FormLayer.ts`
- [ ] Extend BaseLayer
- [ ] Scan document for widgets on load
- [ ] Create HTML input overlays for each field type
- [ ] Wire up change events to mupdf widget updates
- [ ] Implement field highlighting
- [ ] Implement flatten operation

---

## Deliverable 6.2: Annotation Layer

### Requirements

1. Create and manage annotations (text notes, shapes)
2. Render annotation overlays
3. Support annotation selection and editing
4. Persist to PDF

### Interface Contract

```typescript
export type AnnotationType = 'Text' | 'FreeText' | 'Highlight' | 'Square' | 'Circle'

export interface Annotation {
	readonly id: string
	readonly pageNumber: number
	readonly type: AnnotationType
	readonly bounds: Rectangle
	readonly color: Color
	readonly opacity:  number
	readonly contents: string
	readonly createdAt: Date
	readonly modifiedAt: Date
}

export interface AnnotationLayerInterface extends Layer {
	getAnnotations(pageNumber: number): readonly Annotation[]
	getAnnotationById(id: string): Annotation | undefined

	addAnnotation(data: CreateAnnotationData): Annotation
	updateAnnotation(id: string, updates: Partial<Annotation>): void
	removeAnnotation(id:  string): void

	selectAnnotation(id:  string): void
	deselectAnnotation(): void
	getSelectedAnnotation(): Annotation | undefined

	onAnnotationAdd(callback: (annot: Annotation) => void): Unsubscribe
	onAnnotationRemove(callback: (id: string) => void): Unsubscribe
	onAnnotationSelect(callback: (annot: Annotation | undefined) => void): Unsubscribe
}
```

### Implementation Checklist

- [ ] Create `src/core/annotation/AnnotationLayer. ts`
- [ ] Extend BaseLayer
- [ ] Load existing annotations from PDF
- [ ] Render annotation overlays
- [ ] Implement annotation creation flow
- [ ] Implement selection and editing
- [ ] Implement deletion

---

## Deliverable 6.3: Page Management

### Requirements

1. Add blank pages
2. Delete pages
3. Rotate pages
4. Reorder pages (move)

### Interface Contract

```typescript
export interface PageManagementInterface {
	addBlankPage(afterPage?: number, width?: number, height?:  number): number
	deletePage(pageNumber: number): void
	rotatePage(pageNumber: number, rotation: PageRotation): void
	movePage(fromPage: number, toPage: number): void
	getPageRotation(pageNumber:  number): PageRotation
}
```

### Implementation Checklist

- [ ] Add `addBlankPage()` to PdfEditor
- [ ] Add `deletePage()` to PdfEditor
- [ ] Add `rotatePage()` to PdfEditor
- [ ] Add `movePage()` to PdfEditor
- [ ] Update navigation after page operations
- [ ] Emit page count change events

---

## Deliverable 6.4: Showcase Demo

### Requirements

1. Mobile-first responsive design
2. Demonstrate all features
3. Single-file HTML output for easy distribution

### Implementation Checklist

- [ ] Create `showcase/index.html` with semantic markup
- [ ] Create `showcase/main.ts` entry point
- [ ] Create `showcase/styles.css` with mobile-first styles
- [ ] Build toolbar with mode switching
- [ ] Build page navigation controls
- [ ] Build zoom controls
- [ ] Build tool options panel
- [ ] Configure Vite to output single HTML file

---

## Deliverable 6.5: Documentation

### Requirements

1. README with quick start guide
2. API reference in guides/
3. TSDoc on all public exports

### Implementation Checklist

- [ ] Update `README.md` with installation and usage
- [ ] Create `guides/pdf-editor. md` with detailed API docs
- [ ] Create `guides/layers.md` explaining layer system
- [ ] Create `guides/mobile. md` with mobile considerations
- [ ] Ensure all public exports have TSDoc

---

## Deliverable 6.6: Integration Tests

### Requirements

1. End-to-end tests with Playwright
2. Test real PDF loading and manipulation
3. Test touch gestures on mobile viewport

### Implementation Checklist

- [ ] Create `tests/integration/PdfEditor.test. ts`
- [ ] Create `tests/integration/TextLayer.test.ts`
- [ ] Create `tests/integration/DrawingLayer.test.ts`
- [ ] Create `tests/integration/FormLayer.test.ts`
- [ ] Test load → edit → save workflow
- [ ] Test mobile gestures in mobile viewport

## Phase Completion Criteria

All of the following must be true: 

- [ ] All deliverables marked ✅ Done
- [ ] Form filling works
- [ ] Annotations work
- [ ] Page management works
- [ ] Showcase demo demonstrates all features
- [ ] Documentation complete
- [ ] `npm run check` passes
- [ ] `npm run test` passes
- [ ] PLAN.md updated to show Phase 6 complete
- [ ] Project ready for v1.0 release