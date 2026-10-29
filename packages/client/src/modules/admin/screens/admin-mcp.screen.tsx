import { useAdminMcpViewModel } from '@/modules/admin/view-models/use-admin-mcp.view-model'
import { McpTabView } from '@/modules/admin/views/mcp-tab.view'

export function AdminMcpScreen() {
  return <McpTabView {...useAdminMcpViewModel()} />
}
