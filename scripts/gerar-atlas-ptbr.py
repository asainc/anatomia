#!/usr/bin/env python3
"""Gera o manifesto localizado do atlas sem alterar buffers/IDs científicos."""
from __future__ import annotations

import json
from pathlib import Path
from traducao_anatomica import traduzir_nome, palavras_inglesas_remanescentes

RAIZ = Path(__file__).resolve().parents[1]
ORIGEM = RAIZ / 'public' / 'models' / 'atlas.en.json'
DESTINO = RAIZ / 'public' / 'models' / 'atlas.json'

if not ORIGEM.exists():
    # Na primeira execução, o atlas existente ainda é o original em inglês.
    atlas_atual = DESTINO
    if not atlas_atual.exists():
        raise FileNotFoundError(f'Atlas não encontrado: {atlas_atual}')
    ORIGEM.write_bytes(atlas_atual.read_bytes())

atlas = json.loads(ORIGEM.read_text(encoding='utf-8'))

for conceito in atlas.get('concepts', []):
    nome_original = conceito['name']
    conceito['nameEn'] = nome_original
    conceito['name'] = traduzir_nome(nome_original)

for parte in atlas.get('parts', []):
    nome_original = parte['name']
    parte['nameEn'] = nome_original
    parte['name'] = traduzir_nome(nome_original)

atlas['schemaVersion'] = '2.0'
atlas['locale'] = 'pt-BR'
atlas['sourceLocale'] = 'en'
atlas['localization'] = {
    'strategy': 'deterministic anatomical terminology translation',
    'originalManifest': 'atlas.en.json',
}

DESTINO.write_text(json.dumps(atlas, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')

rotulos = [c['name'] for c in atlas.get('concepts', [])] + [p['name'] for p in atlas.get('parts', [])]
problemas = [(r, palavras_inglesas_remanescentes(r)) for r in rotulos]
problemas = [(r, p) for r, p in problemas if p]

print(f'Conceitos localizados: {len(atlas.get("concepts", []))}')
print(f'Partes localizadas: {len(atlas.get("parts", []))}')
print(f'Rótulos com palavras inglesas proibidas: {len(problemas)}')
for rotulo, palavras in problemas[:50]:
    print(f'  - {rotulo} -> {", ".join(palavras)}')
if problemas:
    raise SystemExit(2)
