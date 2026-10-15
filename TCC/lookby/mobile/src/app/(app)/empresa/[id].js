import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { CartaoOportunidade } from '../../../components/Cartoes';
import DadosEmpresa from '../../../components/DadosEmpresa';
import Tela from '../../../components/Tela';
import { Carregando, MensagemErro, Secao } from '../../../components/ui';
import { useEventos } from '../../../contexts/AuthContext';
import { useCarregar } from '../../../hooks/useCarregar';
import { api } from '../../../services/api';

// Página de uma empresa: dados, histórico e as entregas que ela tem abertas
export default function Empresa() {
  const { id } = useLocalSearchParams();
  const { dados: empresa, carregando, erro, recarregar } = useCarregar(() => api.get(`/empresas/${id}`), [id]);
  useEventos(['entrega:nova', 'entrega:atualizada'], () => recarregar());

  if (carregando) return <Carregando />;

  return (
    <Tela titulo="Empresas">
      <MensagemErro texto={erro} />
      {empresa && (
        <>
          <DadosEmpresa empresa={empresa} />
          {empresa.oportunidades.length > 0 && (
            <Secao titulo="Entregas abertas">
              <View style={{ gap: 30, marginTop: 14 }}>
                {empresa.oportunidades.map((e) => (
                  <CartaoOportunidade key={e.id} entrega={e} />
                ))}
              </View>
            </Secao>
          )}
        </>
      )}
    </Tela>
  );
}
