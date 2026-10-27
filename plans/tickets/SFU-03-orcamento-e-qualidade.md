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
- `plans/media-transport-options.md` seções 2.3, 5 e 7
- `plans/06-producao-aws.md` seções 4 e 11
- Cloudflare: [Pricing](https://developers.cloudflare.com/realtime/sfu/platform/pricing/)

## Checklist
- [ ] Orçamento no `limits` e no painel do admin
- [ ] Relato de bytes pelo socket e soma mensal na API
- [ ] SFU indisponível ao estourar o orçamento
- [ ] Seletor de qualidade nos dois modos
- [ ] Qualidade por espectador no monitor em SFU
- [ ] Stories, i18n e testes
- [ ] Commit

## Critério de aceite
Com o orçamento baixado para perto do consumo, a próxima live só oferece "Direto (Mesh)". Quem assiste escolhe "Baixa" e o bitrate recebido cai, nos dois modos.
