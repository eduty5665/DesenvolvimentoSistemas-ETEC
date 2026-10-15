import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import PedidoCard from '../../../components/PedidoCard';
import { Carregando, MensagemErro, Opcoes, Vazio } from '../../../components/ui';
import { useAuth, useEvento } from '../../../contexts/AuthContext';
import { useCarregar } from '../../../hooks/useCarregar';
import { api } from '../../../services/api';
import { cores, espaco, raio } from '../../../theme';
import { CATEGORIAS } from '../../../utils/formatar';

// Cliente: lista dos pedidos que criou + botão para novo pedido
// Entregador: pedidos abertos disponíveis para negociar, com filtro por categoria
export default function Inicio() {
  const { usuario } = useAuth();
  return usuario.tipo === 'ENTREGADOR' ? <PedidosDisponiveis /> : <MeusPedidos usuario={usuario} />;
}

function MeusPedidos({ usuario }) {
  const { dados, carregando, atualizando, erro, recarregar } = useCarregar(() => api.get('/pedidos/meus'));

  // Atualiza a lista quando algo muda em tempo real
  useEvento('pedido:atualizado', () => recarregar());
  useEvento('mensagem:nova', () => recarregar());

  if (carregando) return <Carregando />;

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={dados || []}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={st.lista}
        refreshControl={<RefreshControl refreshing={atualizando} onRefresh={() => recarregar(true)} />}
        ListHeaderComponent={
          <>
            <Text style={st.ola}>Olá, {usuario.nome.split(' ')[0]}!</Text>
            <Text style={st.oque}>O que você precisa levar hoje?</Text>
            <MensagemErro texto={erro} />
          </>
        }
        ListEmptyComponent={
          <Vazio
            icone="cube-outline"
            titulo="Você ainda não fez nenhum pedido"
            texto="Toque no botão + para pedir uma entrega e receber propostas de entregadores."
          />
        }
        renderItem={({ item }) => (
          <PedidoCard pedido={item} onPress={() => router.push(`/pedido/${item.id}`)} />
        )}
      />
      <Pressable style={st.fab} onPress={() => router.push('/pedido/novo')}>
        <Ionicons name="add" size={30} color="#fff" />
      </Pressable>
    </View>
  );
}

const FILTROS = [{ valor: null, rotulo: 'Todas' }, ...CATEGORIAS.map(({ valor, rotulo }) => ({ valor, rotulo }))];

function PedidosDisponiveis() {
  const [categoria, setCategoria] = useState(null);
  const { dados, carregando, atualizando, erro, recarregar } = useCarregar(
    () => api.get(`/pedidos/disponiveis${categoria ? `?categoria=${categoria}` : ''}`),
    [categoria]
  );

  useEvento('pedido:novo', () => recarregar());
  useEvento('pedido:atualizado', () => recarregar());

  if (carregando) return <Carregando />;

  return (
    <FlatList
      data={dados || []}
      keyExtractor={(p) => String(p.id)}
      contentContainerStyle={st.lista}
      refreshControl={<RefreshControl refreshing={atualizando} onRefresh={() => recarregar(true)} />}
      ListHeaderComponent={
        <>
          <Opcoes opcoes={FILTROS} valor={categoria} onChange={setCategoria} />
          <MensagemErro texto={erro} />
        </>
      }
      ListEmptyComponent={
        <Vazio
          icone="search-outline"
          titulo="Nenhum pedido disponível agora"
          texto="Novos pedidos aparecem aqui automaticamente."
        />
      }
      renderItem={({ item }) => (
        <PedidoCard pedido={item} mostrarCliente onPress={() => router.push(`/pedido/${item.id}`)} />
      )}
    />
  );
}

const st = StyleSheet.create({
  lista: { padding: espaco.lg, paddingBottom: 100 },
  ola: { fontSize: 24, fontWeight: '800', color: cores.texto },
  oque: { fontSize: 15, color: cores.textoSecundario, marginBottom: espaco.lg },
  fab: {
    position: 'absolute', right: 20, bottom: 24, width: 60, height: 60, borderRadius: raio.pill,
    backgroundColor: cores.primaria, alignItems: 'center', justifyContent: 'center',
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
  },
});
