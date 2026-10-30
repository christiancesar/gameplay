# Release Windows, assinatura e atualização

Este documento descreve a publicação do desktop Windows, a assinatura Authenticode e a atualização automática do Gameplay.

## Visão geral

O workflow `desktop-release.yml` gera os artefatos Squirrel, publica o histórico no GitHub Releases e envia o feed para o bucket S3 existente:

```text
s3://gameplay-uploads-<account-id>/updates/windows/stable/
```

O aplicativo não acessa o S3 diretamente. O feed oficial é:

```text
https://gameplay.oikos.company/api/updates/windows/stable/RELEASES
```

A API faz proxy para o S3 usando `WINDOWS_UPDATE_FEED_BASE_URL`. Em produção, essa variável fica em `infra/production/.env`, sem o sufixo `/stable`:

```env
WINDOWS_UPDATE_FEED_BASE_URL=https://gameplay-uploads-<account-id>.s3.us-east-1.amazonaws.com/updates/windows
```

Depois de alterar o `.env`, execute o deploy da API para carregar a configuração no container.

## Assinatura Authenticode

A assinatura Authenticode identifica o publisher e permite ao Windows verificar a integridade de executáveis e DLLs. O certificado de produção deve ser emitido por uma autoridade certificadora, como DigiCert, Sectigo ou GlobalSign.

Um certificado autoassinado serve apenas para desenvolvimento ou uma rede interna administrada. Ele não é confiável por padrão nos computadores dos usuários e não resolve o SmartScreen.

### Modalidade futura do pipeline

O pipeline de assinatura está adiado. Quando for retomado, uma opção será usar um certificado PFX temporário no runner:

1. A autoridade certificadora emite o certificado de assinatura de código.
2. O certificado e a chave privada são disponibilizados em um arquivo PFX protegido por senha, quando o provedor permitir essa modalidade.
3. O PFX é convertido para Base64 e armazenado como secret no GitHub.
4. O runner recria o arquivo somente em `RUNNER_TEMP`.
5. O MakerSquirrel assina os executáveis durante a geração do instalador.
6. O workflow verifica os executáveis, DLLs e o `Setup.exe` antes de publicar.
7. O arquivo temporário é removido junto com o runner.

O arquivo `.cer` contém apenas a parte pública e não é suficiente para assinar. O PFX contém a chave privada e deve ser tratado como uma credencial de alto impacto.

Certificados OV atuais podem exigir que a chave privada permaneça em HSM ou hardware seguro. Nesse caso, não se deve exportar um PFX. A alternativa é usar assinatura remota ou gerenciada e adaptar a etapa do workflow para o CLI ou API do provedor.

### Configuração no GitHub

No environment `electron-production`, o workflow espera:

| Tipo | Nome | Conteúdo |
| --- | --- | --- |
| Secret | `WINDOWS_CERTIFICATE_BASE64` | PFX convertido para Base64 |
| Secret | `WINDOWS_CERTIFICATE_PASSWORD` | Senha do PFX |
| Variable | `WINDOWS_CERTIFICATE_SUBJECT` | Subject ou nome esperado do publisher |

O workflow também usa `WINDOWS_TIMESTAMP_SERVER`, definido no próprio workflow como `https://timestamp.digicert.com`. A assinatura usa SHA-256 e timestamp RFC 3161.

Para cadastrar pelo GitHub CLI, sem colocar a senha no histórico do shell:

```bash
gh secret set WINDOWS_CERTIFICATE_BASE64 \
  --repo christiancesar/gameplay \
  --env electron-production \
  < <(base64 -w0 /caminho/certificado.pfx)

gh secret set WINDOWS_CERTIFICATE_PASSWORD \
  --repo christiancesar/gameplay \
  --env electron-production

gh variable set WINDOWS_CERTIFICATE_SUBJECT \
  --repo christiancesar/gameplay \
  --env electron-production \
  --body 'CN=Nome do Publisher'
```

O subject deve ser conferido no certificado emitido. Não coloque o PFX, a senha ou a chave privada no repositório, em issues ou em mensagens.

### Rotação

Quando o certificado for substituído:

1. Gere ou receba o novo certificado pelo provedor.
2. Atualize os dois secrets e a variável do subject no environment.
3. Execute uma release de teste.
4. Verifique a assinatura no `Setup.exe`, no executável principal e no auxiliar nativo.
5. Revogue ou remova o certificado anterior conforme a política do provedor.

Se uma chave privada aparecer em logs, terminal compartilhado ou histórico de comandos, trate-a como comprometida e faça a rotação imediatamente.

## Publicação e atualização

As releases Windows são publicadas atualmente sem assinatura Authenticode. Isso mantém o custo inicial zero, mas pode gerar aviso de publisher desconhecido ou alerta do SmartScreen. A assinatura deverá ser retomada antes de uma distribuição pública de maior escala.

O job `publish` assume a role AWS `gameplay-github-updates` via OIDC. Essa role pode publicar somente no prefixo `updates/windows/*` do bucket existente. Nenhuma access key AWS é armazenada no GitHub.

O aplicativo Windows consulta o feed oficial depois de dez segundos do startup, somente em uma instalação empacotada. Ele ignora desenvolvimento e os argumentos `--squirrel-*`, incluindo o primeiro launch do Squirrel. O download é automático e a instalação ocorre no próximo reinício.

O servidor escolhido pelo usuário não altera a URL de atualização. O feed sempre pertence ao Gameplay oficial.

## Checklist de teste

- [ ] Certificado de produção configurado no environment `electron-production`.
- [ ] API publicada com `WINDOWS_UPDATE_FEED_BASE_URL`.
- [ ] Release Windows gerada pelo workflow.
- [ ] `RELEASES` acessível sem autenticação pelo domínio do Gameplay.
- [ ] `.nupkg` baixado pelo endpoint do Gameplay.
- [ ] Publisher e assinatura válidos nas propriedades do Windows.
- [ ] Instalação limpa concluída.
- [ ] Versão anterior atualizada para a nova versão.
- [ ] Falha de rede não impede a abertura do app.

Referências: [Microsoft SignTool](https://learn.microsoft.com/en-us/windows/win32/seccrypto/signtool), [assinatura de código para apps Windows](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options) e [atualização de aplicações Electron](https://www.electronjs.org/docs/latest/tutorial/updates).
