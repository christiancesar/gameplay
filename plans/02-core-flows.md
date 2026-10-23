# 02 · Core Flows

> Data: 2026-10-23. Base: `00-requirements.md`, `01-epic-brief.md` e mocks enviados pelo usuário.
> Telas com mock: SignIn, SignUp, Hub e Tela do servidor. Os demais fluxos estão descritos no nível de produto; o visual deles será desenhado diretamente no Storybook.

## Padrões globais

- **Tema:** escuro (padrão) e claro, alternado pelo ícone de sol. Escolha lembrada por usuário.
- **Idioma:** inglês e português. Detectado pelo browser no primeiro acesso, com seletor visível no SignIn, no SignUp e no Hub, e também nas Configurações.
- **Marca:** logo "Gameplay" (painel lateral) e "Gameplay UNLIMITED" (Hub e área vazia do servidor).
- **Favicon:** ícones da categoria gaming do Lucide (gamepad, joystick, espadas, dados, troféu, fantasma) trocando em rotação a cada poucos segundos.
- **Navegação:** sem dock e sem home pública. A entrada é o SignIn. Depois do login, o usuário sempre cai no Hub. O logo no painel do servidor volta ao Hub.
- **Feedback:** ações assíncronas mostram estado de carregamento no próprio botão; sucesso e erro aparecem em toast. Erros de formulário aparecem abaixo do campo.

---

## F1 · SignIn

**Gatilho:** abrir o app sem sessão, ou clicar em "Sign in" no SignUp.

```
          [logo]  Gameplay
   ┌──────────────────────────────┐
   │        Welcome back          │
   │ Email or username [        ] │
   │ Password          [        ] │
   │ [           Login          ] │
   │ Don't have an account? Sign up│
   └──────────────────────────────┘
            [ EN | PT ]
```

1. Usuário informa email **ou** username e senha. Sem login social, sem "esqueci minha senha".
2. Credenciais inválidas: mensagem genérica no formulário, sem dizer qual campo errou.
3. Conta suspensa: mensagem informando que a conta está suspensa.
4. Conta de admin da plataforma: após a senha, pede o código de 6 dígitos do app autenticador (ou um código de recuperação).
5. Sucesso: vai para o Hub. Se chegou por link de servidor, segue para o F3.

## F2 · SignUp

**Gatilho:** "Sign up" no SignIn, ou link de servidor aberto sem conta (F3).

```
   ┌──────────────────────────────┐
   │     Create your account      │
   │ Username [                 ] │
   │ Email    [                 ] │
   │ Password [      ] Confirm [ ]│
   │ Invite key [_][_][_][_][_][_]│
   │ [       Create Account     ] │
   │ Already have an account? Sign in │
   └──────────────────────────────┘
```

1. Usuário preenche username, email, senha, confirmação e a **key de convite** em 6 caixas (letras e números, sem diferença de maiúsculas). Colar a key inteira preenche as 6 caixas.
2. Validação no campo: senha mínima de 8 caracteres, confirmação igual, username e email ainda não usados.
3. Key inválida, expirada, revogada ou já usada: erro abaixo das caixas, sem apagar os outros campos.
4. Sucesso: conta criada, sessão iniciada e vai para o Hub (ou continua o F3).

## F3 · Entrar por link de servidor

**Gatilho:** abrir um link de convite de servidor recebido de um owner ou admin.

1. **Sem conta:** a tela mostra "Você foi convidado para *Turbex*" e leva ao SignUp. Quem convidou envia o link junto com uma key de cadastro (a key é gerada só pelo admin da plataforma).
2. **Com conta e sem sessão:** leva ao SignIn e depois retoma o convite.
3. **Com sessão:** confirma "Entrar em *Turbex*?".
4. Link expirado, sem usos restantes ou servidor cheio: mensagem clara e volta ao Hub.
5. Já é membro: abre o servidor direto.
6. Servidor com auto aprovação ligada (e com vaga): entra e abre a tela do servidor.
7. Sem auto aprovação: cria o pedido de entrada, volta ao Hub e mostra o toast "Pedido enviado, aguarde a aprovação". Não há lista de pedidos pendentes; o servidor aparece no Hub quando for aprovado.

## F4 · Hub

**Gatilho:** qualquer login; clique no logo dentro do servidor.

```
                 Game
                   play
             U N L I M I T E D
          ┌─────────────────────────┐
          │ (avatar) Shinigame      │
          │          email          │
          └─────────────────────────┘
          [admin]  [config]  [tema]  [EN|PT]

     ┌──────┐ ┌───────────────────────────┐
     │ icon │ │ Create your server      > │
     │Turbex│ │ Grouping your clan...     │
     └──────┘ └───────────────────────────┘
              Or join a server
     ┌─────────────────────────────────────┐
     │ [      JH34SD32      ]   Join  >    │
     └─────────────────────────────────────┘
```

