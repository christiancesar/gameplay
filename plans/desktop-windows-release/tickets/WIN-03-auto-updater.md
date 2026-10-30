# WIN-03 · Atualização automática no Electron

> Pontos: 8 · Depende de: WIN-01 e WIN-02 · Branch `feature/windows-auto-updater`, saída da `dev`

## Escopo

- Criar o módulo de updates no processo principal.
- Configurar o feed oficial por build/canal.
- Ignorar desenvolvimento, instalação inicial e argumentos especiais do Squirrel.
- Implementar estados de verificação, download, pronto para instalar e erro.
- Evitar verificações concorrentes.
- Expor ao renderer apenas o contrato mínimo necessário para UX.
- Adicionar i18n, ViewModel, View e story se houver UI nova.
- Aplicar a atualização após confirmação ou no próximo reinício, conforme decisão do usuário.
- Cobrir testes unitários com fake do updater e um teste instalado em duas versões.

## Fora do escopo

Promoção de canal, rollback operacional, atualização da UI por OTA, beta channel e atualização Linux.

## Checklist

- [ ] Feed não depende do servidor escolhido pelo usuário
- [ ] Primeiro launch não falha por lock do Squirrel
- [ ] Versão nova é detectada
- [ ] Download é concluído
- [ ] Atualização é aplicada
- [ ] Feed indisponível não impede o app de abrir
- [ ] Logs e Sentry não contêm tokens ou URLs privadas

## Critério de aceite

Uma instalação Windows da versão anterior detecta e instala uma nova release assinada sem reinstalação manual.
