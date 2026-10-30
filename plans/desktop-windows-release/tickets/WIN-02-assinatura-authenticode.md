# WIN-02 · Assinatura Authenticode no CI

> Pontos: 8 · Depende de: WIN-01 · Branch `feature/windows-code-signing`, saída da `dev` · Status: adiado

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

- [x] Modalidade de certificado escolhida
- [ ] Secrets configurados com menor privilégio possível
- [x] Artefatos configurados para assinatura antes do upload
- [x] Verificação criptográfica configurada no CI
- [ ] Teste de propriedades do Windows concluído
- [ ] SmartScreen observado em instalação limpa

## Critério de aceite

O workflow produz uma release Windows assinada e falha de forma segura quando não consegue assinar ou verificar um artefato obrigatório.

## Notas da execução

- _(decisão do usuário)_ A assinatura Authenticode paga foi adiada. As releases Windows continuarão sem assinatura enquanto o custo não for aprovado.

## Preparação mantida para o futuro

- O desenho anterior considerava um certificado Authenticode em PFX, convertido de Base64 somente no diretório temporário do runner.
- O desenho anterior também previa verificar o `Setup.exe`, os executáveis e DLLs dentro dos `.nupkg` antes do upload.
- _(suposição)_ O certificado escolhido será compatível com assinatura PFX local no runner. Se for adotado um provedor remoto ou HSM, a etapa de preparação deverá ser trocada por `signWithParams` ou pela integração do provedor.
- _(pendência futura)_ Quando a assinatura for retomada, será necessário escolher entre um certificado Authenticode emitido por CA e um serviço de assinatura gerenciada.
