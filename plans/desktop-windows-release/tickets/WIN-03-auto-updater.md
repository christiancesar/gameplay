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

- [x] Feed não depende do servidor escolhido pelo usuário
- [x] Primeiro launch não falha por lock do Squirrel
- [ ] Versão nova é detectada
- [ ] Download é concluído
- [ ] Atualização é aplicada
- [x] Feed indisponível não impede o app de abrir
- [x] Logs e Sentry não contêm tokens ou URLs privadas

## Critério de aceite

Uma instalação Windows da versão anterior detecta e instala uma nova release assinada sem reinstalação manual.

## Notas da execução

- Foi criado o módulo `UpdatesService` no processo principal. Ele usa o feed oficial `https://gameplay.oikos.company/api/updates/windows/stable` e não consulta o servidor escolhido pelo usuário.
- O módulo ignora desenvolvimento, plataformas diferentes de Windows e todos os argumentos `--squirrel-*`, incluindo o primeiro launch com `--squirrel-firstrun`.
- A verificação inicia dez segundos após o startup para evitar o lock inicial do Squirrel. Falhas são registradas e não impedem a abertura do app.
- O download do Electron é automático quando há update. A aplicação ocorre no próximo reinício, sem expor `autoUpdater` ao renderer nesta primeira etapa.
- Testes unitários do serviço cobrem as condições de startup, o feed oficial e falha de rede.
- _(pendência externa)_ Ainda falta testar duas versões instaladas no Windows com uma release assinada real.
