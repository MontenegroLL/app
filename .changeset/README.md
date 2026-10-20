# Changesets

Este diretório guarda os *changesets* — descrições das mudanças que serão
versionadas no próximo release do monorepo.

## Fluxo de uso

1. Após concluir uma mudança relevante, rode:

   ```bash
   yarn changeset
   ```

2. Escolha quais pacotes (`@dtc/backend`, `@dtc/storefront`) foram afetados e o
   tipo de bump (`patch` / `minor` / `major`).

3. Escreva uma descrição curta da mudança. Um arquivo `.md` será criado neste
   diretório.

4. Faça commit do arquivo junto com o código.

5. No momento do release:

   ```bash
   yarn version-packages   # aplica as versões e atualiza CHANGELOGs
   yarn release            # (apenas se publicar em npm; hoje somos privados)
   ```

## Observações para este projeto

- Os pacotes são **privados** (`private: true`); não publicamos no npm.
  O valor aqui é **changelog e versionamento internos**, não distribuição.
- `baseBranch` é `main`.
- Como múltiplos agentes trabalham no mesmo repositório, um changeset por
  mudança mantém o histórico claro e evita "mega-commits" de release.

Docs: https://github.com/changesets/changesets
