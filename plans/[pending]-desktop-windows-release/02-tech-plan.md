# 02 · Plano técnico: release desktop, downloads e update Squirrel

## 1. Componentes

```text
GitHub Actions
  ├─ build Electron
  ├─ gera instalador Windows e AppImage Linux
  ├─ gera artefatos Squirrel
  └─ publica release imutável

Canal de update
  └─ endpoint estável no domínio principal + S3/CDN

Electron main
  ├─ define feed oficial
  ├─ verifica depois do startup
  ├─ baixa e registra estado
  └─ aplica com quitAndInstall ou no próximo launch
```

## 2. Artefatos Squirrel

O ticket de empacotamento deve confirmar quais arquivos o `MakerSquirrel` 8 gera para a configuração atual. O conjunto Windows esperado inclui o instalador `Setup.exe`, o pacote `.nupkg` e o arquivo `RELEASES`. O conjunto Linux deve incluir um `AppImage` executável, com nome estável o bastante para ser referenciado pelo manifesto.

O workflow deve preservar o instalador Windows, o AppImage Linux, os artefatos Squirrel necessários ao update e, se desejado, os ZIPs como downloads alternativos. O AppImage é o download principal do Linux.

## 3. Feed e hospedagem

### S3 e endpoint estável

Publicar os artefatos Windows e Linux em prefixos imutáveis do S3 e expor um manifesto estável para a página de download. O plano deve validar:

- se o endpoint serve ou redireciona corretamente o `RELEASES`;
- se o redirecionamento para os assets do S3 preserva o comportamento esperado pelo Squirrel;
- se o download do `.nupkg` funciona sem autenticação;
- se o download do AppImage funciona sem autenticação;
- se o manifesto sempre aponta para a última versão completa;
- se cache e `Content-Type` não quebram a atualização;
- se o limite de tráfego é suficiente para o tamanho e o grupo esperado.

Se o GitHub exigir uma camada de resolução, criar um endpoint pequeno, preferencialmente no mesmo domínio de update. Ele só deve retornar a URL da versão promovida ou redirecionar para um asset imutável.

O bucket pode ser privado para escrita e público somente por CDN ou endpoint. O endpoint público expõe somente:

- `GET /api/updates/windows/stable/RELEASES`;
- `GET /api/updates/windows/stable/latest.json`, se for útil para diagnóstico ou UI;
- os arquivos estáticos do canal por redirecionamento ou proxy controlado.

O bucket não deve aceitar escrita pública. O Actions publica usando credencial restrita ao prefixo de updates. A promoção altera um ponteiro pequeno, não reescreve versões antigas.

## 4.1 Páginas públicas

As páginas humanas ficam no domínio principal e são detalhadas em `plans/[complete]-public-product-portal/`. O download recomendado pela página pode usar uma versão pública do manifest, mas não deve ser a fonte de verdade do `autoUpdater`.

## 4. Configuração do Electron

- Criar módulo no processo principal, provavelmente em `apps/desktop/src/main/modules/updates/`.
- Não expor `autoUpdater` diretamente ao renderer.
- Expor ao renderer apenas estado e comandos mínimos pelo `packages/desktop-bridge`, se a UI precisar mostrar progresso ou ação de reinício.
- Usar `app.getVersion()` para logs e diagnóstico.
- Configurar `autoUpdater.setFeedURL` apenas para builds empacotados e para o canal suportado.
- Não executar `checkForUpdates` em desenvolvimento, em argumentos `--squirrel-*` ou durante `--squirrel-firstrun`.
- Registrar `checking-for-update`, `update-available`, `update-not-available`, `download-progress`, `update-downloaded` e `error` com dados sem segredos.
- Garantir que uma única verificação esteja ativa por vez.
- Aplicar a atualização somente depois de `update-downloaded`, com escolha de UX definida no ticket.

## 5. Assinatura no CI

Assinatura Authenticode não faz parte do MVP atual. O workflow deve validar existência, tamanho e checksum dos artefatos, sem bloquear a publicação por ausência de certificado.

## 6. Rollback e promoção

- O workflow gera a versão, publica artefatos e valida hashes e assinaturas.
- A versão só é promovida para `stable` depois da validação do instalador.
- A versão anterior continua disponível.
- Para rollback, o pipeline aponta o feed para a versão anterior, sem apagar assets.
- O app registra a versão do feed e a versão instalada para facilitar diagnóstico.

## 7. Validação

- Instalação limpa numa VM Windows sem a versão anterior.
- Existência e integridade do `Setup.exe`, do AppImage e dos artefatos referenciados pelo manifesto.
- Primeiro launch sem erro de lock do Squirrel.
- Atualização de `0.0.1` para `0.0.2`.
- App fechado e aberto durante download.
- Feed indisponível, resposta 404, asset incompleto e assinatura inválida.
- Rollback do canal para uma versão anterior.
- Execução com servidor Gameplay diferente do servidor de produção.
- Verificação de que o servidor escolhido não muda a URL de update.

## 8. Ordem dos tickets

1. Confirmar artefatos Squirrel e hospedagem mínima.
2. Adicionar assinatura e validação ao workflow.
3. Implementar o módulo `autoUpdater` e a bridge de estado.
4. Automatizar publicação, promoção, rollback e documentação.
