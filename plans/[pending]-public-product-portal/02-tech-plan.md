# 02 · Plano técnico: portal público do Gameplay

## 1. Arquitetura

As Views públicas ficam em `packages/client`, consumidas pela casca web. No primeiro passo, dados de roadmap, changelog e downloads são constantes tipadas, separadas das Views.

```text
packages/client/src/
├─ modules/public/
│  ├─ model/
│  │  ├─ entities/
│  │  └─ seeds/
│  ├─ views/
│  ├─ screens/
│  └─ view-models/
└─ app/routes/
   ├─ index.tsx
   ├─ download.tsx
   ├─ roadmap.tsx
   └─ changelog/
```

## 2. Dados e persistência

- Roadmap, changelog e solicitações de features são persistidos no banco pela API.
- `features.json` em `plans/[pending]-features` é a fonte dos seeds públicos iniciais.
- A API pública filtra apenas conteúdo publicado.
- O fallback de Storybook continua separado dos dados de produção.
- Nenhum seed deve conter segredo ou URL privada.

## 3. Downloads

As páginas humanas usam `https://gameplay.oikos.company/download`. A página consulta um manifesto público de última versão, servido por uma URL estável da API. O feed do updater continua separado:

```text
Página: https://gameplay.oikos.company/download
Manifesto: https://gameplay.oikos.company/api/downloads/latest
Feed:   https://gameplay.oikos.company/api/updates/windows/stable/RELEASES
```

O manifesto contém os links do instalador Windows e do AppImage Linux, além da versão, arquitetura, tamanho e checksum. O `autoUpdater` não deve depender do renderer nem da página de download.

## 4. Rotas e navegação

- A rota declara apenas `validateSearch`, `beforeLoad`, `loader` e `component`.
- Views não usam `Link` ou `useNavigate`.
- A navegação chega como callback da Screen.
- Usuários autenticados podem receber callbacks para `/hub` ou escolha de servidor.
- Storybook usa callbacks falsos e não exige Router.

## 5. Ordem

1. Shell público e navegação.
2. Home e Downloads estáticos.
3. Roadmap persistido e administrável.
4. Changelog persistido com detalhe e busca.
5. Rotas reais.
6. Integração com dados, votos e solicitações, concluída na API e no painel administrativo.

## 6. Estado atual

- O painel `Public` administra roadmap, changelog e solicitações de features.
- O roadmap público lista os itens em ordem vertical, abre detalhes em modal e permite votos para usuários autenticados.
- O CTA de solicitação abre um modal e exige autenticação para envio.
- O MCP do conteúdo público fica no servidor central de MCP do desktop; não existe uma rota MCP duplicada no painel público.
