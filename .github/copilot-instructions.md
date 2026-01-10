# Universal TypeScript Development Instructions for GitHub Copilot

## Purpose

Ensure consistent code design, naming conventions, and architectural patterns across all TypeScript projectsâ€”browser, Node.js, or isomorphicâ€”so that generated code matches developer expectations and maintains quality standards.

---

## Core Principles

| Principle                        | Description                                                         |
|----------------------------------|---------------------------------------------------------------------|
| **Determinism**                  | Same inputs â†’ same outputs; stable ordering and comparison          |
| **Strict typing**                | No `any`, no `!`, no unsafe casts (`as`); narrow from `unknown`     |
| **Zero dependencies by default** | Build with native APIs; add packages only when explicitly requested |
| **Readonly immutability**        | Prefer `readonly` outputs; copy-on-write for internal state         |
| **Small, modular APIs**          | Composable functions; real use cases drive API growth               |
| **Environment-agnostic core**    | Isolate platform-specific code when needed                          |
| **Accuracy over latency**        | Take time to get things right; precision over speed                 |
| **Types-first development**      | Define types before implementation; use as source of truth          |

---

## Dependencies Policy (CRITICAL)

### Core Rule

**NEVER suggest adding npm packages unless explicitly requested by the user.**

### Forbidden Actions

- âŒ Do NOT suggest installing packages (no "npm install moment", "npm install lodash", etc.)
- âŒ Do NOT mention external libraries
- âŒ Do NOT import from packages not already in package.json
- âŒ Do NOT add devDependencies without explicit permission

### Required Actions

- âœ… Build custom solutions using native APIs
- âœ… Use native JavaScript/TypeScript (Date, Array, Map, Set, Promise, URL, etc.)
- âœ… Use existing project dependencies only
- âœ… Keep runtime dependency-free when possible

### Environment-Specific Native APIs

**Browser:**
- DOM APIs, Fetch, Storage (localStorage/sessionStorage), WebSocket, BroadcastChannel, IndexedDB, Clipboard API, Canvas, Web Audio, etc.

**Node.js:**
- `fs`, `path`, `http`, `https`, `crypto`, `stream`, `buffer`, `process`, etc.

**Universal:**
- `Promise`, `Array`, `Map`, `Set`, `RegExp`, `URL`, `URLSearchParams`, `Date`, `Math`, etc.

---

## TypeScript Standards

### Core Type Rules

- **No `any`**.  No non-null assertions (`!`). No type assertions (`as` or `<T>value`).
- Accept `unknown` at external boundaries; validate first, then narrow.
- Prefer `readonly` in public interfaces and return types.
- Model nullability/optionality explicitly (`T | undefined`, optional fields).
- **Named exports only**; avoid default exports (except when required by frameworks).
- **ESM imports with `.js` extensions**: `import { x } from './foo.js'`
- Use `as const` for literal inference where appropriate.

### Type Guards and Narrowing

Write small, composable user-defined type guards: 

```ts
function isString(value:  unknown): value is string {
	return typeof value === 'string'
}

function isNonEmptyString(value: unknown): value is string {
	return typeof value === 'string' && value.length > 0
}
```

**Rules:**
- No mutation inside guards
- Export guards alongside the APIs they validate
- Prefer positive guards over negative complements
- For discriminated unions, use explicit discriminants

### Preserving Subtypes in Type Predicates

When validating functions or complex types, preserve original subtypes via generics:

```ts
// Preserve the original async function subtype
export function isAsyncFunction<F extends (...args: unknown[]) => Promise<unknown>>(fn: F): fn is F
export function isAsyncFunction(fn: unknown): fn is (...args: unknown[]) => Promise<unknown>
export function isAsyncFunction(fn: unknown): boolean {
	if (typeof fn !== 'function') return false
	const name = (fn as { constructor?:  { name?:  unknown } }).constructor?.name
	return typeof name === 'string' && name === 'AsyncFunction'
}
```

### Generics and Inference

- Constrain generics to the minimum needed:  `<T extends object>`
- Avoid unconstrained `<T>` when it loses useful inference
- Prefer conditional and mapped types over excessive overloads

### Options Objects

- Define a named `*Options` interface for any exported function/class options
- Place in `src/types.ts` or `{app}/types.ts`
- Document as single `@param` with fields listed under `@remarks`
- Prefer boolean/enum flags that are orthogonal and stable
- **For stateful systems with events**: Use the System Hooks Pattern (see API Design Patterns)

### Immutability and Collections

- Prefer `readonly T[]`, `ReadonlyArray<T>`, `ReadonlyMap<K, V>`, `ReadonlySet<T>`
- Do not mutate inputs; use copy-on-write for internal state
- Public getters should return copies or readonly views, not mutable references
- Document collection ordering semantics

### Recommended tsconfig Settings

Use a **base tsconfig.json** for development (includes all types for the full project) and **configs/tsconfig.build.json** for production builds (narrowed types for target environment).

**Base tsconfig.json:**
```json
{
	"compilerOptions": {
		"target": "ESNext",
		"module": "ESNext",
		"moduleResolution": "bundler",
		"lib": ["ESNext", "DOM", "DOM.Iterable"],
		"types": ["node", "vite/client"],
		"noEmit": true,
		"strict":  true,
		"skipLibCheck": true,
		"noImplicitAny":  true,
		"noUncheckedIndexedAccess": true,
		"exactOptionalPropertyTypes":  true,
		"noImplicitOverride": true,
		"useUnknownInCatchVariables": true,
		"resolveJsonModule": true,
		"esModuleInterop":  true,
		"baseUrl": ".",
		"paths": {
			"~/src/*": ["src/*"]
		}
	},
	"exclude": ["node_modules", "dist"]
}
```

**configs/tsconfig.build.json:**
```json
{
	"extends": "../tsconfig.json",
	"compilerOptions": {
		"noEmit": false,
		"types": []
	},
	"include": ["../src/**/*.ts"]
}
```

**Rationale:**
- Base config has all types (Node, DOM, test frameworks) for full project IDE support
- Build config narrows types to production environment only (removes Node types for browser)
- `noEmit:  true` in base, `noEmit: false` in build allows `vite-plugin-dts` to generate declarations
- `types: []` in build removes ambient types not needed in library output

**vite-plugin-dts Integration:**
When using `vite-plugin-dts`, configure it to use the build tsconfig: 
```typescript
dts({
	tsconfigPath: './configs/tsconfig.build.json',
	rollupTypes: true,  // Bundle all .d.ts into single index.d.ts
})
```

This generates a single rolled-up `index.d.ts` that includes all exported types from `src/types.ts` and other modules.

---

## Canonical Naming Taxonomy

### Method Prefix Categories

| Prefix                        | Meaning                    | Return Type      | Rules                      |
|-------------------------------|----------------------------|------------------|----------------------------|
| **Accessors**                 |                            |                  |                            |
| `get`                         | Retrieve a value           | any              | Pure, no mutation          |
| `peek`                        | Retrieve without consuming | any              | Pure, non-destructive      |
| `at`                          | Access by index/position   | any              | Pure                       |
| `has`                         | Check existence            | boolean          | Must return boolean        |
| `is`                          | Check identity/state       | boolean          | Must return boolean        |
| **Mutators**                  |                            |                  |                            |
| `set`                         | Assign or replace          | void / this      | Must mutate                |
| `update`                      | Modify partially           | void / this      | Mutating, partial change   |
| `append`                      | Add to end                 | void / this      | Mutating                   |
| `prepend`                     | Add to beginning           | void / this      | Mutating                   |
| `insert`                      | Add at position            | void / this      | Mutating                   |
| `remove`                      | Delete by key/value        | void / this      | Mutating                   |
| `delete`                      | Remove by key              | void / this      | Mutating                   |
| `clear`                       | Remove all                 | void             | Mutating                   |
| **Transformers**              |                            |                  |                            |
| `to`                          | Convert to another type    | new type         | Pure, returns new instance |
| `as`                          | Represent as another view  | new type         | Pure                       |
| `map`                         | Apply transformation       | new instance     | Pure                       |
| `filter`                      | Select subset              | new instance     | Pure                       |
| `clone`                       | Copy (deep or shallow)     | new instance     | Pure                       |
| **Constructors**              |                            |                  |                            |
| `from`                        | Build from another type    | instance         | Static/factory only        |
| `of`                          | Construct from list/args   | instance         | Static/factory only        |
| `create`                      | Generic factory            | instance         | Factory function           |
| **Commands**                  |                            |                  |                            |
| `run`                         | Execute a process          | result           | May be async or sync       |
| `exec`                        | Lower-level execution      | result           | Often system-level         |
| `apply`                       | Apply configuration/effect | result           | Pure or impure             |
| `compute`                     | Derive a value             | any              | Pure                       |
| `validate`                    | Check correctness          | boolean / result | Pure or impure             |
| `check`                       | Verify validity            | boolean          | Pure                       |
| `report`                      | Report validation state    | void             | May have side effects      |
| **Lifecycle**                 |                            |                  |                            |
| `init`                        | Initialize internal state  | void / this      | Idempotent preferred       |
| `load`                        | Load external data         | any              | Often async                |
| `save`                        | Persist state              | void             | Often async                |
| `reset`                       | Restore baseline           | void             | Mutating                   |
| `close`                       | Close connection/resource  | void             | Finalizing                 |
| `destroy`                     | Tear down resources        | void             | Finalizing, required       |
| **Relationship / Navigation** |                            |                  |                            |
| `in`                          | Membership check           | boolean          | Pure                       |
| `for`                         | Lookup by purpose          | any              | Pure                       |
| `with`                        | Combine/augment            | new instance     | Pure                       |
| `on`                          | Event subscription         | unsubscribe fn   | Event binding              |
| `using`                       | Apply context              | new instance     | Pure                       |
| **Async / Concurrency**       |                            |                  |                            |
| `waitFor`                     | Await a condition          | Promise          | Async only                 |
| `schedule`                    | Queue for later            | void             | Async scheduling           |
| `queue`                       | Add to async queue         | void             | Mutating queue             |
| `ensure`                      | Guarantee a state          | Promise          | Async                      |

