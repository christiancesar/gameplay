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

- [ ] Promoção exige artefatos válidos
- [ ] Rollback documentado e exercitado
- [ ] Release anterior permanece disponível
- [ ] Teste de atualização completo em VM
- [ ] Procedimento de emergência documentado
- [ ] Critérios de publicação aprovados

## Critério de aceite

Uma release pode ser promovida, validada, consumida pelo app e revertida para a anterior por um procedimento documentado e repetível.
