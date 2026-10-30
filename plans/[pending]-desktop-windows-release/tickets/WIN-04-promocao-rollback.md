# WIN-04 · Promoção, rollback e validação

> Pontos: 5 · Depende de: WIN-03 · Branch `chore/windows-release-operations`, saída da `dev`

## Escopo

- Separar publicação de artefatos e promoção para `stable`, quando o endpoint exigir ponteiro.
- Adicionar validação de hashes, assinatura, feed e instalador antes da promoção.
- Documentar rollback para a versão anterior sem apagar releases.
- Definir retenção de artefatos e política de versões.
- Validar instalação limpa, upgrade, reinício, falha de rede e rollback numa VM Windows.
- Atualizar `apps/desktop/README.md` e este plano com o procedimento operacional.

## Fora do escopo

Canal beta, Microsoft Store, distribuição corporativa e observabilidade avançada.

## Checklist

- [x] Promoção exige artefatos válidos
- [x] Rollback documentado
- [x] Release anterior permanece disponível
- [ ] Teste de atualização completo em VM
- [x] Procedimento de emergência documentado
- [ ] Critérios de publicação aprovados

## Critério de aceite

Uma release pode ser promovida, validada, consumida pelo app e revertida para a anterior por um procedimento documentado e repetível.

## Notas da execução

- O workflow publica primeiro em `updates/windows/releases/<version>/` e valida o `RELEASES`, SHA-1 e tamanho dos arquivos referenciados.
- A promoção para `updates/windows/stable/` copia os pacotes antes do `RELEASES`, que é publicado por último.
- O feed anterior é preservado em `updates/windows/promotions/<version>/previous-RELEASES`. Nenhum artefato é apagado automaticamente.
- O rollback manual está documentado em `infra/production/docs/windows-release.md`.
- A release `0.0.6` foi publicada no prefixo imutável, validada e promovida para `stable` pelo workflow `Desktop release`. O feed público confirmou a versão e o pacote sem autenticação.
- _(suposição)_ O conteúdo do `RELEASES` usa nomes de arquivos compatíveis com os artefatos produzidos no mesmo workflow.
- _(pendência externa)_ Ainda falta exercitar o rollback e a atualização completa em uma VM Windows, além de aprovar os critérios de publicação.
