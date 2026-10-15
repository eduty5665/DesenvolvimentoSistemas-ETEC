import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { FlatList, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Tela from '../../../components/Tela';
import { Botao, Carregando, Foto, MensagemErro } from '../../../components/ui';
import { useAuth, useEvento } from '../../../contexts/AuthContext';
import { useAvisos } from '../../../contexts/AvisosContext';
import { useCarregar } from '../../../hooks/useCarregar';
import { api } from '../../../services/api';
import { cores, espaco, fontes } from '../../../theme';
import { hora, lerValor, mascaras, moeda, quando } from '../../../utils/formatar';

// Chat entre o cliente e o candidato (um chat por candidatura).
// É aqui que os dois combinam valor, rota e carga. O botão "R$" envia uma proposta de valor
// que o outro lado aceita ou recusa; o valor aceito vira o "valor combinado".
export default function Chat() {
  const { id } = useLocalSearchParams();
  const candidaturaId = Number(id);
  const { usuario } = useAuth();
  const { chatAberto, recarregarResumo } = useAvisos();
  const insets = useSafeAreaInsets();
  const lista = useRef(null);

  const { dados: conversa, setDados, carregando, erro: erroCarregar, recarregar } = useCarregar(
    () => api.get(`/candidaturas/${candidaturaId}`),
    [candidaturaId]
  );
  const [texto, setTexto] = useState('');
  const [modoProposta, setModoProposta] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  // Enquanto esta tela está aberta, não mostra a faixa de "nova mensagem" deste chat
  useFocusEffect(
    useCallback(() => {
      chatAberto.current = candidaturaId;
      return () => {
        chatAberto.current = null;
        recarregarResumo();
      };
    }, [candidaturaId, chatAberto, recarregarResumo])
  );

  // Adiciona ou substitui uma mensagem na lista (sem duplicar)
  function colocar(m) {
    setDados((c) => {
      if (!c) return c;
      const existe = c.mensagens.some((x) => x.id === m.id);
      return { ...c, mensagens: existe ? c.mensagens.map((x) => (x.id === m.id ? m : x)) : [...c.mensagens, m] };
    });
  }

  useEvento('mensagem:nova', (d) => {
    if (d.candidaturaId !== candidaturaId) return;
    colocar(d.mensagem);
    // Estou com o chat aberto: já conta como lida
    if (d.mensagem.autorId !== usuario.id) api.post(`/candidaturas/${candidaturaId}/lidas`).catch(() => {});
    if (d.mensagem.tipo === 'SISTEMA') recarregar();
  });
  useEvento('mensagem:atualizada', (d) => d.candidaturaId === candidaturaId && colocar(d.mensagem));
  useEvento('candidatura:atualizada', () => recarregar());
  useEvento('entrega:atualizada', (d) => conversa && d.entregaId === conversa.entregaId && recarregar());
  useEvento('presenca', (d) => {
    setDados((c) => (c && c.outro.id === d.usuarioId ? { ...c, outro: { ...c.outro, online: d.online, vistoEm: d.vistoEm } } : c));
  });

  if (carregando) return <Carregando />;
  if (!conversa) {
    return (
      <Tela titulo="Chat" voltar>
        <MensagemErro texto={erroCarregar || 'Conversa não encontrada'} />
      </Tela>
    );
  }

  const { outro, entrega } = conversa;
  const aberta = ['PENDENTE', 'ACEITA'].includes(conversa.status) && entrega.status !== 'CANCELADA';
  const podeNegociar = conversa.status === 'PENDENTE' && entrega.status === 'ABERTA';
  const presenca = outro.online ? 'online agora' : outro.vistoEm ? `online ${quando(outro.vistoEm)}` : 'offline';
  const valorAtual = entrega.valorCombinado ?? conversa.valorCombinado;

  async function enviar() {
    const conteudo = texto.trim();
    if (!conteudo || enviando) return;
    setEnviando(true);
    setErro('');
    try {
      if (modoProposta) {
        const valor = lerValor(conteudo);
        if (!valor) throw new Error('Digite o valor da proposta, por exemplo 250,00');
        colocar(await api.post(`/candidaturas/${candidaturaId}/propostas`, { valor }));
        setModoProposta(false);
      } else {
        colocar(await api.post(`/candidaturas/${candidaturaId}/mensagens`, { texto: conteudo }));
      }
      setTexto('');
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  }

  async function responder(mensagem, acao) {
    setErro('');
    try {
      colocar(await api.post(`/candidaturas/propostas/${mensagem.id}/${acao}`));
    } catch (e) {
      setErro(e.message);
    }
  }

  return (
    <Tela titulo="Chat" rolavel={false}>
      <View style={{ flex: 1 }}>
        <View style={st.painel}>
          <Pressable
            style={st.topo}
            onPress={() => router.push(usuario.tipo === 'CLIENTE' ? `/usuario/${outro.id}` : `/empresa/${outro.id}`)}
            role="button"
          >
            <Text style={st.nome} numberOfLines={1}>{outro.nome}</Text>
            <Text style={st.presenca}>{presenca}</Text>
          </Pressable>
          <Pressable onPress={() => router.push(`/entrega/${entrega.id}`)} role="button">
            <Text style={st.entrega} numberOfLines={1}>
              {entrega.titulo} · {valorAtual != null ? `combinado ${moeda(valorAtual)}` : `oferecido ${moeda(entrega.valor)}`}
            </Text>
          </Pressable>

          <FlatList
            ref={lista}
            data={conversa.mensagens}
            keyExtractor={(m) => String(m.id)}
            contentContainerStyle={st.mensagens}
            onContentSizeChange={() => lista.current?.scrollToEnd({ animated: false })}
            renderItem={({ item }) => (
              <Balao
                mensagem={item}
                minha={item.autorId === usuario.id}
                podeResponder={podeNegociar && item.autorId !== usuario.id}
                aoResponder={responder}
              />
            )}
          />
        </View>

        <View style={{ paddingHorizontal: 22 }}>
          <MensagemErro texto={erro} style={{ marginBottom: 6 }} />
        </View>

        {aberta ? (
          <View style={[st.barra, { paddingBottom: insets.bottom + 12 }]}>
            {podeNegociar && (
              <Pressable
                onPress={() => {
                  setModoProposta((m) => !m);
                  setTexto('');
                  setErro('');
                }}
                style={[st.botaoRedondo, modoProposta && { backgroundColor: cores.azul }]}
                hitSlop={6}
                role="button"
                aria-label="Propor valor"
              >
                <Text style={st.cifrao}>R$</Text>
              </Pressable>
            )}
            <TextInput
              style={st.input}
              value={texto}
              onChangeText={(t) => setTexto(modoProposta ? mascaras.valor(t) : t)}
              placeholder={modoProposta ? 'Valor da proposta' : 'Mensagem'}
              placeholderTextColor="#9A9A9A"
              keyboardType={modoProposta ? 'decimal-pad' : 'default'}
              multiline={!modoProposta}
              onSubmitEditing={modoProposta ? enviar : undefined}
              // No navegador, Enter envia e Shift+Enter quebra a linha
              onKeyPress={(e) => {
                if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
                  e.preventDefault();
                  enviar();
                }
              }}
            />
            <Pressable
              onPress={enviar}
              disabled={enviando || !texto.trim()}
              style={[st.botaoRedondo, { backgroundColor: cores.azul, opacity: texto.trim() ? 1 : 0.5 }]}
              hitSlop={6}
              role="button"
              aria-label="Enviar"
            >
              <Feather name="send" size={19} color={cores.branco} />
            </Pressable>
          </View>
        ) : (
          <Text style={[st.encerrada, { paddingBottom: insets.bottom + 16 }]}>Esta conversa foi encerrada.</Text>
        )}
      </View>
    </Tela>
  );
}

// Balão cinza claro com o bonequinho ao lado: à direita os meus, à esquerda os da outra pessoa
function Balao({ mensagem, minha, podeResponder, aoResponder }) {
  if (mensagem.tipo === 'SISTEMA') {
    return <Text style={st.sistema}>{mensagem.texto}</Text>;
  }

  const proposta = mensagem.tipo === 'PROPOSTA';
  const status = {
    PENDENTE: 'aguardando resposta', ACEITA: 'aceita', RECUSADA: 'recusada',
    SUBSTITUIDA: 'substituída por outra proposta', ENCERRADA: 'negociação encerrada',
  }[mensagem.statusProposta];
  const semEfeito = ['RECUSADA', 'SUBSTITUIDA', 'ENCERRADA'].includes(mensagem.statusProposta);

  const balao = (
    <View style={[st.balao, minha ? st.balaoMeu : st.balaoDele]}>
      {proposta ? (
        <>
          <Text style={st.propostaRotulo}>{minha ? 'Sua proposta' : 'Proposta de valor'}</Text>
          <Text style={[st.propostaValor, semEfeito && st.riscado]}>
            {moeda(mensagem.valorProposta)}
          </Text>
          <Text style={st.propostaStatus}>{status}</Text>
          {mensagem.statusProposta === 'PENDENTE' && podeResponder && (
            <View style={st.propostaBotoes}>
              <Botao titulo="Aceitar" tamanho="pequeno" onPress={() => aoResponder(mensagem, 'aceitar')} />
              <Botao titulo="Recusar" tamanho="pequeno" onPress={() => aoResponder(mensagem, 'recusar')} />
            </View>
          )}
        </>
      ) : (
        <Text style={st.texto}>{mensagem.texto}</Text>
      )}
      <Text style={st.hora}>
        {hora(mensagem.criadoEm)}
        {minha && mensagem.lidaEm ? ' · lida' : ''}
      </Text>
    </View>
  );

  const avatar = (
    <View style={st.avatar}>
      <Foto url={mensagem.autorFotoUrl} tamanho={34} />
    </View>
  );

  return (
    <View style={[st.linha, { justifyContent: minha ? 'flex-end' : 'flex-start' }]}>
      {minha ? (
        <>
          {balao}
          {avatar}
        </>
      ) : (
        <>
          {avatar}
          {balao}
        </>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  painel: { flex: 1, backgroundColor: cores.painel, borderRadius: 10, marginHorizontal: 22, marginTop: 30, marginBottom: 12, overflow: 'hidden' },
  topo: { alignItems: 'center', paddingTop: 18, paddingHorizontal: espaco.lg },
  nome: { fontFamily: fontes.titulo, color: cores.branco, fontSize: 26 },
  presenca: { fontFamily: fontes.chat, color: cores.branco, fontSize: 15, marginTop: 1 },
  entrega: { fontFamily: fontes.corpoMedio, color: cores.azul, fontSize: 12, textAlign: 'center', marginTop: 4, paddingHorizontal: espaco.lg, textDecorationLine: 'underline' },
  mensagens: { paddingHorizontal: 14, paddingVertical: 18 },
  linha: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 20 },
  avatar: { marginBottom: -12, marginHorizontal: 4 },
  balao: {
    maxWidth: '76%', minWidth: 110, backgroundColor: cores.bolha, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9,
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 3, shadowOffset: { width: 0, height: 2 },
  },
  balaoMeu: { borderBottomRightRadius: 2 },
  balaoDele: { borderBottomLeftRadius: 2 },
  texto: { fontFamily: fontes.corpo, color: '#1E1E1E', fontSize: 15, lineHeight: 20 },
  hora: { fontFamily: fontes.corpo, color: '#666', fontSize: 10.5, alignSelf: 'flex-end', marginTop: 3 },
  sistema: { fontFamily: fontes.chat, color: cores.branco, fontSize: 14, textAlign: 'center', marginBottom: 20, paddingHorizontal: 10, lineHeight: 18 },
  propostaRotulo: { fontFamily: fontes.corpoMedio, color: '#555', fontSize: 12 },
  propostaValor: { fontFamily: fontes.valor, color: '#111', fontSize: 24, marginVertical: 1 },
  riscado: { textDecorationLine: 'line-through', color: '#777' },
  propostaStatus: { fontFamily: fontes.corpoMedio, color: '#555', fontSize: 12 },
  propostaBotoes: { flexDirection: 'row', gap: 8, marginTop: 10 },
  barra: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 22 },
  botaoRedondo: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: cores.branco, alignItems: 'center', justifyContent: 'center' },
  cifrao: { fontFamily: fontes.corpoForte, color: cores.branco, fontSize: 13 },
  input: {
    flex: 1, minHeight: 40, maxHeight: 110, borderWidth: 1, borderColor: cores.branco, borderRadius: 10,
    paddingHorizontal: 12, paddingTop: 10, paddingBottom: 10, color: cores.branco, fontFamily: fontes.corpo, fontSize: 14,
  },
  encerrada: { fontFamily: fontes.chat, color: cores.textoSuave, fontSize: 15, textAlign: 'center' },
});
