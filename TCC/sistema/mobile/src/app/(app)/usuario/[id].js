import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar, Carregando, Cartao, Estrelas, MensagemErro } from '../../../components/ui';
import { useCarregar } from '../../../hooks/useCarregar';
import { api } from '../../../services/api';
import { cores, espaco } from '../../../theme';
import { quando, veiculo } from '../../../utils/formatar';

// Perfil público: dá confiança antes de fechar negócio
export default function PerfilPublico() {
  const { id } = useLocalSearchParams();
  const { dados: u, carregando, erro } = useCarregar(() => api.get(`/usuarios/${id}`), [id]);

  if (carregando) return <Carregando />;
  if (!u) return <View style={{ padding: espaco.lg }}><MensagemErro texto={erro} /></View>;

  const entregador = u.tipo === 'ENTREGADOR';

  return (
    <ScrollView contentContainerStyle={st.container}>
      <View style={st.topo}>
        <Avatar nome={u.nome} tamanho={80} />
        <Text style={st.nome}>{u.nome}</Text>
        <Text style={st.tipo}>
          {entregador ? `Entregador · ${veiculo(u.veiculo)}${u.placa ? ` ${u.placa}` : ''}` : 'Cliente'}
        </Text>
      </View>

      <View style={st.numeros}>
        <Numero valor={u.avaliacoes.media ?? '–'} rotulo="Nota média" />
        <Numero valor={u.avaliacoes.total} rotulo="Avaliações" />
        {entregador && <Numero valor={u.entregasConcluidas} rotulo="Entregas" />}
      </View>

      <Text style={st.secao}>Avaliações recentes</Text>
      {u.ultimasAvaliacoes.length === 0 ? (
        <Text style={st.vazio}>Nenhuma avaliação ainda.</Text>
      ) : (
        u.ultimasAvaliacoes.map((a, i) => (
          <Cartao key={i} style={{ marginBottom: espaco.sm }}>
            <View style={st.linha}>
              <Estrelas nota={a.nota} />
              <Text style={st.data}>{quando(a.criadoEm)}</Text>
            </View>
            {a.comentario && <Text style={st.comentario}>{a.comentario}</Text>}
            <Text style={st.autor}>— {a.avaliadorNome}</Text>
          </Cartao>
        ))
      )}
    </ScrollView>
  );
}

function Numero({ valor, rotulo }) {
  return (
    <View style={st.numero}>
      <Text style={st.numeroValor}>{valor}</Text>
      <Text style={st.numeroRotulo}>{rotulo}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  container: { padding: espaco.lg, paddingBottom: 40 },
  topo: { alignItems: 'center' },
  nome: { fontSize: 22, fontWeight: '800', color: cores.texto, marginTop: espaco.md },
  tipo: { fontSize: 14, color: cores.primaria, fontWeight: '600', marginTop: 2 },
  numeros: { flexDirection: 'row', gap: espaco.sm, marginTop: espaco.xl },
  numero: {
    flex: 1, alignItems: 'center', backgroundColor: cores.superficie, borderRadius: 12,
    paddingVertical: espaco.md, borderWidth: 1, borderColor: cores.borda,
  },
  numeroValor: { fontSize: 22, fontWeight: '800', color: cores.primariaEscura },
  numeroRotulo: { fontSize: 12, color: cores.textoSecundario, marginTop: 2 },
  secao: { fontSize: 17, fontWeight: '700', color: cores.texto, marginTop: espaco.xl, marginBottom: espaco.sm },
  vazio: { color: cores.textoSecundario },
  linha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  data: { fontSize: 12, color: cores.textoSecundario },
  comentario: { fontSize: 15, color: cores.texto, marginTop: espaco.sm },
  autor: { fontSize: 13, color: cores.textoSecundario, marginTop: espaco.sm },
});
