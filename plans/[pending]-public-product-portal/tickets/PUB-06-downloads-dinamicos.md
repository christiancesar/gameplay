# PUB-06 · Downloads dinâmicos por manifesto

> Pontos: 5 · Depende de: PUB-04, WIN-01 · Branch `feature/linux-appimage-release`, saída da `dev`

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

- [x] Workflow gera o `.deb`, o `AppImage` e o ZIP Linux
- [x] Workflow prepara os artefatos Windows e Linux para envio ao S3
- [x] Manifesto versionado e estável são publicados após os artefatos
- [x] API serve o manifesto e os artefatos sem autenticação
- [x] Página `/download` consulta e exibe a versão do manifesto
- [x] Botão Windows abre o instalador atual
- [x] Botões Linux baixam o `.deb` e o AppImage atuais
- [x] Erro do manifesto não quebra a página pública, os seeds continuam como fallback
- [x] Storybook continua funcionando com seed fake

## Critério de aceite

Depois de uma nova execução do workflow, a página `/download` passa a mostrar a nova versão e os botões Windows e Linux apontam para os artefatos publicados, sem alteração manual no código do cliente.

## Notas do planejamento

- _(decisão do usuário)_ O MVP não terá assinatura Authenticode nem outra validação paga de autenticidade.
- _(decisão do usuário)_ O formato principal do Linux será `AppImage`.
- _(decisão do usuário)_ O S3 será a origem operacional dos artefatos. O GitHub Releases continuará como histórico da release.

## Notas da execução

- O manifesto tem `version`, `publishedAt`, arquitetura, formato, URL, tamanho e SHA-256 para Windows, DEB e AppImage.
- O workflow usa `downloads/releases/<version>/` como prefixo imutável e publica `downloads/stable/latest.json` por último.
- A API expõe `/api/downloads/latest` e `/api/downloads/stable/:artifact`, mantendo o endereço S3 somente no servidor.
- O ViewModel usa TanStack Query, valida a resposta com schema Zod e mantém o seed como fallback de Storybook e de erro.
- A View mostra cada formato como uma linha da última release dentro do card da plataforma, com botão de download e acesso às instruções específicas pelo ícone de livro.
- O modal de instruções cobre o instalador Windows, `sudo apt install ./gameplay.deb` e a permissão/execução do AppImage, em inglês e português.
- O modal do AppImage também aponta opcionalmente para a página oficial de releases do AppImageLauncher, onde o usuário escolhe a versão e o pacote compatível.
- _(suposição)_ A variável `DOWNLOADS_BASE_URL` apontará para o prefixo S3 `downloads` em produção.
- _(pendência externa)_ Ainda falta executar uma release real, publicar o manifesto na infraestrutura e validar os downloads e a instalação do AppImage.
