import { render } from 'preact-render-to-string'
import type { VNode } from 'preact'

export function renderPage(vnode: VNode): string {
  return '<!DOCTYPE html>\n' + render(vnode)
}
