"""
Converte as malhas OBJ oficiais do BodyParts3D 4.0 para o formato binário
consumido pelo navegador, sem alterar a topologia nesta etapa.

Uso:
    python3 scripts/converter-anatomia.py DIRETORIO_OBJ MAPA_CONCEITOS MAPA_SISTEMAS

Fonte e atribuição: `public/ATTRIBUTION.md`.
As posições são convertidas de milímetros/Z-up para metros/Y-up; as normais
são quantizadas em inteiros de 16 bits e as estruturas são agrupadas em blocos.

Observação: chaves como `elements`, `conceptId`, `system` e `concepts` pertencem
aos arquivos de metadados externos e são preservadas na fronteira de leitura.
"""

import json
import sys
from array import array
from pathlib import Path

RAIZ_PROJETO = Path(__file__).resolve().parents[1]
DIRETORIO_FONTE = Path(sys.argv[1])
METADADOS = json.loads(Path(sys.argv[2]).read_text())
DADOS_SISTEMAS = (
    json.loads(Path(sys.argv[3]).read_text()) if len(sys.argv) > 3 else {}
)
DIRETORIO_SAIDA = RAIZ_PROJETO / "public/models"
DIRETORIO_SAIDA.mkdir(parents=True, exist_ok=True)

# Aceita tanto registros de pesquisa completos quanto um mapa direto id -> sistema.
SISTEMAS = DADOS_SISTEMAS.get(
    "systems",
    DADOS_SISTEMAS.get(
        "mapping",
        DADOS_SISTEMAS.get(
            "elements", DADOS_SISTEMAS.get("meshes", DADOS_SISTEMAS)
        ),
    ),
)
if isinstance(SISTEMAS, list):
    SISTEMAS = {item["id"]: item for item in SISTEMAS}

partes = []
blocos = []
conteudo_bloco = bytearray()
indice_bloco = 0
total_triangulos = 0


def adicionar_ao_bloco(valores, formato):
    """Adiciona um array ao buffer atual com alinhamento de quatro bytes."""
    while len(conteudo_bloco) % 4:
        conteudo_bloco.append(0)
    deslocamento = len(conteudo_bloco)
    conteudo_bloco.extend(array(formato, valores).tobytes())
    return deslocamento


for elemento in METADADOS["elements"]:
    arquivo_malha = DIRETORIO_FONTE / f"{elemento['id']}.obj"
    registro = DADOS_SISTEMAS.get("parts", {}).get(elemento["id"], {})
    vertices = []
    normais = []
    indices = []
    nome = elemento["name"]

    for linha in arquivo_malha.read_text().splitlines():
        if linha.startswith("# English name : "):
            nome = linha.split(" : ", 1)[1].strip() or elemento["name"]
        elif linha.startswith("v "):
            x, y, z = map(float, linha.split()[1:4])
            vertices.extend([x * 0.001, z * 0.001 + 0.0781112, -y * 0.001 - 0.1])
        elif linha.startswith("vn "):
            x, y, z = map(float, linha.split()[1:4])
            normais.extend(
                [round(x * 32767), round(z * 32767), round(-y * 32767)]
            )
        elif linha.startswith("f "):
            face = [int(item.split("/")[0]) - 1 for item in linha.split()[1:]]
            # Triangula polígonos em leque preservando a ordem dos vértices.
            for posicao in range(1, len(face) - 1):
                indices.extend([face[0], face[posicao], face[posicao + 1]])

    assert len(normais) == len(vertices), elemento["id"]
    assert len(vertices) and max(indices) < len(vertices) // 3

    if len(conteudo_bloco) > 7_000_000:
        caminho = DIRETORIO_SAIDA / f"anatomy-{indice_bloco}.bin"
        caminho.write_bytes(conteudo_bloco)
        blocos.append(
            {
                "url": f"/models/anatomy-{indice_bloco}.bin",
                "bytes": len(conteudo_bloco),
            }
        )
        conteudo_bloco = bytearray()
        indice_bloco += 1

    deslocamento_posicoes = adicionar_ao_bloco(vertices, "f")
    deslocamento_normais = adicionar_ao_bloco(normais, "h")
    deslocamento_indices = adicionar_ao_bloco(indices, "I")
    limites = [
        [min(vertices[eixo::3]) for eixo in range(3)],
        [max(vertices[eixo::3]) for eixo in range(3)],
    ]

    sistema = SISTEMAS.get(elemento["id"], "connective")
    if isinstance(sistema, dict):
        sistema = sistema.get("system", sistema.get("category", "connective"))

    partes.append(
        {
            "id": elemento["id"],
            "name": registro.get("name", nome),
            "conceptId": registro.get("conceptId", elemento["conceptId"]),
            "system": sistema,
            "chunk": indice_bloco,
            "positions": deslocamento_posicoes,
            "normals": deslocamento_normais,
            "indices": deslocamento_indices,
            "vertexCount": len(vertices) // 3,
            "indexCount": len(indices),
            "bounds": limites,
        }
    )
    total_triangulos += len(indices) // 3

# Persiste o último bloco, mesmo que não tenha atingido o limite de tamanho.
caminho_final = DIRETORIO_SAIDA / f"anatomy-{indice_bloco}.bin"
caminho_final.write_bytes(conteudo_bloco)
blocos.append(
    {
        "url": f"/models/anatomy-{indice_bloco}.bin",
        "bytes": len(conteudo_bloco),
    }
)

manifesto = {
    "version": "BodyParts3D 4.0",
    "parts": partes,
    "chunks": blocos,
    "triangles": total_triangulos,
    "concepts": [
        {chave: valor for chave, valor in conceito.items() if chave in ["id", "name", "elements"]}
        for conceito in METADADOS["concepts"]
    ],
}
(DIRETORIO_SAIDA / "atlas.json").write_text(
    json.dumps(manifesto, separators=(",", ":"))
)

print(
    json.dumps(
        {
            "partes": len(partes),
            "conceitos": len(manifesto["concepts"]),
            "triangulos": total_triangulos,
            "bytes": sum(bloco["bytes"] for bloco in blocos),
            "blocos": len(blocos),
            "sistemas": sorted(set(parte["system"] for parte in partes)),
        },
        indent=2,
    )
)
