// Formatação de valores, datas e máscaras de digitação

export function moeda(valor) {
  if (valor === null || valor === undefined || valor === '') return 'A combinar';
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// "1.500,50" ou "1500.5" -> 1500.5
export function lerValor(texto) {
  const limpo = String(texto).replace(/[^\d,.]/g, '');
  if (!limpo) return NaN;
  const normal = limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : limpo;
  return Number(normal);
}

// AAAA-MM-DD -> DD/MM/AAAA
export function dataBR(iso) {
  if (!iso) return '—';
  const [a, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
}

// DD/MM/AAAA -> AAAA-MM-DD (ou null se estiver incompleta/inválida)
export function dataISO(br) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(br || '');
  if (!m) return null;
  const [, d, mes, a] = m;
  const data = new Date(Number(a), Number(mes) - 1, Number(d));
  if (data.getDate() !== Number(d) || data.getMonth() !== Number(mes) - 1) return null;
  return `${a}-${mes}-${d}`;
}

export function hora(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// "16:00" -> "16hrs", "16:30" -> "16h30"
export function horaCurta(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':');
  return m === '00' ? `${Number(h)}hrs` : `${Number(h)}h${m}`;
}

// "agora", "há 5 min", "há 2 h", "12/03 14:30"
export function quando(iso) {
  if (!iso) return '';
  const data = new Date(iso);
  const minutos = Math.floor((Date.now() - data.getTime()) / 60000);
  if (minutos < 1) return 'agora';
  if (minutos < 60) return `há ${minutos} min`;
  if (minutos < 24 * 60) return `há ${Math.floor(minutos / 60)} h`;
  return `${dataBR(data.toISOString()).slice(0, 5)} ${hora(iso)}`;
}

// ---------------------------------------------------------------- máscaras
const digitos = (t, max) => String(t || '').replace(/\D/g, '').slice(0, max);

export const mascaras = {
  data: (t) => digitos(t, 8).replace(/^(\d{2})(\d)/, '$1/$2').replace(/^(\d{2})\/(\d{2})(\d)/, '$1/$2/$3'),
  hora: (t) => digitos(t, 4).replace(/^(\d{2})(\d)/, '$1:$2'),
  cpf: (t) =>
    digitos(t, 11)
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2'),
  cnpj: (t) =>
    digitos(t, 14)
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2'),
  telefone: (t) => {
    const d = digitos(t, 11);
    if (d.length <= 2) return d.length ? `(${d}` : '';
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  },
  numeros: (t) => digitos(t, 20),
  valor: (t) => String(t || '').replace(/[^\d,.]/g, '').slice(0, 12),
  placa: (t) => String(t || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7),
};

// ---------------------------------------------------------------- rótulos
export const TIPOS_CARGA = [
  { valor: 'DOCUMENTOS', rotulo: 'Documentos' },
  { valor: 'ALIMENTOS', rotulo: 'Alimentos' },
  { valor: 'MATERIAIS', rotulo: 'Materiais' },
  { valor: 'ELETRONICOS', rotulo: 'Eletrônicos' },
  { valor: 'MOVEIS', rotulo: 'Móveis' },
  { valor: 'FRAGIL', rotulo: 'Frágil' },
  { valor: 'OUTROS', rotulo: 'Outros' },
];

export const VEICULOS = [
  { valor: 'MOTO', rotulo: 'Moto' },
  { valor: 'CARRO', rotulo: 'Carro' },
  { valor: 'BICICLETA', rotulo: 'Bicicleta' },
  { valor: 'VAN', rotulo: 'Van' },
  { valor: 'CAMINHAO', rotulo: 'Caminhão' },
];

const rotuloDe = (lista) => (v) => lista.find((i) => i.valor === v)?.rotulo || '—';
export const tipoCarga = rotuloDe(TIPOS_CARGA);
export const veiculo = rotuloDe(VEICULOS);

// Situação de uma entrega do ponto de vista de quem está olhando
export function situacao(entrega, usuario) {
  const cand = entrega.minhaCandidatura;
  if (usuario?.tipo === 'ENTREGADOR') {
    if (!cand) return null;
    if (cand.status === 'RECUSADA') {
      return entrega.status === 'CANCELADA'
        ? { rotulo: 'Entrega cancelada', cor: 'perigo' }
        : { rotulo: 'Não foi dessa vez', cor: 'perigo' };
    }
    if (cand.status === 'PENDENTE') return { rotulo: 'Aguardando a empresa', cor: 'aviso' };
  }
  switch (entrega.status) {
    case 'ABERTA': {
      const n = entrega.candidaturasPendentes || 0;
      if (usuario?.tipo !== 'CLIENTE') return null;
      return n ? { rotulo: `${n} candidato${n > 1 ? 's' : ''}`, cor: 'aviso' } : { rotulo: 'Sem candidatos', cor: 'suave' };
    }
    case 'ACEITA':
      return { rotulo: 'Confirmada', cor: 'sucesso' };
    case 'ENTREGUE':
      return usuario?.tipo === 'CLIENTE'
        ? { rotulo: 'Confirme o recebimento', cor: 'aviso' }
        : { rotulo: 'Aguardando recebimento', cor: 'aviso' };
    case 'CONCLUIDA':
      return { rotulo: 'Concluída', cor: 'sucesso' };
    case 'CONTESTADA':
      return { rotulo: 'Contestada', cor: 'perigo' };
    case 'CANCELADA':
      return { rotulo: 'Cancelada', cor: 'perigo' };
    default:
      return null;
  }
}
