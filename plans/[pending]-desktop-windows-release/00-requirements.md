# 00 · Requisitos: release Windows/Linux e atualização

> Data: 2026-10-29. Status: planejamento iniciado, aguardando revisão do usuário.

## 1. Objetivo

Criar uma distribuição do Gameplay Desktop para Windows e Linux, com instalador Squirrel.Windows, AppImage e publicação automática da última versão na página pública de download.

As páginas públicas de descoberta e download ficam no domínio principal, em `gameplay.oikos.company`, enquanto o S3 armazena os arquivos e o feed técnico permanece atrás de uma URL estável do Gameplay.

O escopo cobre o instalador e o próprio app Electron. A atualização OTA da UI, descrita no plano original do desktop, continua separada.

## 2. Situação atual

- `apps/desktop/forge.config.ts` já usa `MakerSquirrel`.
- O workflow `.github/workflows/desktop-release.yml` já compila Windows em `windows-latest`.
- O release atual publica o instalador `.exe` e um `.zip` no GitHub Releases.
- O app trata os argumentos de instalação do Squirrel por meio de `electron-squirrel-startup`.
- Não há configuração de assinatura Authenticode.
- Não há módulo chamando `autoUpdater`.
- O workflow não publica nem expõe ainda um feed Squirrel consumível pelo `autoUpdater`.
- Ainda não existe uma página pública dedicada em `/download` para recomendar o download adequado ao sistema do visitante.

## 3. Requisitos funcionais

### 3.0 Portal público

- A página humana de download deve ser `https://gameplay.oikos.company/download`.
- Roadmap e Changelog devem ser páginas públicas no mesmo domínio.
- A Home pública deve encaminhar usuários deslogados para login ou cadastro e usuários logados para o Hub ou escolha de servidor.
- A página deve recomendar Windows ou Linux quando conseguir identificar o sistema, mantendo escolha manual.
- A página não deve depender de o visitante estar autenticado.

### 3.1 Atualização

- O app deve consultar atualizações apenas no canal oficial do Gameplay, independente do servidor Gameplay escolhido pelo usuário.
- O usuário deve ser informado quando houver uma versão pronta para instalar.
- A instalação deve ocorrer no reinício ou por uma ação explícita do usuário.
- Falhas de rede, feed indisponível ou versão inválida não podem impedir o app de abrir.
- A primeira abertura após a instalação Squirrel não deve iniciar uma consulta enquanto os arquivos ainda estiverem bloqueados.
- A versão atualmente instalada e o estado da atualização devem ser observáveis em logs locais e, se habilitado, no Sentry.

### 3.2 Publicação e downloads

- Uma release deve publicar o instalador Windows, o AppImage Linux e, opcionalmente, os pacotes auxiliares na mesma versão.
- Os artefatos devem ser armazenados no S3 em um prefixo imutável por versão.
- O pipeline deve publicar um manifesto estável, por exemplo `downloads/stable/latest.json`, depois que todos os artefatos forem validados.
- A página `/download` deve consultar esse manifesto e sempre mostrar a última versão disponível, sem alteração manual de código ou seed.
- O feed Squirrel deve ter uma URL estável por canal, inicialmente `stable`.
- Releases incompletas não devem ser consumíveis pelo app.
- O processo deve permitir rollback operacional para a versão anterior sem reconstruir o aplicativo.

## 4. Decisões em aberto

- S3 como armazenamento dos artefatos, com GitHub Releases como histórico da versão.
- Formato final do manifesto público e se a API fará proxy dele ou se a página consultará uma URL pública do S3.
- Endpoint estável em `https://gameplay.oikos.company/api/updates/windows/stable/RELEASES`, servindo ou redirecionando para o S3.
- Política de atualização: baixar automaticamente e pedir reinício, ou pedir confirmação antes do download.
- Canal futuro, como `beta`, fora do primeiro ticket, mas sem fechar a arquitetura para ele.

## 5. Fora do escopo

- Assinatura Authenticode e validação paga de autenticidade.
- macOS.
- Microsoft Store e MSIX.
- Atualização da UI do servidor por OTA.
- Atualização automática do servidor self-hosted.
