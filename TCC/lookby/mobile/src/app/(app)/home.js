import { router } from 'expo-router';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { CartaoEmpresa, CartaoEntrega, CartaoOportunidade, Carrossel } from '../../components/Cartoes';
import Tela from '../../components/Tela';
import { Botao, Carregando, MensagemErro } from '../../components/ui';
import { useAuth, useEventos } from '../../contexts/AuthContext';
import { useCarregar } from '../../hooks/useCarregar';
import { api } from '../../services/api';
import { cores, espaco, fontes } from '../../theme';

const EVENTOS = ['entrega:nova', 'entrega:atualizada', 'candidatura:nova', 'candidatura:atualizada', 'mensagem:nova', 'mensagens:lidas'];

// Home do Figma: Oportunidades, Entregas e Empresas, cada uma com seu "ver mais".
// Para o cliente, mostra as entregas que ele publicou e quem está se candidatando.
export default function Home() {
  const { usuario } = useAuth();
  const cliente = usuario.tipo === 'CLIENTE';

  const { dados, carregando, atualizando, erro, recarregar } = useCarregar(async () => {
    if (cliente) return { minhas: await api.get('/entregas/minhas') };
    const [oportunidades, minhas, empresas] = await Promise.all([
      api.get('/entregas/oportunidades'),
      api.get('/entregas/minhas'),
      api.get('/empresas'),
    ]);
    return { oportunidades, minhas, empresas };
  });
  useEventos(EVENTOS, () => recarregar());

  if (carregando) return <Carregando />;
  const atualizar = <RefreshControl refreshing={atualizando} onRefresh={() => recarregar(true)} tintColor={cores.azul} />;

  if (cliente) {
    const minhas = dados?.minhas || [];
    const comCandidatos = minhas.filter((e) => e.status === 'ABERTA' && e.candidaturasPendentes > 0);
    const andamento = minhas.filter((e) => ['ACEITA', 'ENTREGUE'].includes(e.status));
    const abertas = minhas.filter((e) => e.status === 'ABERTA' && !e.candidaturasPendentes);
    return (
      <Tela titulo="Home" refreshControl={atualizar} estiloConteudo={st.semMargem}>
        <MensagemErro texto={erro} style={st.erro} />
        <View style={st.publicar}>
          <Text style={st.ola}>Olá, {usuario.nome.split(' ')[0]}!</Text>
          <Botao titulo="Publicar entrega" icone="plus-square" onPress={() => router.push('/publicar')} />
        </View>
        <Carrossel
          titulo="Candidaturas"
          dados={comCandidatos}
          renderItem={({ item }) => <CartaoEntrega entrega={item} />}
          vazio="Quando um entregador se candidatar a uma entrega sua, ela aparece aqui."
        />
        <Carrossel
          titulo="Em andamento"
          verMais={() => router.navigate('/entregas')}
          dados={andamento}
          renderItem={({ item }) => <CartaoEntrega entrega={item} />}
          vazio="Nenhuma entrega com entregador confirmado no momento."
        />
        <Carrossel
          titulo="Publicadas"
          verMais={() => router.navigate('/entregas')}
          dados={abertas}
          renderItem={({ item }) => <CartaoEntrega entrega={item} />}
          vazio="Nenhuma entrega aguardando candidatos. Publique uma nova para receber candidaturas."
        />
      </Tela>
    );
  }

  // Entregas em que o entregador ainda tem algo a fazer ou acompanhar
  const ativas = (dados?.minhas || []).filter(
    (e) => e.minhaCandidatura?.status !== 'RECUSADA' && !['CONCLUIDA', 'CANCELADA', 'CONTESTADA'].includes(e.status)
  );
  const novas = (dados?.oportunidades || []).filter((e) => !e.minhaCandidatura);

  return (
    <Tela titulo="Home" refreshControl={atualizar} estiloConteudo={st.semMargem}>
      <MensagemErro texto={erro} style={st.erro} />
      <Carrossel
        titulo="Oportunidades"
        verMais={() => router.navigate('/oportunidades')}
        dados={novas}
        renderItem={({ item }) => <CartaoOportunidade entrega={item} />}
        vazio="Nenhuma oportunidade nova agora. Elas aparecem aqui assim que são publicadas."
      />
      <Carrossel
        titulo="Entregas"
        verMais={() => router.navigate('/entregas')}
        dados={ativas}
        renderItem={({ item }) => <CartaoEntrega entrega={item} />}
        vazio="Candidate-se a uma oportunidade. Suas entregas aparecem aqui."
      />
      <Carrossel
        titulo="Empresas"
        verMais={() => router.navigate('/empresas')}
        dados={dados?.empresas || []}
        renderItem={({ item }) => <CartaoEmpresa empresa={item} />}
        vazio="Nenhuma empresa cadastrada ainda."
      />
    </Tela>
  );
}

const st = StyleSheet.create({
  semMargem: { paddingHorizontal: 0, paddingTop: 8 },
  erro: { marginHorizontal: 32, marginTop: espaco.lg },
  publicar: { alignItems: 'center', marginTop: espaco.xl, gap: espaco.md },
  ola: { fontFamily: fontes.corpoForte, color: cores.branco, fontSize: 20 },
});
