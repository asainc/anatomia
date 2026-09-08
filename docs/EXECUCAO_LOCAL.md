# Execução local

## 1. Requisitos

- Node.js 22.13.0 ou superior;
- npm;
- navegador com WebGL;
- Python apenas se for regenerar `atlas.json`.

## 2. Instalação limpa

Extraia o projeto em uma pasta nova e execute:

```bash
npm ci
```

Não use `--force` nem `--legacy-peer-deps`.

O trio React/RSC deve permanecer:

```text
19.2.6 / 19.2.6 / 19.2.6
```

Confirme com:

```bash
npm run validar:dependencias
```

## 3. Desenvolvimento

```bash
npm run dev
```

Abra:

```text
http://localhost:3016
```

## 4. Validação

```bash
npm run validar
```

Para depuração por etapa:

```bash
npm run validar:dependencias
npm run verificar
npm run testar:schema
npm run testar:dominio
npm run validar:traducao
npm run validar:atlas
npm run validar:interacoes
npm run build
```

## 5. Regenerar nomes PT-BR

```bash
npm run localizar:atlas
npm run validar:traducao
```

O gerador lê `public/models/atlas.en.json` e regrava `public/models/atlas.json` com `schemaVersion: 2.0`.

## 6. Build

```bash
npm run build
```

Saída:

```text
dist/
```

## 7. Erro ERESOLVE

Se aparecer conflito entre React e `react-server-dom-webpack`, confira `package.json` e deixe:

```json
"react": "19.2.6",
"react-dom": "19.2.6",
"react-server-dom-webpack": "19.2.6"
```

Depois remova `node_modules` e reinstale com `npm ci`.