### Type and Class Naming Convention

Use suffixes to distinguish between interfaces, abstract classes, and implementations:

| Type           | Suffix      | Example                   | File Location        |
|----------------|-------------|---------------------------|----------------------|
| Interface      | `Interface` | `SessionManagerInterface` | `src/types.ts`       |
| Abstract Class | `Abstract`  | `SessionManagerAbstract`  | `src/abstracts.ts`   |
| Implementation | (none)      | `SessionManager`          | `src/core/[domain]/` |

**Rationale:**
- Clear distinction when importing:  `import type { SessionManagerInterface } from './types.js'`
- No naming conflicts between interface, abstract, and implementation
- Implementation class uses the "clean" name since it's what consumers instantiate

#### When to Use the `Interface` Suffix

**CRITICAL:** In `src/types.ts`, apply the `Interface` suffix to interfaces that define **behavioral contracts** (have methods that will be implemented by a class). Use this decision tree:

1. **Does the interface have methods?**
   - NO â†’ Pure data interface, **no suffix needed** (e.g., `Vector2`, `Rectangle`, `EngineState`)
   - YES â†’ Continue to step 2

2. **Does the interface name end with `Subscriptions`?**
   - YES â†’ Hook definition interface, **no suffix needed** (e.g., `EngineSubscriptions`, `SceneSubscriptions`)
   - NO â†’ Continue to step 3

3. **Does the interface name end with `Options`?**
   - YES â†’ Configuration interface (may have optional hook methods from `SubscriptionToHook<T>`), **no suffix needed**
   - NO â†’ **Add `Interface` suffix** (e.g., `EngineInterface`, `SceneInterface`, `AudioManagerInterface`)

**Summary Table:**

| Interface Type                       | Has Methods?    | Suffix      | Examples                                               |
|--------------------------------------|-----------------|-------------|--------------------------------------------------------|
| Pure data                            | No              | None        | `Vector2`, `Rectangle`, `EngineState`, `AssetState`    |
| Subscriptions (hooks)                | Yes (callbacks) | None        | `EngineSubscriptions`, `SceneSubscriptions`            |
| Options (config)                     | Maybe (hooks)   | None        | `EngineOptions`, `SceneOptions`                        |
| Behavioral (implementation contract) | Yes             | `Interface` | `EngineInterface`, `SceneInterface`, `CameraInterface` |

**Quick Check:** If an interface is returned by a factory function in `src/factories.ts`, it MUST have the `Interface` suffix.

**Examples:**

```typescript
// src/types.ts
export interface SessionManagerInterface {
	readonly userId: string
	createSession(tenantId?:  string): SessionInterface
	destroy(): void
}

export interface SessionInterface {
	readonly id: string
	readonly userId: string
	readonly tenantId?: string
}

// src/abstracts.ts
import type { SessionManagerInterface, SessionInterface } from './types.js'

export abstract class SessionManagerAbstract implements SessionManagerInterface {
	abstract readonly userId: string
	abstract createSession(tenantId?: string): SessionInterface
	
	protected computeSessionKey(tenantId?:  string): string {
		return `session-${tenantId ??  'default'}-${this.userId}`
	}
	
	destroy(): void {
		// Base cleanup logic
	}
}

// src/core/session/SessionManager.ts
import { SessionManagerAbstract } from '../../abstracts.js'
import type { SessionInterface } from '../../types.js'

export class SessionManager extends SessionManagerAbstract {
	readonly userId: string
	
	constructor(userId: string) {
		super()
		this.userId = userId
	}
	
	createSession(tenantId?: string): SessionInterface {
		const key = this.computeSessionKey(tenantId)
		return { id: key, userId: this.userId, tenantId }
	}
}

// src/factory.ts
import type { SessionManagerInterface } from './types.js'
import { SessionManager } from './core/session/SessionManager.js'

export function createSessionManager(userId: string): SessionManagerInterface {
	return new SessionManager(userId)
}
```

### Naming Contract Rules

1. **Structure**: `<prefix><DomainNoun><Qualifier? >`
   - âœ… `getReadyState`, `setVolume`, `isConnected`
   - âŒ `get_state`, `volume`, `connected`

2. **Concrete nouns**: Domain nouns must be explicit
   - âœ… `getBufferedAmount`, `setDropEffect`
   - âŒ `getData`, `setEffect`

3. **Boolean methods**: Must use `is` or `has`
   - âœ… `isOpen()`, `hasPermission()`
   - âŒ `open()`, `checkPermission()`

4. **No abbreviations**: Spell out names fully
   - **Exceptions**: ID, URL, API, HTML, DOM, CSS, ARIA, JSON, XML, SSE, RTT, HTTP, CRUD, CSV, UUID, PWA
   - âœ… `getReadyState`, `setDropEffect`, `associateName`
   - âŒ `getRdyState`, `setDropEff`, `assocName`

5. **One prefix only**: No compound prefixes
   - âœ… `getValue()` + `setValue()`
   - âŒ `getOrSetValue()`

6. **Event subscriptions**: Use `on` prefix, return cleanup function
   - âœ… `onMessage(callback): () => void`
   - âŒ `addMessageListener(callback)`

7. **Length limits**:
   - Public methods: 1â€“2 words maximum
   - Private methods: 2â€“3 words allowed
   - Single-letter variables: Only in tiny, obvious scopes

8. **Function variants**: Use separate named functions, not string parameters
   - âœ… `addRowBody()`, `addRowHead()`, `addRowFoot()`
   - âŒ `addRow(section:  'body' | 'head' | 'foot')`

9. **Type suffixes**: Use `Interface` for interfaces, `Abstract` for abstract classes
   - âœ… `BuffSystemInterface`, `BuffSystemAbstract`, `BuffSystem`
   - âŒ `IBuffSystem`, `AbstractBuffSystem`, `BuffSystemImpl`

### Qualifier Vocabulary

| Qualifier   | Meaning              | Example              |
|-------------|----------------------|----------------------|
| `ById`      | Lookup by identifier | `getItemById(id)`    |
| `ByKey`     | Lookup by key        | `getValueByKey(key)` |
| `ByIndex`   | Access by position   | `getEntryByIndex(0)` |
| `FromCache` | Use cached source    | `loadFromCache()`    |
| `IfExists`  | Conditional behavior | `deleteIfExists()`   |
| `OrThrow`   | Throw on failure     | `getOrThrow()`       |
| `OrDefault` | Fallback value       | `getOrDefault()`     |

### Anti-Patterns to Avoid

âŒ **Avoid:**
```typescript
// Mixed concerns
getOrSetValue()

// Unclear intent
data()
value()

// Abbreviated
getRdySt()
setVal()
assocName()

// Non-boolean returning boolean
checkActive()  // Use isActive()

// Wrong type naming conventions
IBuffSystem      // Use BuffSystemInterface
AbstractBuffSystem  // Use BuffSystemAbstract
BuffSystemImpl   // Use BuffSystem (no suffix for implementation)
```

