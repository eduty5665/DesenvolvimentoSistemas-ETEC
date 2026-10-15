import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import {
  FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Botao, Carregando, MensagemErro, StatusBadge } from '../../../components/ui';
import { useAuth, useEvento } from '../../../contexts/AuthContext';
import { useCarregar } from '../../../hooks/useCarregar';
import { api } from '../../../services/api';
import { cores, espaco, raio } from '../../../theme';
import { hora, moeda } from '../../../utils/formatar';

// Chat de negociação entre cliente e entregador sobre um pedido.
// Além de texto, qualquer lado pode enviar uma PROPOSTA de valor; o outro aceita ou recusa.
export default function Chat() {
  const { id } = useLocalSearchParams();
  const conversaId = Number(id);
  const { usuario } = useAuth();
  const insets = useSafeAreaInsets();
  const lista = useRef(null);

  const { dados: conversa, setDados, carregando, erro: erroCarregar, recarregar } = useCarregar(
    () => api.get(`/conversas/${conversaId}`),
    [conversaId]
  );
  const [texto, setTexto] = useState('');
  const [modoProposta, setModoProposta] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  // Adiciona ou substitui uma mensagem na lista (sem duplicar)
  function colocarMensagem(m) {
    setDados((c) => {
      if (!c) return c;
      const existe = c.mensagens.some((x) => x.id === m.id);
      const mensagens = existe ? c.mensagens.map((x) => (x.id === m.id ? m : x)) : [...c.mensagens, m];
      return { ...c, mensagens };
    });
  }

  useEvento('mensagem:nova', (d) => d.conversaId === conversaId && colocarMensagem(d.mensagem));
  useEvento('mensagem:atualizada', (d) => d.conversaId === conversaId && colocarMensagem(d.mensagem));
  useEvento('pedido:atualizado', (d) => {
    if (conversa && d.pedido.id === conversa.pedidoId) recarregar();
  });

  if (carregando) return <Carregando />;
  if (!conversa) return <View style={{ padding: espaco.lg }}><MensagemErro texto={erroCarregar} /></View>;

  const outro = usuario.id === conversa.clienteId ? conversa.entregador : conversa.cliente;
  const pedido = conversa.pedido;
  const podeNegociar = pedido.status === 'ABERTO';
  const encerrada =
    pedido.status === 'CANCELADO' ||
    (pedido.status !== 'ABERTO' && pedido.entregadorId !== conversa.entregadorId);

  async function enviar() {
    const conteudo = texto.trim();
    if (!conteudo) return;
    setEnviando(true);
    setErro('');
    try {
      if (modoProposta) {
        const valor = Number(conteudo.replace(/[^\d,.]/g, '').replace(',', '.'));
        colocarMensagem(await api.post(`/conversas/${conversaId}/propostas`, { valor }));
        setModoProposta(false);
      } else {
        colocarMensagem(await api.post(`/conversas/${conversaId}/mensagens`, { texto: conteudo }));
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
      await api.post(`/conversas/propostas/${mensagem.id}/${acao}`);
      await recarregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Stack.Screen options={{ title: outro?.nome || 'Conversa' }} />

      {/* Resumo do pedido no topo */}
      <Pressable style={st.pedido} onPress={() => router.push(`/pedido/${pedido.id}`)}>
        <View style={{ flex: 1 }}>
          <Text style={st.pedidoTitulo} numberOfLines={1}>{pedido.titulo}</Text>
          <Text style={st.pedidoSub}>
            {pedido.valorFinal != null ? `Combinado: ${moeda(pedido.valorFinal)}` : `Sugerido: ${moeda(pedido.valorSugerido)}`}
          </Text>
        </View>
        <StatusBadge status={pedido.status} />
      </Pressable>

      <FlatList
        ref={lista}
        data={conversa.mensagens}
        keyExtractor={(m) => String(m.id)}
        contentContainerStyle={{ padding: espaco.md }}
        onContentSizeChange={() => lista.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => (
          <Balao
            mensagem={item}
            minha={item.autorId === usuario.id}
            podeResponder={podeNegociar && item.autorId !== usuario.id}
            onResponder={responder}
          />
        )}
      />

      <View style={{ paddingHorizontal: espaco.md }}>
        <MensagemErro texto={erro} />
      </View>

      {encerrada ? (
        <View style={[st.encerrada, { paddingBottom: insets.bottom + espaco.md }]}>
          <Text style={st.encerradaTexto}>Esta negociação foi encerrada.</Text>
        </View>
      ) : (
        <View style={[st.barra, { paddingBottom: insets.bottom + espaco.sm }]}>
          {podeNegociar && (
            <Pressable
              onPress={() => {
                setModoProposta((m) => !m);
                setTexto('');
              }}
              style={[st.botaoProposta, modoProposta && { backgroundColor: cores.primaria }]}
              hitSlop={6}
              role="button"
              aria-label="Fazer proposta de valor"
            >
              <Ionicons name="cash-outline" size={22} color={modoProposta ? '#fff' : cores.primaria} />
            </Pressable>
          )}
          <TextInput
            style={st.input}
            value={texto}
            onChangeText={setTexto}
            placeholder={modoProposta ? 'Valor da proposta (R$)' : 'Mensagem'}
            placeholderTextColor={cores.textoSecundario}
            keyboardType={modoProposta ? 'decimal-pad' : 'default'}
            multiline={!modoProposta}
          />
          <Pressable onPress={enviar} disabled={enviando || !texto.trim()} style={st.enviar} hitSlop={6} role="button" aria-label="Enviar">
            <Ionicons name="send" size={20} color="#fff" />
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

function Balao({ mensagem, minha, podeResponder, onResponder }) {
  if (mensagem.tipo === 'SISTEMA') {
    return (
      <View style={st.sistema}>
        <Text style={st.sistemaTexto}>{mensagem.texto}</Text>
      </View>
    );
  }

  if (mensagem.tipo === 'PROPOSTA') {
    const status = mensagem.statusProposta;
    const cor = status === 'ACEITA' ? cores.sucesso : status === 'RECUSADA' ? cores.textoSecundario : cores.aviso;
    const rotulo = { PENDENTE: 'Aguardando resposta', ACEITA: 'Aceita', RECUSADA: 'Encerrada' }[status];
    return (
      <View style={[st.proposta, minha ? st.direita : st.esquerda]}>
        <Text style={st.propostaRotulo}>{minha ? 'Sua proposta' : `Proposta de ${mensagem.autor?.nome?.split(' ')[0]}`}</Text>
        <Text style={[st.propostaValor, status === 'RECUSADA' && st.riscado]}>{moeda(mensagem.valorProposta)}</Text>
        <Text style={[st.propostaStatus, { color: cor }]}>{rotulo}</Text>
        {status === 'PENDENTE' && podeResponder && (
          <View style={st.propostaAcoes}>
            <Botao titulo="Recusar" variante="perigo" onPress={() => onResponder(mensagem, 'recusar')} style={st.acao} />
            <Botao titulo="Aceitar" variante="sucesso" onPress={() => onResponder(mensagem, 'aceitar')} style={st.acao} />
          </View>
        )}
        <Text style={st.hora}>{hora(mensagem.criadoEm)}</Text>
      </View>
    );
  }

  return (
    <View style={[st.balao, minha ? [st.direita, st.minha] : [st.esquerda, st.dele]]}>
      <Text style={[st.texto, minha && { color: '#fff' }]}>{mensagem.texto}</Text>
      <Text style={[st.hora, minha && { color: '#E0F2FE' }]}>{hora(mensagem.criadoEm)}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  pedido: {
    flexDirection: 'row', alignItems: 'center', gap: espaco.md, padding: espaco.md,
    backgroundColor: cores.superficie, borderBottomWidth: 1, borderBottomColor: cores.borda,
  },
  pedidoTitulo: { fontSize: 15, fontWeight: '700', color: cores.texto },
  pedidoSub: { fontSize: 13, color: cores.textoSecundario, marginTop: 2 },
  balao: { maxWidth: '80%', borderRadius: raio.lg, paddingHorizontal: 14, paddingVertical: 8, marginVertical: 3 },
  direita: { alignSelf: 'flex-end' },
  esquerda: { alignSelf: 'flex-start' },
  minha: { backgroundColor: cores.primaria, borderBottomRightRadius: 4 },
  dele: { backgroundColor: cores.superficie, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: cores.borda },
  texto: { fontSize: 15, color: cores.texto, lineHeight: 20 },
  hora: { fontSize: 11, color: cores.textoSecundario, alignSelf: 'flex-end', marginTop: 2 },
  sistema: {
    alignSelf: 'center', backgroundColor: cores.destaqueClaro, borderRadius: raio.pill,
    paddingHorizontal: 12, paddingVertical: 6, marginVertical: 8, maxWidth: '90%',
  },
  sistemaTexto: { fontSize: 13, color: cores.primariaEscura, textAlign: 'center' },
  proposta: {
    width: '75%', backgroundColor: cores.superficie, borderRadius: raio.lg, padding: espaco.md,
    marginVertical: 6, borderWidth: 2, borderColor: cores.destaque,
  },
  propostaRotulo: { fontSize: 12, color: cores.textoSecundario, fontWeight: '600' },
  propostaValor: { fontSize: 26, fontWeight: '800', color: cores.texto, marginVertical: 2 },
  riscado: { textDecorationLine: 'line-through', color: cores.textoSecundario },
  propostaStatus: { fontSize: 13, fontWeight: '700' },
  propostaAcoes: { flexDirection: 'row', gap: espaco.sm, marginTop: espaco.md },
  acao: { flex: 1, minHeight: 40 },
  barra: {
    flexDirection: 'row', alignItems: 'flex-end', gap: espaco.sm, paddingHorizontal: espaco.md,
    paddingTop: espaco.sm, backgroundColor: cores.superficie, borderTopWidth: 1, borderTopColor: cores.borda,
  },
  botaoProposta: {
    width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: cores.primaria,
    alignItems: 'center', justifyContent: 'center',
  },
  input: {
    flex: 1, minHeight: 44, maxHeight: 120, backgroundColor: cores.fundo, borderRadius: 22,
    paddingHorizontal: 16, paddingTop: 11, paddingBottom: 11, fontSize: 16, color: cores.texto,
  },
  enviar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: cores.primaria,
    alignItems: 'center', justifyContent: 'center',
  },
  encerrada: { padding: espaco.md, alignItems: 'center', backgroundColor: cores.superficie, borderTopWidth: 1, borderTopColor: cores.borda },
  encerradaTexto: { color: cores.textoSecundario, fontSize: 14 },
});
