import { describe, it, expect } from 'vitest'

// Smoke test: confirms Vitest + jsdom + jest-dom setup are wired correctly.
describe('test environment', () => {
  it('provides a jsdom document', () => {
    expect(typeof document).toBe('object')
  })

  it('has jest-dom matchers available via setupTests', () => {
    const el = document.createElement('div')
    el.textContent = 'ok'
    document.body.appendChild(el)
    expect(el).toBeInTheDocument()
  })
})
