import { isTauri } from '../composables/useTransport'
import { IS_MAC } from '../composables/useKeybindings'

export async function copyToClipboard(text: string): Promise<void> {
  // Desktop (Tauri WebKitGTK) blocks the webview clipboard API, so use the native
  // clipboard plugin there; the browser deployment keeps navigator.clipboard.
  if (isTauri() && !IS_MAC) {
    try {
      const { writeText } = await import('@tauri-apps/plugin-clipboard-manager')
      await writeText(text)
      return
    } catch { /* fall back to the webview clipboard below */ }
  }
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    ta.remove()
  }
}

export async function readFromClipboard(): Promise<string> {
  if (isTauri() && !IS_MAC) {
    try {
      const { readText } = await import('@tauri-apps/plugin-clipboard-manager')
      return await readText()
    } catch { /* fall back to the webview clipboard below */ }
  }
  return navigator.clipboard.readText()
}
