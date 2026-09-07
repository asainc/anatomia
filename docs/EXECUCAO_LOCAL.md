# Execução local detalhada

## 1. Objetivo

Este guia descreve como preparar o ambiente, instalar dependências, executar a aplicação, validar o projeto e gerar o build de produção.

## 2. Requisitos

### Obrigatórios

- Node.js `>= 22.13.0`;
- npm compatível com a instalação do Node.js;
- navegador moderno com WebGL habilitado;
- espaço em disco suficiente para dependências e modelos binários.

### Opcional

- Python 3, apenas para reconstrução da geometria a partir dos arquivos OBJ originais.

Não são necessárias:

- chaves de API;
- credenciais;
- banco de dados;
- servidor backend;
- variáveis de ambiente para a execução padrão.

## 3. Conferir Node.js e npm

### Windows PowerShell

```powershell
node --version
npm --version
```

### Linux/macOS

```bash
node --version
npm --version
```

Se o Node.js estiver abaixo de `22.13.0`, atualize-o antes de continuar.

## 4. Abrir o projeto

Entre na pasta que contém `package.json`:

```bash
cd caminho/para/anatomy
```

Confirme:

```bash
ls
```

No PowerShell, também pode ser usado:

```powershell
Get-ChildItem
```

A raiz deve conter, entre outros, `package.json`, `app/`, `public/`, `scripts/` e `web/`.

## 5. Instalar dependências

Execute:

```bash
npm ci
```

### Por que usar `npm ci`?

`npm ci` usa o `package-lock.json` como fonte exata das versões. Isso aumenta a reprodutibilidade entre máquinas e evita alterações inesperadas no arquivo de lock.

Use `npm install` somente quando houver intenção de alterar dependências.

## 6. Iniciar o servidor local

```bash
npm run dev
```

O Vite será iniciado em:

```text
http://localhost:3016
```

Abra esse endereço no navegador.

O script usa:

```text
vite --host 0.0.0.0 --port 3016
```

O `--host 0.0.0.0` permite acesso pela rede local quando a configuração de firewall permitir.

## 7. Parar a aplicação

No terminal em que o Vite está sendo executado, pressione:

```text
Ctrl + C
```

## 8. Verificar TypeScript

```bash
npm run verificar
```

Esse comando executa:

```text
tsc --noEmit
```

Ele valida os tipos sem gerar arquivos JavaScript.

## 9. Validar o atlas

```bash
npm run validar:atlas
```

O script verifica, entre outros pontos:

- quantidade esperada de malhas;
- quantidade esperada de conceitos;
- unicidade dos identificadores;
- existência dos buffers binários;
- tamanho dos buffers;
- limites de índices de vértices;
- finitude das posições;
- relação entre conceitos e elementos;
- total de triângulos.

## 10. Validar interações

```bash
npm run validar:interacoes
```

O script verifica:

- layout explodido sem sobreposição;
- proporções de tela diferentes;
- busca em português;
- seleção por identificador;
- erro esperado para estruturas inexistentes;
- diferenciação entre toque e arraste;
- comportamento com multitoque;
- cancelamento de interação.

## 11. Executar todas as validações

```bash
npm run validar
```

Fluxo executado:

```text
TypeScript
   ↓
Validação do atlas
   ↓
Validação das interações
   ↓
Build de produção
```

## 12. Gerar build

```bash
npm run build
```

Saída:

```text
dist/
```

Para validar o build manualmente, use um servidor HTTP estático. Evite abrir `dist/index.html` diretamente com `file://`, porque caminhos absolutos como `/models/...` dependem de um servidor HTTP.

## 13. Problemas comuns

### `npm ci` informa incompatibilidade de Node.js

Confirme:

```bash
node --version
```

A aplicação exige Node.js `22.13.0` ou superior, conforme `package.json`.

### Porta 3016 já está em uso

Encerre o processo que utiliza a porta ou execute temporariamente:

```bash
npx vite --host 0.0.0.0 --port 3017
```

### A tela 3D não abre

Verifique:

- WebGL habilitado no navegador;
- aceleração por hardware habilitada;
- drivers gráficos atualizados;
- console do navegador para mensagens de erro;
- existência dos arquivos em `public/models/`.

### Erro ao carregar `atlas.json`

Confirme a existência de:

```text
public/models/atlas.json
```

Também confirme que a aplicação está sendo aberta pelo Vite e não diretamente pelo sistema de arquivos.

### Arquivo binário incompleto

A aplicação compara o tamanho recebido com o valor declarado no manifesto. Se houver diferença, ela solicita recarregamento. Se o erro persistir, execute:

```bash
npm run validar:atlas
```

## 14. Reconstrução opcional da geometria

Não execute essa etapa para uso normal.

Quando houver necessidade de regenerar os modelos a partir do BodyParts3D:

```bash
python3 scripts/converter-anatomia.py DIRETORIO_OBJ MAPA_CONCEITOS MAPA_SISTEMAS
node scripts/otimizar-anatomia.mjs
node scripts/compactar-modelos.mjs
npm run validar
```

A reconstrução depende dos arquivos oficiais de origem e dos mapas de conceitos/sistemas, que não fazem parte necessariamente desta distribuição.
