# Atribuição dos dados anatômicos

BodyParts3D, © The Database Center for Life Science, licenciado sob CC Attribution 4.0 International.

- Licença: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html — página atualizada em 2025-02-27.
- Conjunto de dados: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html
- Termos da licença: https://creativecommons.org/licenses/by/4.0/
- Geometria de origem: `isa_BP3D_4.0_obj_99.zip`, BodyParts3D 4.0.
- Nomes e relações em inglês: tabelas de conceitos, elementos e inclusões IS-A e PART-OF do mesmo arquivo.
- Publicação: Mitsuhashi et al. (2009), *BodyParts3D: 3D structure database for anatomical concepts*. https://doi.org/10.1093/nar/gkn613

Adaptações realizadas no projeto original: eixos e unidades convertidos de milímetros/Z-up para metros/Y-up; translação para posicionamento no palco; geometria simplificada com `meshoptimizer` usando limite de erro relativo de 0,2% por estrutura; normais quantizadas em inteiros com sinal de 16 bits; dados agrupados em blocos binários; agrupamentos de exibição e cores definidos para a interface.

A fonte contém 2.234 malhas OBJ individuais e todas permanecem representadas. A hierarquia combinada contém 3.432 conceitos FMA nomeados, que podem apontar para múltiplas malhas. A identidade original da fonte é preservada no manifesto.

Comentários dos OBJ de origem mencionam uma licença anterior CC BY-SA 2.1 Japan. A licença oficial atual do banco de dados, indicada acima, substitui esse texto legado e permite explicitamente redistribuição e adaptação sob CC BY 4.0.

O BodyParts3D representa uma anatomia masculina adulta de referência baseada em MRI TARO e refinamentos por ilustração anatômica. Não é um modelo completo de todas as estruturas ou variações humanas. Esta interface possui finalidade educacional e não é uma ferramenta clínica.

## Recursos históricos não incluídos na versão atual

Versões anteriores do repositório incluíram anatomia feminina de referência: Kristen Browne e Heidi Schlehlein, Human Reference Atlas / HuBMAP, *3D Reference Organ Set for Female v1.5* (2023), CC BY 4.0. A geometria havia sido adaptada para este visualizador.

- DOI da fonte: https://doi.org/10.48539/HBM352.BTSQ.586
- Conjunto de dados: https://lod.humanatlas.io/ref-organ/united-female/v1.5
- GLB original: https://cdn.humanatlas.io/digital-objects/ref-organ/united-female/v1.5/assets/3d-vh-f-united.glb
- Licença: https://creativecommons.org/licenses/by/4.0/

Adaptações históricas: translação de coordenadas nativas em metros/Y-up para o palco, soldagem de vértices coincidentes, média das normais da fonte, simplificação geométrica com limite de erro relativo de 0,2% por estrutura e quantização de normais. Cores e sistemas de exibição foram definidos para a interface.

A referência histórica continha superfície corporal e órgãos selecionados, incluindo anatomia reprodutiva feminina. A cobertura de esqueleto e musculatura era parcial. Não representava todas as estruturas humanas nem o exame de uma única pessoa.
