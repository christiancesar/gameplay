import { describe, expect, it } from 'vitest'

import { uploadsUrl } from './uploads-url'

describe('uploadsUrl', () => {
  it('puts a path under /uploads/ on the server, with its query', () => {
    expect(uploadsUrl('https://play.example.com', 'app://gameplay/uploads/avatars/a.png?v=2')).toBe(
      'https://play.example.com/uploads/avatars/a.png?v=2',
    )
    expect(uploadsUrl('http://localhost:8080', 'app://gameplay/uploads/x.webp')).toBe(
      'http://localhost:8080/uploads/x.webp',
    )
  })

  it('answers nothing before there is a server', () => {
    expect(uploadsUrl(null, 'app://gameplay/uploads/a.png')).toBeNull()
  })

  it('answers nothing for a path outside /uploads/, even when dots lead out of it', () => {
    expect(uploadsUrl('https://play.example.com', 'app://gameplay/api/auth/get-session')).toBeNull()
    expect(uploadsUrl('https://play.example.com', 'app://gameplay/uploads/../api/health')).toBeNull()
    expect(uploadsUrl('https://play.example.com', 'app://gameplay/uploads')).toBeNull()
  })
})
