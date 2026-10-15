import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { Botao, Campo, MensagemErro, Opcoes } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { cores, espaco } from '../../theme';
import { VEICULOS } from '../../utils/formatar';

const TIPOS = [
  { valor: 'CLIENTE', rotulo: 'Preciso de entregas', icone: 'person-outline' },
  { valor: 'ENTREGADOR', rotulo: 'Quero fazer entregas', icone: 'bicycle-outline' },
];

export default function Cadastro() {
  const { cadastrar } = useAuth();
  const [form, setForm] = useState({
    tipo: 'CLIENTE', nome: '', email: '', telefone: '', senha: '', veiculo: 'MOTO', placa: '', cnh: '',
  });
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const alterar = (campo) => (valor) => setForm((f) => ({ ...f, [campo]: valor }));
  const entregador = form.tipo === 'ENTREGADOR';

  async function handleCadastrar() {
    setErro('');
    setEnviando(true);
    try {
      const dados = { ...form };
      if (!entregador) {
        delete dados.veiculo;
        delete dados.placa;
        delete dados.cnh;
      }
      await cadastrar(dados);
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={st.container} keyboardShouldPersistTaps="handled">
        <Opcoes rotulo="Como você vai usar o app?" opcoes={TIPOS} valor={form.tipo} onChange={alterar('tipo')} />

        <Campo rotulo="Nome completo" value={form.nome} onChangeText={alterar('nome')} autoComplete="name" />
        <Campo
          rotulo="E-mail"
          value={form.email}
          onChangeText={alterar('email')}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Campo
          rotulo="Telefone (WhatsApp)"
          value={form.telefone}
          onChangeText={alterar('telefone')}
          keyboardType="phone-pad"
          placeholder="(11) 99999-9999"
        />
        <Campo
          rotulo="Senha"
          value={form.senha}
          onChangeText={alterar('senha')}
          secureTextEntry
          placeholder="Mínimo 6 caracteres"
        />

        {entregador && (
          <>
            <Text style={st.secao}>Dados do veículo</Text>
            <Opcoes rotulo="Veículo" opcoes={VEICULOS} valor={form.veiculo} onChange={alterar('veiculo')} />
            <Campo
              rotulo="Placa"
              value={form.placa}
              onChangeText={alterar('placa')}
              autoCapitalize="characters"
              placeholder="ABC1D23"
            />
            <Campo rotulo="Número da CNH" value={form.cnh} onChangeText={alterar('cnh')} keyboardType="number-pad" />
          </>
        )}

        <MensagemErro texto={erro} />
        <Botao titulo="Criar conta" onPress={handleCadastrar} carregando={enviando} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  container: { padding: espaco.xl, paddingBottom: 48 },
  secao: { fontSize: 17, fontWeight: '700', color: cores.texto, marginVertical: espaco.md },
});
