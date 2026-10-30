# 00 · Requisitos: fronteiras do `realtime` na API

> Data: 2026-10-28. Status: **pedido do usuário**, base para o Epic Brief e o Tech Plan.

## 1. Visão

O módulo `realtime` é o **endpoint do socket** da API: recebe as conexões e os eventos do Socket.IO e entrega cada um ao recurso certo. Os demais recursos (voz, sinalização, presença, mídia, ICE) são **provedores** dessa camada: têm as próprias regras e não dependem do `realtime`.

## 2. Requisitos

- O `realtime` fica com o transporte: gateway, ciclo de vida da conexão (conectar, desconectar), autenticação do socket, salas do Socket.IO e envio de eventos para os clientes.
- Cada recurso é um módulo próprio, dono do seu estado, das suas regras e dos seus testes.
- **Direção das dependências**: o `realtime` depende dos provedores; nenhum provedor importa o `realtime`.
- Um provedor que precisa avisar os clientes usa uma porta de emissão, sem conhecer o Socket.IO.
- Nomes sem ambiguidade: "realtime" é o módulo do socket. O que hoje se chama `RealtimeUsage*` no `media` (o consumo do Cloudflare Realtime) ganha outro nome.

## 3. Não funcionais

- **Sem mudança de comportamento**: os mesmos eventos, payloads e respostas (AsyncAPI igual), os mesmos endpoints REST.
- Todos os testes unitários e e2e da API passando em cada ticket, sem apagar teste: os specs mudam de lugar junto com o código.
- Regra de dependência verificada por lint, não só por convenção.

## 4. Fora do escopo

- Mudanças no web ou no desktop.
- Novos eventos ou recursos.
- Trocar o Socket.IO ou o modelo de stores em memória.