1. No topo: logo, card do perfil e os ícones de painel admin (só para o admin da plataforma), configurações, tema e idioma.
2. Os servidores dos quais o usuário é membro aparecem como **blocos** (ícone e nome) à esquerda do card "Create your server". Clicar abre a tela do servidor (F6).
3. "Create your server" abre o F5. Com o limite de servidores atingido, o card fica desabilitado com "Limite atingido".
4. "Or join a server": campo para o código de 8 caracteres (colar o link inteiro também funciona) e botão Join. Segue o F3.
5. Primeiro acesso, sem servidores: só o card de criar e o campo de entrar.

## F5 · Criar servidor

**Gatilho:** "Create your server" no Hub.

1. Formulário com nome (obrigatório) e ícone (opcional, com prévia e fallback de iniciais). Descrição e cover podem ser adicionados depois, nas configurações do servidor.
2. Imagem acima de 2 MB ou em formato não aceito: erro no campo, sem enviar.
3. Sucesso: o servidor é criado já com uma sala padrão, o usuário vira owner e abre a tela do servidor.

## F6 · Tela do servidor

**Gatilho:** abrir um servidor no Hub, ou entrar por link.

```
 ┌───────────┬──────────────────────────────────────┐
 │  Game     │                                      │
 │    play   │                                      │
 │ ┌───────┐ │          (área principal)            │
 │ │Turbex │ │    vazia: logo Gameplay UNLIMITED    │
 │ │owner  │ │    em sala: participantes e telas    │
 │ └───────┘ │                                      │
 │ ~ Sala 1  │                                      │
 │   (avatars)│                                     │
 │ ~ Sala 2  │                                      │
 │┌─────────┐│                                      │
 ││ painel  ││                                      │
 ││transmis.││                                      │
 │├─────────┤│                                      │
 ││(eu) nome││                                      │
 ││ ⚙ 🎤 🎧 ☎││                                      │
 │└─────────┘│                                      │
 └───────────┴──────────────────────────────────────┘
```

1. O painel lateral mostra **só o servidor atual**: logo (volta ao Hub), card do servidor, salas e, abaixo de cada sala, os avatares de quem está nela.
2. **Card do servidor:** ícone e nome.
   - **Owner e admin:** engrenagem na frente; clicar no card abre o modal do servidor (F7). Um contador na engrenagem mostra os pedidos de entrada pendentes.
   - **Member:** no lugar da engrenagem, o ícone de sair do servidor, com confirmação. Ao sair, volta ao Hub.
3. **Clicar numa sala já entra nela** (F8).
4. Card do usuário, embaixo:
   - Painel de transmissão (F9), visível enquanto está numa sala.
   - Linha com avatar, nome e email.
   - Engrenagem que abre as **configurações do usuário** (F11).
   - Enquanto está numa sala: **mute**, **deafen** e o **telefone vermelho** para sair da sala.
5. As configurações pessoais (F11) abrem pela engrenagem do card do usuário e também pelo Hub.
6. O **cover** e a descrição do servidor ainda não têm lugar definido na tela (decisão pendente do usuário).

## F7 · Modal do servidor (owner e admin)

**Gatilho:** card do servidor no painel lateral (owner e admin). Modal com sidebar de seções. Visual a desenhar no Storybook.

1. **Geral:** nome, ícone, cover e descrição.
2. **Convites:** toggle de **auto aprovação** no topo (aprovar novos membros automaticamente enquanto houver vaga); gerar código/link com máximo de usos e validade, copiar, ver usos restantes e validade, revogar. No limite de membros, gerar fica bloqueado com o motivo.
3. **Pedidos:** aprovar ou recusar. Com a auto aprovação ligada, um aviso explica que pedidos só esperam aqui quando o servidor está cheio. No limite de membros, aprovar fica bloqueado com o motivo.
4. **Membros:** lista com papel. Ações por membro: promover a admin, rebaixar a member, kick (com confirmação). O owner aparece sem ações.
5. **Salas:** criar, renomear e excluir. No limite de salas, criar fica bloqueado com o motivo. Excluir uma sala com gente dentro pede confirmação e desconecta quem estiver nela.
6. **Sair ou excluir:**
   - Admin: "Sair do servidor", com confirmação.
   - Owner: não pode sair. Só tem "Excluir servidor", que remove o servidor e todos os membros, salas e convites. Pede para digitar o nome do servidor para confirmar; quem estiver conectado é desconectado e volta ao Hub.

## F8 · Entrar na sala e conversar por voz

**Gatilho:** clicar numa sala no painel lateral. Visual a desenhar no Storybook.

