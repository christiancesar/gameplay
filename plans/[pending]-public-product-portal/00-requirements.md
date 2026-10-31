# 00 · Requisitos: portal público do Gameplay

> Data: 2026-10-30. Status: planejamento revisado, aguardando execução.

## 1. Objetivo

Criar uma área pública simples e navegável para apresentar o Gameplay, encaminhar o usuário ao Hub, oferecer downloads e comunicar a evolução do produto. O conteúdo editorial do roadmap e do changelog será gerenciado pelo painel administrativo e persistido no banco de dados.

## 2. Rotas

- `/`: Home pública inspirada na clareza do Notion, sem copiar sua identidade visual.
- `/download`: downloads recomendados por sistema operacional.
- `/roadmap`: roadmap público inicialmente estático.
- `/changelog`: lista cronológica de atualizações.
- `/changelog/:slug`: detalhe de uma atualização.
- `/sign-in` e `/sign-up`: autenticação existente.
- `/hub`: área autenticada existente.
- `/admin/public/roadmap`: administração dos itens públicos do roadmap.
- `/admin/public/changelog`: administração das entradas públicas do changelog.
- `/admin/public/feature-requests`: moderação das solicitações de features.
- `/admin/public/mcp`: ativação e configuração da automação local via MCP.

## 3. Requisitos

- Usuário deslogado pode navegar pela Home, Downloads, Roadmap e Changelog.
- Usuário deslogado recebe CTA para login ou cadastro.
- Usuário logado pode abrir o Hub ou escolher um servidor.
- `/download` recomenda Windows ou Linux quando possível, mas sempre oferece escolha manual.
- Roadmap começa estático e preparado para receber votos no futuro.
- Changelog começa estático, com listagem, busca e detalhe.
- Admin da plataforma pode criar e editar roadmap, changelog e solicitações de features pela seção `Public`.
- Usuário autenticado pode votar em itens publicados e abrir solicitações de features.
- O MCP local pode consultar e alterar os recursos públicos mediante ativação explícita e token temporário.
- Toda navegação usa callbacks nas Views, respeitando MVVM.
- A navegação pública usa o `NavigationMenu` do shadcn quando a integração for adequada ao layout.
- As telas devem ter stories para estados principais, incluindo tema claro e escuro.

## 4. Fora do escopo inicial

- Integração com GitHub Projects.
- CMS genérico ou público.
- API pública do Changelog.
- Download autenticado.
- Personalização por servidor antes do login.
- MCP remoto ou acesso direto do MCP ao banco de dados.
