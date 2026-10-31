import { useTranslation } from 'react-i18next'

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'

function PublicMcpTabView() {
  const { t } = useTranslation()
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('admin.public.mcp.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">{t('admin.public.mcp.description')}</p>
      </CardContent>
    </Card>
  )
}

export { PublicMcpTabView }
