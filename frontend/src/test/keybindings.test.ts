import { describe, it, expect, vi } from 'vitest'

// isAppShortcut only needs the keybinding defaults; stub settings so the test does not
// pull in the full settings/runtime machinery.
vi.mock('../composables/useSettings', () => ({ settings: { keybindings: {} } }))

import { isAppShortcut } from '../composables/useKeybindings'

// The app's shortcut modifier is ⌘ on macOS and Ctrl elsewhere; isAppShortcut bakes this
// from navigator.platform at module load. Mirror it here so the test is deterministic on
// whatever platform it runs on.
const IS_MAC = /Mac|iPhone|iPod|iPad/i.test(navigator.platform)
const withPrimary = (init: KeyboardEventInit) =>
  new KeyboardEvent('keydown', IS_MAC ? { ...init, metaKey: true } : { ...init, ctrlKey: true })
const withOther = (init: KeyboardEventInit) =>
  new KeyboardEvent('keydown', IS_MAC ? { ...init, ctrlKey: true } : { ...init, metaKey: true })

describe('isAppShortcut — app shortcuts must pass through xterm to the global handler', () => {
  it('claims the bound combos (new tab / split / close / tab-switch / pane focus)', () => {
    expect(isAppShortcut(withPrimary({ key: 't' }))).toBe(true)                  // new tab
    expect(isAppShortcut(withPrimary({ key: 'd' }))).toBe(true)                  // split horizontal
    expect(isAppShortcut(withPrimary({ key: 'd', shiftKey: true }))).toBe(true)  // split vertical
    expect(isAppShortcut(withPrimary({ key: 'w' }))).toBe(true)                  // close tab
    expect(isAppShortcut(withPrimary({ key: '3' }))).toBe(true)                  // switch to tab 3
    expect(isAppShortcut(withPrimary({ key: 'ArrowLeft', altKey: true }))).toBe(true) // focus neighbor
  })

  it('leaves terminal control keys for the PTY (Ctrl+C / plain keys)', () => {
    expect(isAppShortcut(withPrimary({ key: 'c' }))).toBe(false)                 // SIGINT stays with the shell
    expect(isAppShortcut(new KeyboardEvent('keydown', { key: 'd' }))).toBe(false) // no modifier
  })

  it('only the platform primary modifier triggers (on macOS Ctrl+D stays EOF)', () => {
    expect(isAppShortcut(withOther({ key: 'd' }))).toBe(false)
  })

  it('requires an exact modifier/shift match (Ctrl+Shift+T is not the new-tab binding)', () => {
    expect(isAppShortcut(withPrimary({ key: 't', shiftKey: true }))).toBe(false)
  })
})
