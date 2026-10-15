import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  Avatar, Botao, Campo, Carregando, Cartao, Estrelas, MensagemErro, StatusBadge,
} from '../../../components/ui';
import { useAuth, useEvento } from '../../../contexts/AuthContext';
import { useCarregar } from '../../../hooks/useCarregar';
import { api } from '../../../services/api';
import { cores, espaco } from '../../../theme';
import { categoria, moeda, quando, veiculo } from '../../../utils/formatar';

// Confirmação que funciona no celular e no navegador
function confirmar(titulo, mensagem) {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${titulo}\n\n${mensagem}`));
  return new Promise((ok) =>
    Alert.alert(titulo, mensagem, [
      { text: 'Voltar', style: 'cancel', onPress: () => ok(false) },
      { text: 'Confirmar', onPress: () => ok(true) },
    ])
  );
}

export default function DetalhePedido() {
  const { id } = useLocalSearchParams();
  const { usuario } = useAuth();
  const { dados: pedido, carregando, erro, recarregar } = useCarregar(() => api.get(`/pedidos/${id}`), [id]);
  const [acao, setAcao] = useState('');
  const [erroAcao, setErroAcao] = useState('');

  useEvento('pedido:atualizado', (d) => d.pedido.id === Number(id) && recarregar());
  useEvento('mensagem:nova', () => recarregar());

  if (carregando) return <Carregando />;
  if (!pedido) return <View style={{ padding: espaco.lg }}><MensagemErro texto={erro} /></View>;

  const souCliente = pedido.clienteId === usuario.id;
  const souEntregador = pedido.entregadorId === usuario.id;
  const cat = categoria(pedido.categoria);

  async function executar(nome, fn) {
    setAcao(nome);
    setErroAcao('');
    try {
      await fn();
      await recarregar();
    } catch (e) {
      setErroAcao(e.message);
    } finally {
      setAcao('');
    }
  }

  const mudarStatus = (status) => api.patch(`/pedidos/${pedido.id}/status`, { status });

  async function negociar() {
    setAcao('negociar');
    setErroAcao('');
    try {
      const conversa = await api.post(`/pedidos/${pedido.id}/conversas`);
      router.push(`/chat/${conversa.id}`);
    } catch (e) {
      setErroAcao(e.message);
    } finally {
      setAcao('');
    }
  }

  async function cancelar() {
    if (await confirmar('Cancelar pedido', 'Tem certeza? Essa ação não pode ser desfeita.')) {
      executar('cancelar', () => mudarStatus('CANCELADO'));
    }
  }

  return (
    <ScrollView contentContainerStyle={st.container}>
      <Stack.Screen options={{ title: cat.rotulo }} />

      <Cartao>
        <View style={st.linhaTopo}>
          <StatusBadge status={pedido.status} />
          <Text style={st.data}>{quando(pedido.criadoEm)}</Text>
        </View>
        <Text style={st.titulo}>{pedido.titulo}</Text>
        <Text style={st.descricao}>{pedido.descricao}</Text>

        <View style={st.rota}>
          <Parada icone="radio-button-on" cor={cores.primaria} rotulo="Retirada" texto={pedido.origem} />
          <View style={st.tracejado} />
          <Parada icone="location" cor={cores.perigo} rotulo="Entrega" texto={pedido.destino} />
        </View>

        <View style={st.valores}>
          <View>
            <Text style={st.valorRotulo}>Sugerido pelo cliente</Text>
            <Text style={st.valor}>{moeda(pedido.valorSugerido)}</Text>
          </View>
          {pedido.valorFinal != null && (
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={st.valorRotulo}>Valor combinado</Text>
              <Text style={[st.valor, { color: cores.sucesso }]}>{moeda(pedido.valorFinal)}</Text>
            </View>
          )}
        </View>
      </Cartao>

      {/* Pessoa do outro lado */}
      {!souCliente && <Pessoa titulo="Cliente" pessoa={pedido.cliente} />}
      {souCliente && pedido.entregador && <Pessoa titulo="Entregador" pessoa={pedido.entregador} />}

      <MensagemErro texto={erroAcao} />

      {/* Ações do entregador */}
      {usuario.tipo === 'ENTREGADOR' && pedido.status === 'ABERTO' && (
        <Botao
          titulo={pedido.conversas.length ? 'Continuar negociação' : 'Negociar com o cliente'}
          icone="chatbubbles-outline"
          onPress={negociar}
          carregando={acao === 'negociar'}
        />
      )}
      {souEntregador && pedido.status === 'ACEITO' && (
        <Botao titulo="Retirei a mercadoria" icone="cube-outline" onPress={() => executar('retirar', () => mudarStatus('EM_ANDAMENTO'))} carregando={acao === 'retirar'} />
      )}
      {souEntregador && pedido.status === 'EM_ANDAMENTO' && (
        <Botao titulo="Confirmar entrega" variante="sucesso" icone="checkmark-circle-outline" onPress={() => executar('concluir', () => mudarStatus('CONCLUIDO'))} carregando={acao === 'concluir'} />
      )}
      {souEntregador && pedido.conversas[0] && pedido.status !== 'ABERTO' && (
        <Botao titulo="Abrir conversa" variante="secundario" icone="chatbubble-outline" onPress={() => router.push(`/chat/${pedido.conversas[0].id}`)} style={{ marginTop: espaco.sm }} />
      )}

      {/* Cliente: negociações recebidas */}
      {souCliente && (
        <>
          <Text style={st.secao}>
            {pedido.status === 'ABERTO' ? 'Entregadores interessados' : 'Conversas'}
          </Text>
          {pedido.conversas.length === 0 ? (
            <Text style={st.aguardando}>
              Aguardando entregadores. Você será avisado quando alguém quiser negociar.
            </Text>
          ) : (
            pedido.conversas.map((c) => (
              <Cartao key={c.id} onPress={() => router.push(`/chat/${c.id}`)} style={{ marginBottom: espaco.sm }}>
                <View style={st.linhaPessoa}>
                  <Avatar nome={c.entregador.nome} />
                  <View style={{ flex: 1 }}>
                    <Text style={st.nomePessoa}>{c.entregador.nome}</Text>
                    <Text style={st.sub} numberOfLines={1}>
                      {c.ultimaMensagem?.tipo === 'PROPOSTA'
                        ? `Proposta: ${moeda(c.ultimaMensagem.valorProposta)}`
                        : c.ultimaMensagem?.texto}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={cores.textoSecundario} />
                </View>
              </Cartao>
            ))
          )}
          {['ABERTO', 'ACEITO'].includes(pedido.status) && (
            <Botao titulo="Cancelar pedido" variante="perigo" onPress={cancelar} carregando={acao === 'cancelar'} style={{ marginTop: espaco.lg }} />
          )}
        </>
      )}

      {/* Avaliação depois da entrega */}
      {pedido.status === 'CONCLUIDO' && (souCliente || souEntregador) && (
        <Avaliar pedido={pedido} souCliente={souCliente} aoAvaliar={recarregar} />
      )}
    </ScrollView>
  );
}

function Parada({ icone, cor, rotulo, texto }) {
  return (
    <View style={st.parada}>
      <Ionicons name={icone} size={18} color={cor} />
      <View style={{ flex: 1 }}>
        <Text style={st.paradaRotulo}>{rotulo}</Text>
        <Text style={st.paradaTexto}>{texto}</Text>
      </View>
    </View>
  );
}

function Pessoa({ titulo, pessoa }) {
  if (!pessoa) return null;
  return (
    <>
      <Text style={st.secao}>{titulo}</Text>
      <Cartao onPress={() => router.push(`/usuario/${pessoa.id}`)} style={{ marginBottom: espaco.lg }}>
        <View style={st.linhaPessoa}>
          <Avatar nome={pessoa.nome} />
          <View style={{ flex: 1 }}>
            <Text style={st.nomePessoa}>{pessoa.nome}</Text>
            {pessoa.veiculo && (
              <Text style={st.sub}>
                {veiculo(pessoa.veiculo)}{pessoa.placa ? ` · ${pessoa.placa}` : ''}
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color={cores.textoSecundario} />
        </View>
      </Cartao>
    </>
  );
}

function Avaliar({ pedido, souCliente, aoAvaliar }) {
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  if (pedido.jaAvaliei) {
    return (
      <Cartao style={{ marginTop: espaco.lg, alignItems: 'center' }}>
        <Ionicons name="checkmark-circle" size={32} color={cores.sucesso} />
        <Text style={[st.nomePessoa, { marginTop: 6 }]}>Obrigado pela avaliação!</Text>
      </Cartao>
    );
  }

  async function enviar() {
    setEnviando(true);
    setErro('');
    try {
      await api.post(`/pedidos/${pedido.id}/avaliacoes`, { nota, comentario: comentario || undefined });
      aoAvaliar();
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Cartao style={{ marginTop: espaco.lg }}>
      <Text style={st.nomePessoa}>Como foi com {souCliente ? 'o entregador' : 'o cliente'}?</Text>
      <View style={{ marginVertical: espaco.md }}>
        <Estrelas nota={nota} tamanho={34} onChange={setNota} />
      </View>
      <Campo value={comentario} onChangeText={setComentario} placeholder="Deixe um comentário (opcional)" multiline />
      <MensagemErro texto={erro} />
      <Botao titulo="Enviar avaliação" onPress={enviar} desabilitado={!nota} carregando={enviando} />
    </Cartao>
  );
}

const st = StyleSheet.create({
  container: { padding: espaco.lg, paddingBottom: 48 },
  linhaTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  data: { fontSize: 13, color: cores.textoSecundario },
  titulo: { fontSize: 20, fontWeight: '800', color: cores.texto, marginTop: espaco.md },
  descricao: { fontSize: 15, color: cores.texto, marginTop: 6, lineHeight: 21 },
  rota: { marginTop: espaco.lg },
  parada: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  paradaRotulo: { fontSize: 12, color: cores.textoSecundario, fontWeight: '600' },
  paradaTexto: { fontSize: 15, color: cores.texto },
  tracejado: { width: 2, height: 18, backgroundColor: cores.borda, marginLeft: 8, marginVertical: 4 },
  valores: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: espaco.lg,
    paddingTop: espaco.md, borderTopWidth: 1, borderTopColor: cores.borda,
  },
  valorRotulo: { fontSize: 12, color: cores.textoSecundario },
  valor: { fontSize: 20, fontWeight: '800', color: cores.primariaEscura, marginTop: 2 },
  secao: { fontSize: 17, fontWeight: '700', color: cores.texto, marginTop: espaco.xl, marginBottom: espaco.sm },
  aguardando: { fontSize: 14, color: cores.textoSecundario },
  linhaPessoa: { flexDirection: 'row', alignItems: 'center', gap: espaco.md },
  nomePessoa: { fontSize: 16, fontWeight: '700', color: cores.texto },
  sub: { fontSize: 13, color: cores.textoSecundario, marginTop: 2 },
});