âœ… **Prefer:**
```typescript
// Clear, single-purpose
getValue()
setValue()
getReadyState()
associateName()

// Boolean clarity
isOpen()
isConnected()
hasPermission()

// Full words
getBufferedAmount()
setDropEffect()

// Correct type naming
BuffSystemInterface  // Interface in types.ts
BuffSystemAbstract   // Abstract class in abstracts.ts
BuffSystem           // Implementation in core/
```

---

## Method Organization Pattern

**Always organize instance methods in this order:**

1. **Property Accessors** (`get`, `is`, `has`)
2. **Property Mutators** (`set`, `update`)
3. **Actions/Manipulation** (`append`, `remove`, `send`, `load`)
4. **Event Subscriptions** (`on*` returning cleanup)
5. **Lifecycle** (`init`, `close`, `destroy`)

### Example

```typescript
class Example {
	// 1. Property Accessors
	getValue(): string { }
	isActive(): boolean { }
	hasPermission(): boolean { }

	// 2. Property Mutators
	setValue(value: string): void { }
	updateConfig(partial: Partial<Config>): void { }

	// 3. Actions
	send(data: string): void { }
	load(): Promise<void> { }
	save(): Promise<void> { }

	// 4. Event Subscriptions
	onChange(callback: (value: string) => void): () => void { }
	onError(callback: (error: Error) => void): () => void { }

	// 5. Lifecycle
	close(): void { }
	destroy(): void { }
}
```

---

## Encapsulation Standards

- Use `#` private fields (runtime-enforced), not `private` keyword
- Expose via getters/setters only if truly needed
- Keep public surface minimal
- No top-level mutable state

```typescript
class Counter {
	#count = 0

	getCount(): number {
		return this.#count
	}

	increment(): void {
		this.#count++
	}
}
```

---

## Environment Portability

### Runtime Neutrality (Isomorphic Design)

- Library modules should not import platform-specific APIs by default
- Prefer Web Platform APIs or small abstractions
- If platform-specific features are needed, define interfaces and accept implementation from callers
- Provide platform-only implementations in dedicated files (e.g., `src/cli.ts`, `src/browser.ts`)
- Avoid side effects at import time

### Isolation Pattern

**Browser-only code:**
- Isolate in dedicated modules or behind capability checks
- Example: `src/dom/`, `src/browser.ts`, `client/`, `game/`, `docs/`, `showcase/`

**Node-only code:**
- Restrict to `src/cli.ts`, `src/node/`, `server/`, `scripts/`, or test scaffolding
- Example: file system operations, CLI commands, build scripts

**Shared code:**
- Must run in both browser and Node without shims
- Example: validation, parsing, transformation logic
- Place in `src/`, `shared/`, or dedicated utility modules

### CSS and Styling

**Rules:**
- All styles in external `.css` or `.scss` files (e.g., `styles.css`, `styles.scss`)
- Import CSS in main entry point:  `import './styles.css'` or `import './styles.scss'`
- No inline styles in HTML files
- No CSS-in-JS or template literals with CSS
- Use class names, not inline `style` attributes (except for dynamic values)

```typescript
// âœ… Correct:  External CSS + class names
import './styles.css'

const element = document.createElement('div')
element.className = 'demo-section'

// âœ… OK: Dynamic style values only
element.style.color = isSuccess ? '#48bb78' : '#f56565'

// âŒ Avoid: Inline styles for static properties
element.style.padding = '1rem'
element.style.background = '#f8f9fa'
```

---

## Repository Layout

### Required Structure

```
project/
â”œâ”€â”€ src/                  # Library source OR shared code
â”‚   â”œâ”€â”€ index.ts          # Barrel exports only (no logic)
â”‚   â”œâ”€â”€ types.ts          # Centralized exported types/interfaces (SOURCE OF TRUTH)
â”‚   â”œâ”€â”€ abstracts.ts      # Abstract classes implementing interfaces
â”‚   â”œâ”€â”€ helpers.ts        # Centralized shared helpers/utilities
â”‚   â”œâ”€â”€ constants.ts      # Immutable shared constants
â”‚   â”œâ”€â”€ factories.ts        # Factory functions for creating instances
â”‚   â”œâ”€â”€ core/             # Implementation classes
â”‚   â”‚   â””â”€â”€ [domain]/     # Domain-specific implementations
â”‚   â”‚       â””â”€â”€ *.ts      # Concrete classes extending abstracts
â”‚   â””â”€â”€ ...               # Other feature modules
â”œâ”€â”€ tests/
â”‚   â”œâ”€â”€ setup.ts          # Test utilities, factories, polyfills
â”‚   â”œâ”€â”€ helpers.test.ts   # Tests for helpers.ts
â”‚   â”œâ”€â”€ core/             # Tests mirroring src/core/ structure
â”‚   â”‚   â””â”€â”€ [domain]/
â”‚   â”‚       â””â”€â”€ *.test.ts
â”‚   â””â”€â”€ integration/      # Integration tests for sandbox implementations
â”‚       â””â”€â”€ *.test.ts
â”œâ”€â”€ guides/               # Feature documentation
â”‚   â””â”€â”€ [feature].md
â”œâ”€â”€ configs/              # Build configurations (tsconfig.build.json, vite configs)
â”œâ”€â”€ .editorconfig
â”œâ”€â”€ .gitignore
â”œâ”€â”€ eslint.config.ts
â”œâ”€â”€ LICENSE
â”œâ”€â”€ package.json
â”œâ”€â”€ README.md
â”œâ”€â”€ tsconfig.json
â”œâ”€â”€ vite.config.ts
â””â”€â”€ vitest.config.ts
```

### Optional/Contextual Folders

| Folder      | Purpose                                   | When to Create                     |
|-------------|-------------------------------------------|------------------------------------|
| `ideas.md`  | Single-file phased implementation tracker | For planning and tracking          |
| `guides/`   | Feature documentation                     | For completed features             |
| `plan/`     | Phased implementation plans               | For complex projects               |
| `examples/` | Usage examples and fixtures               | Sandbox for testing implementation |
| `docs/`     | Documentation site                        | Sandbox for library demos          |
| `game/`     | Game-specific code                        | Sandbox for game projects          |
| `showcase/` | Library demo/examples                     | Sandbox for NPM packages           |
| `client/`   | Browser-only Vue/React app                | For client-side applications       |
| `server/`   | Node.js server code                       | For server-side applications       |
| `output/`   | Generated artifacts                       | For CLI/build outputs              |
| `dist/`     | Build output                              | Generated, not committed           |
| `configs/`  | Isolated configuration files              | For multi-config projects          |
| `scripts/`  | Build automation and tooling              | For build scripts                  |

**Rules:**
- Do not create optional folders unless requested
- Adapt to what is present in the repository
- Do not add CI workflows in repos that explicitly avoid them

### Sandbox Folders (examples/, docs/, game/, showcase/)

These folders serve as **integration playgrounds** where `src/` implementation is assembled into real-world scenarios. 

**Purpose:**
- Test library APIs in realistic use cases
- Provide interactive demos
- Generate single-file HTML artifacts for review
- Serve as integration test reference
- **Demonstrate ALL features from `src/`**

**Common patterns:**
- Import library via alias (e.g., `import { x } from '~/src'`)
- Build single-file HTML with `vite-plugin-singlefile`
- Store built artifact in root (e.g., `showcase.html`) for download/review
- Keep HTML minimal â€” create DOM elements dynamically in JavaScript
- External CSS in `styles.css` or `styles.scss`, import in main.ts

**Sandbox vite config pattern:**
```typescript
// configs/vite.showcase.config.ts
import { defineConfig } from 'vite'
import { resolve } from 'path'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
	plugins: [viteSingleFile()],
	root: 'showcase',
	publicDir: false,
	build: {
		outDir: '../dist/showcase',
		emptyOutDir: true,
	},
	resolve: {
		alias: {
			'~/src': resolve(__dirname, '../src'),
		},
	},
})
```

### Barrel Export Pattern

Update `src/index.ts` whenever the public API changes:

```typescript
// src/index.ts
export * from './factory.js'
export * from './helpers.js'
export * from './constants.js'
export type * from './types.js'
```

**CRITICAL:** Use `export *` patternâ€”**do NOT curate exports**. Everything exported from any module is for public consumption.  Let developers decide what to import and use.  Export all implementation files except test files.

**Note:** Do NOT export from `abstracts.ts` in the barrel â€” abstract classes are internal implementation details.  Consumers use factory functions to create instances.

