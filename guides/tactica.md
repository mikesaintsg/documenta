# Tactica - Mobile-First Browser Game Engine

A comprehensive, mobile-first 2D game engine for browser-based games, built with TypeScript. Zero external runtime dependencies, pure Web APIs.

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Architecture](#architecture)
4. [Core Systems](#core-systems)
5. [Rendering](#rendering)
6. [Input System](#input-system)
7. [Audio System](#audio-system)
8. [Physics & Collision](#physics--collision)
9. [Animation System](#animation-system)
10. [Game Systems](#game-systems)
11. [UI Components](#ui-components)
12. [Advanced UI](#advanced-ui)
13. [Storage & State Management](#storage--state-management)
14. [Asset Management](#asset-management)
15. [Mobile Features](#mobile-features)
16. [Accessibility](#accessibility)
17. [PWA Support](#pwa-support)
18. [Network/Multiplayer](#networkmultiplayer)
19. [Performance Monitoring](#performance-monitoring)
20. [Debug & Development Tools](#debug--development-tools)
21. [Helper Functions](#helper-functions)
22. [API Reference](#api-reference)

---

## Overview

Tactica is a mobile-first, canvas-based 2D game engine designed for:

- **Mobile games**: Touch-optimized with gesture recognition, haptic feedback
- **Browser games**: PWA-ready, offline-capable, cross-tab sync
- **Indie developers**: Zero dependencies, TypeScript-first, easy to learn

### Key Features

- 🎮 **Complete Game Loop**: Engine with update/render cycle, scene management
- 📱 **Mobile-First**: Touch gestures, haptic feedback, orientation handling
- 🎨 **Canvas Rendering**: Sprites, tilemaps, cameras, batched drawing
- ⚡ **Physics Engine**: Collision detection, rigid body dynamics, spatial partitioning
- 🎵 **Audio System**: Sound effects, music, spatial audio, crossfade
- 💾 **State Management**: Reactive stores, IndexedDB persistence, cross-tab sync
- 🎬 **Animation**: Sprite animations, tweening, particle effects
- 🖼️ **UI System**: Buttons, sliders, panels, progress bars, toggles
- ♿ **Accessibility**: Screen reader support, reduced motion, high contrast
- 📲 **PWA Ready**: Service workers, offline mode, install prompts

---

## Quick Start

### Installation

```bash
npm install tactica
```

### Basic Game Setup

```typescript
import { createEngine, createScene, createEntity } from 'tactica'

// Create the engine
const engine = createEngine({
  canvas: document.getElementById('game') as HTMLCanvasElement,
  width: 800,
  height: 600,
  targetFPS: 60,
  backgroundColor: '#1a1a2e',
})

// Create a scene
const mainScene = createScene({ name: 'main' })

// Create an entity
const player = createEntity({
  x: 400,
  y: 300,
  width: 32,
  height: 32,
})

// Add entity to scene
mainScene.addEntity(player)

// Set active scene and start
engine.start()
```

---

## Architecture

### Project Structure

```
tactica/
├── src/
│   ├── types.ts                 # All type definitions (source of truth)
│   ├── constants.ts             # Immutable constants
│   ├── helpers.ts               # Utility functions and type guards
│   ├── factories.ts               # Factory functions for creating systems
│   ├── index.ts                 # Public API exports
│   ├── schemas/                 # Game state schemas (PlayerState, WorldState, InventoryState, SettingsState)
│   └── core/
│       ├── index.ts             # Barrel exports for all core modules
│       ├── engine/              # Core game loop (Engine, Entity, Scene, SceneManager, TimerManager, TransitionManager)
│       ├── input/               # Input handling (InputSystem)
│       ├── rendering/           # Visual output (Camera, Renderer, SpriteSheet, Tilemap, LayerManager, CameraEffects, SpriteBatch)
│       ├── animation/           # Motion and effects (AnimationPlayer, Tween, TweenManager, ParticleEmitter, ParticleSystem)
│       ├── audio/               # Sound playback (AudioManager)
│       ├── physics/             # Collision and physics (PhysicsWorld, CollisionSystem, Quadtree, SpatialGrid)
│       ├── storage/             # Data persistence (Cache, MetricsCollector, StorageManager, LocalStorageBackend, IndexedDBBackend, MigrationRunner)
│       ├── asset/               # Resource loading (AssetManager, ResourceManager, ObjectPool)
│       ├── platform/            # Platform features (AccessibilityManager, PWAManager, MobileManager)
│       ├── debug/               # Development tools (DebugTools, DebugOverlay, PerformanceMonitor, ScreenshotManager, FrameBudget)
│       ├── network/             # Networking (NetworkManager)
│       ├── gameplay/            # Game mechanics (BuffSystem, HealthSystem, FloatingTextSystem, CollectibleSystem, SpawnerSystem, EffectZoneSystem, BackgroundSystem, ExperienceSystem, StatisticsSystem, ObjectiveSystem, StateMachine, CrosshairSystem, EntityRendererRegistry)
│       ├── components/          # Entity-component system (ColliderComponent, ComponentFactory, PhysicsComponent, SpriteComponent, TransformComponent)
│       └── ui/                  # Canvas UI components (Button, Checkbox, Panel, ProgressBar, Slider, Text, Toggle, UIImage, UIManager, ToastManager, Modal, ModalManager, VirtualJoystick, ActionButton, TextInput, TooltipManager)
```

### Design Principles

1. **Types First**: All interfaces defined in `src/types.ts`
2. **Immutable State**: Readonly types, copy-on-write patterns
3. **Zero Dependencies**: Pure Web APIs only
4. **Mobile First**: Touch-optimized, 44x44px touch targets
5. **Subscription Pattern**: Event hooks return unsubscribe functions

---

## Core Systems

### Engine

The main game loop controller.

```typescript
import { createEngine } from 'tactica'

const engine = createEngine({
  canvas: document.getElementById('game') as HTMLCanvasElement,
  width: 800,
  height: 600,
  targetFPS: 60,
  backgroundColor: '#000000',
  preventContextMenu: true,
  preventScrollBounce: true,
})

// Lifecycle hooks
engine.onBeforeUpdate((dt) => { /* physics */ })
engine.onAfterUpdate((dt) => { /* game logic */ })
engine.onBeforeRender((ctx) => { /* pre-render */ })
engine.onAfterRender((ctx) => { /* post-render */ })
engine.onPause(() => { /* paused */ })
engine.onResume(() => { /* resumed */ })
engine.onResize((w, h) => { /* resized */ })

// Control
engine.start()
engine.pause()
engine.resume()
engine.stop()
engine.resize(1024, 768)

// State
engine.isRunning()
engine.isPaused()
engine.getState() // EngineState
```

### Scene Management

Organize game content into scenes.

```typescript
import { createScene, createSceneManager } from 'tactica'

const sceneManager = createSceneManager()

const menuScene = createScene({
  name: 'menu',
  backgroundColor: '#1a1a2e',
})

const gameScene = createScene({
  name: 'game',
  onLoad: async () => {
    // Load assets
  },
  onActivate: () => {
    // Scene entered
  },
  onDeactivate: () => {
    // Scene left
  },
})

sceneManager.addScene(menuScene)
sceneManager.addScene(gameScene)
await sceneManager.setActiveScene('game')
```

### Entity System

Basic game objects with transform, rendering, and events.

```typescript
import { createEntity } from 'tactica'

const enemy = createEntity({
  id: 'enemy-1',
  x: 100,
  y: 200,
  width: 32,
  height: 32,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
  opacity: 1,
  visible: true,
  interactive: true,
  zIndex: 10,
})

// Transform
enemy.setPosition(150, 250)
enemy.move(10, 0)  // Relative
enemy.setRotation(Math.PI / 4)
enemy.rotate(0.1)  // Relative

// Visibility
enemy.show()
enemy.hide()
enemy.setOpacity(0.5)

// Events
enemy.onUpdate((dt) => {
  enemy.move(100 * dt, 0)
})

enemy.onCollision((other) => {
  if (other.id === 'bullet') {
    enemy.destroy()
  }
})
```

---

## Rendering

### Camera

Control the viewport and follow entities.

```typescript
import { createCamera } from 'tactica'

const camera = createCamera({
  x: 0,
  y: 0,
  width: 800,
  height: 600,
  zoom: 1,
  minZoom: 0.5,
  maxZoom: 2,
  smoothing: 0.1,
})

// Follow player
camera.follow(player)

// Manual control
camera.setPosition(100, 100)
camera.setZoom(1.5)

// Effects
camera.shake(10, 500)  // intensity, duration
camera.flash('#ffffff', 200)
camera.fade('#000000', 1000, true)  // fadeIn

// Coordinate conversion
const worldPos = camera.screenToWorld(mouseX, mouseY)
const screenPos = camera.worldToScreen(entity.getX(), entity.getY())

// Culling
if (camera.contains(entity)) {
  // Render entity
}
```

### Sprite Sheets

Efficient sprite animation.

```typescript
import { createSpriteSheet } from 'tactica'

const playerSheet = createSpriteSheet({
  imageKey: 'player-spritesheet',
  frameWidth: 32,
  frameHeight: 32,
  columns: 8,
  rows: 4,
  animations: [
    { name: 'idle', frames: [0, 1, 2, 3], frameRate: 8, loop: true },
    { name: 'walk', frames: [8, 9, 10, 11, 12, 13], frameRate: 12, loop: true },
    { name: 'jump', frames: [16, 17, 18], frameRate: 10, loop: false },
    { name: 'attack', frames: [24, 25, 26, 27, 28], frameRate: 15, loop: false },
  ],
})
```

### Tilemaps

Efficient tile-based level rendering.

```typescript
import { createTilemap } from 'tactica'

const level = createTilemap({
  width: 100,
  height: 50,
  tileWidth: 16,
  tileHeight: 16,
  tilesets: [
    { name: 'terrain', imageKey: 'terrain', firstGid: 1, tileWidth: 16, tileHeight: 16 },
  ],
  layers: [
    { name: 'background', width: 100, height: 50, data: [/* ... */] },
    { name: 'collision', width: 100, height: 50, data: [/* ... */], visible: false },
  ],
})

// Query tiles
const tile = level.getTileAt(worldX, worldY, 'collision')
const tilesInView = level.getTilesInRectangle(camera.getBounds())
```

### Trail Renderer

Draw visual trails behind moving objects.

```typescript
import { createTrailRenderer } from 'tactica'

const trail = createTrailRenderer({
  maxPoints: 50,
  startWidth: 10,
  endWidth: 1,
  startColor: '#00ffff',
  endColor: '#0000ff',
  fadeTime: 500,
  minDistance: 5,
  blendMode: 'lighter',
})

// Events
trail.onTrailStart(() => console.log('Trail started'))
trail.onTrailEnd(() => console.log('Trail ended'))

// Control
trail.start()
trail.stop()
trail.clear()

// Add points in game loop
trail.addPoint(entity.x, entity.y)

// Update and render
trail.update(deltaTime)
trail.render(ctx, camera)
```

### Shape Renderer

Draw geometric primitives (lines, circles, polygons, etc.).

```typescript
import { createShapeRenderer } from 'tactica'

const shapes = createShapeRenderer({
  defaultLineStyle: { color: '#ffffff', width: 2 },
  defaultFillStyle: { color: '#333333' },
})

// Set canvas context
shapes.setContext(ctx)

// Set styles
shapes.setLineStyle({ color: '#ff0000', width: 3, dash: [5, 5] })
shapes.setFillStyle({ color: '#00ff00', opacity: 0.5 })

// Draw shapes
shapes.line(0, 0, 100, 100)
shapes.rectangle(50, 50, 100, 80, true)  // filled
shapes.roundRectangle(50, 50, 100, 80, 10, false)  // stroked
shapes.circle(200, 200, 50, true)
shapes.ellipse(300, 200, 60, 30, 0, false)
shapes.arc(400, 200, 50, 0, Math.PI)
shapes.polygon([{ x: 0, y: 0 }, { x: 50, y: 100 }, { x: 100, y: 0 }], true)
shapes.polyline([{ x: 0, y: 0 }, { x: 50, y: 50 }, { x: 100, y: 0 }], false)

// Curves
shapes.bezier(0, 0, 50, 100, 150, 100, 200, 0)
shapes.quadratic(0, 0, 100, 50, 200, 0)

// Utilities
shapes.arrow(0, 0, 100, 0, 20, Math.PI / 6)
shapes.cross(100, 100, 20)
shapes.grid(0, 0, 400, 300, 50, 50)

shapes.resetStyles()
```

### Post-Processing Effects

Apply screen-wide visual effects.

```typescript
import { createPostProcessManager } from 'tactica'

const postProcess = createPostProcessManager({
  effects: [
    { type: 'vignette', intensity: 0.3, enabled: true },
    { type: 'scanlines', intensity: 0.1, enabled: false },
  ],
  enabled: true,
})

// Events
postProcess.onEffectAdd((effect) => console.log('Added:', effect.type))
postProcess.onEffectChange((effect) => console.log('Changed:', effect.type))

// Enable/disable
postProcess.enable()
postProcess.disable()
postProcess.toggle()

// Add/remove effects
postProcess.addEffect({ type: 'crt', intensity: 0.5, enabled: true })
postProcess.removeEffect('crt')

// Modify effects
postProcess.setEffectIntensity('vignette', 0.5)
postProcess.setEffectEnabled('scanlines', true)
postProcess.setEffectParams('blur', { radius: 5 })

// Check effect state
const vignetteEffect = postProcess.getEffect('vignette')
postProcess.hasEffect('blur')

// Apply after rendering (in game loop)
postProcess.apply(ctx, canvas)

// Available effect types:
// 'vignette', 'color-tint', 'brightness', 'contrast', 'saturation',
// 'pixelate', 'scanlines', 'crt', 'blur', 'glow'
```

---

## Input System

### Touch & Gesture Recognition

```typescript
import { createInputSystem } from 'tactica'

const input = createInputSystem({
  tapThreshold: 10,
  doubleTapDelay: 300,
  pressDelay: 500,
  swipeThreshold: 50,
  swipeVelocity: 0.3,
})

// Pointer (unified mouse/touch)
input.onPointerDown((data) => {
  console.log(`Pressed at ${data.x}, ${data.y}`)
})

// Gestures
input.onTap((x, y) => { /* single tap */ })
input.onDoubleTap((x, y) => { /* double tap */ })
input.onPress((x, y) => { /* long press */ })
input.onPan((gesture) => { /* dragging */ })
input.onSwipe((gesture) => {
  if (gesture.deltaX > 0) { /* swipe right */ }
})
input.onPinch((gesture) => {
  camera.zoom(gesture.scale)
})
input.onRotate((gesture) => {
  player.rotate(gesture.rotation)
})

// State queries
const { x, y, isDown } = input.getState()
const touches = input.getTouches()
```

### Keyboard Input

Desktop keyboard handling with key combos and axis mapping.

```typescript
import { createKeyboardManager } from 'tactica'

const keyboard = createKeyboardManager({
  preventDefaultKeys: ['ArrowUp', 'ArrowDown', 'Space'],
  allowBrowserShortcuts: false,
})

// Event subscriptions
keyboard.onKeyDown((key, event) => {
  if (key === 'Space') player.jump()
})

keyboard.onKeyUp((key, event) => {
  if (key === 'Space') player.endJump()
})

// Key combos
keyboard.onCombo(
  { keys: ['Shift', 'KeyE'], maxDelay: 200, ordered: true },
  () => openInventory()
)

// State queries
keyboard.isKeyDown('KeyW')  // Currently held
keyboard.isKeyPressed('Space')  // Just pressed this frame
keyboard.isKeyReleased('KeyA')  // Just released this frame

// Axis mapping (returns -1, 0, or 1)
const horizontal = keyboard.getAxis('KeyA', 'KeyD')  // -1 left, 1 right
const vertical = keyboard.getAxis('KeyW', 'KeyS')

// Vector mapping (returns normalized direction)
const direction = keyboard.getVector('KeyA', 'KeyD', 'KeyW', 'KeyS')
player.move(direction.x * speed, direction.y * speed)

// Update in game loop
keyboard.update()
```

### Gamepad Input

Controller support with unified button names.

```typescript
import { createGamepadManager } from 'tactica'

const gamepad = createGamepadManager({
  deadzone: 0.2,
  axisThreshold: 0.5,
})

// Connection events
gamepad.onConnect((index, id) => {
  console.log(`Controller ${index} connected: ${id}`)
})

gamepad.onDisconnect((index) => {
  console.log(`Controller ${index} disconnected`)
})

// Button events
gamepad.onButtonDown((index, button) => {
  if (button === 'a') player.jump()
})

// Get stick input
const leftStick = gamepad.getStick(0, 'left')
player.move(leftStick.x * speed, leftStick.y * speed)

// Vibration
gamepad.vibrate(0, 200, 0.5, 1.0)  // index, duration, weak, strong

// Available buttons: 'a', 'b', 'x', 'y', 'lb', 'rb', 'lt', 'rt',
//                    'back', 'start', 'guide', 'ls', 'rs',
//                    'dpad-up', 'dpad-down', 'dpad-left', 'dpad-right'

// Update in game loop
gamepad.update()
```

### Input Action System

Unified input handling across multiple input sources with rebindable controls.

```typescript
import { createInputActionSystem } from 'tactica'

const actions = createInputActionSystem({
  contexts: [{
    name: 'gameplay',
    priority: 0,
    actions: [
      {
        name: 'jump',
        bindings: [
          { source: 'keyboard', key: 'Space' },
          { source: 'gamepad', button: 'a' },
        ],
      },
      {
        name: 'attack',
        bindings: [
          { source: 'keyboard', key: 'KeyJ' },
          { source: 'gamepad', button: 'x' },
        ],
      },
      {
        name: 'move',
        bindings: [
          { source: 'gamepad', axis: 'left-x' },
        ],
      },
    ],
  }],
  persistBindings: true,
  storageKey: 'game-bindings',
})

// Enable input context
actions.enableContext('gameplay')

// Action events
actions.onActionStart((name) => {
  if (name === 'jump') player.jump()
})

actions.onActionEnd((name, duration) => {
  if (name === 'jump') player.endJump()
})

// Query action state
if (actions.isActionActive('attack')) {
  player.attack()
}

const moveValue = actions.getActionValue('move')

// Rebind controls
actions.rebind('jump', 0, { source: 'keyboard', key: 'KeyW' })

// Export/import bindings
const bindings = actions.exportBindings()
actions.importBindings(bindings)

// Update in game loop
actions.update(keyboard.getState(), gamepad.getGamepad(0), input.getState())
```

---

## Audio System

### Audio Manager

```typescript
import { createAudioManager } from 'tactica'

const audio = createAudioManager({
  masterVolume: 1.0,
  maxConcurrentSounds: 32,
})

// Register audio (from asset manager or raw elements)
audio.register('bgm', audioElement)
audio.register('explosion', audioBuffer)

// Play sounds
audio.play('explosion', { volume: 0.8, playbackRate: 1.2 })
audio.playOneShot('coin', 0.5)  // Quick SFX

// Music control
audio.play('bgm', { loop: true, volume: 0.6 })
audio.fadeIn('bgm', 2000)
audio.fadeOut('bgm', 1000)
audio.crossfade('bgm1', 'bgm2', 2000)

// Global controls
audio.setMasterVolume(0.5)
audio.mute()
audio.unmute()
```

### Music Playlist

Sequential music playback with shuffle and repeat modes.

```typescript
import { createMusicPlaylist } from 'tactica'

const playlist = createMusicPlaylist({
  tracks: [
    { key: 'menu-music', name: 'Main Menu', artist: 'Composer' },
    { key: 'level-1', name: 'Forest Theme', duration: 180 },
    { key: 'level-2', name: 'Cave Theme' },
  ],
  mode: 'shuffle',  // 'sequential' | 'shuffle' | 'repeat-one' | 'repeat-all'
  volume: 0.7,
  crossfadeDuration: 2000,
  autoPlay: false,
})

// Events
playlist.onTrackChange((from, to) => {
  updateNowPlaying(to.name)
})

playlist.onPlaylistEnd(() => {
  showPlaylistComplete()
})

// Playback control
playlist.play()
playlist.pause()
playlist.next()
playlist.previous()
playlist.playTrack('level-2')
playlist.skipTo(2)  // By index

// Mode control
playlist.setMode('shuffle')
playlist.shuffle()  // Reshuffle playlist

// Volume
playlist.setVolume(0.5)
playlist.fadeIn(1000)
playlist.fadeOut(1000)

// Progress
const progress = playlist.getProgress()  // 0-1
playlist.seek(0.5)  // Seek to 50%
```

### Sound Variant Pool

Play random sound variations with pitch/volume variance for organic audio.

```typescript
import { createSoundVariantPool } from 'tactica'

const footsteps = createSoundVariantPool({
  variants: [
    { key: 'step-1', weight: 1 },
    { key: 'step-2', weight: 1 },
    { key: 'step-3', weight: 1 },
    { key: 'step-4', weight: 0.5 },  // Less common
  ],
  pitchVariation: { min: 0.9, max: 1.1 },
  volumeVariation: { min: 0.8, max: 1.0 },
  cooldown: 100,  // Prevent rapid-fire
  preventRepeat: true,  // Don't play same sound twice in a row
})

// Play random variant
footsteps.play(audioManager, 0.8)  // volume

// Check if can play (cooldown)
if (footsteps.canPlay()) {
  footsteps.play(audioManager)
}

// Update cooldown timer
footsteps.update(deltaTime)
```

### Audio Zone Manager

Spatial audio effects based on player position.

```typescript
import { createAudioZoneManager } from 'tactica'

const zones = createAudioZoneManager({
  zones: [
    {
      id: 'cave',
      name: 'Cave Echo',
      bounds: { x: 0, y: 0, width: 500, height: 400 },
      effect: { type: 'reverb', intensity: 0.7 },
      enabled: true,
      priority: 1,
    },
    {
      id: 'underwater',
      name: 'Underwater',
      bounds: { x: 500, y: 0, width: 300, height: 600 },
      effect: { type: 'lowpass', intensity: 0.8 },
      enabled: true,
      priority: 2,
    },
  ],
  defaultTransitionDuration: 500,
  audioManager: audio,
})

// Events
zones.onZoneEnter((zone) => {
  console.log(`Entered ${zone.name}`)
})

zones.onZoneExit((zone) => {
  console.log(`Left ${zone.name}`)
})

zones.onTransitionStart((from, to) => {
  // Audio effect blending starts
})

// Manual zone management
zones.addZone({
  id: 'forest',
  name: 'Forest Ambience',
  bounds: { x: 800, y: 0, width: 400, height: 600 },
  effect: { type: 'echo', intensity: 0.3 },
  enabled: true,
})

zones.setZoneEnabled('cave', false)
zones.updateZoneBounds('cave', { x: 0, y: 0, width: 600, height: 500 })

// Update in game loop (checks player position)
zones.update(player.x, player.y, deltaTime)
```

---

## Physics & Collision

### Physics World

```typescript
import { createPhysicsWorld } from 'tactica'

const physics = createPhysicsWorld({
  gravityX: 0,
  gravityY: 9.8,
  damping: 0.99,
})

// Add physics bodies
physics.addBody(player, {
  mass: 1,
  friction: 0.1,
  restitution: 0.3,
  isStatic: false,
})

physics.addBody(ground, {
  mass: 0,
  isStatic: true,
})

// Apply forces
physics.applyForce(player, 0, -500)  // Jump
physics.applyImpulse(enemy, 100, 0)  // Knockback
physics.setVelocity(bullet, 500, 0)

// Update physics (in game loop)
physics.step(deltaTime)
```

### Collision Detection

```typescript
import { createCollisionSystem } from 'tactica'

const collision = createCollisionSystem()

// Add colliders
collision.addEntity(player, {
  shape: 'rectangle',
  x: 0, y: 0, width: 32, height: 32,
})

collision.addEntity(enemy, {
  shape: 'circle',
  x: 16, y: 16, radius: 16,
})

// Collision layers
collision.setLayerCollision(LAYER_PLAYER, LAYER_ENEMY, true)
collision.setLayerCollision(LAYER_PLAYER, LAYER_PLAYER_BULLET, false)

// Query collisions
const hits = collision.checkPoint(mouseX, mouseY)
const entitiesInArea = collision.checkArea(explosionBounds)
const rayHits = collision.checkRay(startX, startY, endX, endY)
```

### Spatial Partitioning

```typescript
import { createSpatialGrid, createQuadtree } from 'tactica'

// For uniform entity sizes
const grid = createSpatialGrid({ cellSize: 64 })

// For varying entity sizes
const quadtree = createQuadtree({
  maxObjects: 10,
  maxLevels: 5,
})

// Usage
grid.insert(entity, entity.getBounds())
const nearby = grid.query(queryBounds)
grid.update(entity, entity.getBounds())
```

---

## Animation System

### Tweening

```typescript
import { createTweenManager } from 'tactica'

const tweens = createTweenManager()

// Simple tween
const tween = tweens.create({
  target: player,
  properties: { x: 500, y: 300 },
  duration: 1000,
  easing: 'easeOutQuad',
})

tween.onComplete(() => {
  console.log('Animation finished')
})

tween.play()

// Easing types available:
// linear, quadIn/Out/InOut, cubicIn/Out/InOut,
// quartIn/Out/InOut, sineIn/Out/InOut, expoIn/Out/InOut,
// circIn/Out/InOut, backIn/Out/InOut, elasticIn/Out/InOut,
// bounceIn/Out/InOut
```

### Particle Effects

```typescript
import { createParticleSystem } from 'tactica'

const particles = createParticleSystem()

const explosion = particles.createEmitter({
  x: 400,
  y: 300,
  maxParticles: 100,
  emissionRate: 50,
  lifespan: 1000,
  velocityX: 0,
  velocityY: -100,
  velocityVariance: 50,
  accelerationY: 200,  // gravity
  startScale: 1,
  endScale: 0,
  startOpacity: 1,
  endOpacity: 0,
  color: '#ff6600',
  blendMode: 'lighter',
})

explosion.emit(50)  // Burst 50 particles

// Update in game loop
particles.update(deltaTime)
particles.render(context)
```

---

## Game Systems

Higher-level game systems for common mechanics. All systems use generic type parameters for customization and follow the subscription pattern (`onEvent(callback): Unsubscribe`).

### Buff System

Manage stackable, duration-based buffs and debuffs.

```typescript
import { createBuffSystem } from 'tactica'

type MyBuffs = 'speed' | 'damage' | 'shield'

const buffs = createBuffSystem<MyBuffs>({
  configs: {
    speed: { type: 'speed', maxStacks: 3, duration: 10, effectPerStack: 0.15 },
    damage: { type: 'damage', maxStacks: 3, duration: 10, effectPerStack: 0.20 },
    shield: { type: 'shield', maxStacks: 3, duration: 10, effectPerStack: 0.25 },
  }
})

// Apply buffs
buffs.apply('speed', currentTime)

// Calculate effects
const speedMultiplier = buffs.calculateMultiplier('speed') // 1.15 per stack

// Event hooks
buffs.onBuffAdded((buff, count) => showBuffIcon(buff.type, count))
buffs.onBuffExpired((type, remaining) => updateBuffIcon(type, remaining))
buffs.onStackChange((type, oldCount, newCount) => updateUI())

// Update (call each frame)
buffs.update(currentTime)

// Query state
const speedStacks = buffs.getStacks('speed')
const allBuffs = buffs.getActiveBuffs()
```

### Health System

Manage entity health, damage, healing, and invincibility.

```typescript
import { createHealthSystem } from 'tactica'

type DamageTypes = 'physical' | 'fire' | 'ice' | 'contact'

const health = createHealthSystem<DamageTypes>({
  defaultInvincibilityDuration: 1.0,
  damageModifier: (entityId, info) => {
    if (info.type === 'fire' && hasFireResist(entityId)) return info.amount * 0.5
    return info.amount
  }
})

// Register entities
health.register('player', 100)
health.register('enemy-1', 50)

// Damage and heal
health.damage('player', { type: 'contact', amount: 10, sourceId: 'enemy-1' })
health.heal('player', 25)

// Events
health.onDamage((entityId, info, actual) => showDamageNumber(entityId, actual))
health.onDeath((entityId) => handleDeath(entityId))
health.onHeal((entityId, amount, newHealth) => showHealEffect(entityId))

// Query
const playerHealth = health.getHealth('player')
const isInvincible = health.isInvincible('player')
```

### Floating Text System

Display animated text for feedback (damage numbers, pickups, etc.).

```typescript
import { createFloatingTextSystem } from 'tactica'

const floatingText = createFloatingTextSystem({
  defaultDuration: 1.5,
  defaultStyle: 'rise',
  defaultFontSize: 14,
})

// Spawn floating text with different styles
floatingText.spawn({ text: '-50', x: enemy.x, y: enemy.y, color: '#ff4444' })
floatingText.spawn({ text: '+20 HP', x: player.x, y: player.y, color: '#44ff44', style: 'bounce' })
floatingText.spawn({ text: 'CRITICAL!', x: target.x, y: target.y, style: 'shake', fontSize: 24 })

// Update and render (in game loop)
floatingText.update(deltaTime)
floatingText.render(ctx, camera)
```

### Collectible System

Manage pickups with drop tables and magnetism.

```typescript
import { createCollectibleSystem } from 'tactica'

type PickupTypes = 'health' | 'xp' | 'coin' | 'powerup'

const pickups = createCollectibleSystem<PickupTypes>({
  dropTable: [
    { type: 'health', weight: 20, value: 20 },
    { type: 'xp', weight: 30, value: 15 },
    { type: 'coin', weight: 25, value: { min: 1, max: 5 } },
  ],
  dropChance: 0.4,
  magnetRange: 80,
  magnetSpeed: 300,
})

// Spawn from drop table (random based on weights)
pickups.spawnFromDropTable({ x: enemy.x, y: enemy.y })

// Events
pickups.onCollect((pickup, collectorId) => {
  applyPickup(pickup.type, pickup.value)
})

// Update with collector position
pickups.update(deltaTime, { x: player.x, y: player.y })
```

### Spawner System

Manage entity spawning with zones, waves, and intervals.

```typescript
import { createSpawnerSystem } from 'tactica'

const spawner = createSpawnerSystem<Enemy, EnemyType>({
  zones: [
    { id: 'top', x: 0, y: -24, width: 800, height: 1, weight: 1, enabled: true },
    { id: 'right', x: 824, y: 0, width: 1, height: 600, weight: 1, enabled: true },
  ],
  entityTypes: [
    { type: 'basic', weight: 60 },
    { type: 'fast', weight: 25 },
    { type: 'tank', weight: 15 },
  ],
  entityFactory: (type, pos) => createEnemy(type, pos),
  baseInterval: 2.0,
  minInterval: 0.5,
  intervalDecayRate: 0.01,
})

// Events
spawner.onSpawn((entity, type, zone) => {
  enemies.push(entity)
})

// Update (spawns entities automatically based on interval)
spawner.update(deltaTime)
```

### Effect Zone System

Manage areas that trigger effects when entities enter.

```typescript
import { createEffectZoneSystem } from 'tactica'

type ZoneEffects = 'heal' | 'speed' | 'damage' | 'teleport'

const zones = createEffectZoneSystem<ZoneEffects>({
  defaultCooldown: 5,
})

// Create zones
zones.createZone('heal', { x: 400, y: 300 }, 50)
zones.createZone('speed', { x: 200, y: 200 }, 40)

// Events
zones.onZoneEnter((zone, entityId) => {
  if (zone.effectType === 'heal') healEntity(entityId, 20)
})

zones.onZoneActivate((zone, entityId) => {
  if (zone.effectType === 'teleport') teleportEntity(entityId)
})

// Check entity collisions
zones.checkCollision('player', { x: player.x, y: player.y }, 16)
```

### Experience System

Track XP and level progression.

```typescript
import { createExperienceSystem } from 'tactica'

interface LevelRewards {
  healthBonus: number
  damageBonus: number
}

const xp = createExperienceSystem<LevelRewards>({
  xpFormula: (level) => level * 50 + (level - 1) * 25,
  levelRewards: [
    { level: 2, xpRequired: 75, rewards: { healthBonus: 10, damageBonus: 5 } },
    { level: 3, xpRequired: 150, rewards: { healthBonus: 10, damageBonus: 5 } },
  ],
})

// Events
xp.onLevelUp((level, rewards) => {
  showLevelUpEffect()
  if (rewards) applyRewards(rewards)
})

// Add XP
xp.addXP(50)

// Query
const progress = xp.getProgress() // { level, xp, xpToNext, progress: 0-1 }
```

### Statistics System

Track game statistics and milestones.

```typescript
import { createStatisticsSystem } from 'tactica'

const stats = createStatisticsSystem({
  statistics: [
    { key: 'kills', name: 'Enemies Killed', type: 'counter', persistent: true },
    { key: 'highScore', name: 'High Score', type: 'max', persistent: true },
  ],
  milestones: [
    { id: 'first_kill', name: 'First Blood', statKey: 'kills', threshold: 1 },
    { id: 'centurion', name: 'Centurion', statKey: 'kills', threshold: 100 },
  ],
})

// Events
stats.onMilestoneReached((milestone) => showAchievement(milestone.name))

// Update stats
stats.increment('kills')
stats.set('highScore', score)
```

### State Machine

Manage game/scene state transitions.

```typescript
import { createStateMachine } from 'tactica'

type GameStates = 'loading' | 'menu' | 'playing' | 'paused' | 'gameover'

const gameState = createStateMachine<GameStates>({
  initialState: 'loading',
  transitions: [
    { from: 'loading', to: 'menu' },
    { from: 'menu', to: 'playing', onTransition: () => startGame() },
    { from: 'playing', to: 'paused' },
    { from: 'paused', to: 'playing' },
    { from: 'playing', to: 'gameover', onTransition: () => saveScore() },
    { from: '*', to: 'menu' }, // Wildcard: from any state
  ],
})

// Events
gameState.onStateEnter('playing', () => playMusic())
gameState.onStateExit('playing', () => stopMusic())

// Transition
await gameState.transitionTo('playing')

// Query
const current = gameState.getCurrentState()
const canPause = gameState.canTransitionTo('paused')
```

### Background System

Render layered backgrounds with parallax and effects.

```typescript
import { createBackgroundSystem } from 'tactica'

const background = createBackgroundSystem({
  clearColor: '#0a0a12',
  worldWidth: 960,
  worldHeight: 1080,
})

// Add layers
background.addSolidLayer('base', '#1a1a2e', 0)
background.addStarfieldLayer('stars', {
  count: 150,
  minSize: 0.5,
  maxSize: 2.5,
  twinkleSpeed: 2,
}, 1)

// Render (in game loop)
background.render(ctx, camera)
```

### Crosshair System

Render aiming cursor for desktop.

```typescript
import { createCrosshairSystem } from 'tactica'

const crosshair = createCrosshairSystem({
  style: 'cross', // 'cross' | 'dot' | 'circle' | 'ring'
  size: 12,
  color: '#4fc3f7',
  activeColor: '#fff59d',
  hideOnMobile: true,
})

// Update position
crosshair.setPosition(mouseScreenX, mouseScreenY, mouseWorldX, mouseWorldY)

// Set active state (e.g., when firing)
crosshair.setActive(isFiring)

// Render
crosshair.render(ctx)
```

### Objective System

Track goals and progress.

```typescript
import { createObjectiveSystem } from 'tactica'

const objectives = createObjectiveSystem({
  objectives: [
    { id: 'kill_10', name: 'Kill 10 Enemies', condition: { target: 10 } },
    { id: 'survive_60', name: 'Survive 60s', condition: { target: 60 } },
  ],
})

// Events
objectives.onObjectiveComplete((id) => showNotification(`Completed: ${id}`))

// Update progress
objectives.incrementProgress('kill_10')
```

### Entity Renderer Registry

Register and render procedural entity drawings.

```typescript
import { createEntityRendererRegistry } from 'tactica'

const renderers = createEntityRendererRegistry<EnemyType, Enemy>()

// Register renderers for each entity type
renderers.register('basic', (ctx, enemy, time, camera) => {
  const pos = camera.worldToScreen(enemy.x, enemy.y)
  ctx.fillStyle = '#ff4444'
  ctx.beginPath()
  ctx.arc(pos.x, pos.y, 16, 0, Math.PI * 2)
  ctx.fill()
})

// Render entity
renderers.render(ctx, 'basic', enemy, camera)
```

---

## UI Components

All UI components are canvas-based, mobile-friendly (44px minimum touch targets).

### Button

```typescript
import { createUIManager } from 'tactica'

const ui = createUIManager()

const playButton = ui.createButton({
  x: 400,
  y: 300,
  width: 200,
  height: 60,
  text: 'Play Game',
  fontSize: 24,
  backgroundColor: '#4CAF50',
  hoverColor: '#66BB6A',
  pressedColor: '#388E3C',
  borderRadius: 8,
  onClick: () => {
    startGame()
  },
})
```

### Slider

```typescript
const volumeSlider = ui.createSlider({
  x: 100,
  y: 200,
  width: 300,
  height: 40,
  min: 0,
  max: 1,
  value: 0.8,
  step: 0.1,
  onChange: (value) => {
    audio.setMasterVolume(value)
  },
})
```

### Progress Bar

```typescript
const healthBar = ui.createProgressBar({
  x: 20,
  y: 20,
  width: 200,
  height: 20,
  min: 0,
  max: 100,
  value: 100,
  foregroundColor: '#4CAF50',
  backgroundColor: '#333',
  showText: true,
})

// Update value
healthBar.setValue(player.health)
```

### Panel (Container)

```typescript
const menuPanel = ui.createPanel({
  x: 200,
  y: 100,
  width: 400,
  height: 500,
  backgroundColor: 'rgba(0,0,0,0.8)',
  borderRadius: 16,
  padding: 20,
  layout: {
    direction: 'column',
    gap: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

menuPanel.addChild(titleText)
menuPanel.addChild(playButton)
menuPanel.addChild(settingsButton)
```

### Other Components

- **Text**: Labels and text display
- **Checkbox**: Boolean toggles with labels
- **Toggle**: iOS-style toggle switches
- **UIImage**: Image display with tinting

### Modal Dialogs

Create modal dialogs for confirmations, alerts, and custom content.

```typescript
import { createModal, createModalManager } from 'tactica'

// Create a standalone modal
const modal = createModal({
  title: 'Confirm Action',
  content: 'Are you sure you want to proceed?',
  buttons: [
    { text: 'Cancel', value: false, style: 'secondary', closeOnClick: true },
    { text: 'Confirm', value: true, style: 'primary', closeOnClick: true },
  ],
  closeOnBackdrop: true,
  animation: 'scale',
})

// Subscribe to events
modal.onClose((value) => {
  if (value === true) {
    performAction()
  }
})

modal.open()

// In game loop
modal.update(inputState)
modal.render(ctx)
```

### Modal Manager

Manage multiple modals with convenience methods for common dialogs.

```typescript
import { createModalManager } from 'tactica'

const modals = createModalManager({
  defaultBackdropColor: 'rgba(0,0,0,0.8)',
  defaultAnimation: 'scale',
  stackModals: true,
})

// Convenience methods (promise-based)
await modals.alert('Game Over!')
const confirmed = await modals.confirm('Restart?', 'Confirm')
const playerName = await modals.prompt('Enter name:', 'Player1')

// Create custom modals
const customModal = modals.createModal({
  title: 'Settings',
  content: 'Configure game options',
  buttons: [{ text: 'Done', value: true, style: 'primary', closeOnClick: true }],
})

// Check modal state
if (modals.hasOpenModals()) {
  // Block game input
}

// Close all modals
modals.closeAll()
```

---

## Advanced UI

### Radial Menu

Circular selection menu for quick item/action selection.

```typescript
import { createRadialMenu } from 'tactica'

const radialMenu = createRadialMenu({
  x: 0,
  y: 0,
  width: 200,
  height: 200,
  items: [
    { id: 'attack', label: 'Attack', icon: '⚔' },
    { id: 'defend', label: 'Defend', icon: '🛡' },
    { id: 'magic', label: 'Magic', icon: '✨', children: [
      { id: 'fire', label: 'Fire' },
      { id: 'ice', label: 'Ice' },
    ]},
    { id: 'items', label: 'Items', icon: '🎒' },
  ],
  innerRadius: 40,
  outerRadius: 100,
  showLabels: true,
})

// Events
radialMenu.onSelect((item, index) => {
  executeAction(item.id)
})

radialMenu.onHover((item, index) => {
  showPreview(item)
})

radialMenu.onCancel(() => {
  hideMenu()
})

// Control
radialMenu.open(screenX, screenY)
radialMenu.close()
radialMenu.toggle(screenX, screenY)

// Navigation
radialMenu.selectIndex(2)
radialMenu.navigateToChild(0)  // Enter submenu
radialMenu.navigateToParent()  // Exit submenu

// Dynamic items
radialMenu.setItems(newItems)
radialMenu.setItemEnabled('magic', hasMana)
radialMenu.setItemHidden('items', inventoryEmpty)

// Update and render
radialMenu.update(inputState)
radialMenu.render(ctx)
```

### Minimap

World overview with markers and fog of war.

```typescript
import { createMinimap } from 'tactica'

const minimap = createMinimap({
  x: 10,
  y: 10,
  width: 150,
  height: 150,
  worldWidth: 2000,
  worldHeight: 2000,
  shape: 'circle',  // 'circle' | 'rectangle'
  zoom: 1,
  minZoom: 0.5,
  maxZoom: 2,
  showPlayer: true,
  playerIcon: { id: 'player', type: 'player', color: '#00ff00', size: 8 },
  rotateWithPlayer: true,
  fogOfWar: true,
  clickable: true,
})

// Events
minimap.onMarkerClick((marker) => {
  selectMarker(marker)
})

minimap.onMapClick((worldX, worldY) => {
  setWaypoint(worldX, worldY)
})

minimap.onZoomChange((zoom) => {
  updateZoomIndicator(zoom)
})

// Player tracking
minimap.setPlayerPosition(player.x, player.y, player.rotation)

// Markers
minimap.addMarker({
  id: 'enemy-1',
  x: 500,
  y: 300,
  icon: { id: 'enemy', type: 'enemy', color: '#ff0000', size: 6 },
  label: 'Boss',
  trackable: true,
})

minimap.updateMarker('enemy-1', { x: 510, y: 305 })
minimap.removeMarker('enemy-1')
minimap.setMarkerVisible('quest-1', true)
minimap.clearMarkers()

// Fog of war
minimap.revealFog(player.x, player.y, 100)
minimap.clearFog()  // Reveal all
minimap.resetFog()  // Hide all

// Coordinate conversion
const worldPos = minimap.minimapToWorld(clickX, clickY)
const minimapPos = minimap.worldToMinimap(entity.x, entity.y)

// Zoom control
minimap.setZoom(1.5)
minimap.zoomIn(0.1)
minimap.zoomOut(0.1)

// Update and render
minimap.update(inputState)
minimap.render(ctx)
```

### Notification Manager

In-game notifications for achievements, quests, and rewards.

```typescript
import { createNotificationManager } from 'tactica'

const notifications = createNotificationManager({
  x: 10,
  y: 10,
  width: 300,
  height: 400,
  maxVisible: 3,
  maxHistory: 50,
  defaultDuration: 5000,
  position: 'top-right',
  animation: 'slide',
  hapticFeedback: true,
})

// Events
notifications.onNotification((notification) => {
  console.log('New:', notification.title)
})

notifications.onDismiss((notification) => {
  console.log('Dismissed:', notification.id)
})

notifications.onClick((notification) => {
  if (notification.action) notification.action()
})

// Quick notifications
notifications.achievement('Level Up!', 'You reached level 10!')
notifications.quest('New Quest', 'Defeat the dragon')
notifications.system('Auto-saved', 'Game progress saved')
notifications.reward('+100 Gold', 'Quest reward')

// Custom notification
notifications.push({
  title: 'Rare Item Found',
  message: 'You found a Legendary Sword!',
  category: 'reward',
  priority: 'high',
  icon: '⚔',
  action: () => openInventory(),
})

// Management
notifications.dismiss('notification-id')
notifications.dismissAll()
notifications.markRead('notification-id')
notifications.markAllRead()
notifications.clear()

// Query
const unread = notifications.getUnreadCount()
const questNotifications = notifications.getByCategory('quest')

// Toggle expanded view
notifications.expand()
notifications.collapse()
notifications.toggle()

// Update and render
notifications.update(inputState)
notifications.render(ctx)
```

### Inventory System

Complete inventory management with equipment and stacking.

```typescript
import { createInventorySystem } from 'tactica'

const inventory = createInventorySystem({
  capacity: 20,
  startingGold: 100,
  equipmentSlots: ['weapon', 'armor', 'helmet', 'boots', 'accessory'],
})

// Events
inventory.onItemAdd((item, quantity, slot) => {
  showItemAdded(item)
})

inventory.onItemRemove((item, quantity, slot) => {
  showItemRemoved(item)
})

inventory.onEquip((item, slot) => {
  updatePlayerStats()
})

inventory.onGoldChange((oldAmount, newAmount) => {
  updateGoldDisplay(newAmount)
})

// Add items
const sword = {
  id: 'iron-sword',
  name: 'Iron Sword',
  type: 'weapon',
  rarity: 'common',
  stackable: false,
  value: 50,
}
inventory.addItem(sword)

// Remove items
inventory.removeItem('iron-sword', 1)

// Equipment
inventory.equip('iron-sword', 'weapon')
inventory.unequip('weapon')
const equipped = inventory.getEquippedItem('weapon')

// Gold
inventory.addGold(100)
inventory.removeGold(50)
if (inventory.canAfford(200)) {
  // Purchase item
}

// Slots
inventory.moveItem(0, 5)  // Move from slot 0 to 5
inventory.swapItems(0, 1)
inventory.splitStack(3, 5)  // Split stack at slot 3

// Query
const weapons = inventory.getItemsOfType('weapon')
const hasPotion = inventory.hasItem('health-potion', 3)
const potionCount = inventory.getItemQuantity('health-potion')

// Sorting
inventory.sortByType()
inventory.sortByRarity()
inventory.sortByName()
```

### Dialogue System

Conversation trees with branching, conditions, and typewriter effect.

```typescript
import { createDialogueSystem } from 'tactica'

const dialogue = createDialogueSystem({
  typewriterSpeed: 50,  // Characters per second
  autoAdvanceDelay: 0,  // 0 = manual advance
  skipTypingOnInput: true,
})

// Load dialogue tree
dialogue.loadTree({
  id: 'merchant-greeting',
  name: 'Merchant Conversation',
  startNodeId: 'greeting',
  nodes: {
    'greeting': {
      id: 'greeting',
      type: 'text',
      speaker: 'Merchant',
      portrait: 'merchant-portrait',
      text: 'Welcome to my shop! What can I help you with?',
      choices: [
        { text: 'Show me your wares', nextNodeId: 'shop' },
        { text: 'Tell me about yourself', nextNodeId: 'backstory' },
        { text: 'Goodbye', nextNodeId: 'farewell' },
      ],
    },
    'shop': {
      id: 'shop',
      type: 'action',
      actions: [{ type: 'trigger', target: 'openShop' }],
      nextNodeId: 'end',
    },
    // ... more nodes
  },
})

// Events
dialogue.onStart((tree) => showDialogueUI())
dialogue.onEnd((tree) => hideDialogueUI())
dialogue.onNodeEnter((node) => updateDialogueDisplay(node))
dialogue.onChoice((choice, node) => logChoice(choice))
dialogue.onTypingComplete((text) => showChoices())

// Control
dialogue.start()
dialogue.advance()  // Next line or complete typing
dialogue.selectChoice(0)  // Select first choice
dialogue.skipTyping()  // Complete current typewriter
dialogue.end()

// Variables for conditions
dialogue.setVariable('playerGold', 100)
dialogue.setFlag('hasMetMerchant')
const gold = dialogue.getVariable('playerGold')

// State
const state = dialogue.getState()
const isTyping = dialogue.isTyping()
const choices = dialogue.getAvailableChoices()
const displayedText = dialogue.getDisplayedText()

// Update in game loop
dialogue.update(deltaTime)
```

### Quest System

Quest tracking with objectives, prerequisites, and rewards.

```typescript
import { createQuestSystem } from 'tactica'

const quests = createQuestSystem({
  maxActiveQuests: 10,
  autoTrackActive: true,
})

// Register quests
quests.registerQuest({
  id: 'dragon-slayer',
  name: 'Dragon Slayer',
  description: 'Defeat the dragon terrorizing the village',
  category: 'main',
  level: 10,
  prerequisites: [
    { type: 'quest', target: 'training-complete' },
    { type: 'level', target: 'player', value: 10 },
  ],
  objectives: [
    { id: 'find-cave', description: 'Find the dragon cave', target: 1, current: 0, completed: false },
    { id: 'defeat-dragon', description: 'Defeat the dragon', target: 1, current: 0, completed: false },
  ],
  rewards: [
    { type: 'xp', amount: 1000 },
    { type: 'gold', amount: 500 },
    { type: 'item', target: 'dragon-scale-armor' },
  ],
})

// Events
quests.onQuestStart((quest) => showQuestStarted(quest))
quests.onQuestComplete((quest, rewards) => showQuestComplete(quest, rewards))
quests.onObjectiveProgress((quest, objective, current, target) => {
  updateObjectiveUI(quest, objective)
})
quests.onObjectiveComplete((quest, objective) => {
  showObjectiveComplete(objective)
})

// Quest control
quests.start('dragon-slayer')
quests.complete('dragon-slayer')
quests.fail('timed-quest')
quests.abandon('optional-quest')

// Objective tracking
quests.updateObjective('dragon-slayer', 'find-cave', 1)
quests.incrementObjective('dragon-slayer', 'defeat-dragon')
quests.completeObjective('dragon-slayer', 'find-cave')

// Query
const activeQuests = quests.getActiveQuests()
const availableQuests = quests.getAvailableQuests()
const progress = quests.getQuestProgress('dragon-slayer')  // 0-1
const canStart = quests.canStart('dragon-slayer')
```

### Crafting System

Item crafting with recipes, stations, and progression.

```typescript
import { createCraftingSystem } from 'tactica'

const crafting = createCraftingSystem({
  recipes: [
    {
      id: 'iron-sword',
      name: 'Iron Sword',
      ingredients: [
        { itemId: 'iron-ingot', quantity: 3 },
        { itemId: 'wood', quantity: 1 },
      ],
      results: [{ itemId: 'iron-sword', quantity: 1 }],
      craftingTime: 2000,
      requiredStation: 'anvil',
      unlocked: true,
    },
  ],
  stations: [
    { id: 'anvil', name: 'Anvil', recipes: ['iron-sword'], tier: 1 },
  ],
})

// Events
crafting.onCraftStart((recipe) => showCraftingProgress(recipe))
crafting.onCraftProgress((recipe, progress) => updateProgressBar(progress))
crafting.onCraftComplete((recipe, results) => {
  results.forEach(r => inventory.addItem(r.itemId, r.quantity))
})
crafting.onRecipeUnlock((recipe) => showRecipeUnlocked(recipe))

// Set current station
crafting.setCurrentStation('anvil')
const stationRecipes = crafting.getRecipesForStation('anvil')

// Check if can craft
if (crafting.canCraft('iron-sword', inventory)) {
  crafting.craft('iron-sword', inventory)
}

// Recipe management
crafting.unlockRecipe('steel-sword')
crafting.discoverRecipe('legendary-blade')  // Shows as "???" until unlocked

// Progress
const progress = crafting.getCraftProgress()
crafting.cancelCraft()

// Update in game loop
crafting.update(deltaTime)
```

### Save Slot Manager

Extended save management with quick saves and auto-saves.

```typescript
import { createSaveSlotManager } from 'tactica'

const saves = createSaveSlotManager({
  maxSlots: 10,
  autoSaveInterval: 60000,
  enableAutoSave: true,
  enableQuickSave: true,
  version: '1.0.0',
})

// Events
saves.onSave((slot) => showSaveIndicator())
saves.onLoad((slot) => showLoadIndicator())
saves.onAutoSave((slot) => showAutoSaveIndicator())
saves.onError((error, operation) => showError(error))

// Manual saves
await saves.save('slot1', 'My Adventure', gameData, thumbnail)
const data = await saves.load('slot1')

// Quick save/load
await saves.quickSave(gameData)
const quickData = await saves.quickLoad()

// Auto-save
saves.triggerAutoSave(gameData)
const autoData = await saves.loadAutoSave()

// Slot management
const slots = saves.getSlots()
await saves.delete('slot1')
await saves.rename('slot1', 'New Name')

// Export/import
const exported = await saves.exportSlot('slot1')
await saves.importSlot(exported)
```

---

## Storage & State Management

### Reactive Stores

```typescript
import { createStore, createComputed } from 'tactica'

const playerStore = createStore({
  id: 'player',
  initialState: {
    health: 100,
    maxHealth: 100,
    gold: 0,
    inventory: [],
  },
  enableHistory: true,  // Enable undo/redo
})

// Read state
const state = playerStore.get()
const stateWithoutTracking = playerStore.peek()

// Update state
playerStore.set({ ...state, gold: state.gold + 10 })
playerStore.update((s) => ({ ...s, health: s.health - 20 }))

// Subscribe to changes
const unsubscribe = playerStore.onChange((state, prev) => {
  updateUI(state)
})

// Undo/Redo
playerStore.undo()
playerStore.redo()
```

### Computed Values

```typescript
const healthPercent = createComputed(() => {
  const { health, maxHealth } = playerStore.get()
  return health / maxHealth
})

healthPercent.onChange((value) => {
  healthBar.setValue(value * 100)
})
```

### Game State Manager

```typescript
import { createGameStateManager } from 'tactica'
import { playerStateSchema, worldStateSchema } from 'tactica'

const gameState = await createGameStateManager({
  gameVersion: '1.0.0',
  formatVersion: 1,
  stores: {
    player: { schema: playerStateSchema, enableHistory: true },
    world: { schema: worldStateSchema },
  },
  autoSave: {
    enabled: true,
    intervalMs: 30000,
    onVisibilityHidden: true,
  },
})

// Save/Load
await gameState.save('slot1', 'My Save', { level: 5, location: 'Forest' })
await gameState.load('slot1')

// List saves
const slots = await gameState.getSlots()

// Auto-save
await gameState.autoSave()

// Export/Import (for sharing saves)
const exportData = await gameState.exportSlot('slot1')
const newSlotId = await gameState.importSlot(exportData, 'Imported Save')

// Cross-tab sync
gameState.onRemoteChange((slotId) => {
  // Another tab modified the save
  gameState.refresh()
})
```

---

## Asset Management

```typescript
import { createAssetManager } from 'tactica'

const assets = createAssetManager({
  basePath: 'assets/',
  retryAttempts: 3,
})

// Load individual assets
await assets.loadImage('player', 'sprites/player.png')
await assets.loadAudio('bgm', 'audio/bgm.mp3')
await assets.loadJSON('levels', 'data/levels.json')

// Batch loading
await assets.loadBatch([
  { key: 'enemy', url: 'sprites/enemy.png', type: 'image' },
  { key: 'explosion', url: 'audio/explosion.wav', type: 'audio' },
])

// Progress tracking
assets.onLoadProgress((loaded, total) => {
  loadingBar.setValue((loaded / total) * 100)
})

// Access loaded assets
const playerImage = assets.getImage('player')
const levelData = assets.getJSON<LevelData>('levels')
```

---

## Mobile Features

```typescript
import { createMobileManager } from 'tactica'

const mobile = createMobileManager({
  enableMotionSensors: true,
  enableBatteryMonitoring: true,
  enableNetworkMonitoring: true,
})

// Device detection
mobile.isMobile()  // Phone or tablet
mobile.isTablet()
mobile.isIOS()
mobile.isAndroid()

// Safe areas (for notches)
const insets = mobile.getSafeAreaInsets()
// { top: 44, right: 0, bottom: 34, left: 0 }

// Haptic feedback
mobile.vibrateHaptic({ pattern: 'impact', intensity: 'medium' })

// Orientation
mobile.onOrientationChange((orientation) => {
  if (orientation === 'landscape') {
    // Adjust UI
  }
})
await mobile.lockOrientation('landscape')

// Battery-aware gaming
const battery = await mobile.getBatteryStatus()
if (battery && battery.level < 0.2 && !battery.charging) {
  enableLowPowerMode()
}

// Screen wake lock
await mobile.requestWakeLock()  // Keep screen on
mobile.releaseWakeLock()

// Motion sensors
mobile.onDeviceMotion((motion) => {
  // Tilt controls
  player.move(motion.accelerationX * 10, 0)
})
```

---

## Accessibility

```typescript
import { createAccessibilityManager } from 'tactica'

const a11y = createAccessibilityManager({
  enableScreenReader: true,
  enableKeyboardNavigation: true,
  announceStateChanges: true,
})

// Screen reader
a11y.announce('Game started. Level 1.', 'polite')
a11y.announce('Health critical!', 'assertive')

// System preferences
a11y.onReducedMotionChange((enabled) => {
  if (enabled) {
    disableParticles()
    disableScreenShake()
  }
})

a11y.onHighContrastChange((enabled) => {
  if (enabled) {
    applyHighContrastTheme()
  }
})

// Queries
a11y.isReducedMotionEnabled()
a11y.isHighContrastEnabled()
```

---

## PWA Support

```typescript
import { createPWAManager } from 'tactica'

const pwa = createPWAManager({
  serviceWorkerUrl: '/sw.js',
  autoRegister: true,
})

// Install prompt
pwa.onInstall(() => {
  showInstallBanner()
})

if (pwa.canInstall()) {
  const result = await pwa.promptInstall()
  // result.outcome: 'accepted' | 'dismissed'
}

// Updates
pwa.onUpdate((result) => {
  if (result.available) {
    showUpdateBanner()
  }
})

await pwa.applyUpdate()

// Offline
pwa.onOffline(() => {
  showOfflineIndicator()
})

pwa.onOnline(() => {
  hideOfflineIndicator()
  syncGameState()
})

// Precaching
await pwa.precacheAssets([
  '/assets/sprites/player.png',
  '/assets/audio/bgm.mp3',
])
```

---

## Network/Multiplayer

```typescript
import { createNetworkManager } from 'tactica'

const network = createNetworkManager({
  transport: 'websocket',
  url: 'wss://game-server.example.com',
  autoReconnect: true,
  reconnectDelay: 1000,
  maxReconnectAttempts: 5,
})

// Connection lifecycle
network.onConnect(() => { console.log('Connected') })
network.onDisconnect((reason) => { console.log('Disconnected:', reason) })
network.onReconnect(() => { console.log('Reconnected') })

// Messaging
network.onMessage<PlayerMoved>('player-moved', (msg) => {
  updatePlayerPosition(msg.payload.playerId, msg.payload.x, msg.payload.y)
})

network.send('move', { x: player.getX(), y: player.getY() })
await network.sendReliable('chat', { message: 'Hello!' })

// Stats
const stats = network.getStats()
// { latency, bytesSent, messagesReceived, ... }
```

---

## Performance Monitoring

```typescript
import { createPerformanceMonitor, createDebugTools } from 'tactica'

const perf = createPerformanceMonitor({
  enabled: true,
  sampleRate: 60,
  trackMemory: true,
})

// Metrics
const metrics = perf.getMetrics()
// { fps, frameTime, updateTime, renderTime, drawCalls, entityCount, memoryUsed }

// Debug overlay
const debug = createDebugTools()
debug.setLogLevel('debug')
debug.info('Game started')
debug.warn('Low memory')

// Performance traces
const traceId = debug.startTrace('level-load')
await loadLevel()
debug.endTrace(traceId, true, { levelId: 'forest' })
```

---

## Debug & Development Tools

### Debug Overlay

Visual debug information overlay.

```typescript
import { createDebugOverlay } from 'tactica'

const debugOverlay = createDebugOverlay({
  enabled: true,
  position: 'top-left',
  showFPS: true,
  showMemory: true,
  showEntityCount: true,
  showDrawCalls: true,
  showInputState: true,
  showColliders: true,
  showTouchPoints: true,
  backgroundColor: 'rgba(0,0,0,0.7)',
  textColor: '#ffffff',
  fontSize: 12,
  graphHeight: 50,
  graphHistory: 60,
})

// Events
debugOverlay.onToggle((enabled) => {
  console.log('Debug overlay:', enabled ? 'on' : 'off')
})

debugOverlay.onMetricClick((name) => {
  console.log('Clicked metric:', name)
})

// Toggle
debugOverlay.enable()
debugOverlay.disable()
debugOverlay.toggle()

// Custom metrics
debugOverlay.addMetric({ name: 'Enemies', value: enemies.length, color: '#ff0000' })
debugOverlay.updateMetric('Enemies', enemies.length)
debugOverlay.removeMetric('Enemies')

// Panels
debugOverlay.addPanel({ name: 'Physics', x: 10, y: 200, collapsed: false })
debugOverlay.togglePanel('Physics')

// Display toggles
debugOverlay.setShowFPS(true)
debugOverlay.setShowMemory(true)
debugOverlay.setShowColliders(true)
debugOverlay.setShowTouchPoints(true)

// Logging
debugOverlay.log('Player spawned', 'info')
debugOverlay.clearLogs()

// Update and render
debugOverlay.update(performanceMetrics, inputState)
debugOverlay.render(ctx)
```

### Entity Inspector

Live entity property inspection and editing.

```typescript
import { createEntityInspector } from 'tactica'

const inspector = createEntityInspector({
  enabled: true,
  position: 'right',
  width: 300,
  showComponents: true,
  showTransform: true,
  showBounds: true,
  editableProperties: ['x', 'y', 'rotation', 'opacity'],
})

// Events
inspector.onEntitySelect((entity) => {
  highlightEntity(entity)
})

inspector.onPropertyChange((property, oldValue, newValue) => {
  console.log(`${property}: ${oldValue} -> ${newValue}`)
})

inspector.onOpen(() => pauseGame())
inspector.onClose(() => resumeGame())

// Control
inspector.open()
inspector.close()
inspector.toggle()

// Entity selection
inspector.selectEntity(player)
inspector.selectEntityById('enemy-1')
inspector.clearSelection()

// Property access
const property = inspector.getProperty('x')
inspector.setProperty('x', 100)
inspector.refreshProperties()

// Categories
inspector.expandCategory('Transform')
inspector.collapseCategory('Components')
inspector.toggleCategory('Bounds')

// Property watchers
const unwatch = inspector.addPropertyWatcher({
  property: 'health',
  callback: (value) => console.log('Health:', value),
})

// Update and render
inspector.update(inputState)
inspector.render(ctx)
```

### Command Console

Developer console for runtime commands.

```typescript
import { createCommandConsole } from 'tactica'

const console = createCommandConsole({
  enabled: true,
  toggleKey: '`',
  maxHistory: 100,
  maxLogEntries: 500,
  position: 'bottom',
  height: 200,
})

// Register commands
console.registerCommand({
  id: 'spawn',
  name: 'spawn',
  aliases: ['s'],
  description: 'Spawn an entity at position',
  args: [
    { name: 'type', type: 'string', required: true },
    { name: 'x', type: 'number', required: false, defaultValue: 0 },
    { name: 'y', type: 'number', required: false, defaultValue: 0 },
  ],
  execute: (args, ctx) => {
    spawnEntity(args.type, args.x, args.y)
    return `Spawned ${args.type} at (${args.x}, ${args.y})`
  },
  category: 'debug',
})

console.registerCommand({
  id: 'god',
  name: 'god',
  description: 'Toggle god mode',
  execute: (args, ctx) => {
    godMode = !godMode
    return `God mode: ${godMode ? 'ON' : 'OFF'}`
  },
})

// Events
console.onCommand((command, args) => {
  console.log('Executed:', command)
})

console.onLog((entry) => {
  if (entry.type === 'error') alertError(entry.message)
})

// Control
console.open()
console.close()
console.toggle()

// Execution
console.execute('spawn enemy 100 200')

// Logging
console.log('Game initialized', 'info')
console.log('Low health warning', 'warning')
console.log('Error loading asset', 'error')
console.clear()

// Set context for commands
console.setContext({
  engine: engine,
  scene: currentScene,
  entities: entityMap,
})

// Update and render
console.update(inputState)
console.render(ctx)
```

### Scene Graph Viewer

Hierarchical view of scene entities.

```typescript
import { createSceneGraphViewer } from 'tactica'

const sceneGraph = createSceneGraphViewer({
  enabled: true,
  position: 'left',
  width: 250,
  showIcons: true,
  showSearch: true,
  autoRefresh: true,
  refreshInterval: 500,
})

// Events
sceneGraph.onNodeSelect((node) => {
  if (node.entity) inspector.selectEntity(node.entity)
})

sceneGraph.onNodeExpand((node) => {
  console.log('Expanded:', node.name)
})

// Control
sceneGraph.open()
sceneGraph.close()
sceneGraph.toggle()

// Scene binding
sceneGraph.setScene(currentScene)
sceneGraph.refresh()
sceneGraph.clearScene()

// Node navigation
sceneGraph.selectNode('player')
sceneGraph.expandNode('enemies')
sceneGraph.collapseNode('pickups')
sceneGraph.expandAll()
sceneGraph.collapseAll()

// Search
sceneGraph.search('enemy')
sceneGraph.clearSearch()
const filtered = sceneGraph.getFilteredNodes()

// Keyboard navigation
sceneGraph.navigateUp()
sceneGraph.navigateDown()
sceneGraph.navigateToParent()
sceneGraph.navigateToFirstChild()

// Update and render
sceneGraph.update(inputState)
sceneGraph.render(ctx)
```

### Debug Draw

Primitive drawing for debugging colliders, paths, etc.

```typescript
import { createDebugDraw } from 'tactica'

const debugDraw = createDebugDraw({
  enabled: true,
  defaultColor: '#00ff00',
  lineWidth: 1,
  fontSize: 12,
})

// Enable/disable
debugDraw.enable()
debugDraw.disable()
debugDraw.toggle()

// Layers
debugDraw.addLayer({ name: 'colliders', enabled: true, color: '#ff0000' })
debugDraw.setLayerEnabled('colliders', true)
debugDraw.isLayerEnabled('colliders')

// Draw primitives
debugDraw.point(100, 100, '#ff0000', 5)
debugDraw.line(0, 0, 100, 100, '#00ff00')
debugDraw.rect(50, 50, 100, 80, '#0000ff', false)
debugDraw.circle(200, 200, 50, '#ffff00', true)
debugDraw.polygon([{ x: 0, y: 0 }, { x: 50, y: 100 }, { x: 100, y: 0 }], '#ff00ff')
debugDraw.text(100, 50, 'Debug Text', '#ffffff')

// Utilities
debugDraw.arrow(0, 0, 100, 0, '#00ffff')
debugDraw.cross(100, 100, 20, '#ff0000')
debugDraw.grid(0, 0, 400, 300, 50, '#333333')
debugDraw.bounds(entity.getBounds(), '#00ff00')
debugDraw.velocity(entity, 2, '#ff0000')  // Scale velocity vector
debugDraw.path(pathPoints, '#ffff00')

// Clear and render
debugDraw.clear()
debugDraw.render(ctx, camera)
```

### Frame Budget Tracker

Monitor frame timing and detect performance issues.

```typescript
import { createFrameBudget } from 'tactica'

const frameBudget = createFrameBudget({
  targetFPS: 60,
  warningThreshold: 0.8,  // 80% of budget
  criticalThreshold: 1.0,  // 100% of budget
  trackHistory: 60,
})

// Events
frameBudget.onOverBudget((timing) => {
  console.warn('Over budget:', timing.total, 'ms')
})

frameBudget.onCritical((timing) => {
  console.error('Critical frame:', timing)
  reduceQuality()
})

frameBudget.onRecover(() => {
  console.log('Performance recovered')
  restoreQuality()
})

// In game loop
frameBudget.startFrame()

frameBudget.startPhase('update')
updateGame()
frameBudget.endPhase('update')

frameBudget.startPhase('physics')
updatePhysics()
frameBudget.endPhase('physics')

frameBudget.startPhase('render')
renderGame()
frameBudget.endPhase('render')

frameBudget.startPhase('ui')
renderUI()
frameBudget.endPhase('ui')

frameBudget.endFrame()

// Query state
const state = frameBudget.getState()
const timing = frameBudget.getTiming()
const isOverBudget = frameBudget.isOverBudget()
const isCritical = frameBudget.isCritical()
const averageMs = frameBudget.getAverageMs()
```

### Culling System

Optimize rendering by culling off-screen entities.

```typescript
import { createCullingSystem } from 'tactica'

const culling = createCullingSystem({
  enabled: true,
  strategy: 'frustum',  // 'none' | 'frustum' | 'distance' | 'occlusion'
  margin: 50,  // Extra pixels beyond camera
  updateInterval: 16,  // ms between updates
})

// Control
culling.enable()
culling.disable()
culling.setStrategy('distance')
culling.setMargin(100)

// Query visibility
if (culling.isVisible(entity)) {
  entity.render(ctx)
}

// Get visible entities (optimized)
const visibleEntities = culling.getVisibleEntities(allEntities, camera)

// Or cull in-place
const visible = culling.cullEntities(allEntities, camera)

// Stats
const stats = culling.getStats()
// { totalEntities, visibleEntities, culledEntities, cullingRatio }

// Update (call before rendering)
culling.update(camera)
```

### LOD System

Level of detail for distance-based quality scaling.

```typescript
import { createLODSystem } from 'tactica'

const lod = createLODSystem({
  enabled: true,
  updateInterval: 100,
  referencePoint: 'camera',  // 'camera' | 'player'
  defaultLevels: [
    { level: 0, distance: 0, quality: 'high' },
    { level: 1, distance: 200, quality: 'medium' },
    { level: 2, distance: 500, quality: 'low' },
    { level: 3, distance: 1000, quality: 'minimal', visible: false },
  ],
})

// Register entity-specific LOD
lod.registerConfig({
  id: 'enemy-lod',
  entityType: 'enemy',
  levels: [
    { level: 0, distance: 0, quality: 'high' },
    { level: 1, distance: 150, quality: 'medium' },
    { level: 2, distance: 300, quality: 'low' },
  ],
  transitionDuration: 200,
})

// Query LOD level
const level = lod.getCurrentLevel(entity, distanceToCamera)
const entityLOD = lod.getEntityLOD(entity.id)

// Manual override
lod.setEntityLOD(entity.id, 0)  // Force high quality

// Update (call each frame or at interval)
lod.update(camera.getX(), camera.getY(), allEntities)
```

---

## Helper Functions

Tactica provides a comprehensive set of utility functions for game development. All helpers are pure functions with no side effects.

### Type Guards

Type guards for runtime type checking:

```typescript
import {
  isString, isNonEmptyString, isNumber, isFiniteNumber,
  isBoolean, isNullish, isDefined, isObject, isFunction,
  isArray, isNonEmptyArray, isOk, isErr
} from 'tactica'

// Primitive checks
isString('hello')        // true
isNumber(42)             // true (also checks !isNaN)
isBoolean(true)          // true
isNullish(null)          // true
isDefined(value)         // value !== null && value !== undefined

// Object checks
isObject({ key: 'value' }) // true (plain object, not array)
isArray([1, 2, 3])         // true
isFunction(() => {})       // true

// Result pattern helpers
isOk({ ok: true, value: 42 })    // true
isErr({ ok: false, error: 'fail' }) // true
```

### Utility Functions

General-purpose utilities:

```typescript
import {
  generateId, now, clamp, lerp, deepClone,
  shallowEqual, debounce, throttle, createSpacing
} from 'tactica'

// ID and time
const id = generateId()      // UUID v4 string
const timestamp = now()       // Date.now() wrapper

// Math basics
clamp(150, 0, 100)           // 100
lerp(0, 100, 0.5)            // 50

// Object utilities
const copy = deepClone(obj)  // JSON-safe deep copy
shallowEqual(a, b)           // shallow property comparison

// Function utilities
const debouncedFn = debounce(fn, 300)  // delay execution
const throttledFn = throttle(fn, 100)  // limit call rate

// UI helpers
createSpacing(8)             // { top: 8, right: 8, bottom: 8, left: 8 }
createSpacing({ top: 10 })   // { top: 10, right: 0, bottom: 0, left: 0 }
```

### Distance & Vector Math

Functions for 2D vector operations:

```typescript
import {
  distance, distanceSquared, distanceVec,
  normalize, normalizeVec, magnitude, magnitudeVec,
  angleBetween, angleOf, fromAngle,
  addVec, subVec, scaleVec, dotVec, crossVec,
  rotateVec, perpVec, reflectVec
} from 'tactica'

// Distance calculations
distance(0, 0, 3, 4)          // 5
distanceSquared(0, 0, 3, 4)   // 25 (faster, no sqrt)
distanceVec(vecA, vecB)       // distance between Vector2 objects

// Vector operations
normalize(3, 4)               // { x: 0.6, y: 0.8 }
normalizeVec(vec)             // normalize Vector2 object
magnitude(3, 4)               // 5

// Angle calculations
angleBetween(0, 0, 1, 1)      // angle in radians
angleOf(1, 0)                 // 0 (pointing right)
fromAngle(Math.PI / 2)        // { x: 0, y: 1 } (pointing up)
fromAngle(Math.PI / 4, 10)    // unit vector scaled by 10

// Vector arithmetic
addVec(a, b)                  // { x: a.x + b.x, y: a.y + b.y }
subVec(a, b)                  // { x: a.x - b.x, y: a.y - b.y }
scaleVec(v, 2)                // { x: v.x * 2, y: v.y * 2 }
dotVec(a, b)                  // a.x * b.x + a.y * b.y
crossVec(a, b)                // 2D cross product (z-component)

// Vector transformations
rotateVec(v, Math.PI / 2)     // rotate 90 degrees
perpVec(v)                    // perpendicular vector (90° CCW)
reflectVec(velocity, normal)  // bounce off surface
```

### Clamping & Bounds

Functions for constraining values within bounds:

```typescript
import {
  clamp, clampToRectangle, clampToWorld, wrap, wrapToWorld
} from 'tactica'

// Basic clamping
clamp(150, 0, 100)            // 100 (clamp to range)

// Position clamping
clampToRectangle(x, y, 0, 0, 800, 600)  // clamp to rectangle
clampToWorld(x, y, 16, 800, 600)   // clamp with entity size padding

// Wrapping (for screen wrap behavior)
wrap(810, 0, 800)             // 10 (wraps around)
wrapToWorld(x, y, 800, 600)   // wrap both axes
```

### Interpolation & Easing

Smooth value transitions:

```typescript
import {
  lerp, lerpVec, smoothstep, smootherstep,
  inverseLerp, remap, approach, damp, dampVec
} from 'tactica'

// Linear interpolation
lerp(0, 100, 0.5)             // 50
lerpVec(vecA, vecB, 0.5)      // interpolate Vector2 objects

// Smooth interpolation (ease in-out)
smoothstep(0.5)               // smooth S-curve
smootherstep(0.5)             // Ken Perlin's smoother version

// Range mapping
inverseLerp(0, 100, 50)       // 0.5 (find t from value)
remap(50, 0, 100, 0, 1)       // 0.5 (map between ranges)

// Movement helpers
approach(current, target, 5)  // move toward target by step
damp(current, target, 5, dt) // exponential decay smoothing
dampVec(pos, target, 5, dt)   // smooth vector movement
```

### Random Generation

Functions for procedural generation:

```typescript
import {
  randomRange, randomInt, randomElement,
  randomPosition, randomEdgePosition,
  randomInCircle, randomOnCircle,
  randomDirection, randomSign, randomBool
} from 'tactica'

// Number generation
randomRange(10, 20)           // float between 10 and 20
randomInt(1, 6)               // integer 1-6 inclusive (dice roll)

// Array selection
randomElement(['a', 'b', 'c']) // random array element

// Position generation
randomPosition(0, 800, 0, 600) // random point in rectangle
randomEdgePosition(800, 600)   // random point on rectangle edge
randomInCircle(400, 300, 50)   // random point inside circle
randomOnCircle(400, 300, 50)   // random point on circle edge

// Direction and signs
randomDirection()              // random unit vector
randomSign()                   // -1 or 1
randomBool(0.7)                // true 70% of the time
```

### Collision Detection

Functions for testing overlaps:

```typescript
import {
  circlesOverlap, pointInCircle, pointInRectangle,
  rectsOverlap, circleRectangleOverlap
} from 'tactica'

// Circle collision
circlesOverlap(x1, y1, r1, x2, y2, r2)  // two circles overlap
pointInCircle(px, py, cx, cy, radius)   // point inside circle

// Rectangle collision
pointInRectangle(px, py, rx, ry, rw, rh)     // point inside rectangle
rectsOverlap(x1, y1, w1, h1, x2, y2, w2, h2) // AABB overlap

// Mixed collision
circleRectangleOverlap(cx, cy, r, rx, ry, rw, rh) // circle vs rectangle
```

### Angle Utilities

Functions for working with angles:

```typescript
import {
  degToRad, radToDeg, normalizeAngle,
  angleDifference, lerpAngle, rotateToward
} from 'tactica'

// Conversion
degToRad(90)                  // Math.PI / 2
radToDeg(Math.PI)             // 180

// Angle normalization
normalizeAngle(angle)         // normalize to [-PI, PI]
angleDifference(from, to)     // shortest angular distance

// Angle interpolation
lerpAngle(from, to, 0.5)      // interpolate taking shortest path
rotateToward(current, target, 0.1) // rotate by max step
```

---

## API Reference

### Factory Functions - Core Engine

| Function                      | Description                    |
|-------------------------------|--------------------------------|
| `createEngine(options)`       | Create game engine with canvas |
| `createScene(options)`        | Create a game scene            |
| `createSceneManager(options)` | Manage multiple scenes         |
| `createEntity(options)`       | Create game entities           |
| `createTimerManager(options)` | Game-time aware timers         |

### Factory Functions - Rendering

| Function                                         | Description                               |
|--------------------------------------------------|-------------------------------------------|
| `createCamera(options)`                          | Create camera with follow/shake           |
| `createCameraEffects(camera)`                    | Camera effects (shake, flash, fade, zoom) |
| `createRenderer(context, options)`               | Create renderer with batching             |
| `createViewport(options)`                        | Viewport with scaling modes               |
| `createSpriteSheet(options)`                     | Sprite sheet for animations               |
| `createAnimationPlayer(options)`                 | Animation playback controller             |
| `createTilemap(options)`                         | Tile-based level rendering                |
| `createLayerManager(options)`                    | Render layer management                   |
| `createSpriteBatch(context, assets, options)`    | Batched sprite rendering                  |
| `createTrailRenderer(options)`                   | Visual trails behind objects              |
| `createShapeRenderer(options)`                   | Geometric primitive drawing               |
| `createPostProcessManager(options)`              | Screen-wide visual effects                |
| `createCullingSystem(options)`                   | Frustum/distance culling                  |
| `createLODSystem(options)`                       | Level of detail management                |
| `createTransitionManager(sceneManager, options)` | Screen transitions                        |

### Factory Functions - Input

| Function                             | Description                       |
|--------------------------------------|-----------------------------------|
| `createInputSystem(canvas, options)` | Touch/mouse input handling        |
| `createKeyboardManager(options)`     | Keyboard input with combos        |
| `createGamepadManager(options)`      | Controller input support          |
| `createInputActionSystem(options)`   | Unified input with rebinding      |
| `createVirtualJoystick(options)`     | Virtual joystick for mobile       |
| `createActionButton(options)`        | Touch action button with cooldown |

### Factory Functions - Audio

| Function                          | Description                |
|-----------------------------------|----------------------------|
| `createAudioManager(options)`     | Sound playback and control |
| `createMusicPlaylist(options)`    | Sequential music playback  |
| `createSoundVariantPool(options)` | Random sound variations    |
| `createAudioZoneManager(options)` | Spatial audio zones        |

### Factory Functions - Physics

| Function                      | Description         |
|-------------------------------|---------------------|
| `createPhysicsWorld(options)` | Physics simulation  |
| `createCollisionSystem()`     | Collision detection |

### Factory Functions - Animation

| Function                        | Description                  |
|---------------------------------|------------------------------|
| `createTweenManager(options)`   | Animation tweens with easing |
| `createParticleSystem(options)` | Particle effects             |

### Factory Functions - UI

| Function                             | Description                          |
|--------------------------------------|--------------------------------------|
| `createUIManager(options)`           | Canvas-based UI components           |
| `createToastManager(options)`        | Toast notifications                  |
| `createModal(options)`               | Individual modal dialog              |
| `createModalManager(options)`        | Modal dialogs (alert/confirm/prompt) |
| `createTooltipManager(options)`      | Tooltip system                       |
| `createTextInput(options)`           | Text input field                     |
| `createRadialMenu(options)`          | Circular selection menu              |
| `createMinimap(options)`             | World overview minimap               |
| `createNotificationManager(options)` | In-game notifications                |

### Factory Functions - Storage

| Function                             | Description                |
|--------------------------------------|----------------------------|
| `createStore(options)`               | Reactive state management  |
| `createComputed(compute)`            | Derived state values       |
| `createDatabase(config)`             | IndexedDB database wrapper |
| `createStateManager(config)`         | Game state with save/load  |
| `createTabSyncManager(channelName)`  | Cross-tab synchronization  |
| `createSchema(options)`              | Data validation schema     |
| `createLocalStorageBackend(options)` | localStorage persistence   |
| `createIndexedDBBackend(options)`    | IndexedDB persistence      |
| `createMigrationRunner(options)`     | Data migrations            |

### Factory Functions - Game Systems

| Function                            | Description                            |
|-------------------------------------|----------------------------------------|
| `createBuffSystem(options)`         | Stackable buffs/debuffs with duration  |
| `createHealthSystem(options)`       | Entity health, damage, invincibility   |
| `createFloatingTextSystem(options)` | Animated damage/pickup text            |
| `createCollectibleSystem(options)`  | Pickups with drop tables and magnetism |
| `createSpawnerSystem(options)`      | Entity spawning with zones and waves   |
| `createEffectZoneSystem(options)`   | Areas that trigger effects on entry    |
| `createExperienceSystem(options)`   | XP tracking and level progression      |
| `createStatisticsSystem(options)`   | Game stats and milestone tracking      |
| `createObjectiveSystem(options)`    | Goals and progress tracking            |
| `createStateMachine(options)`       | State transitions for game flow        |
| `createBackgroundSystem(options)`   | Layered backgrounds with parallax      |
| `createCrosshairSystem(options)`    | Desktop aiming cursor                  |
| `createEntityRendererRegistry()`    | Procedural entity rendering registry   |
| `createInventorySystem(options)`    | Item and equipment management          |
| `createDialogueSystem(options)`     | Conversation trees                     |
| `createQuestSystem(options)`        | Quest tracking and rewards             |
| `createCraftingSystem(options)`     | Item crafting with recipes             |

### Factory Functions - Platform

| Function | Description |
|----------|-------------|
| `createMobileManager(options)` | Mobile device features |
| `createAccessibilityManager(options)` | Accessibility support |
| `createPWAManager(options)` | PWA install/update |
| `createNetworkManager(options)` | Network/multiplayer client |

### Factory Functions - Debug

| Function                            | Description               |
|-------------------------------------|---------------------------|
| `createPerformanceMonitor(options)` | FPS and metrics           |
| `createDebugTools()`                | Debug logging             |
| `createDebugOverlay(options)`       | Visual debug overlay      |
| `createFrameBudget(options)`        | Frame timing budget       |
| `createScreenshotManager(canvas)`   | Screenshot capture        |
| `createEntityInspector(options)`    | Entity property inspector |
| `createCommandConsole(options)`     | Developer command console |

### Helper Functions

| Category               | Functions                                                                                                                                                                                                                                                        |
|------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Type Guards**        | `isString`, `isNonEmptyString`, `isNumber`, `isFiniteNumber`, `isBoolean`, `isNullish`, `isDefined`, `isObject`, `isFunction`, `isArray`, `isNonEmptyArray`, `isOk`, `isErr`                                                                                     |
| **Browser Guards**     | `hasDeviceMemory`, `hasGetBattery`, `hasNetworkConnection`, `hasVibrate`, `hasIndexedDB`, `isIDBValidKey`                                                                                                                                                        |
| **Object Guards**      | `hasId`, `hasVersion`, `hasTimestamp`                                                                                                                                                                                                                            |
| **Utilities**          | `generateId`, `now`, `clamp`, `lerp`, `deepClone`, `shallowEqual`, `debounce`, `throttle`, `createSpacing`, `createError`, `validateField`                                                                                                                       |
| **Distance & Vectors** | `distance`, `distanceSquared`, `distanceVec`, `distanceVecSquared`, `normalize`, `normalizeVec`, `magnitude`, `magnitudeVec`, `angleBetween`, `angleOf`, `fromAngle`, `addVec`, `subVec`, `scaleVec`, `dotVec`, `crossVec`, `rotateVec`, `perpVec`, `reflectVec` |
| **Clamping & Bounds**  | `clamp`, `clampToRectangle`, `clampToWorld`, `wrap`, `wrapToWorld`                                                                                                                                                                                               |
| **Interpolation**      | `lerp`, `lerpVec`, `smoothstep`, `smootherstep`, `inverseLerp`, `remap`, `approach`, `damp`, `dampVec`                                                                                                                                                           |
| **Random**             | `randomRange`, `randomInt`, `randomElement`, `randomPosition`, `randomEdgePosition`, `randomInCircle`, `randomOnCircle`, `randomDirection`, `randomSign`, `randomBool`                                                                                           |
| **Collision**          | `circlesOverlap`, `pointInCircle`, `pointInRectangle`, `rectsOverlap`, `circleRectangleOverlap`                                                                                                                                                                  |
| **Angles**             | `degToRad`, `radToDeg`, `normalizeAngle`, `angleDifference`, `lerpAngle`, `rotateToward`                                                                                                                                                                         |

### Type Exports

All types are exported from the main package. Key interfaces include:

**Foundational Types:**
`Vector2`, `Size2`, `Rectangle`, `AABB`, `Transform2D`, `Color`, `Identifiable`, `Timestamped`, `Versioned`, `Result`, `TimedResult`, `PlaybackState`, `LoadingState`, `Unsubscribe`, `Callback`, `AsyncCallback`

**Core Systems:**
`EngineInterface`, `EngineOptions`, `EngineState`, `SceneInterface`, `SceneOptions`, `SceneState`, `SceneManagerInterface`, `EntityInterface`, `EntityOptions`, `EntityTransform`, `EntityBounds`, `TimerManagerInterface`

**Rendering:**
`CameraInterface`, `CameraOptions`, `CameraState`, `CameraBounds`, `CameraEffectsInterface`, `RendererInterface`, `ViewportInterface`, `SpriteSheetInterface`, `AnimationPlayerInterface`, `AnimationState`, `TilemapInterface`, `TilemapLayerInterface`, `TilesetInterface`, `LayerManagerInterface`, `SpriteBatchInterface`, `TrailRendererInterface`, `ShapeRendererInterface`, `PostProcessManagerInterface`, `CullingSystemInterface`, `LODSystemInterface`, `TransitionManagerInterface`

**Input:**
`InputSystemInterface`, `InputState`, `TouchPoint`, `PointerData`, `GestureData`, `GestureType`, `KeyboardManagerInterface`, `KeyboardState`, `KeyBinding`, `KeyCombo`, `GamepadManagerInterface`, `GamepadControllerState`, `GamepadButtonName`, `GamepadAxisName`, `InputActionSystemInterface`, `InputAction`, `InputActionContext`, `VirtualJoystickInterface`, `ActionButtonInterface`

**Audio:**
`AudioManagerInterface`, `AudioPlayOptions`, `AudioState`, `MusicPlaylistInterface`, `MusicTrack`, `PlaylistMode`, `SoundVariantPoolInterface`, `SoundVariant`, `AudioZoneManagerInterface`, `AudioZoneInterface`, `AudioZoneEffect`

**Physics:**
`PhysicsWorldInterface`, `PhysicsBodyOptions`, `PhysicsBodyState`, `CollisionSystemInterface`, `Collider`, `CollisionResult`, `CollisionShape`, `RectangleCollider`, `CircleCollider`, `PolygonCollider`

**Animation:**
`TweenInterface`, `TweenOptions`, `TweenState`, `TweenManagerInterface`, `EasingType`, `ParticleEmitterInterface`, `ParticleEmitterOptions`, `ParticleState`, `ParticleSystemInterface`

**UI Components:**
`UIManagerInterface`, `UIElement`, `InteractiveUIElement`, `ButtonInterface`, `ButtonOptions`, `TextInterface`, `TextOptions`, `ProgressBarInterface`, `SliderInterface`, `CheckboxInterface`, `ToggleInterface`, `PanelInterface`, `UIImageInterface`, `TextInputInterface`, `ToastManagerInterface`, `ToastState`, `ModalInterface`, `ModalManagerInterface`, `TooltipManagerInterface`, `RadialMenuInterface`, `MinimapInterface`, `NotificationManagerInterface`

**Storage:**
`StoreInterface`, `StoreOptions`, `ComputedInterface`, `DatabaseInterface`, `DatabaseConfig`, `StateManagerInterface`, `StateManagerConfig`, `SaveSlot`, `Snapshot`, `SchemaInterface`, `SchemaResult`, `TabSyncManagerInterface`, `StorageBackendInterface`, `MigrationRunnerInterface`, `MigrationDefinition`

**Game Systems:**
`BuffSystemInterface`, `BuffConfig`, `ActiveBuff`, `HealthSystemInterface`, `DamageInfo`, `HealthEntityState`, `FloatingTextSystemInterface`, `FloatingTextEntry`, `CollectibleSystemInterface`, `Collectible`, `DropTableEntry`, `SpawnerSystemInterface`, `SpawnZone`, `WaveConfig`, `EffectZoneSystemInterface`, `EffectZone`, `ExperienceSystemInterface`, `LevelReward`, `StatisticsSystemInterface`, `StatisticDef`, `MilestoneDef`, `ObjectiveSystemInterface`, `ObjectiveDef`, `ObjectiveProgress`, `StateMachineInterface`, `StateTransition`, `BackgroundSystemInterface`, `BackgroundLayer`, `StarfieldLayer`, `CrosshairSystemInterface`, `EntityRendererRegistryInterface`, `InventorySystemInterface`, `GameItem`, `GameItemStack`, `DialogueSystemInterface`, `DialogueTree`, `DialogueNode`, `DialogueChoice`, `QuestSystemInterface`, `Quest`, `QuestObjective`, `QuestReward`

**Platform:**
`MobileManagerInterface`, `DeviceCapabilities`, `SafeAreaInsets`, `BatteryStatus`, `NetworkInfo`, `AccessibilityManagerInterface`, `PWAManagerInterface`, `NetworkManagerInterface`, `NetworkMessage`, `NetworkStats`

**Debug:**
`PerformanceMonitorInterface`, `PerformanceMetrics`, `DebugToolsInterface`, `DebugOverlayInterface`, `DebugMetric`, `FrameBudgetInterface`, `FrameTiming`, `ScreenshotManagerInterface`, `ScreenshotResult`, `EntityInspectorInterface`, `CommandConsoleInterface`, `CommandDef`

**Lightweight Entity Types:**
`SimpleEntityInterface`, `MovingEntityInterface`, `RectangularEntityInterface`, `CircularEntityInterface`, `RemovalReason`

---

## License

MIT License - See LICENSE file for details.


