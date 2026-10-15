import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import Tela from '../../../components/Tela';
import {
  Botao, Caixa, Campo, Carregando, Confirmacao, Contador, Dado, Dados, Estrelas, Foto, MensagemErro, Secao,
} from '../../../components/ui';
import { useAuth, useEventos } from '../../../contexts/AuthContext';
import { useCarregar } from '../../../hooks/useCarregar';
import { api } from '../../../services/api';
import { cores, espaco, fontes } from '../../../theme';
import { dataBR, moeda, situacao, tipoCarga, veiculo } from '../../../utils/formatar';

const EVENTOS = ['entrega:atualizada', 'candidatura:nova', 'candidatura:atualizada', 'mensagem:nova', 'mensagens:lidas'];

// Textos das caixas de confirmação (SIM / NÃO), como no Figma
const CONFIRMACOES = {
  candidatar: {
    pergunta: 'Deseja se candidatar a vaga?',
    explicacao: 'ao confirmar, você estará se candidatando a vaga, e esperando a confirmação da empresa.',
    acao: (e) => api.post(`/entregas/${e.id}/candidaturas`),
  },
  desistir: {
    pergunta: 'Desistir desta candidatura?',
    explicacao: 'ao confirmar, a empresa será avisada e você sai da lista de candidatos.',
    acao: (e) => api.post(`/candidaturas/${e.minhaCandidatura.id}/desistir`),
  },
  entregar: {
    pergunta: 'Confirmar sua entrega?',
    explicacao:
      'ao confirmar, você estará dizendo que o produto foi entregue a empresa como combinado. E caso não tenha sido poderá sofrer as consequências',
    acao: (e) => api.post(`/entregas/${e.id}/confirmar-entrega`),
  },
  receber: {
    pergunta: 'Confirmar o recebimento?',
    explicacao: 'ao confirmar, você estará dizendo que a carga chegou como combinado e a entrega será concluída.',
    acao: (e) => api.post(`/entregas/${e.id}/confirmar-recebimento`),
  },
  cancelar: {
    pergunta: 'Cancelar esta entrega?',
    explicacao: 'ao confirmar, a entrega sai das oportunidades e os candidatos são avisados. Não dá para desfazer.',
    acao: (e) => api.post(`/entregas/${e.id}/cancelar`),
  },
  aceitar: {
    pergunta: (c) => `Confirmar ${c.entregador.nome.split(' ')[0]} para esta entrega?`,
    explicacao: (c, e) =>
      `ao confirmar, o valor combinado será ${moeda(c.valorCombinado ?? e.valor)} e as outras candidaturas serão recusadas.`,
    acao: (_e, c) => api.post(`/candidaturas/${c.id}/aceitar`),
  },
  recusar: {
    pergunta: (c) => `Recusar a candidatura de ${c.entregador.nome.split(' ')[0]}?`,
    explicacao: () => 'ao confirmar, o entregador será avisado. A entrega continua aberta para outros candidatos.',
    acao: (_e, c) => api.post(`/candidaturas/${c.id}/recusar`),
  },
};