---

## File Organization Patterns

### Centralized Types (SOURCE OF TRUTH)

**CRITICAL:** `src/types.ts` is the **single source of truth** for public-facing types and interfaces.

**Purpose:**
- Define all exported types and interfaces
- Serve as API contract for consumers
- Enable centralized refactoring via `npm run check`
- Document expected shapes before implementation

**Workflow:**
1. **Start with types**:  Define interfaces in `src/types.ts` first
2. **Implement based on types**: Write code to satisfy the type contracts
3. **Run `npm run check`**: Find all locations where types need updating
4. **Refactor accordingly**: Update implementation to match types

Place all exported types in `src/types.ts` or `src/types/index.ts`:

```typescript
// src/types.ts

// Foundational types
export type Unsubscribe = () => void

export interface Vector2Interface {
	readonly x: number
	readonly y: number
}

export interface IdentifiableInterface {
	readonly id: string
}

export interface TimestampedInterface {
	readonly timestamp: number
}

export interface ResultInterface<T = void> {
	readonly ok: boolean
	readonly value?: T
	readonly error?: string
}

// Domain types with Interface suffix
export interface UserOptionsInterface {
	readonly name: string
	readonly age?:  number
}

export interface ValidationResultInterface extends ResultInterface {
	readonly errors: readonly string[]
}

// Internal types can live with implementation or in src/types/ subfolder
```

### Centralized Abstract Classes

Place abstract classes in `src/abstracts.ts`:

```typescript
// src/abstracts.ts
import type { SessionManagerInterface, SessionInterface } from './types.js'

export abstract class SessionManagerAbstract implements SessionManagerInterface {
	abstract readonly userId: string
	
	abstract createSession(tenantId?: string): SessionInterface
	
	protected computeSessionKey(tenantId?: string): string {
		return `session-${tenantId ??  'default'}-${this.userId}`
	}
	
	destroy(): void {
		// Base cleanup logic â€” subclasses may override
	}
}
```

### Centralized Helpers

Place shared utility functions in `src/helpers.ts`:

```typescript
// src/helpers.ts
export function isNonEmptyString(value: unknown): value is string {
	return typeof value === 'string' && value.length > 0
}
```

### Centralized Constants

Place immutable constants in `src/constants.ts`:

```typescript
// src/constants.ts
export const DEFAULT_TIMEOUT = 5000 as const
export const MAX_RETRIES = 3 as const
```

### Centralized Factory Functions

Place factory functions that create system instances in `src/factories.ts`:

```typescript
// src/factories.ts
import type { BuffSystemInterface, BuffSystemOptionsInterface } from './types.js'
import { BuffSystem } from './core/buff/BuffSystem.js'

/**
 * Factory functions follow the pattern:  create<SystemName>
 * They accept an options object and return a system interface. 
 */
export function createBuffSystem<TType extends string>(
	options: BuffSystemOptionsInterface<TType>
): BuffSystemInterface<TType> {
	return new BuffSystem(options)
}
```

**Rules for factory.ts:**
- Use `create` prefix for all factory functions
- Accept options object matching `*OptionsInterface` type from types.ts
- Return interface type (`*Interface`), not implementation class
- Use generics to preserve type parameters
- Document with TSDoc including `@param` for options and `@returns`

**Implementation Class Naming Convention:**
- Implementation classes have NO prefix or suffix (e.g., `BuffSystem`, `SessionManager`)
- Abstract classes use `Abstract` suffix (e.g., `BuffSystemAbstract`, `SessionManagerAbstract`)
- Interfaces use `Interface` suffix (e.g., `BuffSystemInterface`, `SessionManagerInterface`)
- Factory function imports the implementation class and returns the interface type
- This keeps imports unambiguous and the public API clean

```typescript
// src/types.ts
export interface BuffSystemInterface<TType extends string> {
	// ...  interface definition
}

// src/abstracts.ts
export abstract class BuffSystemAbstract<TType extends string> implements BuffSystemInterface<TType> {
	// ...abstract class definition
}

// src/core/buff/BuffSystem.ts
export class BuffSystem<TType extends string> extends BuffSystemAbstract<TType> {
	// Implementation... 
}

// src/factories.ts
import type { BuffSystemInterface } from './types.js'
import { BuffSystem } from './core/buff/BuffSystem.js'

export function createBuffSystem<TType extends string>(
	options: BuffSystemOptionsInterface<TType>
): BuffSystemInterface<TType> {
	return new BuffSystem(options)
}
```

---

## Development Workflow

### Types-First Development Flow

**Phase 1: Types (src/types.ts)**
1. Define all foundational types and interfaces in `src/types.ts`
2. Use `Interface` suffix for all interfaces (e.g., `SessionManagerInterface`)
3. For stateful systems, use System Hooks Pattern: 
   - Define `*StateInterface` interface (readonly snapshot)
   - Define `*HooksInterface` interface (event subscription methods returning `Unsubscribe`)
   - Define `*OptionsInterface` interface extending `Partial<*HooksInterface>`
4. Document expected behavior in TSDoc
5. Run `npm run check` to validate types compile

**Phase 2: Abstract Classes (src/abstracts.ts)**
1. Create abstract classes that `implement` the interfaces from Phase 1
2. Use `Abstract` suffix for all abstract classes (e.g., `SessionManagerAbstract`)
3. Define abstract methods for all required subclass behavior
4. Implement shared concrete methods that use protected fields
5. Protected fields become contracts â€” subclasses must use them
6. Run `npm run check` to validate abstract classes compile

**Phase 3: Implementation (src/core/[domain]/)**
1. Create concrete classes that `extend` abstract classes from Phase 2
2. Use clean names with NO suffix (e.g., `SessionManager`)
3. Implement all abstract methods
4. Wire up all protected fields from abstract class
5. Extract internal types to `src/types.ts`
6. Extract internal helpers to `src/helpers.ts`
7. Extract internal constants to `src/constants.ts`
8. Run `npm run check` frequently to catch type mismatches
9. Run `npm run format` to enforce code style

**Phase 4: Factory Functions (src/factories.ts)**
1. Create factory functions for each system/class
2. Factory accepts `*OptionsInterface` interface, returns `*Interface`
3. Hide implementation class behind factory
4. Update barrel exports in `src/index.ts`

**Phase 5: Unit Tests (tests/)**
1. Mirror `src/` structure in `tests/`
2. Write comprehensive unit tests for `helpers.ts` first
3. Write comprehensive unit tests for core implementations
4. Cover: 
   - Happy path
   - Edge cases
   - Error conditions
   - All public API methods
5. Use factories from `tests/setup.ts` for test data
6. Run `npm test` and refactor until all pass
7. Run `npm run check` and `npm run format` again

**Phase 6: Documentation (guides/, README.md)**
1. Create/update guide documents for each major feature
2. Update `README.md` with: 
   - Installation instructions
   - Quick start example
   - API overview
   - Link to guides
3. Ensure all public exports have TSDoc with examples

**Phase 7: Sandbox Integration (examples/, docs/, game/, showcase/)**
1. Create sandbox implementation using ALL features from `src/`
2. Build real-world scenarios demonstrating the library
3. Reference guide documentation for each feature used
4. Run `npm run check` to validate integration
5. Run `npm run dev` to test interactively
6. Run `npm run show` to generate single-file HTML artifact

**Phase 8: Integration Tests (tests/integration/)**
1. Write integration tests based on sandbox implementations
2. Test real-world usage patterns end-to-end
3. Run `npm test` to validate all tests pass
4. Run `npm run check` and `npm run format` one final time

**Phase 9: Review and Commit**
1. Review generated HTML artifact (e.g., `docs.html`, `game.html`, `showcase.html`)
2. Verify all features from `src/` are demonstrated in sandbox
3. Verify guides reference all demonstrated features
4. Commit artifact to repository for download/review
5. Ensure all quality gates pass

### File Creation Order

```
1.src/types.ts          â† Interfaces with Interface suffix (SOURCE OF TRUTH)
2.src/abstracts.ts      â† Abstract classes with Abstract suffix
3.src/core/[domain]/    â† Concrete implementations (clean names, no suffix)
4.src/helpers.ts        â† Extracted utility functions
5.src/constants.ts      â† Extracted immutable values
6.src/factories.ts        â† Factory functions
7.src/index.ts          â† Barrel exports (update)
8.tests/helpers.test.ts â† Helper unit tests
9.tests/core/[domain]/  â† Implementation unit tests
10.guides/[feature].md  â† Feature documentation
11. README.md            â† Update with new features
12. [sandbox]/main.ts    â† Sandbox integration
13.tests/integration/   â† Integration tests
```