1. Primeira vez: o browser pede permissão de microfone. Se negar, a pessoa entra só ouvindo, com aviso e instrução para liberar.
2. Ao entrar: a área principal mostra um bloco por participante com avatar; quem fala ganha destaque visual.
3. Controles na linha do usuário: mute (não envia voz), deafen (não ouve ninguém e também silencia o próprio microfone, como no Discord) e telefone vermelho para sair da sala. Compartilhar tela fica no painel de transmissão (F9).
4. Clique em um participante: ajustar o volume dele só para mim.
5. Estar em uma sala e clicar em outra troca de sala direto. Só é possível estar em uma sala por vez.
6. Quem está conectando aparece como "conectando"; se a conexão com alguém falhar, o bloco dele mostra o erro e tenta de novo sozinho.

## F9 · Compartilhar tela

**Gatilho:** painel de transmissão no card do usuário, enquanto está numa sala. Visual desenhado no Storybook (`ScreenShare/*`).

1. **Parado:** o painel é um botão verde grande de compartilhar tela.
2. Ao clicar, abre o **modal de compartilhamento**:
   - **O que compartilhar:** tela inteira, janela ou jogo, ou aba do navegador. O app não consegue listar as telas, janelas e jogos abertos (limitação do browser). Essa escolha vira a dica `displaySurface`, e o seletor nativo do Chrome abre já na aba certa.
   - Dica para jogos: tela cheia exclusiva pode sair preta; usar modo janela sem bordas.
   - **Resolução** (720p ou 1080p) e **FPS** (30 ou 60), formando os 4 presets.
   - **Áudio**, com aviso de suporte: aba em qualquer SO, tela inteira só no Windows, janela não tem áudio.
   - "Usar estas configurações da próxima vez": o modal abre com o padrão salvo do usuário.
3. "Escolher e compartilhar" abre o seletor nativo do browser para escolher a tela, janela ou aba exata. Cancelar no seletor volta ao estado parado.
4. **Transmitindo:** o painel vira um monitor com:
   - **Alvo** (o que a pessoa escolheu) e **Entregando** (a pior qualidade real entre os espectadores), com barras de resolução e FPS em relação ao alvo, e a taxa de envio.
   - Quando está abaixo do alvo, o **motivo**: rede ou computador (vem do `qualityLimitationReason` do WebRTC), com sugestão (baixar para 720p ou 30 fps, fechar downloads ou apps pesados).
   - Número de espectadores, botão **Detalhes** e botão **Parar**.
   - Sem espectadores, nada é enviado, então não há qualidade para medir.
5. **Detalhes:** tabela por espectador (resolução, FPS, envio e status), porque em mesh cada espectador recebe uma cópia codificada separadamente e a qualidade pode variar entre eles.
6. Parar: pelo botão do painel ou pelo "parar compartilhamento" do browser. Sair da sala também encerra a transmissão.

## F10 · Assistir tela

**Gatilho:** participante ao vivo na sala. Visual a desenhar no Storybook.

1. O bloco do participante ao vivo mostra um selo "LIVE" e o botão "Assistir". Nada é recebido antes do clique.
2. Assistindo: a tela ocupa a área principal; os demais participantes ficam numa faixa menor.
3. Com várias telas ao vivo, dá para trocar qual assistir ou parar de assistir.
4. Tela cheia e volume do áudio da transmissão separado do volume de voz.
5. Quando quem transmite para, a visualização fecha e volta para a sala.

## F11 · Configurações

**Gatilho:** engrenagem no Hub ou no card do usuário. Visual a desenhar no Storybook.

1. **Perfil:** avatar (trocar ou remover) e dados da conta.
2. **Áudio:** escolher microfone e saída, com teste de microfone (barra de nível).
3. **Aparência:** tema e idioma.
4. **Sair** da conta.

## F12 · Painel admin da plataforma

**Gatilho:** ícone de escudo no Hub, só para o admin da plataforma. Visual a desenhar no Storybook.

1. Primeiro login do admin: obriga a configurar o app autenticador (QR code) e mostra os códigos de recuperação.
2. **Usuários:** lista com online/offline, sessões com IP e navegador. Ações: suspender ou reativar, encerrar sessões, redefinir senha, ajustar limite de servidores.
3. **Servidores:** lista com owner, membros e salas. Ações: ajustar limites de membros e salas, excluir servidor (com confirmação).
4. **Limites globais:** editar os padrões (1 servidor, 10 membros, 2 salas).
5. **Keys de cadastro:** gerar com validade, copiar, ver quem usou, revogar.

## F13 · Desconexões e remoções

**Gatilho:** eventos fora do controle do usuário.

1. Internet cai: aviso "Reconectando" no topo; ao voltar, retorna à mesma sala sozinho.
2. Kick ou servidor excluído: sai da sala, volta ao Hub e vê um aviso com o motivo.
3. Rebaixado ou promovido: as opções de gestão aparecem ou somem na hora, sem recarregar.
4. Conta suspensa ou sessões encerradas pelo admin: desconecta e vai para o SignIn com mensagem.
