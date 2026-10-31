import { McpTabView } from '@/modules/admin/views/mcp-tab.view'
import { useAdminMcpViewModel } from '@/modules/admin/view-models/use-admin-mcp.view-model'

function AdminPublicMcpScreen() {
  return <McpTabView {...useAdminMcpViewModel()} />
}

export { AdminPublicMcpScreen }