### Extraction Rules

During Phase 3, extract to centralized files:

| What to Extract           | Destination        | Criteria                                                  |
|---------------------------|--------------------|-----------------------------------------------------------|
| Internal interfaces/types | `src/types.ts`     | Any type used across multiple files OR part of public API |
| Internal helper functions | `src/helpers.ts`   | Pure functions, type guards, utilities                    |
| Internal constants        | `src/constants.ts` | Immutable values, configuration defaults                  |
| Factory functions         | `src/factories.ts` | Functions that create system instances                    |

**Extraction Process:**
1. Identify candidate for extraction
2. Move to appropriate file
3. Add export statement
4. Update imports in original file
5. Run `npm run check` to verify
6. Add/update tests for extracted code

---

## Symbol Preservation Protocol

### Problem

LLMs may remove, collapse, or "optimize away" symbols that appear unused but serve future or indirect purposes. This happens due to:
- Context window limitations causing loss of original intent
- Optimization bias toward "clean" code that satisfies linters
- Static analysis patterns that flag unused symbols

**This is unacceptable behavior. ** Unused parameters, fields, and methods were created for a reason.  The correct response is to **implement them**, not delete them.

### Core Principle

**NEVER remove a symbol to satisfy a linter or reduce warnings.**

When encountering an unused symbol: 
1. **STOP** â€” Do not remove it
2. **THINK** â€” Why was this created? What was the original intent?
3. **SEARCH** â€” Check `types.ts`, `abstracts.ts`, and related interfaces for context
4. **IMPLEMENT** â€” Wire up the symbol to fulfill its purpose
5. **ANNOTATE** â€” If implementation is blocked, add `@copilot.keep` annotation

### Layered Protection Strategy

#### Layer 1: Type System Enforcement (Structural)

Use TypeScript's type system to make removal impossible: 

```typescript
// src/types.ts â€” Interface fields CANNOT be removed from implementations
export interface SessionStateInterface {
	readonly userId: string
	readonly tenantId?:  string  // Implementations MUST include this
	readonly replayBuffer?:  readonly string[]  // Implementations MUST include this
}

// src/abstracts.ts â€” Abstract methods CANNOT be removed
export abstract class BaseTransportAbstract {
	abstract sendPacket(packet: PacketInterface): void  // Subclasses MUST implement this
}
```

#### Layer 2: Abstract Class Contracts

Abstract classes bridge interfaces and implementations, enforcing method signatures:

```typescript
// src/abstracts.ts
export abstract class SessionManagerAbstract implements SessionManagerInterface {
	// Protected field â€” subclasses inherit and MUST use
	protected readonly tenantId?:  string

	// Abstract method â€” subclasses MUST implement
	abstract createSession(userId: string, tenantId?: string): SessionInterface

	// Concrete method using protected field
	protected computeSessionKey(userId: string): string {
		const tenant = this.tenantId ??  'default'
		return `session-${tenant}-${userId}`
	}
}
```

#### Layer 3: `@copilot.keep` Annotation (Edge Cases)

Use when Layers 1-2 cannot protect the symbol:

```typescript
/// @copilot.keep
/// @copilot.reason "Parameter reserved for multi-tenant auth expansion"
/// @copilot.status "pending-implementation"
createSession(userId: string, tenantId?:  string): SessionInterface {
	// TODO: Implement tenantId handling when multi-tenant feature is active
	return { id: crypto.randomUUID(), userId }
}
```

### Annotation Format

```typescript
/// @copilot.keep
/// @copilot.reason "Human-readable explanation of purpose"
/// @copilot.status "pending-implementation" | "internal-api" | "reserved" | "future-feature"
```

#### Required Directives

| Directive       | Purpose                                                                   |
|-----------------|---------------------------------------------------------------------------|
| `@copilot.keep` | Marks symbol as protected from removal, renaming, collapsing, or inlining |

#### Optional Directives

| Directive                | Purpose                        |
|--------------------------|--------------------------------|
| `@copilot.reason "text"` | Explains why the symbol exists |
| `@copilot.status "text"` | Indicates lifecycle state      |

#### Allowed Status Values

- `"pending-implementation"` â€” Will be implemented when feature is active
- `"internal-api"` â€” Used indirectly or dynamically
- `"reserved"` â€” Reserved for future use
- `"future-feature"` â€” Part of upcoming feature
- `"must-be-implemented"` â€” Required by architecture, not yet complete

### Placement Rules

- Annotation block must appear immediately above the symbol
- No blank lines between annotation and symbol
- Annotation applies only to the next symbol
- Do not merge annotations across multiple symbols

### LLM Behavior Requirements (CRITICAL)

#### When Encountering Unused Symbols

1. **DO NOT** remove the symbol to fix linter warnings
2. **DO NOT** delete parameters, fields, or methods that appear unused
3. **DO** search for the symbol's purpose in: 
   - `types.ts` â€” Check interface definitions
   - `abstracts.ts` â€” Check abstract class contracts
   - `ideas.md` or `plan/` â€” Check implementation plans
   - Git history â€” Check original commit message
4. **DO** implement the symbol if its purpose is clear
5. **DO** add `@copilot.keep` annotation if implementation is blocked

#### When Encountering `@copilot.keep` Annotations

1. **NEVER** remove the annotated symbol
2. **NEVER** remove or modify the annotation itself
3. **NEVER** inline, collapse, or "optimize away" the symbol
4. **PRESERVE** the signature shape exactly
5. **CHECK** if the symbol should now be implemented (if status is `pending-implementation`)
6. **IMPLEMENT** the symbol when its feature becomes active, then remove the annotation

#### When Creating New Symbols for Future Use

1. **DO** define the type/interface in `types.ts` first
2. **DO** add abstract method to `abstracts.ts` if applicable
3. **DO** add `@copilot.keep` annotation with reason and status
4. **DO** leave TODO comment explaining what triggers implementation

### Decision Tree:  Unused Symbol Encountered

```
Unused symbol detected
â”‚
â”œâ”€ Is it defined in types.ts or abstracts.ts? 
â”‚  â”œâ”€ YES â†’ Implement it (the interface/abstract requires it)
â”‚  â””â”€ NO â†’ Continue
â”‚
â”œâ”€ Does it have @copilot.keep annotation?
â”‚  â”œâ”€ YES â†’ Preserve it, check if ready to implement
â”‚  â””â”€ NO â†’ Continue
â”‚
â”œâ”€ Can you determine original intent from context?
â”‚  â”œâ”€ YES â†’ Implement it
â”‚  â””â”€ NO â†’ Continue
â”‚
â”œâ”€ Is this a parameter, field, or method you created earlier in this session?
â”‚  â”œâ”€ YES â†’ You had a reason; find it and implement it
â”‚  â””â”€ NO â†’ Continue
â”‚
â””â”€ After exhausting all options: 
   â”œâ”€ Add @copilot.keep annotation with your best guess at intent
   â””â”€ Leave TODO comment asking for clarification
```

### Examples

#### Unused Parameter â€” Implement, Don't Delete

```typescript
// âŒ WRONG: Removing parameter to satisfy linter
createSession(userId: string): SessionInterface {
	return { id: crypto.randomUUID(), userId }
}

// âœ… CORRECT: Implement the parameter
createSession(userId: string, tenantId?: string): SessionInterface {
	const tenant = tenantId ?? this.defaultTenantId
	return { id:  crypto.randomUUID(), userId, tenantId: tenant }
}

// âœ… ALSO CORRECT: Annotate if implementation is blocked
/// @copilot.keep
/// @copilot.reason "Parameter reserved for multi-tenant auth expansion"
/// @copilot.status "pending-implementation"
createSession(userId: string, tenantId?: string): SessionInterface {
	// TODO:  Implement tenantId when multi-tenant feature ships
	return { id: crypto.randomUUID(), userId }
}
```

#### Unused Private Field â€” Implement, Don't Delete

