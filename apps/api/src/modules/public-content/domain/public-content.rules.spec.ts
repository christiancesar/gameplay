import { describe, expect, it } from 'vitest'
import { publishedAtFor } from './public-content.rules'

describe('publishedAtFor', () => {
  it('publishes immediately when content becomes published', () => {
    expect(publishedAtFor('published')).toBeInstanceOf(Date)
  })

  it('keeps an existing publication date when editing published content', () => {
    const current = new Date('2026-10-30T12:00:00.000Z')
    expect(publishedAtFor('published', undefined, current)).toBe(current)
  })

  it('clears the date for draft and archived content', () => {
    expect(publishedAtFor('draft')).toBeNull()
    expect(publishedAtFor('archived')).toBeNull()
  })

  it('honors an explicit date or explicit clearing', () => {
    expect(publishedAtFor('published', '2026-10-29T12:00:00.000Z')).toEqual(new Date('2026-10-29T12:00:00.000Z'))
    expect(publishedAtFor('published', null)).toBeNull()
  })
})
