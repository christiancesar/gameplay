import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('react-i18next', async () => (await import('@/shared/test/fake-i18n')).fakeI18nModule)

import { useAdminMcpViewModel } from './use-admin-mcp.view-model'

describe('useAdminMcpViewModel', () => {
  it('keeps the MCP panel unavailable until the local server exists', () => {
    const { result } = renderHook(() => useAdminMcpViewModel())

    expect(result.current.state).toBe('unavailable')
    expect(result.current.documentation).toEqual(['admin.mcp.docs.local', 'admin.mcp.docs.future'])
    expect(result.current.onStart()).toBeUndefined()
    expect(result.current.onStop()).toBeUndefined()
  })
})