```typescript
// âŒ WRONG:  Removing field to satisfy linter
class SessionManager extends SessionManagerAbstract {
	#userId: string

	constructor(userId:  string) {
		super()
		this.#userId = userId
	}
}

// âœ… CORRECT:  Use the field
class SessionManager extends SessionManagerAbstract {
	#userId: string
	#tenantId?: string

	constructor(userId: string, tenantId?: string) {
		super()
		this.#userId = userId
		this.#tenantId = tenantId
	}

	getSessionKey(): string {
		return `${this.#tenantId ??  'default'}-${this.#userId}`
	}
}
```

#### Dynamic Dispatch Helper â€” Annotate for Protection

```typescript
/// @copilot.keep
/// @copilot.reason "Used by dynamic event dispatch via string interpolation"
/// @copilot.status "internal-api"
#resolveHandlerName(event: string): string {
	const first = event[0]
	if (first === undefined) return 'onUnknown'
	return `on${first.toUpperCase()}${event.slice(1)}`
}
```

---

## TSDoc and Documentation

### Policy

| Target                                | Requirement                                                                       |
|---------------------------------------|-----------------------------------------------------------------------------------|
| **Public exported classes/functions** | Full TSDoc:  description, `@param`, `@returns`, `@example`, `@remarks` if helpful |
| **Simple getters/setters**            | Concise description and `@returns`; no `@example`                                 |
| **Private methods, non-exported**     | Single-line description comment only                                              |
| **Overload signatures**               | Single-line description comment only                                              |
| **Types and interfaces**              | Concise single-line comments                                                      |

### Full TSDoc Example

`````typescript
/**
 * Validates an object against a shape of property guards.
 *
 * @param props - Mapping of property names to guard functions
 * @param options - Optional configuration
 * @remarks
 * Properties on `options`:
 * - `optional` â€” readonly array of keys that may be missing
 * - `exact` â€” boolean; when true, additional keys are disallowed
 * @returns A guard function that validates objects matching `props`
 * @example
 * ```ts
 * const isUser = objectOf({ name: isString, age: isNumber })
 * isUser({ name: 'Alice', age: 30 }) // true
 * isUser({ name: 'Bob' }) // false
 * ```
 */
export function objectOf<T>(
	props:  { readonly [K in keyof T]: Guard<T[K]> },
	options?: ObjectOptionsInterface
): Guard<T> {
	// Implementation
}
`````

### Options Object Documentation

TSDoc does not support dotted `@param` names. Use `@remarks` to list fields:

```typescript
/**
 * Create a retry wrapper
 *
 * @param fn - Function to wrap
 * @param options - Retry configuration
 * @remarks
 * Properties on `options`:
 * - `maxRetries` â€” Maximum number of retry attempts
 * - `delay` â€” Milliseconds between retries
 * - `backoff` â€” Exponential backoff multiplier
 * @returns Wrapped function with retry logic
 */
```

### Rules

- Do not include type annotations in JSDoc; rely on TypeScript types
- Avoid inline object types in parameter positions for exported functions
- Keep examples copy-pasteable
- Use `ts` fences for code examples
- Avoid leaking secrets or large payloads in previews

---

## Testing Conventions

### Structure

- **Mirror source**:  `tests/[file].test.ts` for every `src/[file].ts`
- **Integration tests**: `tests/integration/[feature].test.ts` for sandbox scenarios
- One top-level `describe()` per file
- Nested `describe()` per function/feature
- Use **Vitest with Playwright** for browser testing (not jsdom or happy-dom)

### Principles

- **Deterministic**: Same inputs â†’ same outputs
- **Fast**: Short timers (10â€“50ms), avoid network calls
- **No mocks in core libraries**: Use real values and small scenarios
- **Cover edge cases**: Happy path + key edge cases
- **Test public API**: Not internal implementation details
- **Browser testing**: Use Playwright for DOM/Canvas/WebAPI tests

### Vitest + Playwright Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
	test: {
		include: ['tests/**/*.test.ts'],
		browser: {
			enabled: true,
			provider: playwright(),
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
})
```

**CRITICAL:** For browser-based applications, **always** use Playwright browser testing.  No jsdom or happy-dom.

### Test Pattern

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { myFunction } from '../src/module.js'

describe('module', () => {
	describe('myFunction', () => {
		it('handles expected input', () => {
			expect(myFunction('input')).toBe('expected')
		})

		it('returns false for invalid input', () => {
			expect(myFunction(null as unknown)).toBe(false)
		})

		it('handles edge case', () => {
			expect(myFunction('')).toBe('')
		})
	})
})
```

### Test Placeholder Policy

- **Never skip tests or create placeholder tests that pass**
- Use `it.todo('descriptive test case')` for unimplemented tests
- When implementing logic, convert todos to real tests
- Search for remaining `it.todo()` before completing a feature

### Test Utilities and Factories

Create reusable test utilities in `tests/setup.ts`:

```typescript
// tests/setup.ts
export function createMockElement(): HTMLElement {
	const el = document.createElement('div')
	el.id = 'test'
	return el
}

export function delay(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms))
}

// Deep merge helper for factories
function deepMerge<T>(base: T, overrides: DeepPartial<T>): T { /* ... */ }

// Factory pattern
export function createMockUser(overrides?:  DeepPartial<UserInterface>): UserInterface {
	const base:  UserInterface = {
		id: crypto.randomUUID(),
		name: 'Test User',
		email: 'test@example.com'
	}
	return deepMerge(base, overrides ??  {})
}
```

---

## API Design Patterns

### Result Pattern (for Fallible Operations)

```typescript
type ResultInterface<T, E = Error> =
	| { readonly ok: true; readonly value: T }
	| { readonly ok: false; readonly error: E }

function divide(a: number, b: number): ResultInterface<number> {
	if (b === 0) {
		return { ok: false, error:  new Error('Division by zero') }
	}
	return { ok: true, value: a / b }
}
```

### Error and Diagnostics Typing

Define stable, structured error metadata:

```typescript
interface ValidationErrorInterface {
	readonly expected: string
	readonly path: readonly (string | number)[]
	readonly receivedType: string
	readonly receivedPreview?:  string
	readonly hint?: string
	readonly helpUrl?: string
}
```

**Rules:**
- Keep fields readonly
- Provide helpers to render locations (path arrays â†’ strings) deterministically
- Use cycle-safe previews that do not leak secrets
- Assertions throw `TypeError` with structured metadata

### Event Subscription Pattern

Event subscriptions must return cleanup functions:

```typescript
interface EventEmitterInterface {
	onChange(callback: (value: string) => void): () => void
	onError(callback: (error: Error) => void): () => void
}

function createEmitter(): EventEmitterInterface {
	const changeListeners = new Set<(value: string) => void>()
	const errorListeners = new Set<(error: Error) => void>()

	return {
		onChange(callback): () => void {
			changeListeners.add(callback)
			return () => changeListeners.delete(callback)
		},

		onError(callback): () => void {
			errorListeners.add(callback)
			return () => errorListeners.delete(callback)
		}
	}
}
```

### System Hooks Pattern (Stateful Systems)

For complex stateful systems (engines, managers, controllers), use the **Hooks-Options-Interface** pattern to ensure consistent typing across options, hooks, and public APIs.

#### Pattern Structure

```typescript
/** Cleanup function type */
export type Unsubscribe = () => void

/** 1.  State interface (readonly snapshot) */
export interface SystemStateInterface {
	readonly isActive: boolean
	readonly count: number
}

/** 2. Hooks interface (required subscription methods) */
export interface SystemHooksInterface {
	onActivate(callback: () => void): Unsubscribe
	onDeactivate(callback:  () => void): Unsubscribe
	onChange(callback: (value: string) => void): Unsubscribe
}

/** 3. Options interface (extends Partial<Hooks>) */
export interface SystemOptionsInterface extends Partial<SystemHooksInterface> {
	readonly requiredOption: string
	readonly optionalOption?:  number
}

/** 4. Public interface (extends Hooks) */
export interface SystemInterface extends SystemHooksInterface {
	getState(): SystemStateInterface
	isActive(): boolean

	start(): void
	stop(): void

