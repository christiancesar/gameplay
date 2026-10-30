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

## 2. Dados iniciais

- `download-seed.ts`: plataformas, arquitetura, versão exibida e URL pública.
- `roadmap-seed.ts`: itens, status, descrição e prioridade visual.
- `changelog-seed.ts`: slug, data, título, resumo, conteúdo, tags e versão.
- Nenhum seed deve conter segredo ou URL privada.

## 3. Downloads

As páginas humanas usam `https://gameplay.oikos.company/download`. Os links apontam para assets públicos ou para um endpoint estável. O feed do updater continua separado:

```text
Página: https://gameplay.oikos.company/download
Feed:   https://gameplay.oikos.company/api/updates/windows/stable/RELEASES
```

O manifest público pode recomendar o download, mas o `autoUpdater` não deve depender do renderer nem da página de download.

## 4. Rotas e navegação

- A rota declara apenas `validateSearch`, `beforeLoad`, `loader` e `component`.
- Views não usam `Link` ou `useNavigate`.
- A navegação chega como callback da Screen.
- Usuários autenticados podem receber callbacks para `/hub` ou escolha de servidor.
- Storybook usa callbacks falsos e não exige Router.

## 5. Ordem

1. Shell público e navegação.
2. Home e Downloads estáticos.
3. Roadmap estático.
4. Changelog estático com detalhe.
5. Rotas reais.
6. Integração futura com dados, votos e solicitações.
