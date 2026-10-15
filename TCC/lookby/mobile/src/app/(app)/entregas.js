import { router } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { CartaoEntrega } from '../../components/Cartoes';
import Tela from '../../components/Tela';
import { Botao, Carregando, MensagemErro, Vazio } from '../../components/ui';
import { useAuth, useEventos } from '../../contexts/AuthContext';
import { useCarregar } from '../../hooks/useCarregar';
import { api } from '../../services/api';
import { cores, espaco } from '../../theme';

// "Entregas" do menu.
//  Entregador: tudo a que se candidatou (aguardando a empresa, confirmadas, concluídas).
//  Cliente: as entregas que publicou, com o número de candidatos.
export default function Entregas() {
  const { usuario } = useAuth();
  const cliente = usuario.tipo === 'CLIENTE';
  const { dados, carregando, atualizando, erro, recarregar } = useCarregar(() => api.get('/entregas/minhas'));
  useEventos(
    ['entrega:atualizada', 'candidatura:nova', 'candidatura:atualizada', 'mensagem:nova', 'mensagens:lidas'],
    () => recarregar()
  );

  return (
    <Tela titulo="Entregas" rolavel={false}>
      {carregando ? (
        <Carregando />
      ) : (
        <FlatList
          data={dados || []}
          keyExtractor={(e) => String(e.id)}
          contentContainerStyle={st.lista}
          refreshControl={<RefreshControl refreshing={atualizando} onRefresh={() => recarregar(true)} tintColor={cores.azul} />}
          ListHeaderComponent={
            <View style={{ paddingHorizontal: 24 }}>
              <MensagemErro texto={erro} />
              {cliente && (dados || []).length > 0 && (
                <Botao
                  titulo="Publicar entrega"
                  icone="plus-square"
                  onPress={() => router.push('/publicar')}
                  style={{ marginBottom: espaco.xxl }}
                />
              )}
            </View>
          }
          ItemSeparatorComponent={() => <View style={{ height: 46 }} />}
          ListEmptyComponent={
            cliente ? (
              <Vazio icone="truck" titulo="Você ainda não publicou entregas" texto="Publique a primeira e receba candidaturas de entregadores.">
                <Botao titulo="Publicar entrega" icone="plus-square" onPress={() => router.push('/publicar')} style={{ marginTop: espaco.xl }} />
              </Vazio>
            ) : (
              <Vazio icone="truck" titulo="Nenhuma entrega ainda" texto="Candidate-se a uma oportunidade. Quando a empresa confirmar, a entrega aparece aqui.">
                <Botao titulo="Ver oportunidades" onPress={() => router.navigate('/oportunidades')} style={{ marginTop: espaco.xl }} />
              </Vazio>
            )
          }
          renderItem={({ item }) => <CartaoEntrega entrega={item} />}
        />
      )}
    </Tela>
  );
}

const st = StyleSheet.create({ lista: { paddingTop: 44, paddingBottom: 60 } });