	destroy(): void
}
```

#### Key Rules

1. **Hooks interface defines subscription methods** that return `Unsubscribe`
2. **Options interface extends `Partial<Hooks>`** making hooks optional at construction
3. **Main interface extends `Hooks`** making all hook methods required on instances
4. **State interface** is always readonly for immutable snapshots
5. **No duplicate `readonly hooks?:  Hooks`** in Options since `extends Partial<Hooks>` already includes them

#### When to Use

Use this pattern for:
- Game engines, systems, and managers
- Stateful controllers with lifecycle events
- Systems with multiple event types
- Any class/function that accepts options and emits events

#### Ordering Convention

Define types in this order:
1. **State** â€” readonly snapshot of internal state
2. **Hooks** â€” event subscription methods
3. **Options** â€” construction options extending `Partial<Hooks>`
4. **Interface** â€” public API extending `Hooks`

#### Implementation Example

```typescript
class GameEngine extends GameEngineAbstract {
	#listeners = {
		start: new Set<() => void>(),
		stop: new Set<() => void>(),
	}

	constructor(options: EngineOptionsInterface) {
		super()
		// Register hooks from options
		if (options.onStart) {
			this.#listeners.start.add(options.onStart)
		}
		if (options.onStop) {
			this.#listeners.stop.add(options.onStop)
		}
	}

	onStart(callback: () => void): Unsubscribe {
		this.#listeners.start.add(callback)
		return () => this.#listeners.start.delete(callback)
	}

	onStop(callback: () => void): Unsubscribe {
		this. #listeners.stop.add(callback)
		return () => this.#listeners.stop.delete(callback)
	}

	start(): void {
		this.#listeners.start.forEach(cb => cb())
	}

	stop(): void {
		this.#listeners.stop.forEach(cb => cb())
	}

	destroy(): void {
		this.#listeners.start.clear()
		this.#listeners.stop.clear()
	}
}
```

#### Usage Patterns

```typescript
// 1. Pass hooks in options (configuration-time)
const engine = createGameEngine({
	width: 800,
	height: 600,
	onStart: () => console.log('Started! '),
})

// 2. Add hooks dynamically (runtime)
const unsubscribe = engine.onStop(() => console.log('Stopped!'))

// 3. Clean up when done
unsubscribe()
engine.destroy()
```

### Cleanup and Lifecycle Pattern

Every stateful instance should have a `destroy()` method:

```typescript
interface InstanceInterface {
	// ...  API methods ...
	destroy(): void
}

function createInstance(): InstanceInterface {
	const listeners = new Set<() => void>()

	return {
		// API methods... 

		destroy(): void {
			listeners.clear()
			// Clean up other resources
		}
	}
}
```

---

## Quality Gates (Must Pass Before Commit)

Run these commands before committing:

```powershell
npm run check    # Typecheck (no emit)
npm run format   # Lint and autofix
npm run build    # Build library
npm test         # Unit tests
```

**Style compliance checklist:**
- File placement (types/constants/helpers/abstracts centralized)
- Barrel exports updated in `src/index.ts`
- Naming follows canonical prefix taxonomy
- Type naming uses `Interface` and `Abstract` suffixes correctly
- Typing rules (no `any`, no `!`, no unsafe `as`)
- Tests mirror source structure
- TSDoc on public exports

---

## Build, Test, Run Commands

Standard package.json scripts:

```json
{
	"scripts": {
		"dev": "vite --config configs/vite.{sandbox}.config.ts",
		"build": "npm run clean: dist && npm run check && vite build",
		"build:{sandbox}": "vite build --config configs/vite.{sandbox}.config.ts",
		"check": "npm run decache && tsc --noEmit",
		"check:{sandbox}": "npm run decache && tsc --noEmit -p configs/tsconfig.{sandbox}.json",
		"test": "npm run decache && vitest run --no-cache",
		"format": "eslint .  --fix",
		"show":  "npm run build:{sandbox} && npm run copy:{sandbox} && npm run clean:{sandbox}",
		"clean: dist": "node -e \"try{require('fs').rmSync('dist',{recursive:true,force:true})}catch(e){}\"",
		"clean:{sandbox}": "node -e \"try{require('fs').rmSync('dist/{sandbox}',{recursive:true,force:true})}catch(e){}\"",
		"copy:{sandbox}":  "node -e \"try{require('fs').cpSync('dist/{sandbox}/index.html','{sandbox}.html',{force:true});console.log('Created:  {sandbox}.html')}catch(e){throw e}\"",
		"decache":  "node -e \"const fs=require('fs');['.eslintcache','node_modules/.vite','node_modules/.vitest','node_modules/.cache'].forEach(p=>{try{fs.rmSync(p,{recursive:true,force:true})}catch{}})\""
	}
}
```

**Key Scripts:**
- `dev` â€” Start dev server for sandbox folder
- `show` â€” Build sandbox to single HTML file, copy to root, clean up dist/{sandbox}
- `check` â€” Typecheck library using configs/tsconfig.build.json
- `check:{sandbox}` â€” Typecheck sandbox integration
- `decache` â€” Clear all caches before type checking/testing
- `format` â€” Lint and autofix with ESLint

PowerShell examples (Windows paths):

```powershell
# Install dependencies
npm install

# Typecheck
npm run check

# Lint and autofix
npm run format

# Build library
npm run build

# Run tests
npm test

# Development server for sandbox
npm run dev

