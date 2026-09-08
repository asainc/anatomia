import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validarManifestoAtlas} from '../app/dominio/schema-atlas.ts';

const dados = JSON.parse(await readFile(new URL('../public/models/atlas.json', import.meta.url), 'utf8'));
const validado = validarManifestoAtlas(dados);
assert.equal(validado.schemaVersion, '2.0');
assert.equal(validado.locale, 'pt-BR');
assert.ok(validado.parts.length > 2000);
assert.ok(validado.concepts.length > 3000);
assert.throws(() => validarManifestoAtlas({...dados, parts: []}), /parts/);
assert.throws(() => validarManifestoAtlas({...dados, triangles: -1}), /triangles/);
console.log('Schema do atlas validado: contrato V2 e falhas de regressão aprovados.');
