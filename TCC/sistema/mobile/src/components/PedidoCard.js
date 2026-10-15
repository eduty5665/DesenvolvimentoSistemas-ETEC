import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { cores, espaco } from '../theme';
import { categoria, moeda, quando } from '../utils/formatar';
import { Cartao, StatusBadge } from './ui';

// Resumo de um pedido usado nas listas
export default function PedidoCard({ pedido, onPress, mostrarCliente }) {
  const cat = categoria(pedido.categoria);
  const valor = pedido.valorFinal ?? pedido.valorSugerido;

  return (
    <Cartao onPress={onPress} style={{ marginBottom: espaco.md }}>
      <View style={st.topo}>
        <View style={st.icone}>
          <Ionicons name={cat.icone} size={20} color={cores.primaria} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={st.titulo} numberOfLines={1}>{pedido.titulo}</Text>
          <Text style={st.sub}>
            {cat.rotulo} · {quando(pedido.criadoEm)}
            {mostrarCliente && pedido.cliente ? ` · ${pedido.cliente.nome}` : ''}
          </Text>
        </View>
        <StatusBadge status={pedido.status} />
      </View>

      <View style={st.rota}>
        <Endereco icone="radio-button-on" cor={cores.primaria} texto={pedido.origem} />
        <Endereco icone="location" cor={cores.perigo} texto={pedido.destino} />
      </View>

      <View style={st.rodape}>
        <Text style={st.valor}>
          {pedido.valorFinal != null ? 'Combinado: ' : 'Sugerido: '}
          {moeda(valor)}
        </Text>
        {pedido.totalConversas > 0 && pedido.status === 'ABERTO' && (
          <Text style={st.propostas}>
            {pedido.totalConversas} entregador{pedido.totalConversas > 1 ? 'es' : ''} negociando
          </Text>
        )}
      </View>
    </Cartao>
  );
}

function Endereco({ icone, cor, texto }) {
  return (
    <View style={st.endereco}>
      <Ionicons name={icone} size={14} color={cor} />
      <Text style={st.enderecoTexto} numberOfLines={1}>{texto}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  topo: { flexDirection: 'row', alignItems: 'center', gap: espaco.md },
  icone: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: cores.destaqueClaro, alignItems: 'center', justifyContent: 'center',
  },
  titulo: { fontSize: 16, fontWeight: '700', color: cores.texto },
  sub: { fontSize: 13, color: cores.textoSecundario, marginTop: 2 },
  rota: { marginTop: espaco.md, gap: 6 },
  endereco: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  enderecoTexto: { flex: 1, fontSize: 14, color: cores.texto },
  rodape: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: espaco.md, paddingTop: espaco.md, borderTopWidth: 1, borderTopColor: cores.borda,
  },
  valor: { fontSize: 15, fontWeight: '700', color: cores.primariaEscura },
  propostas: { fontSize: 13, color: cores.aviso, fontWeight: '600' },
});
