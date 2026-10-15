import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { CartaoEmpresa } from '../../components/Cartoes';
import Tela from '../../components/Tela';
import { Carregando, MensagemErro, Vazio } from '../../components/ui';
import { useCarregar } from '../../hooks/useCarregar';
import { api } from '../../services/api';
import { cores } from '../../theme';

// Empresas que publicam entregas no LookBy
export default function Empresas() {
  const { dados, carregando, atualizando, erro, recarregar } = useCarregar(() => api.get('/empresas'));

  return (
    <Tela titulo="Empresas" rolavel={false}>
      {carregando ? (
        <Carregando />
      ) : (
        <FlatList
          data={dados || []}
          keyExtractor={(e) => String(e.id)}
          contentContainerStyle={st.lista}
          refreshControl={<RefreshControl refreshing={atualizando} onRefresh={() => recarregar(true)} tintColor={cores.azul} />}
          ListHeaderComponent={<MensagemErro texto={erro} style={{ marginHorizontal: 24 }} />}
          ItemSeparatorComponent={() => <View style={{ height: 46 }} />}
          ListEmptyComponent={<Vazio icone="briefcase" titulo="Nenhuma empresa cadastrada ainda" />}
          renderItem={({ item }) => <CartaoEmpresa empresa={item} />}
        />
      )}
    </Tela>
  );
}

const st = StyleSheet.create({ lista: { paddingTop: 44, paddingBottom: 60 } });
