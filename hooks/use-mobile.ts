import * as React from 'react';

const LIMITE_TELA_MOVEL = 768;

/** Retorna `true` quando a largura atual corresponde ao layout móvel. */
export function useIsMobile() {
  const [ehMovel, definirEhMovel] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    const consultaMidia = window.matchMedia(
      `(max-width: ${LIMITE_TELA_MOVEL - 1}px)`,
    );
    const atualizarEstado = () => {
      definirEhMovel(window.innerWidth < LIMITE_TELA_MOVEL);
    };

    consultaMidia.addEventListener('change', atualizarEstado);
    definirEhMovel(window.innerWidth < LIMITE_TELA_MOVEL);

    return () => consultaMidia.removeEventListener('change', atualizarEstado);
  }, []);

  return !!ehMovel;
}
