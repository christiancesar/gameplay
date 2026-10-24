# Transporte de mídia: mesh e SFU

> Criado em 2026-10-24. Proposta em discussão, nada aqui foi implementado.
> Decisões do usuário: custo zero como padrão, com as duas opções disponíveis. **MVP só com mesh; SFU fica para a fase seguinte** (2026-10-24).
> Itens marcados como **(suposição)** são propostas minhas e precisam de confirmação.

## 0. Escopo do MVP

- Só mesh, para voz e tela.
- Sem seletor de modo no diálogo de transmissão e sem configuração de SFU no painel do admin.
- A interface `MediaTransport` continua, para o `SfuTransport` entrar depois sem mudar ViewModels e Views.
- O monitor do F8 segue como está (tabela por espectador em mesh).
- As seções 2 a 5 descrevem a fase seguinte.

## 1. As duas opções

### Mesh (direto, P2P)

```
Streamer --8 Mbps--> A
         --8 Mbps--> B
         --8 Mbps--> C
upload do streamer = bitrate × número de espectadores
```

- A mídia vai direto de um browser para o outro. O servidor só faz a sinalização (Socket.IO).
- Cada espectador tem a própria conexão e o próprio encoder no streamer.
- **Custo:** zero, exceto quando a conexão precisa de TURN (franquia grátis do Cloudflare, ver seção 5).
- **Limite:** o upload e a CPU de quem transmite. Com 1080p60 a ~8 Mbps, um upload de 30 Mbps aguenta uns 3 espectadores.
- **Latência:** a menor possível, sem salto intermediário.
- **Privacidade:** os participantes veem o IP uns dos outros.

### SFU (via servidor)

```
Streamer --8 a 11 Mbps--> SFU --> A
                              --> B
                              --> C
upload do streamer fixo, qualquer número de espectadores
```

- O streamer sobe a mídia uma vez. O SFU repassa uma cópia para cada espectador, sem decodificar nem recodificar.
- Com **simulcast**, o streamer envia três camadas (exemplo: 1080p60, 720p30, 360p15), cerca de 1,4 vezes a camada maior. Cada espectador recebe a camada que escolheu ou que a rede dele aguenta.
- **Custo:** o download de cada espectador é egress pago pelo servidor.
- **Limite:** o orçamento de egress, não a banda do streamer.
- **Latência:** um salto até o SFU. Com PoP em São Paulo, poucos ms.
- **Privacidade:** os participantes não veem o IP uns dos outros. O operador do SFU poderia, em tese, acessar a mídia (criptografia ponta a ponta via Insertable Streams fica para depois).

### Comparação

| | Mesh | SFU |
|---|---|---|
| Upload do streamer | cresce com cada espectador | fixo |
| Encoders no streamer | um por espectador | um (com camadas) |
| Espectadores suportados | 2 a 4 em 1080p60, depende do upload | limitado pelo orçamento |
| Custo do servidor | zero (fora TURN) | egress por GB assistido |
| Qualidade por espectador | o streamer ajusta cada conexão | o espectador escolhe a camada |
| Latência | menor | +poucos ms |

## 2. Como oferecer as duas ao usuário

A escolha certa depende de quantas pessoas estão assistindo e do upload de quem transmite. Quem sabe isso em tempo real é o app, não o usuário. Por isso a proposta é o **modo automático** como padrão, com controle manual para quem quiser.

### 2.1 Quem decide o quê (suposição)

| Papel | Onde | O que controla |
|---|---|---|
| `platform_admin` | Painel do admin, no módulo `limits` | Liga ou desliga o SFU na plataforma, define o orçamento mensal de egress (GB) e pode dar override por servidor. |
| Streamer | Diálogo antes de transmitir (F8), junto do preset | **Modo**: Automático (padrão), Direto ou Via servidor. |
| Espectador | Player ao assistir | **Qualidade**: Auto (padrão), Alta, Média ou Baixa. |

Owner e admin do servidor não controlam o modo no MVP. O custo é da plataforma, então quem decide é o `platform_admin`.

### 2.2 Modo do streamer

- **Automático (padrão):** começa em mesh. Muda para SFU quando uma das condições acontece:
  - o número de espectadores passa de um limite (exemplo: 3, configurável no `limits`);
  - o monitor detecta `qualityLimitationReason = bandwidth` por alguns segundos, ou seja, o upload não está dando conta.
  
  Volta para mesh quando os espectadores caem abaixo do limite, ou quando o orçamento do SFU acaba.
- **Direto:** sempre mesh. Útil para quem tem upload sobrando e quer latência mínima.
- **Via servidor:** sempre SFU, enquanto houver orçamento.

Se o SFU estiver desligado ou sem orçamento, o seletor mostra só "Direto", com o motivo.

### 2.3 Qualidade do espectador (consumo sob demanda)

O espectador escolhe quanto quer baixar. Funciona nos dois modos, de formas diferentes:

