# WIN-02 · Assinatura Authenticode no CI

> Pontos: 8 · Depende de: WIN-01 · Branch `feature/windows-code-signing`, saída da `dev`

## Escopo

- Escolher e configurar a modalidade de assinatura aprovada pelo usuário.
- Adicionar secrets e variáveis no environment `electron-production`.
- Integrar a assinatura ao job Windows antes da publicação.
- Assinar o instalador, o executável, o auxiliar nativo e os PE relevantes.
- Usar SHA-256 e timestamp.
- Validar assinatura e publisher no CI.
- Fazer o pipeline falhar quando a assinatura obrigatória não existir.
- Atualizar a documentação sem expor certificado ou senha.

## Fora do escopo

Atualização automática, Microsoft Store, MSIX, emissão do certificado pelo provedor e assinatura Linux/macOS.

## Checklist

- [ ] Modalidade de certificado escolhida
- [ ] Secrets configurados com menor privilégio possível
- [ ] Artefatos assinados antes do upload
- [ ] Verificação criptográfica no CI
- [ ] Teste de propriedades do Windows concluído
- [ ] SmartScreen observado em instalação limpa

## Critério de aceite

O workflow produz uma release Windows assinada e falha de forma segura quando não consegue assinar ou verificar um artefato obrigatório.
