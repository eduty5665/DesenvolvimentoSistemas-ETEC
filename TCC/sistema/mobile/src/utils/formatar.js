import { cores } from '../theme';

export function moeda(valor) {
  if (valor === null || valor === undefined) return 'A combinar';
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// "agora", "há 5 min", "há 2 h", "12/03 14:30"
export function quando(iso) {
  if (!iso) return '';
  const data = new Date(iso);
  const minutos = Math.floor((Date.now() - data.getTime()) / 60000);
  if (minutos < 1) return 'agora';
  if (minutos < 60) return `há ${minutos} min`;
  if (minutos < 24 * 60) return `há ${Math.floor(minutos / 60)} h`;
  const dd = String(data.getDate()).padStart(2, '0');
  const mm = String(data.getMonth() + 1).padStart(2, '0');
  const hh = String(data.getHours()).padStart(2, '0');
  const mi = String(data.getMinutes()).padStart(2, '0');
  return `${dd}/${mm} ${hh}:${mi}`;
}

export function hora(iso) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export const CATEGORIAS = [
  { valor: 'ENCOMENDA', rotulo: 'Encomenda', icone: 'cube-outline' },
  { valor: 'DOCUMENTOS', rotulo: 'Documentos', icone: 'document-text-outline' },
  { valor: 'COMPRAS', rotulo: 'Compras', icone: 'cart-outline' },
  { valor: 'ALIMENTOS', rotulo: 'Alimentos', icone: 'fast-food-outline' },
  { valor: 'MUDANCA', rotulo: 'Mudança', icone: 'home-outline' },
  { valor: 'OUTRO', rotulo: 'Outro', icone: 'ellipsis-horizontal-circle-outline' },
];

export const VEICULOS = [
  { valor: 'MOTO', rotulo: 'Moto', icone: 'bicycle-outline' },
  { valor: 'CARRO', rotulo: 'Carro', icone: 'car-outline' },
  { valor: 'BICICLETA', rotulo: 'Bicicleta', icone: 'bicycle-outline' },
  { valor: 'VAN', rotulo: 'Van', icone: 'bus-outline' },
  { valor: 'CAMINHAO', rotulo: 'Caminhão', icone: 'bus-outline' },
];

export const categoria = (v) => CATEGORIAS.find((c) => c.valor === v) || CATEGORIAS[5];
export const veiculo = (v) => VEICULOS.find((c) => c.valor === v)?.rotulo || '';

export const STATUS = {
  ABERTO: { rotulo: 'Aberto', cor: cores.primaria, fundo: cores.destaqueClaro },
  ACEITO: { rotulo: 'Acordo fechado', cor: cores.aviso, fundo: cores.avisoClaro },
  EM_ANDAMENTO: { rotulo: 'Em andamento', cor: cores.aviso, fundo: cores.avisoClaro },
  CONCLUIDO: { rotulo: 'Concluído', cor: cores.sucesso, fundo: cores.sucessoClaro },
  CANCELADO: { rotulo: 'Cancelado', cor: cores.perigo, fundo: cores.perigoClaro },
};
