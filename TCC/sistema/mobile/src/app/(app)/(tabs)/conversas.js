import { router } from 'expo-router';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Avatar, Carregando, MensagemErro, Vazio } from '../../../components/ui';
import { useAuth, useEvento } from '../../../contexts/AuthContext';
import { useCarregar } from '../../../hooks/useCarregar';
import { api } from '../../../services/api';
import { cores, espaco } from '../../../theme';
import { moeda, quando, STATUS } from '../../../utils/formatar';

function previa(m) {
  if (!m) return 'Sem mensagens';
  if (m.tipo === 'PROPOSTA') return `💰 Proposta: ${moeda(m.valorProposta)}`;
  return m.texto;
}

export default function Conversas() {
  const { usuario } = useAuth();
  const { dados, carregando, atualizando, erro, recarregar } = useCarregar(() => api.get('/conversas'));

  useEvento('mensagem:nova', () => recarregar());

  if (carregando) return <Carregando />;

  return (
    <FlatList
      data={dados || []}
      keyExtractor={(c) => String(c.id)}
      refreshControl={<RefreshControl refreshing={atualizando} onRefresh={() => recarregar(true)} />}
      ListHeaderComponent={<MensagemErro texto={erro} />}
      ItemSeparatorComponent={() => <View style={st.separador} />}
      ListEmptyComponent={
        <Vazio
          icone="chatbubbles-outline"
          titulo="Nenhuma conversa"
          texto={
            usuario.tipo === 'CLIENTE'
              ? 'Quando um entregador se interessar pelo seu pedido, a conversa aparece aqui.'
              : 'Abra um pedido disponível e toque em "Negociar" para conversar com o cliente.'
          }
        />
      }
      renderItem={({ item }) => {
        const outro = usuario.id === item.clienteId ? item.entregador : item.cliente;
        return (
          <Pressable style={st.item} onPress={() => router.push(`/chat/${item.id}`)}>
            <Avatar nome={outro?.nome} />
            <View style={{ flex: 1 }}>
              <View style={st.linha}>
                <Text style={st.nome} numberOfLines={1}>{outro?.nome}</Text>
                <Text style={st.hora}>{quando(item.ultimaMensagem?.criadoEm || item.criadoEm)}</Text>
              </View>
              <Text style={st.pedido} numberOfLines={1}>
                {item.pedidoTitulo} · {STATUS[item.pedidoStatus]?.rotulo}
              </Text>
              <Text style={st.previa} numberOfLines={1}>{previa(item.ultimaMensagem)}</Text>
            </View>
          </Pressable>
        );
      }}
    />
  );
}

const st = StyleSheet.create({
  item: { flexDirection: 'row', gap: espaco.md, padding: espaco.lg, backgroundColor: cores.superficie },
  linha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nome: { fontSize: 16, fontWeight: '700', color: cores.texto, flex: 1 },
  hora: { fontSize: 12, color: cores.textoSecundario, marginLeft: 8 },
  pedido: { fontSize: 13, color: cores.primaria, marginTop: 2 },
  previa: { fontSize: 14, color: cores.textoSecundario, marginTop: 2 },
  separador: { height: 1, backgroundColor: cores.borda, marginLeft: 72 },
});