- **SFU:** o espectador troca de camada do simulcast. Não afeta o streamer nem os outros espectadores.
- **Mesh:** o pedido vai pelo Socket.IO para o streamer, que reduz o encoding só daquela conexão (`setParameters` com `scaleResolutionDownBy` e `maxBitrate`). Isso também libera upload do streamer.

"Auto" deixa o controle de congestionamento escolher.

### 2.4 Troca de modo durante a transmissão

A troca entre mesh e SFU é feita em "make before break" (suposição):
1. O streamer passa a publicar também no SFU.
2. Cada espectador assina o stream do SFU.
3. Quando a imagem nova chega, a conexão antiga é fechada.

Deve aparecer no máximo uma piscada curta. Não precisa reiniciar o compartilhamento de tela nem abrir o seletor do browser de novo.

### 2.5 O que aparece na interface

- **Diálogo antes de transmitir:** preset, prioridade (Fluidez ou Nitidez) e modo.
- **Monitor ao vivo (F8):** um selo "Direto" ou "Via servidor".
  - Em mesh, a tabela por espectador continua como está.
  - Em SFU, o streamer vê o envio dele para o SFU, e a qualidade de cada espectador vem do `getStats` do espectador, enviado pelo Socket.IO.
  - Em automático, o monitor mostra quando e por que trocou de modo.
- **Player do espectador:** seletor de qualidade.
- **Painel do admin:** consumo do mês contra o orçamento, por servidor.

## 3. Voz

**Voz sempre em mesh** (suposição). Cada pessoa envia ~50 kbps por participante; numa sala cheia de 10, são ~450 kbps de upload, que qualquer conexão aguenta. Passar a voz pelo SFU gastaria franquia sem ganho perceptível.

Consequência: dois transportes rodam ao mesmo tempo (voz em mesh, tela em mesh ou SFU). A interface `MediaTransport` passa a ter implementações separadas por tipo de mídia: `MeshTransport` para voz e para tela no modo direto, `SfuTransport` para tela no modo via servidor.

## 4. Fornecedor do SFU

| Opção | Custo | Observações |
|---|---|---|
| **Cloudflare Realtime SFU** (recomendado) | 1.000 GB/mês grátis, depois US$ 0,05/GB. O upload para a Cloudflare é grátis. | Anycast com PoP em São Paulo, sem servidor para operar. A franquia é compartilhada com o TURN, e o tráfego que passa pelos dois não é cobrado em dobro. |
| LiveKit self-hosted | Instância + egress da AWS (~US$ 0,09/GB em us-east-1, mais caro em sa-east-1) | Open source, salas e SDK prontos. Mais um serviço para operar. |
| LiveKit Cloud | Free tier de ~50 GB/mês, planos pagos a partir de US$ 50 | Valores vindos de blogs de terceiros, confirmar na página oficial. |

Com a Cloudflare, o Nest cria as sessões do SFU pela API dela, e o token fica só no servidor. O módulo `ice` vira `media`: credenciais TURN, sessões do SFU e controle do orçamento.

## 5. Como manter custo zero

- O padrão é mesh, e o automático só usa o SFU quando ele resolve um problema real.
- Só quem clica em "Assistir" puxa o stream, e só isso gera egress.
- O espectador pode baixar uma camada menor.
- **Orçamento mensal** no `limits`, abaixo da franquia grátis (exemplo: 800 GB, deixando margem para o TURN). Ao chegar no limite, novas transmissões ficam só em mesh e as que estão em SFU voltam para mesh.
- **Medição do consumo:** cada espectador em SFU reporta os bytes recebidos (do `getStats`) pelo Socket.IO, e a API acumula por mês. Conferir com a API de analytics da Cloudflare (suposição).
- **A verificar:** se a Cloudflare permite um teto rígido de cobrança. Se não permitir, o orçamento da aplicação é a única proteção, e convém um alerta de billing na conta.

Referência de consumo: 1080p60 a ~6 Mbps de média dá ~2,7 GB por hora por espectador. A franquia de 1.000 GB cobre cerca de 370 horas-espectador por mês.

## 6. Decisões pendentes

1. Confirmar o modelo de papéis da seção 2.1 (admin liga e define orçamento; streamer escolhe o modo; espectador escolhe a qualidade).
2. Limite de espectadores para o automático trocar para SFU (exemplo: 3).
3. Voz sempre em mesh.
4. Fornecedor do SFU: Cloudflare Realtime SFU.
5. Orçamento mensal padrão (exemplo: 800 GB).
6. ~~SFU entra no MVP ou numa fase seguinte~~. Decidido: fase seguinte, MVP só mesh.
7. Seletor de qualidade do espectador (seção 2.3) em mesh: entra no MVP ou junto do SFU? Em mesh ele já funciona e economiza upload do streamer.

Os itens 1 a 5 só precisam ser decididos quando o SFU entrar.

## Fontes

- [Cloudflare Realtime SFU pricing](https://developers.cloudflare.com/realtime/sfu/pricing)
- [Cloudflare Realtime pricing](https://developers.cloudflare.com/realtime/pricing/)
- [LiveKit pricing 2026 (trtc.io)](https://trtc.io/blog/details/livekit-pricing-2026)
