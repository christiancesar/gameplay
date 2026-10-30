# SFU-03 · Orçamento do SFU e qualidade escolhida por quem assiste

> Pontos: 5 · Modelo sugerido: Sonnet · Depende de: SFU-02, SFU-04 · Onda 5

## Contexto
O SFU cobra a saída para cada espectador. A franquia grátis é de 1.000 GB por mês, dividida com o TURN, e depois custa US$ 0,05/GB. A Cloudflare não oferece teto de cobrança que eu tenha encontrado, então o limite precisa estar na aplicação. Com o SFU, quem assiste também pode escolher uma camada menor e baixar menos.

## Escopo
- Orçamento mensal em GB no módulo `limits`, editável no bloco do SFU da aba Mídia (SFU-04). Padrão de 800 GB *(suposição, deixa margem para o TURN)*.
- Medição: quem assiste em modo SFU manda, de tempos em tempos, os bytes recebidos (do `getStats`) pelo socket. A API soma por mês *(suposição: conferir depois com os números da Cloudflare)*.
- Ao chegar no orçamento, `GET /api/media/sfu` passa a responder `budget-exhausted`. Transmissões novas só abrem em Direto (Mesh), se ele estiver ligado (SFU-04). As que já estão no SFU continuam até acabar *(suposição: cortar no meio da live seria pior para quem assiste)*.
- Consumo do mês contra o orçamento no bloco do SFU da aba Mídia.
- Seletor de qualidade no player de quem assiste: Auto, Alta, Média e Baixa. No SFU troca a camada pela API (`tracks/update`). No mesh, quem transmite reduz o envio só daquela conexão (`setParameters`), usando o `stream:quality` que já existe.
- Qualidade de cada espectador no monitor em modo SFU, a partir do mesmo relato de `getStats`.

## Fora do escopo
Orçamento por servidor. Alerta de billing na conta da Cloudflare (configuração manual, fica anotada em `06-producao-aws.md`).

## Referências
- `plans/[complete]-media-transport/media-transport-options.md` seções 2.3, 5 e 7
- `plans/[complete]-production-infrastructure/06-producao-aws.md` seções 4 e 11
- Cloudflare: [Pricing](https://developers.cloudflare.com/realtime/sfu/platform/pricing/)

## Checklist
- [x] Orçamento no `limits` e no painel do admin
- [x] Relato de bytes pelo socket e soma mensal na API
- [x] SFU indisponível ao estourar o orçamento
- [x] Seletor de qualidade nos dois modos
- [x] Qualidade por espectador no monitor em SFU
- [x] Stories, i18n e testes
- [x] Commit

## Critério de aceite
Com o orçamento baixado para perto do consumo, a próxima live só oferece "Direto (Mesh)". Quem assiste escolhe "Baixa" e o bitrate recebido cai, nos dois modos.

## Notas da execução
- **Orçamento:** coluna `sfuBudgetGb` em `platform_settings` (padrão 800) e tabela `media_usage` (bytes do SFU por mês UTC, `"2026-10"`), migration `sfu_budget`. GB conta como 1.000.000.000 bytes. A aba Mídia mostra "X GB de Y GB usados em 2026-10", com uma barra que fica âmbar a partir de 80% e vermelha no limite, e o campo para mudar o orçamento (`PUT /api/admin/media/budget`, de 0 a 100000; 0 tira o SFU das transmissões novas).
- **Medição:** quem assiste pelo SFU manda `media:usage` pelo socket a cada 10 s, com os bytes recebidos desde o último relato (vídeo e áudio, limitado a 25 MB por relato) e a qualidade que está chegando. A API confere que quem transmite está na mesma sala e no modo SFU (no Direto não conta, porque não custa), soma os bytes do mês num incremento atômico e repassa a qualidade para quem transmite (`stream:received`). *(Suposição: conferir depois com os números da Cloudflare; o que acontece nos últimos segundos antes de parar de assistir não é relatado.)*
- **Estourou o orçamento:** o `GET /api/media/sfu` e o que o servidor oferece passam a dizer `budget-exhausted`, e publicar no SFU volta `SFU_BUDGET_EXHAUSTED`. O diálogo de compartilhar mostra "A cota de transmissão pelo servidor deste mês acabou" e abre no Direto. Quem já está no SFU continua, e quem chega para assistir uma live em andamento ainda consegue.
- **Qualidade de quem assiste:** seletor no player com Auto, Alta, Média e Baixa, guardado para a próxima live como o volume. No SFU troca a camada sem renegociar (Auto e Alta: `f`, Média: `h`, Baixa: `q`); Auto deixa o SFU descer quando a rede não aguenta. No Direto, quem transmite reduz só a conexão daquela pessoa (Média: metade da resolução e 35% do bitrate; Baixa: um quarto, 10% e até 15 fps), usando o `stream:quality` que a API já repassava.
- **Monitor no SFU:** "Detalhes" mostra a qualidade de cada espectador pelo que eles informam, com o texto explicando que no SFU cada um recebe a camada que a rede aguenta.
- **Teste com a Cloudflare de verdade** (mesmo script headless do SFU-02): quem assistia recebia 720p · 29 fps; escolher Baixa trocou a camada (`PUT .../layer` 204) e passou a chegar 180p · 14 fps; o consumo do mês apareceu em `GET /api/admin/media`; os Detalhes de quem transmitia mostraram a qualidade de quem assistia.
- **Stories:** `StreamViewer/ChooseQuality`, `ShareDetailsDialog/ThroughServer`, `Admin/AdminPanel/MediaBudget`.
- **Testes:** API (orçamento, relato e repasse, recusa ao estourar, e2e com relato pelo socket e orçamento zerado) e web (camada e qualidade no Direto, relato de bytes, qualidade por espectador, ViewModels). O e2e rodou com Postgres temporário; o do S3 não rodou.
- **Teste com vídeo de verdade (2026-10-27):** um trecho de 60 s do Big Buck Bunny (720p, com som) tocando na página de quem transmite, no lugar do seletor de tela, e dois Chromium headless contra a Cloudflare. Pelo SFU quem assistia recebeu 720p · 30 fps (até 5,5 Mbps), e o som da tela chegou no volume do próprio filme (RMS 0,009 a 0,015, contra cerca de -40 dB no arquivo). Baixa, Média e Alta deram 180p · 15 fps, 360p · 30 fps e 720p · 30 fps. No Direto (Mesh) os mesmos três níveis funcionaram. O teste com a aba do YouTube não deu: o Chrome automatizado sempre compartilha a própria aba do app, porque o seletor não aparece sem janela.
- **Consumo pela Cloudflare:** com o token do `infra/production/.env`, a API de analytics respondeu o mês (SFU e TURN separados), então as credenciais e as consultas estão certas.

