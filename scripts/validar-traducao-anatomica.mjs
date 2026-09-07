/**
 * Valida a localização PT-BR dos nomes anatômicos exibidos pela aplicação.
 *
 * A checagem não tenta decidir se todo cognato é português: vários termos
 * anatômicos são grafados da mesma maneira em português e inglês. Em vez disso,
 * ela verifica o contrato de localização, palavras inequivocamente inglesas e
 * casos de regressão importantes (metacarpo, falanges, lateralidade etc.).
 */
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const caminho = resolve('public/models/atlas.json');
const atlas = JSON.parse(await readFile(caminho, 'utf8'));

const falhas = [];
const registrar = (condicao, mensagem) => {
  if (!condicao) falhas.push(mensagem);
};

registrar(atlas.locale === 'pt-BR', 'O manifesto não está marcado como pt-BR.');
registrar(atlas.sourceLocale === 'en', 'O idioma da fonte original não está registrado como en.');
registrar(Array.isArray(atlas.concepts), 'A lista de conceitos não existe.');
registrar(Array.isArray(atlas.parts), 'A lista de partes não existe.');

const itens = [...(atlas.concepts ?? []), ...(atlas.parts ?? [])];
const iguaisPermitidos = new Set(['aorta', 'atlas', 'face', 'ulna', 'ureter']);
const inglesNaoPermitido = new Set([
  'of', 'right', 'left', 'artery', 'arteries', 'vein', 'veins', 'branch', 'branches',
  'bone', 'phalanx', 'finger', 'toe', 'tooth', 'muscle', 'nerve', 'wall', 'layer',
  'heart', 'brain', 'liver', 'kidney', 'stomach', 'spleen', 'gallbladder', 'bladder',
  'lung', 'eyeball', 'eyelid', 'eyebrow', 'mouth', 'skin', 'forearm', 'shoulder',
  'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth',
  'ninth', 'tenth', 'eleventh', 'twelfth', 'upper', 'lower', 'middle', 'deep',
  'little', 'big', 'great', 'small', 'longus', 'brevis', 'pollicis', 'digitorum',
  'hallucis', 'carpi', 'brachii', 'femoris', 'capitis',
]);

const tokens = (texto) =>
  texto.toLocaleLowerCase('pt-BR').match(/[\p{L}]+/gu) ?? [];

for (const item of itens) {
  registrar(typeof item.name === 'string' && item.name.trim(), `Nome PT-BR ausente em ${item.id}.`);
  registrar(typeof item.nameEn === 'string' && item.nameEn.trim(), `Nome original ausente em ${item.id}.`);

  const nomePt = item.name?.trim() ?? '';
  const nomeEn = item.nameEn?.trim() ?? '';
  const palavrasInglesas = tokens(nomePt).filter((token) => inglesNaoPermitido.has(token));
  if (palavrasInglesas.length) {
    falhas.push(`${item.id}: rótulo ainda contém inglês (${[...new Set(palavrasInglesas)].join(', ')}): ${nomePt}`);
  }

  if (
    nomePt.toLocaleLowerCase('pt-BR') === nomeEn.toLocaleLowerCase('en') &&
    !iguaisPermitidos.has(nomePt.toLocaleLowerCase('pt-BR'))
  ) {
    falhas.push(`${item.id}: tradução idêntica ao inglês sem estar na lista de cognatos válidos: ${nomePt}`);
  }
}

const porIngles = new Map((atlas.concepts ?? []).map((item) => [item.nameEn?.toLowerCase(), item.name]));
const casosObrigatorios = new Map([
  ['metacarpal bone', 'metacarpo'],
  ['first metacarpal bone', 'metacarpo 1º'],
  ['metatarsal bone', 'metatarso'],
  ['proximal phalanx of thumb', 'falange proximal do polegar'],
  ['heart', 'coração'],
  ['brain', 'encéfalo'],
  ['femur', 'fêmur'],
  ['inferior nasal concha', 'concha nasal inferior'],
]);
for (const [ingles, portugues] of casosObrigatorios) {
  registrar(
    porIngles.get(ingles) === portugues,
    `Tradução obrigatória divergente: "${ingles}" deveria ser "${portugues}", recebido "${porIngles.get(ingles) ?? 'ausente'}".`,
  );
}

if (falhas.length) {
  console.error(`Falha na localização anatômica: ${falhas.length} problema(s).`);
  for (const falha of falhas.slice(0, 100)) console.error(`- ${falha}`);
  process.exit(1);
}

console.log(`Localização anatômica validada: ${atlas.concepts.length} conceitos e ${atlas.parts.length} partes em PT-BR.`);
console.log('Nenhum rótulo de exibição contém os termos ingleses bloqueados.');
