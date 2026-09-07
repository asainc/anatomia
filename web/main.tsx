import {createRoot} from 'react-dom/client';
import PaginaInicial from '../app/pagina.tsx';
import '../app/globals.css';

const elementoRaiz = document.getElementById('root');

if (!elementoRaiz) {
  throw new Error('O elemento raiz da aplicação não foi encontrado.');
}

createRoot(elementoRaiz).render(<PaginaInicial />);
