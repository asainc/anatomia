# Correção do erro npm ERESOLVE

## Causa

`react`, `react-dom` e `react-server-dom-webpack` precisam permanecer na mesma linha compatível de versão. O erro ocorre quando somente um deles é atualizado, por exemplo `react-server-dom-webpack@19.2.8`, enquanto `react` permanece em `19.2.6`.

## Versões adotadas neste projeto

- `react`: `19.2.6`
- `react-dom`: `19.2.6`
- `react-server-dom-webpack`: `19.2.6`

As versões são exatas, sem `^`, para impedir atualização parcial automática desse trio.

## Windows / PowerShell

Na raiz do projeto, execute:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\corrigir-dependencias-windows.ps1
```

O script:

1. valida Node.js 22+;
2. fixa o trio React/RSC em `19.2.6`;
3. atualiza o lockfile;
4. remove `node_modules` antigo;
5. executa `npm ci`;
6. mostra as versões efetivamente instaladas;
7. executa a checagem TypeScript e o build.

## Não usar como solução

Evite `npm install --force` e `npm install --legacy-peer-deps`. Esses parâmetros apenas ignoram o conflito e podem produzir uma árvore de dependências inconsistente.