export default function DetalheEntrega() {
  const { id } = useLocalSearchParams();
  const { usuario } = useAuth();
  const { dados: entrega, carregando, atualizando, erro, recarregar } = useCarregar(() => api.get(`/entregas/${id}`), [id]);

  const [confirmacao, setConfirmacao] = useState(null); // { tipo, candidatura? }
  const [contestando, setContestando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [executando, setExecutando] = useState(false);
  const [erroAcao, setErroAcao] = useState('');
  const [perfilIncompleto, setPerfilIncompleto] = useState('');

  useEventos(EVENTOS, (d) => {
    if (!d?.entregaId || d.entregaId === Number(id)) recarregar();
  });

  if (carregando) return <Carregando />;
  if (!entrega) {
    return (
      <Tela titulo="Entregas" voltar>
        <MensagemErro texto={erro || 'Entrega não encontrada'} />
      </Tela>
    );
  }

  const cliente = usuario.tipo === 'CLIENTE';
  const cand = entrega.minhaCandidatura;
  const sit = situacao(entrega, usuario);
  const terminou = ['CONCLUIDA', 'CONTESTADA'].includes(entrega.status);
  const participei = cliente || cand?.status === 'ACEITA';

  const config = confirmacao && CONFIRMACOES[confirmacao.tipo];
  const texto = (campo) =>
    typeof config[campo] === 'function' ? config[campo](confirmacao.candidatura, entrega) : config[campo];

  async function confirmar() {
    setExecutando(true);
    setErroAcao('');
    try {
      await config.acao(entrega, confirmacao.candidatura);
      setConfirmacao(null);
      setPerfilIncompleto('');
      await recarregar();
    } catch (e) {
      // Regra: sem telefone/veículo/CNH o entregador não se candidata; leva para o perfil
      if (/Complete seu perfil/.test(e.message)) {
        setConfirmacao(null);
        setPerfilIncompleto(e.message);
      } else {
        setErroAcao(e.message);
      }
    } finally {
      setExecutando(false);
    }
  }

  async function contestar() {
    setExecutando(true);
    setErroAcao('');
    try {
      await api.post(`/entregas/${entrega.id}/contestar`, { motivo });
      setContestando(false);
      await recarregar();
    } catch (e) {
      setErroAcao(e.message);
    } finally {
      setExecutando(false);
    }
  }

  const abrir = (tipo, candidatura) => {
    setErroAcao('');
    setConfirmacao({ tipo, candidatura });
  };

  return (
    <Tela
      titulo={!cliente && !cand ? 'Oportunidades' : 'Entregas'}
      refreshControl={<RefreshControl refreshing={atualizando} onRefresh={() => recarregar(true)} tintColor={cores.azul} />}
    >
      <View style={st.topo}>
        <Feather name="truck" size={128} color={cores.azul} />
        <Text style={st.titulo}>{entrega.titulo}</Text>
        {sit && <Text style={[st.situacao, { color: cores[sit.cor] || cores.textoSuave }]}>{sit.rotulo}</Text>}
      </View>

      <Secao titulo="Dados da entrega">
        <Dados>
          <Dado rotulo="Data" valor={dataBR(entrega.data)} />
          <Dado rotulo="Horário" valor={`${entrega.horarioRetirada} às ${entrega.horarioEntrega}`} />
          <Dado rotulo="Retirada" valor={`${entrega.enderecoRetirada}, ${entrega.cidadeRetirada}`} largo />
          <Dado rotulo="Localização da entrega" valor={`${entrega.enderecoEntrega}, ${entrega.cidadeEntrega}`} largo />
          <Dado rotulo="Carga" valor={entrega.carga} />
          <Dado rotulo="Tipo da Carga" valor={tipoCarga(entrega.tipoCarga)} />
          {entrega.observacoes ? <Dado rotulo="Observações" valor={entrega.observacoes} largo /> : null}
          <Dado rotulo="Valor oferecido" valor={moeda(entrega.valor)} />
          <Dado
            rotulo="Valor combinado"
            valor={entrega.valorCombinado != null ? moeda(entrega.valorCombinado) : cand?.valorCombinado != null ? moeda(cand.valorCombinado) : 'A combinar'}
          />
        </Dados>
      </Secao>

      {!cliente && (
        <Pressable onPress={() => router.push(`/empresa/${entrega.cliente.id}`)} role="button">
          <Secao titulo="Dados da empresa">
            <Dados>
              <Dado rotulo="Nome" valor={entrega.cliente.nome} />
              <Dado rotulo="CNPJ" valor={entrega.cliente.cnpj} />
              <Dado rotulo="Localização" valor={entrega.cliente.localizacao} largo />
              <Dado rotulo="Nicho" valor={entrega.cliente.nicho} largo />
              {entrega.cliente.historia ? <Dado rotulo="História da empresa" valor={entrega.cliente.historia} largo /> : null}
            </Dados>
          </Secao>
        </Pressable>
      )}

      <MensagemErro texto={erro} style={{ marginTop: espaco.lg }} />

      {/* ====================== ENTREGADOR ====================== */}
      {!cliente && (
        <View style={st.acoes}>
          {perfilIncompleto ? (
            <>
              <MensagemErro texto={perfilIncompleto} />
              <Botao titulo="Completar perfil" icone="edit" onPress={() => router.push('/perfil')} />
            </>
          ) : null}

          {!cand && entrega.status === 'ABERTA' && (
            <Botao titulo="Candidatar-se" tamanho="grande" largura={235} onPress={() => abrir('candidatar')} />
          )}

          {cand?.status === 'PENDENTE' && (
            <>
              <Text style={st.info}>Candidatura enviada. Agora é só esperar a confirmação da empresa. Enquanto isso, combine os detalhes pelo chat.</Text>
              <BotaoChat candidatura={cand} />
              <Botao titulo="Desistir" variante="contorno" largura={162} onPress={() => abrir('desistir')} />
            </>
          )}

          {cand?.status === 'RECUSADA' && (
            <Text style={st.info}>
              {entrega.status === 'CANCELADA'
                ? 'A empresa cancelou esta entrega.'
                : 'A empresa escolheu outro entregador para esta entrega.'}
            </Text>
          )}

          {cand?.status === 'ACEITA' && (
            <>
              {entrega.status === 'ACEITA' && (
                <Botao titulo="Confirmar" largura={162} onPress={() => abrir('entregar')} />
              )}
              {entrega.status === 'ENTREGUE' && (
                <Text style={st.info}>Você confirmou a entrega. Falta a empresa confirmar o recebimento.</Text>
              )}
              {entrega.status === 'CONTESTADA' && (
                <Text style={[st.info, { color: cores.perigo }]}>
                  A empresa contestou esta entrega: {entrega.motivoContestacao}
                </Text>
              )}
              <BotaoChat candidatura={cand} />
            </>
          )}
        </View>
      )}

      {/* ====================== CLIENTE ====================== */}
      {cliente && entrega.status === 'ABERTA' && (
        <Secao titulo={`Candidaturas (${entrega.candidaturasPendentes})`}>
          {entrega.candidaturas.length === 0 ? (
            <Text style={st.info}>
              Ninguém se candidatou ainda. A entrega está visível em Oportunidades para todos os entregadores.
            </Text>
          ) : (
            entrega.candidaturas.map((c) => (
              <Candidato key={c.id} candidatura={c} entrega={entrega} aoAceitar={() => abrir('aceitar', c)} aoRecusar={() => abrir('recusar', c)} />
            ))
          )}
        </Secao>
      )}

      {cliente && entrega.status !== 'ABERTA' && entrega.candidaturas.some((c) => c.status === 'ACEITA') && (
        <Secao titulo="Entregador">
          {entrega.candidaturas.filter((c) => c.status === 'ACEITA').map((c) => (
            <Candidato key={c.id} candidatura={c} entrega={entrega} />
          ))}
        </Secao>
      )}

      {cliente && (
        <View style={st.acoes}>
          {entrega.status === 'ACEITA' && (
            <Text style={st.info}>Entregador confirmado. Quando ele entregar a carga, você confirma o recebimento aqui.</Text>
          )}
          {entrega.status === 'ENTREGUE' && (
            <>
              <Text style={st.info}>O entregador informou que a carga foi entregue. Chegou tudo como combinado?</Text>
              <Botao titulo="Confirmar recebimento" onPress={() => abrir('receber')} />
              <Botao
                titulo="Contestar"
                variante="perigo"
                largura={162}
                onPress={() => {
                  setErroAcao('');
                  setContestando(true);
                }}
              />
            </>
          )}
          {entrega.status === 'CONTESTADA' && (
            <Text style={[st.info, { color: cores.perigo }]}>Você contestou esta entrega: {entrega.motivoContestacao}</Text>
          )}
          {entrega.status === 'CANCELADA' && <Text style={st.info}>Esta entrega foi cancelada.</Text>}
          {['ABERTA', 'ACEITA'].includes(entrega.status) && (
            <Botao titulo="Cancelar entrega" variante="perigo" tamanho="pequeno" onPress={() => abrir('cancelar')} style={{ marginTop: espaco.lg }} />
          )}
        </View>
      )}

      {/* ====================== AVALIAÇÃO ====================== */}
      {terminou && participei && (
        <Avaliacao entrega={entrega} quem={cliente ? 'o entregador' : 'a empresa'} aoAvaliar={recarregar} />
      )}

      {/* ---------- caixas ---------- */}
      {config && (
        <Confirmacao
          visivel
          pergunta={texto('pergunta')}
          explicacao={texto('explicacao')}
          aoConfirmar={confirmar}
          aoFechar={() => setConfirmacao(null)}
          carregando={executando}
          erro={erroAcao}
        />
      )}

      <Caixa visivel={contestando} aoFechar={() => setContestando(false)} largura={290}>
        <Text style={st.caixaTitulo}>Contestar entrega</Text>
        <Campo
          value={motivo}
          onChangeText={setMotivo}
          placeholder="Conte o que aconteceu (ex.: faltaram 5 caixas)"
          multiline
          style={{ alignSelf: 'stretch' }}
        />
        <MensagemErro texto={erroAcao} />
        <Botao titulo="Enviar" onPress={contestar} carregando={executando} />
        <Text style={st.caixaNota}>A contestação fica registrada no histórico do entregador.</Text>
      </Caixa>
    </Tela>
  );
}

function BotaoChat({ candidatura }) {
  return (
    <View>
      <Botao titulo="Chat" icone="message-circle" largura={162} onPress={() => router.push(`/chat/${candidatura.id}`)} />
      <Contador numero={candidatura.naoLidas} style={st.contadorChat} />
    </View>
  );
}

// Um candidato na lista do cliente: quem é, o que já combinou e as ações
function Candidato({ candidatura: c, entrega, aoAceitar, aoRecusar }) {
  const e = c.entregador;
  const previa = c.ultimaMensagem && c.ultimaMensagem.tipo !== 'SISTEMA' ? c.ultimaMensagem.texto : null;
  const recusada = c.status === 'RECUSADA';

  return (
    <View style={[st.candidato, recusada && { opacity: 0.55 }]}>
      <Pressable style={st.candidatoTopo} onPress={() => router.push(`/usuario/${e.id}`)} role="button">
        <Foto url={e.fotoUrl} tamanho={48} />
        <View style={{ flex: 1 }}>
          <Text style={st.candidatoNome}>{e.nome}</Text>
          <Text style={st.candidatoSub}>
            {veiculo(e.veiculo)}{e.placa ? ` · ${e.placa}` : ''} · {e.entregasConcluidas} entrega{e.entregasConcluidas === 1 ? '' : 's'}
          </Text>
          <View style={st.candidatoNota}>
            <Estrelas nota={e.avaliacoes.media || 0} tamanho={13} />
            <Text style={st.candidatoSub}>
              {e.avaliacoes.total ? `${e.avaliacoes.media} (${e.avaliacoes.total})` : 'sem avaliações'}
              {e.online ? ' · online' : ''}
            </Text>
          </View>
        </View>
      </Pressable>

      <Text style={st.candidatoValor}>
        {recusada
          ? 'Candidatura recusada'
          : c.valorCombinado != null
            ? `Valor combinado no chat: ${moeda(c.valorCombinado)}`
            : `Aceita o valor publicado: ${moeda(entrega.valor)}`}
      </Text>
      {previa ? <Text style={st.candidatoPrevia} numberOfLines={2}>“{previa}”</Text> : null}

      <View style={st.candidatoBotoes}>
        <View>
          <Botao titulo="Chat" icone="message-circle" tamanho="pequeno" onPress={() => router.push(`/chat/${c.id}`)} />
          <Contador numero={c.naoLidas} style={st.contadorChat} />
        </View>
        <Botao titulo="Currículo" icone="user" tamanho="pequeno" variante="contorno" onPress={() => router.push(`/usuario/${e.id}`)} />
      </View>
      {c.status === 'PENDENTE' && aoAceitar && (
        <View style={st.candidatoBotoes}>
          <Botao titulo="Confirmar" tamanho="pequeno" largura={104} onPress={aoAceitar} />
          <Botao titulo="Recusar" tamanho="pequeno" largura={104} variante="perigo" onPress={aoRecusar} />
        </View>
      )}
    </View>
  );
}

function Avaliacao({ entrega, quem, aoAvaliar }) {
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  if (entrega.jaAvaliei) {
    return <Text style={[st.info, { marginTop: espaco.xl }]}>Obrigado pela avaliação!</Text>;
  }

  async function enviar() {
    setEnviando(true);
    setErro('');
    try {
      await api.post(`/entregas/${entrega.id}/avaliacoes`, { nota, comentario: comentario || null });
      await aoAvaliar();
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Secao titulo={`Avalie ${quem}`}>
      <View style={{ alignItems: 'center', marginBottom: espaco.md }}>
        <Estrelas nota={nota} tamanho={36} onChange={setNota} />
      </View>
      <Campo value={comentario} onChangeText={setComentario} placeholder="Comentário (opcional)" multiline />
      <MensagemErro texto={erro} />
      <Botao titulo="Avaliar" largura={162} onPress={enviar} desabilitado={!nota} carregando={enviando} />
    </Secao>
  );
}

const st = StyleSheet.create({
  topo: { alignItems: 'center', marginTop: 12 },
  titulo: { fontFamily: fontes.destaque, color: cores.branco, fontSize: 56, lineHeight: 50, marginTop: 14, textAlign: 'center' },
  situacao: { fontFamily: fontes.corpoForte, fontSize: 14, marginTop: 2 },
  acoes: { alignItems: 'center', gap: 16, marginTop: espaco.xxl },
  info: { fontFamily: fontes.corpoMedio, color: cores.textoSuave, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  contadorChat: { position: 'absolute', top: -8, right: -8 },
  candidato: { borderWidth: 1, borderColor: cores.branco, borderRadius: 10, padding: espaco.md, marginTop: espaco.md },
  candidatoTopo: { flexDirection: 'row', alignItems: 'center', gap: espaco.md },
  candidatoNome: { fontFamily: fontes.corpoForte, color: cores.branco, fontSize: 17 },
  candidatoSub: { fontFamily: fontes.corpo, color: cores.textoSuave, fontSize: 12.5 },
  candidatoNota: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  candidatoValor: { fontFamily: fontes.corpoMedio, color: cores.azul, fontSize: 13.5, marginTop: espaco.md },
  candidatoPrevia: { fontFamily: fontes.chat, color: cores.branco, fontSize: 14, marginTop: 4 },
  candidatoBotoes: { flexDirection: 'row', justifyContent: 'center', gap: 14, marginTop: espaco.md },
  caixaTitulo: { fontFamily: fontes.secao, color: cores.branco, fontSize: 20, marginBottom: espaco.md },
  caixaNota: { fontFamily: fontes.corpo, color: cores.branco, fontSize: 11, textAlign: 'center', marginTop: espaco.md },
});