# Build sandbox to single HTML
npm run show
```

---

## Communication Style

### Code Over Prose

- **Write in clear, technical English** with precision over verbosity
- **Provide actionable code** with brief explanations
- **Reference authoritative sources**:  MDN Web Docs, TypeScript documentation, ECMAScript spec
- **Structure responses**:  Code examples first, then explanation

### Summaries and Documentation

**CRITICAL:** Keep responses concise.  Do NOT create multiple markdown files or lengthy summaries.

- âœ… **Short summary in chat** - List changes made, questions, and suggestions only
- âŒ **No markdown summary files** - Wastes tokens, clutters workspace
- âŒ **No lengthy documentation** - Only create/update if truly necessary
- âœ… **Inline comments** - Document code changes directly in files
- âœ… **Update existing docs** - Prefer editing README.md over creating new files

Focus on taking action and implementing changes, not on documenting every step.

### Terminal Examples

- Use **PowerShell syntax** in terminal examples
- Use Windows paths with backslashes:  `src\index.ts`
- Chain commands with semicolons: `npm run build; npm test`

### Code Examples

- Keep examples copy-pasteable
- Use `ts` fences for TypeScript
- Avoid leaking secrets or sensitive data
- Show realistic use cases

---

## ideas.md (Single-File Implementation Tracker)

When `ideas.md` exists at repository root, it serves as the **single source of truth** for implementation planning.

### Assistant Behavior with ideas.md

- **Always read ideas.md first** before starting implementation work
- **Check progress tracking table** to understand which phase is active
- **Follow implementation patterns** provided in each idea's details
- **Update progress checkboxes** as tasks are completed
- **Mark phases complete** only when ALL acceptance criteria are met
- **Do not create plan/ folder** if ideas.md exists
- **Preserve rationale sections** for future decisions
- **Respect tier rankings**â€”do not implement lower-tier ideas without explicit approval

### Structure

1. **Header with metadata** (title, last updated, analysis source, status)
2. **Progress tracking table** (phase, status, completion %, deliverables)
3. **Executive summary** (goals, methodology, timeline)
4. **Ideas ranked by reward/complexity ratio** (tiers with star ratings)
5. **Phased implementation plan** (numbered phases with tasks, acceptance criteria)
6. **Completion markers** (checkboxes, notes, validation commands)

---

## Pull Request and Change Control

### Guidelines

- **Keep diffs focused**:  One logical change per PR
- **Expand public API only with rationale**: Multi-site need or clear use case
- **Update or add mirrored tests** for any source change
- **Update TSDoc and documentation** when behavior changes
- **Prefer small extensions** to existing shapes over new abstractions
- **Prefer well-scoped tasks** with acceptance criteria
- **Start with safer tasks**:  bug fixes, tests, docs, small refactors
- **Defer ambiguous or production-critical tasks** until requirements are clear

---

## Copilot Coding Agent Expectations

### Before Coding

1. Run setup steps in `.github/workflows/copilot-setup-steps.yml` if present
2. Run `npm run check`, `npm test`, `npm run build`, `npm run format`
3. Read `ideas.md` or `plan/overview.md` if present
4. Install Playwright browsers:  `npx playwright install --with-deps chromium`

### When Generating Code

- **Start with types in `src/types.ts`** before implementing logic
- **Use `Interface` suffix** for all interfaces in types.ts
- **Use `Abstract` suffix** for all abstract classes in abstracts.ts
- **Use clean names (no suffix)** for implementation classes in core/
- **Use System Hooks Pattern** for stateful systems (State â†’ Hooks â†’ Options â†’ Interface)
- **Add and update mirrored tests** alongside implementation
- **Respect strict typing**:  no `any`, no `!`, no unsafe `as`
- **Keep ESM-only imports/exports** with `.js` extensions
- **Follow TSDoc policy** with `ts` examples
- **Use `it.todo()`** for unimplemented tests, never placeholders
- **Convert `it.todo()` to real tests** when implementing logic
- **Follow canonical prefix taxonomy** for all method names
- **Organize methods** in standard order (accessors, mutators, actions, events, lifecycle)
- **Use Playwright for browser tests**, not jsdom or happy-dom

### Symbol Preservation

- **NEVER** remove parameters, fields, or methods to satisfy linters
- **ALWAYS** implement unused symbols or annotate with `@copilot.keep`
- **CHECK** `types.ts` and `abstracts.ts` for symbol contracts before claiming something is unused
- **SEARCH** for original intent before removing any symbol
- **ASK** for clarification if intent is unclear rather than deleting

### When Editing Documentation

- Keep examples copy-pasteable
- Use `ts` fences for code
- Avoid leaking secrets or large payloads in previews
- Update TSDoc when changing behavior

### TODO Comments

Leave TODO comments for:
- Stale/legacy code needing removal
- Code left to avoid breaking tests
- Code you feel necessary to revisit later

---

## Pre-Commit Checklist

Before committing changes, verify:

- [ ] Types defined in `src/types.ts` before implementation
- [ ] Interfaces use `Interface` suffix (e.g., `SessionManagerInterface`)
- [ ] Abstract classes use `Abstract` suffix (e.g., `SessionManagerAbstract`)
- [ ] Implementation classes use clean names (e.g., `SessionManager`)
- [ ] Method names follow canonical prefix taxonomy
- [ ] No `any`, no `!`, no unsafe `as`
- [ ] ESM imports use `.js` extensions
- [ ] Public exports have full TSDoc
- [ ] Tests mirror source structure
- [ ] Tests use `it.todo()` for unimplemented, not placeholders
- [ ] Integration tests exist in `tests/integration/` for sandbox features
- [ ] Types/helpers/constants/abstracts centralized appropriately
- [ ] Barrel exports updated in `src/index.ts`
- [ ] Stateful systems use System Hooks Pattern (State â†’ Hooks â†’ Options â†’ Interface)
- [ ] Hook methods return `Unsubscribe`
- [ ] Options extend `Partial<Hooks>`, interfaces extend `Hooks`
- [ ] No symbols removed to satisfy linter warnings
- [ ] Unused parameters either implemented or annotated with `@copilot.keep`
- [ ] Abstract class methods implemented in all concrete subclasses
- [ ] Protected fields from abstract classes used in implementations
- [ ] `@copilot.keep` annotations have both `reason` and `status`
- [ ] No stale `@copilot.status "pending-implementation"` for active features
- [ ] `npm run check` passes
- [ ] `npm run format` passes
- [ ] `npm run build` passes
- [ ] `npm test` passes
- [ ] Sandbox artifact generated with `npm run show` (if applicable)
- [ ] All features from `src/` demonstrated in sandbox
- [ ] Guides to reference all demonstrated features

---

## Gotchas and Tips

### ESM Only

- Avoid CommonJS-only patterns (`require`, `module.exports`)
- Use `import` and `export` exclusively
- Include `.js` extensions in imports

### Path Conventions

- Use Windows examples with backslashes in docs/commands
- Prefer package alias (`@scope/package`) when configured
- Otherwise use relative imports with `.js`

### Number Semantics

- Be explicit about number semantics when needed
- Strict numbers:  `+0 !== -0`, `NaN === NaN`
- Document precision requirements

### Configuration Reuse

- When the repo provides reusable config builders, import and extend them
- Don't duplicate configuration

### Lifecycle Hooks

- Type lifecycle hooks precisely using the System Hooks Pattern
- Hooks interface methods must return `Unsubscribe` (or `() => void`)
- Options extend `Partial<Hooks>` so hooks are optional at construction
- Main interface extends `Hooks` so all hook methods are required on instances
- Include per-phase timeout options as named fields
- Order types as:  State â†’ Hooks â†’ Options â†’ Interface

### Playwright Setup

- Always install Playwright browsers in `copilot-setup-steps.yml`
- Use `@vitest/browser-playwright` for browser tests
- Configure Playwright in `vite.config.ts` test section

### Type and Class Naming

- Interfaces: `*Interface` suffix (e.g., `BuffSystemInterface`)
- Abstract classes: `*Abstract` suffix (e.g., `BuffSystemAbstract`)
- Implementations: No suffix (e.g., `BuffSystem`)
- This prevents naming conflicts and clarifies imports

### ESLint Configuration

Use minimal ESLint with only `eslint`, `@typescript-eslint/eslint-plugin`, and `@typescript-eslint/parser` dependencies:

```typescript
// eslint.config.ts
import parser from '@typescript-eslint/parser'
import tseslint from '@typescript-eslint/eslint-plugin'

/** Shared formatting rules - auto-fixable with --fix */
const formattingRules = {
	'indent': ['error', 'tab', { SwitchCase: 1 }],
	'quotes': ['error', 'single', { avoidEscape: true }],
	'semi': ['error', 'never'],
	'comma-dangle': ['error', 'always-multiline'],
	'no-trailing-spaces': 'error',
	'no-multiple-empty-lines':  ['error', { max:  1, maxEOF: 0, maxBOF: 0 }],
	'eol-last': ['error', 'always'],
	'object-curly-spacing': ['error', 'always'],
	'array-bracket-spacing': ['error', 'never'],
	'space-before-function-paren':  ['error', 'never'],
	'keyword-spacing': ['error', { before: true, after:  true }],
	'space-infix-ops': 'error',
	'arrow-spacing': ['error', { before: true, after:  true }],
} as const

/** Shared TypeScript language options */
const typescriptLanguageOptions = {
	parser,
	ecmaVersion: 'latest' as const,
	sourceType: 'module' as const,
}

export default [
	// Global ignores
	{
		ignores:  ['dist/**', 'node_modules/**'],
	},

	// Type definition files - formatting only, no unused vars check
	{
		files: ['**/types.ts', '**/*.d.ts'],
		languageOptions: typescriptLanguageOptions,
		plugins: { '@typescript-eslint':  tseslint },
		rules: {
			...formattingRules,
			'no-unused-vars':  'off',
			'@typescript-eslint/no-unused-vars': 'off',
		},
	},

	// All other TypeScript/JavaScript files
	{
		files: ['**/*.{js,ts}'],
		ignores: ['**/types.ts', '**/*.d.ts'],
		languageOptions: {
			...typescriptLanguageOptions,
			parserOptions: { project: './tsconfig.json' },
		},
		plugins: { '@typescript-eslint':  tseslint },
		rules: {
			...formattingRules,

			// TypeScript-specific rules
			'@typescript-eslint/no-explicit-any': 'error',
			'no-unused-vars':  'off',
			'@typescript-eslint/no-unused-vars': ['error', {
				varsIgnorePattern: '^_',
				argsIgnorePattern: '^_',
				ignoreRestSiblings: true,
			}],

			// Code quality rules
			'no-console': 'warn',
			'no-debugger': 'error',
			'no-var': 'error',
			'prefer-const': 'error',
			'no-mixed-spaces-and-tabs': 'error',
		},
	},
]
```

**Rules:**
- No Prettier or other formatting tools needed
- ESLint handles both linting and formatting with `--fix`
- Only two dependencies: `eslint`, `@typescript-eslint/eslint-plugin`, and `@typescript-eslint/parser`
- All formatting rules are auto-fixable
- **No `@vitest/eslint-plugin` needed** â€” use explicit imports (`import { describe, it } from 'vitest'`) instead of globals mode

---

## If Unsure

- **When `ideas.md` exists**, treat it as the single source of truth
- **When using `plan/` structure**, check `plan/overview.md` and relevant `plan/phase-*.md`
- **Follow existing patterns** in the codebase
- **Check `design.md`** in sandbox folders for integration patterns
- **Ask the user for clarification** rather than guessing

---

## Code of Conduct

Be kind.  Assume good intent. Discuss ideas, not people.

---

## Project-Specific Configuration Template

When creating project-specific instructions, add this section at the end:

```markdown
# Project-Specific Configuration

## Project Profile

| Field              | Value                                         |
|--------------------|-----------------------------------------------|
| **Package name**   | `@scope/package-name`                         |
| **Environment**    | `browser` / `node` / `isomorphic`             |
| **Type**           | `library` / `application` / `cli`             |
| **Focus**          | Brief description of primary purpose          |
| **Sandbox folder** | `docs/` / `game/` / `examples/` / `showcase/` |

## Environment-Specific Rules

<!-- Add environment-specific patterns here -->

## Domain-Specific Patterns

<!-- Add domain-specific patterns here -->

## Sandbox Configuration

<!-- Document sandbox folder structure and build process -->

## Error Codes

<!-- Add project-specific error codes here -->

## Package Scripts

<!-- Add project-specific scripts here -->
```

---

**End of Universal TypeScript Development Instructions**
