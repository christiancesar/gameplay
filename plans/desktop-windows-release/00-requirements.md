# 00 · Requisitos: release Windows, assinatura e atualização

> Data: 2026-10-29. Status: planejamento iniciado, aguardando revisão do usuário.

## 1. Objetivo

Criar uma distribuição Windows confiável para o Gameplay Desktop, com instalador Squirrel.Windows, binários assinados e atualização automática do aplicativo sem reinstalação manual.

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

### 3.1 Assinatura

- Toda release Windows de produção deve ser assinada com certificado emitido por uma autoridade confiável.
- A chave privada não pode entrar no repositório, no artefato ou nos logs do Actions.
- O instalador, o executável principal, o auxiliar nativo WASAPI e demais PE distribuídos devem ser considerados no desenho da assinatura.
- A release deve falhar se a assinatura obrigatória não for aplicada ou validada.
- O pipeline deve usar timestamp para manter a validade da assinatura após a expiração do certificado.

### 3.2 Atualização

- O app deve consultar atualizações apenas no canal oficial do Gameplay, independente do servidor Gameplay escolhido pelo usuário.
- O usuário deve ser informado quando houver uma versão pronta para instalar.
- A instalação deve ocorrer no reinício ou por uma ação explícita do usuário.
- Falhas de rede, feed indisponível ou versão inválida não podem impedir o app de abrir.
- A primeira abertura após a instalação Squirrel não deve iniciar uma consulta enquanto os arquivos ainda estiverem bloqueados.
- A versão atualmente instalada e o estado da atualização devem ser observáveis em logs locais e, se habilitado, no Sentry.

### 3.3 Publicação

- Uma release deve publicar os artefatos do instalador e os artefatos necessários ao feed na mesma versão.
- O feed deve ter uma URL estável por canal, inicialmente `stable`.
- Releases incompletas não devem ser consumíveis pelo app.
- O processo deve permitir rollback operacional para a versão anterior sem reconstruir o aplicativo.

## 4. Decisões em aberto

- Certificado OV tradicional ou serviço de assinatura gerenciado disponível para a conta e região do projeto.
- S3 como armazenamento dos artefatos, com GitHub Releases como histórico da versão.
- Endpoint estável em `https://gameplay.oikos.company/api/updates/windows/stable/RELEASES`, servindo ou redirecionando para o S3.
- Política de atualização: baixar automaticamente e pedir reinício, ou pedir confirmação antes do download.
- Canal futuro, como `beta`, fora do primeiro ticket, mas sem fechar a arquitetura para ele.

## 5. Fora do escopo

- Assinatura ou atualização do Linux.
- macOS.
- Microsoft Store e MSIX.
- Atualização da UI do servidor por OTA.
- Atualização automática do servidor self-hosted.
