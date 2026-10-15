import { router } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';
import PedidoCard from '../../../components/PedidoCard';
import { Carregando, MensagemErro, Vazio } from '../../../components/ui';
import { useEvento } from '../../../contexts/AuthContext';
import { useCarregar } from '../../../hooks/useCarregar';
import { api } from '../../../services/api';
import { espaco } from '../../../theme';

// Entregador: pedidos em que o acordo foi fechado com ele
export default function MinhasEntregas() {
  const { dados, carregando, atualizando, erro, recarregar } = useCarregar(() => api.get('/pedidos/meus'));
  useEvento('pedido:atualizado', () => recarregar());

  if (carregando) return <Carregando />;

  return (
    <FlatList
      data={dados || []}
      keyExtractor={(p) => String(p.id)}
      contentContainerStyle={st.lista}
      refreshControl={<RefreshControl refreshing={atualizando} onRefresh={() => recarregar(true)} />}
      ListHeaderComponent={<MensagemErro texto={erro} />}
      ListEmptyComponent={
        <Vazio
          icone="cube-outline"
          titulo="Nenhuma entrega ainda"
          texto="Negocie um pedido disponível. Quando o cliente fechar com você, ele aparece aqui."
        />
      }
      renderItem={({ item }) => (
        <PedidoCard pedido={item} mostrarCliente onPress={() => router.push(`/pedido/${item.id}`)} />
      )}
    />
  );
}

const st = StyleSheet.create({ lista: { padding: espaco.lg } });
