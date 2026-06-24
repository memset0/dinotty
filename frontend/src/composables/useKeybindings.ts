import { settings } from './useSettings'

export interface KeyBinding {
  key: string
  shift: boolean
}

export interface KeyBindingDef {
  id: string
  defaultBinding: KeyBinding
  icon: string
  titleKey: string
}

const defs: KeyBindingDef[] = [
  { id: 'togglePalette', defaultBinding: { key: 'k', shift: false }, icon: '⌘K', titleKey: 'keybinding.togglePalette' },
  { id: 'openBookmarks', defaultBinding: { key: 'b', shift: true }, icon: '★', titleKey: 'keybinding.openBookmarks' },
  { id: 'newTab', defaultBinding: { key: 't', shift: false }, icon: '＋', titleKey: 'keybinding.newTab' },
  { id: 'closeTab', defaultBinding: { key: 'w', shift: false }, icon: '✕', titleKey: 'keybinding.closeTab' },
  { id: 'splitHorizontal', defaultBinding: { key: 'd', shift: false }, icon: '⊞', titleKey: 'keybinding.splitHorizontal' },
  { id: 'splitVertical', defaultBinding: { key: 'd', shift: true }, icon: '⊟', titleKey: 'keybinding.splitVertical' },
  { id: 'toggleBroadcast', defaultBinding: { key: 'i', shift: true }, icon: '⬤', titleKey: 'keybinding.toggleBroadcast' },
  { id: 'toggleZoom', defaultBinding: { key: 'Enter', shift: true }, icon: '⤢', titleKey: 'keybinding.toggleZoom' },
  { id: 'equalizePanes', defaultBinding: { key: '=', shift: false }, icon: '⊞', titleKey: 'keybinding.equalizePanes' },
  { id: 'focusNextPane', defaultBinding: { key: ']', shift: false }, icon: '→', titleKey: 'keybinding.focusNextPane' },
  { id: 'focusPrevPane', defaultBinding: { key: '[', shift: false }, icon: '←', titleKey: 'keybinding.focusPrevPane' },
  { id: 'searchTerminal', defaultBinding: { key: 'f', shift: false }, icon: '🔍', titleKey: 'keybinding.searchTerminal' },
]

// macOS uses ⌘ (metaKey) as the shortcut modifier; every other platform uses Ctrl.
export const IS_MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPod|iPad/i.test(navigator.platform)
const PRIMARY_MOD_LABEL = IS_MAC ? '⌘' : 'Ctrl'

function resolveBinding(id: string): KeyBinding {
  const def = defs.find(d => d.id === id)
  if (!def) return { key: '', shift: false }
  return settings.keybindings[id] ?? def.defaultBinding
}

// True when a keydown matches an app-level shortcut handled by onGlobalKeydown in App.vue.
// The terminal consults this (via xterm's attachCustomKeyEventHandler) to let these combos
// pass THROUGH instead of being swallowed as terminal control characters when a pane is
// focused — otherwise Ctrl+D reaches the PTY as EOF (closing the shell) and Ctrl+T as ^T,
// so the shortcut never fires. Uses the platform modifier (⌘ on macOS, Ctrl elsewhere) so
// that e.g. Ctrl+D on macOS still sends EOF to the terminal. Keep the three categories below
// in sync with onGlobalKeydown.
export function isAppShortcut(e: KeyboardEvent): boolean {
  const primary = IS_MAC ? e.metaKey : e.ctrlKey
  if (!primary) return false
  // primary (+Shift) + Arrow → focus neighbor / keyboard resize
  if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown')) return true
  // primary + 1..9 → switch tab
  if (!e.shiftKey && e.key >= '1' && e.key <= '9') return true
  // primary (+Shift) + bound key
  for (const def of defs) {
    const b = resolveBinding(def.id)
    const eventKey = b.key.length === 1 ? e.key.toLowerCase() : e.key
    if (eventKey === b.key.toLowerCase() && e.shiftKey === b.shift) return true
  }
  return false
}

export function useKeybindings() {
  function getBinding(id: string): KeyBinding {
    return resolveBinding(id)
  }

  function formatBinding(binding: KeyBinding): string[] {
    const parts: string[] = [PRIMARY_MOD_LABEL]
    if (binding.shift) parts.push('⇧')
    parts.push(binding.key.toUpperCase())
    return parts
  }

  function getAllWithDisplay() {
    return defs.map(def => {
      const binding = getBinding(def.id)
      return {
        ...def,
        binding,
        display: formatBinding(binding),
      }
    })
  }

  return { defs, getBinding, formatBinding, getAllWithDisplay }
}
