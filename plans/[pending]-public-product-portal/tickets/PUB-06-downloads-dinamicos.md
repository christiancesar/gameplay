# PUB-06 · Downloads dinâmicos por manifesto

> Pontos: 5 · Depende de: PUB-04, WIN-01 · Branch a definir, saída da `dev`

## Objetivo

Fazer a página `https://gameplay.oikos.company/download` sempre mostrar a última release completa do Gameplay para Windows e Linux, sem alteração manual de código a cada publicação.

## Escopo

- Definir um manifesto público de downloads com versão, plataforma, formato, arquitetura, URL, tamanho e checksum.
- Fazer o workflow publicar o instalador Windows, o `.deb` Linux e o `AppImage` Linux no S3, em um prefixo imutável por versão.
- Publicar o manifesto estável somente depois que todos os artefatos forem enviados e validados.
- Expor o manifesto por uma URL estável do domínio do Gameplay, preferencialmente por um endpoint read-only da API.
- Conectar o ViewModel de Downloads ao manifesto usando TanStack Query e validar a resposta com schema do Model.
- Manter a recomendação automática de Windows/Linux e a escolha manual.
- Mostrar estado de carregamento, erro e ausência de uma plataforma.
- Manter os seeds atuais como fallback de Storybook, sem usá-los como fonte de produção.

## Fora do escopo

- Assinatura Authenticode ou validação paga de autenticidade.
- Atualização automática do app Windows pelo `autoUpdater`.
- Canal beta, histórico de versões e CMS.
- Download autenticado ou dependência do servidor Gameplay escolhido pelo usuário.

## Formato inicial proposto

```json
{
  "version": "0.0.6",
  "publishedAt": "2026-10-30T04:06:29Z",
  "downloads": {
    "windows": {
      "architecture": "x64",
      "format": "squirrel-installer",
      "url": "https://gameplay.oikos.company/api/downloads/stable/windows",
      "size": 157138944,
      "sha256": "..."
    },
    "linuxDeb": {
      "architecture": "x64",
      "format": "deb",
      "url": "https://gameplay.oikos.company/api/downloads/stable/linux-deb",
      "size": 0,
      "sha256": "..."
    },
    "linuxAppImage": {
      "architecture": "x64",
      "format": "appimage",
      "url": "https://gameplay.oikos.company/api/downloads/stable/linux-appimage",
      "size": 0,
      "sha256": "..."
    }
  }
}
```

Os URLs públicos podem ser endpoints estáveis que redirecionam ou fazem proxy para o objeto imutável do S3. O nome e a localização do arquivo não devem ficar espalhados no front-end.

## Checklist

- [ ] Workflow gera o `.deb` e o `AppImage` Linux
- [ ] Artefatos Windows e Linux são enviados ao S3
- [ ] Manifesto estável é publicado após os artefatos
- [ ] API serve o manifesto sem autenticação
- [ ] Página `/download` exibe a versão do manifesto
- [ ] Botão Windows abre o instalador atual
- [ ] Botões Linux baixam o `.deb` e o AppImage atuais
- [ ] Erro do manifesto não quebra a página pública
- [ ] Storybook continua funcionando com seed fake

## Critério de aceite

Depois de uma nova execução do workflow, a página `/download` passa a mostrar a nova versão e os botões Windows e Linux apontam para os artefatos publicados, sem alteração manual no código do cliente.

## Notas do planejamento

- _(decisão do usuário)_ O MVP não terá assinatura Authenticode nem outra validação paga de autenticidade.
- _(decisão do usuário)_ O formato principal do Linux será `AppImage`.
- _(decisão do usuário)_ O S3 será a origem operacional dos artefatos. O GitHub Releases continuará como histórico da release.
