import {ChevronRight} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {SISTEMAS, type Conceito, type IdSistema} from '../anatomia.ts';
import {
  nomeCategoria,
  nomeRegiao,
  type GrupoHierarquia,
} from '../dominio/catalogo-anatomico.ts';

interface PropriedadesArvoreAnatomica {
  grupos: GrupoHierarquia[];
  aoSelecionar: (conceito: Conceito) => void;
}

/**
 * Navegação semântica do atlas: sistema > região > categoria > estrutura.
 * Usa elementos HTML nativos de expansão para manter boa acessibilidade e
 * evitar dependências adicionais.
 */
export default function ArvoreAnatomica({
  grupos,
  aoSelecionar,
}: PropriedadesArvoreAnatomica) {
  const ordem = new Map(SISTEMAS.map((sistema, indice) => [sistema.id, indice]));
  const ordenados = [...grupos].sort(
    (a, b) => (ordem.get(a.sistema) ?? 999) - (ordem.get(b.sistema) ?? 999),
  );

  return (
    <div className="anatomy-tree" role="tree" aria-label="Hierarquia anatômica">
      {ordenados.map((grupo) => {
        const sistema = SISTEMAS.find((item) => item.id === grupo.sistema);
        const total = grupo.regioes.reduce(
          (soma, regiao) =>
            soma +
            regiao.categorias.reduce(
              (subtotal, categoria) => subtotal + categoria.conceitos.length,
              0,
            ),
          0,
        );
        return (
          <details className="tree-system" key={grupo.sistema}>
            <summary>
              <span
                className="system-dot"
                style={{background: sistema?.cor}}
                aria-hidden="true"
              />
              <strong>{sistema?.nome ?? grupo.sistema}</strong>
              <span className="tree-count">{total}</span>
            </summary>
            <div className="tree-regions">
              {grupo.regioes.map((regiao) => (
                <details key={regiao.regiao} className="tree-region">
                  <summary>
                    <span>{nomeRegiao(regiao.regiao)}</span>
                    <span className="tree-count">
                      {regiao.categorias.reduce(
                        (soma, categoria) => soma + categoria.conceitos.length,
                        0,
                      )}
                    </span>
                  </summary>
                  <div className="tree-categories">
                    {regiao.categorias.map((categoria) => (
                      <details key={categoria.categoria} className="tree-category">
                        <summary>
                          <span>{nomeCategoria(categoria.categoria)}</span>
                          <span className="tree-count">{categoria.conceitos.length}</span>
                        </summary>
                        <div className="tree-items">
                          {categoria.conceitos.slice(0, 120).map(({conceito}) => (
                            <Button
                              variant="ghost"
                              key={conceito.id}
                              onClick={() => aoSelecionar(conceito)}
                              title={conceito.nome}
                            >
                              <span>{conceito.nome}</span>
                              <ChevronRight size={13} />
                            </Button>
                          ))}
                          {categoria.conceitos.length > 120 && (
                            <p className="tree-limit">
                              Use a busca para acessar as demais {categoria.conceitos.length - 120} estruturas.
                            </p>
                          )}
                        </div>
                      </details>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </details>
        );
      })}
    </div>
  );
}
