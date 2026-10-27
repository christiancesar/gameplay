# 00 · Requisitos: app desktop em Electron

> Data: 2026-10-27. Status: **acordado com o usuário**, base para o Epic Brief e o Tech Plan.

## 1. Visão

Um app desktop do Gameplay, em Electron, para usar recursos do computador do usuário que o browser não entrega: compartilhar **janela, tela, jogo ou música com o áudio deles**. A UI é a mesma do web: o que é feito para o web sai no desktop, sem componentes reescritos.

## 2. Requisitos de produto

### 2.1 Compartilhamento
- Compartilhar uma **janela específica, uma tela ou um jogo, com o áudio daquela fonte**, inclusive áudio de outros aplicativos (o jogo, o player de música), sem o resto do sistema e sem a voz da própria call.
- **O usuário que compartilha escolhe** a janela ou tela e o áudio.
- O resto da transmissão (mesh e SFU, qualidade, quem assiste) funciona como no web.

### 2.2 Sistemas
- **Linux primeiro**, que é o ambiente do usuário. Áudio por aplicativo com **`@vencord/venmic`** e PipeWire, com o que o sistema oferecer.
- **Windows depois**, para testar por lá.
- macOS sem data.

### 2.3 Mesma UI no web e no desktop
- Todo o front-end (telas, ViewModels, services, transportes, i18n, testes e stories) é compartilhado entre o web e o desktop.
- O que muda entre os dois são as **capacidades da plataforma** (o que cada um consegue capturar).

### 2.4 Servidor
- O desktop conecta em qualquer servidor do Gameplay: produção ou um self-hosted. O usuário informa o endereço na primeira abertura.

### 2.5 Atualizações
- O usuário recebe as atualizações sem reinstalar à mão: as de UI chegam por **OTA**, e as do próprio app (Electron, recursos nativos) por **atualização completa**.

## 3. Requisitos não funcionais

- **Segurança**: a UI vai empacotada no app. Código vindo do servidor nunca ganha acesso à captura de tela e áudio. OTA só com bundle assinado, vindo do nosso canal de releases, nunca do servidor ao qual o usuário se conecta.
- **Arquitetura**: o MVVM do `AGENTS.md` continua valendo no front-end compartilhado. Views sem acesso a Electron, IPC, query ou store.
- **IPC tipado** entre o renderer e o processo main, com validação da entrada no main.
- **Sem regressão no web**: cada etapa deixa o web, o self-hosted e o deploy de produção funcionando como antes.

## 4. Ordem do trabalho

1. **Migração**: dividir os pacotes, o web consumindo o front-end compartilhado e o desktop rodando o mesmo front-end. Sem recursos nativos de captura: no desktop, a transmissão usa o `getDisplayMedia` padrão do Chromium.
2. **Recursos nativos**: captura de janela e áudio por aplicativo no Linux, depois Windows, empacotamento e atualizações. Detalhados quando a migração terminar.

## 5. Fora do escopo

- Reescrever componentes de UI para o desktop.
- Carregar a UI a partir da URL do servidor.
- Push-to-talk global (fica como capacidade futura).
- App mobile.
