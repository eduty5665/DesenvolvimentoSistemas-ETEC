import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { Botao, Campo, MensagemErro, Opcoes } from '../../../components/ui';
import { api } from '../../../services/api';
import { cores, espaco } from '../../../theme';
import { CATEGORIAS } from '../../../utils/formatar';

// Cliente descreve o que precisa transportar. O valor é só uma sugestão:
// o preço final é combinado no chat com o entregador.
export default function NovoPedido() {
  const [form, setForm] = useState({
    categoria: 'ENCOMENDA', titulo: '', descricao: '', origem: '', destino: '', valorSugerido: '',
  });
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const alterar = (campo) => (valor) => setForm((f) => ({ ...f, [campo]: valor }));

  async function publicar() {
    setErro('');
    setEnviando(true);
    try {
      const valor = form.valorSugerido.replace(',', '.').trim();
      const pedido = await api.post('/pedidos', { ...form, valorSugerido: valor ? Number(valor) : null });
      router.replace(`/pedido/${pedido.id}`);
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={st.container} keyboardShouldPersistTaps="handled">
        <Opcoes rotulo="Tipo de serviço" opcoes={CATEGORIAS} valor={form.categoria} onChange={alterar('categoria')} />
        <Campo rotulo="Título" value={form.titulo} onChangeText={alterar('titulo')} placeholder="Ex.: Levar bolo de aniversário" />
        <Campo
          rotulo="O que vai ser transportado?"
          value={form.descricao}
          onChangeText={alterar('descricao')}
          placeholder="Tamanho, peso, cuidados, horário desejado..."
          multiline
        />
        <Campo rotulo="Endereço de retirada" value={form.origem} onChangeText={alterar('origem')} placeholder="Rua, número, bairro, cidade" />
        <Campo rotulo="Endereço de entrega" value={form.destino} onChangeText={alterar('destino')} placeholder="Rua, número, bairro, cidade" />
        <Campo
          rotulo="Quanto você pretende pagar? (opcional)"
          value={form.valorSugerido}
          onChangeText={alterar('valorSugerido')}
          placeholder="Ex.: 25,00"
          keyboardType="decimal-pad"
        />
        <Text style={st.dica}>O valor final é combinado com o entregador no chat.</Text>

        <MensagemErro texto={erro} />
        <Botao titulo="Publicar pedido" icone="send-outline" onPress={publicar} carregando={enviando} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  container: { padding: espaco.lg, paddingBottom: 48 },
  dica: { fontSize: 13, color: cores.textoSecundario, marginTop: -4, marginBottom: espaco.lg },
});
