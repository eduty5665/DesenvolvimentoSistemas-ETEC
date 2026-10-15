import { useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { CartaoOportunidade } from '../../components/Cartoes';
import Tela from '../../components/Tela';
import { Campo, Carregando, MensagemErro, Opcoes, Vazio } from '../../components/ui';
import { useEventos } from '../../contexts/AuthContext';
import { useCarregar } from '../../hooks/useCarregar';
import { api } from '../../services/api';
import { cores } from '../../theme';
import { TIPOS_CARGA } from '../../utils/formatar';

const FILTROS = [{ valor: null, rotulo: 'Todas' }, ...TIPOS_CARGA];

// Lista de entregas abertas: é aqui que o entregador escolhe a qual se candidatar
export default function Oportunidades() {
  const [busca, setBusca] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');
  const [tipo, setTipo] = useState(null);

  // Espera a pessoa parar de digitar antes de buscar
  useEffect(() => {
    const t = setTimeout(() => setBuscaAplicada(busca.trim()), 350);
    return () => clearTimeout(t);
  }, [busca]);

  const { dados, carregando, atualizando, erro, recarregar } = useCarregar(() => {
    const params = new URLSearchParams();
    if (buscaAplicada) params.set('busca', buscaAplicada);
    if (tipo) params.set('tipoCarga', tipo);
    return api.get(`/entregas/oportunidades?${params}`);
  }, [buscaAplicada, tipo]);
  useEventos(['entrega:nova', 'entrega:atualizada', 'candidatura:atualizada'], () => recarregar());

  return (
    <Tela titulo="Oportunidades" rolavel={false}>
      {carregando ? (
        <Carregando />
      ) : (
        <FlatList
          data={dados || []}
          keyExtractor={(e) => String(e.id)}
          contentContainerStyle={st.lista}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={atualizando} onRefresh={() => recarregar(true)} tintColor={cores.azul} />}
          ListHeaderComponent={
            <View style={st.filtros}>
              <Campo value={busca} onChangeText={setBusca} placeholder="Buscar por cidade ou carga" style={{ marginBottom: 10 }} />
              <Opcoes opcoes={FILTROS} valor={tipo} onChange={setTipo} />
              <MensagemErro texto={erro} />
            </View>
          }
          ItemSeparatorComponent={() => <View style={{ height: 46 }} />}
          ListEmptyComponent={
            <Vazio
              icone="grid"
              titulo="Nenhuma oportunidade encontrada"
              texto="Novas entregas aparecem aqui assim que uma empresa publica."
            />
          }
          renderItem={({ item }) => <CartaoOportunidade entrega={item} />}
        />
      )}
    </Tela>
  );
}

const st = StyleSheet.create({
  lista: { paddingTop: 20, paddingBottom: 60 },
  filtros: { paddingHorizontal: 24, marginBottom: 22 },
});
