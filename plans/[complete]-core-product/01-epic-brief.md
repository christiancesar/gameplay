# 01 · Epic Brief: gameplay

> Nome de trabalho: **gameplay**. Data: 2026-10-22. Base: `00-requirements.md`.

## Resumo

O gameplay é um app web privado onde grupos pequenos de amigos conversam por voz e assistem à tela uns dos outros enquanto jogam. O acesso é fechado: só entra quem recebe um convite do administrador. Cada pessoa pode criar um servidor para o seu grupo, com salas onde a conversa e as transmissões acontecem. O compartilhamento de tela é o centro do produto: precisa chegar a 1080p a 60 quadros por segundo, de graça, com escolha da janela ou da tela. Áudio e vídeo trafegam direto entre os computadores dos participantes, e o app guarda apenas o mínimo (contas, servidores, salas e configurações). Este épico entrega o MVP para um grupo inicial de até cerca de 20 pessoas.

## Contexto e problema

**Quem é afetado:** um grupo fechado de amigos (até ~20 pessoas no início) que joga junto e usa o Discord para conversar e mostrar o jogo uns aos outros.

**Onde dói:** no momento de compartilhar a tela. O Discord deixou de oferecer compartilhamento de tela adequado e, quando oferecia, cobrava assinatura para transmitir em qualidade alta. Assistir ao jogo de um amigo em baixa resolução ou com travamentos tira o sentido da experiência.

**A dor atual:**
- Qualidade de transmissão limitada ou paga, insuficiente para acompanhar jogos.
- Dependência de uma plataforma de terceiros que muda regras e preços sem aviso.
- Nenhum controle sobre quem participa e sobre os dados do grupo.

**Restrições que moldam a solução:**
- Custo zero ou próximo disso, especialmente na fase de testes.
- Uso apenas por convidados, sem cadastro aberto.
- Mínimo de dados armazenados; nada de chat ou gravação.

## Critérios de sucesso do MVP

1. **Tela 1080p60 fluida:** quem assiste acompanha o jogo sem travamentos perceptíveis em conexões domésticas comuns.
2. **Custo zero ou perto disso:** a fase local roda sem gasto; a fase em nuvem cabe em poucas dezenas de dólares por mês.
3. **Entrar e conectar rápido:** do convite recebido até estar falando numa sala em poucos minutos, sem precisar de ajuda.

## Fora do escopo

Chat de texto, gravação, push-to-talk, ban, apps nativos ou mobile, suporte garantido fora de Chrome/Edge, abertura ao público.
