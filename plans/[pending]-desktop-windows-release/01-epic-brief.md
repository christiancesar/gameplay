# 01 · Epic Brief: release desktop e downloads automáticos

## 1. Problema

O app já é empacotado para Windows e Linux, mas a página pública ainda não conhece a última versão automaticamente. Além disso, embora o app Windows já seja empacotado com Squirrel.Windows, ele ainda precisa concluir o fluxo de atualização automática.

O GitHub Releases já é usado como catálogo das versões, mas o armazenamento operacional dos downloads será o S3. Squirrel precisa de um feed compatível e estável, não apenas de uma página de release.

## 2. Resultado esperado

O usuário acessa `/download`, vê a última versão disponível para seu sistema e baixa o instalador Windows ou o AppImage Linux. No Windows, o usuário também recebe futuras versões pelo próprio app. O app consulta o canal oficial, baixa uma atualização válida, mostra que ela está pronta e aplica a versão ao reiniciar.

## 3. Direção proposta

### S3 como armazenamento e domínio principal como portal

Usar o S3 como bucket operacional dos artefatos Windows e Linux. A página pública fica em `gameplay.oikos.company/download`, consulta um manifesto estável da última release e usa os URLs dos artefatos retornados.

O endereço do S3 não será acoplado ao renderer nem ao app. O endpoint do domínio principal fará a resolução do canal e servirá ou redirecionará para os assets imutáveis do S3.

### Endpoint próprio mais bucket/CDN

Se o GitHub não oferecer uma URL estável ou comportamento adequado para o feed, usar:

```text
Electron app
    -> https://gameplay.oikos.company/api/updates/windows/stable/RELEASES
    -> endpoint ou arquivo estático
    -> asset imutável do S3
```

O armazenamento pode ser R2, S3 ou outro bucket compatível. O endpoint não recebe credenciais do usuário, não depende do servidor ao qual o app se conecta e só publica referências para artefatos já aprovados.

## 4. Portal público

O portal público será detalhado separadamente em `plans/[complete]-public-product-portal/`, com Home, `/download`, `/roadmap`, `/changelog`, login, cadastro e Hub.

## 4. Princípios de segurança

- A URL do update é fixa no build de produção.
- O servidor escolhido na tela inicial não pode alterar a origem do update.
- Não haverá assinatura Authenticode no MVP, por depender de custo externo.
- O endpoint não executa lógica de instalação nem aceita upload público.
- Releases antigas permanecem imutáveis.
- A promoção de uma versão para `stable` deve ser uma operação explícita do pipeline.
- O app não instala downgrade pelo canal normal.

## 5. Critérios de sucesso do épico

- A página pública mostra a última versão e links funcionais para Windows e Linux.
- O workflow publica o instalador Windows e o AppImage Linux no S3.
- Uma instalação limpa abre sem depender de uma release anterior.
- Uma segunda release é detectada pelo app, baixada e aplicada após reinício.
- O GitHub ou o bucket pode ser temporariamente indisponível sem impedir o uso da versão instalada.
- Uma release inválida ou incompleta não atualiza o manifesto estável.
