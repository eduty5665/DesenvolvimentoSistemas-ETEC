import { Feather } from '@expo/vector-icons';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { ArquivosCurriculo, SecoesCurriculo } from '../../../components/Curriculo';
import Tela from '../../../components/Tela';
import { Carregando, Dado, Dados, Estrelas, Foto, MensagemErro, Secao } from '../../../components/ui';
import { useCarregar } from '../../../hooks/useCarregar';
import { api } from '../../../services/api';
import { cores, espaco, fontes } from '../../../theme';
import { quando, veiculo } from '../../../utils/formatar';

// Currículo de um entregador visto pela empresa (antes de confirmar o candidato)
export default function PerfilPublico() {
  const { id } = useLocalSearchParams();
  const { dados: u, carregando, erro } = useCarregar(() => api.get(`/usuarios/${id}`), [id]);

  if (carregando) return <Carregando />;
  if (!u) {
    return (
      <Tela titulo="Currículo" voltar>
        <MensagemErro texto={erro || 'Usuário não encontrado'} />
      </Tela>
    );
  }
  if (u.tipo === 'CLIENTE') return <Redirect href={`/empresa/${u.id}`} />;

  return (
    <Tela titulo="Currículo" voltar>
      <View style={st.topo}>
        {u.fotoUrl ? <Foto url={u.fotoUrl} tamanho={150} /> : <Feather name="user" size={170} color={cores.azul} />}
        <Text style={st.nome}>{u.nome}</Text>
        <View style={st.nota}>
          <Estrelas nota={u.avaliacoes.media || 0} tamanho={18} />
          <Text style={st.sub}>
            {u.avaliacoes.total ? `${u.avaliacoes.media} (${u.avaliacoes.total} avaliaç${u.avaliacoes.total > 1 ? 'ões' : 'ão'})` : 'ainda sem avaliações'}
          </Text>
        </View>
      </View>

      <Secao titulo="Dados Pessoais">
        <Dados>
          <Dado rotulo="Usuário" valor={`@${u.usuario}`} />
          <Dado rotulo="Situação" valor={u.online ? 'online agora' : u.vistoEm ? `visto ${quando(u.vistoEm)}` : 'offline'} />
          <Dado rotulo="Veículo" valor={u.veiculo ? veiculo(u.veiculo) : null} />
          <Dado rotulo="Placa" valor={u.placa} />
          <Dado rotulo="Entregas concluídas" valor={String(u.entregasConcluidas)} />
          <Dado rotulo="Contestações" valor={String(u.entregasContestadas)} />
        </Dados>
      </Secao>

      {u.curriculo && (
        <>
          <SecoesCurriculo curriculo={u.curriculo} />
          <ArquivosCurriculo arquivos={u.curriculo.arquivos} />
        </>
      )}

      <Secao titulo="Avaliações">
        {u.ultimasAvaliacoes.length === 0 ? (
          <Text style={st.vazio}>Nenhuma avaliação ainda.</Text>
        ) : (
          u.ultimasAvaliacoes.map((a, i) => (
            <View key={i} style={st.avaliacao}>
              <Estrelas nota={a.nota} tamanho={15} />
              {a.comentario ? <Text style={st.comentario}>“{a.comentario}”</Text> : null}
              <Text style={st.sub}>{a.avaliadorNome} · {quando(a.criadoEm)}</Text>
            </View>
          ))
        )}
      </Secao>
    </Tela>
  );
}

const st = StyleSheet.create({
  topo: { alignItems: 'center', marginTop: 8 },
  nome: { fontFamily: fontes.destaque, color: cores.branco, fontSize: 52, lineHeight: 46, marginTop: 14, textAlign: 'center' },
  nota: { alignItems: 'center', gap: 4, marginTop: 4 },
  sub: { fontFamily: fontes.corpo, color: cores.textoSuave, fontSize: 13 },
  vazio: { fontFamily: fontes.corpo, color: cores.textoSuave, fontSize: 14, textAlign: 'center' },
  avaliacao: { alignItems: 'center', marginTop: espaco.md, gap: 3 },
  comentario: { fontFamily: fontes.chat, color: cores.branco, fontSize: 16, textAlign: 'center' },
});
