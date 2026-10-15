import { Link } from 'expo-router';
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Botao, Campo, MensagemErro } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { cores, espaco } from '../../theme';

export default function Login() {
  const { entrar } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function handleEntrar() {
    setErro('');
    setEnviando(true);
    try {
      await entrar(email, senha);
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: cores.fundo }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={st.container} keyboardShouldPersistTaps="handled">
          <View style={st.cabecalho}>
            <Image source={require('../../../assets/logo.png')} style={st.logo} resizeMode="contain" />
            <Text style={st.nome}>Entregas</Text>
            <Text style={st.slogan}>Combine entregas direto com quem vai levar.</Text>
          </View>

          <MensagemErro texto={erro} />
          <Campo
            rotulo="E-mail"
            value={email}
            onChangeText={setEmail}
            placeholder="seu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <Campo
            rotulo="Senha"
            value={senha}
            onChangeText={setSenha}
            placeholder="Sua senha"
            secureTextEntry
            onSubmitEditing={handleEntrar}
          />
          <Botao titulo="Entrar" onPress={handleEntrar} carregando={enviando} style={{ marginTop: espaco.sm }} />

          <View style={st.rodape}>
            <Text style={{ color: cores.textoSecundario }}>Ainda não tem conta? </Text>
            <Link href="/cadastro" style={st.link}>Cadastre-se</Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: espaco.xl },
  cabecalho: { alignItems: 'center', marginBottom: espaco.xl },
  logo: { width: 96, height: 104 },
  nome: { fontSize: 30, fontWeight: '800', color: cores.primariaEscura, marginTop: espaco.sm },
  slogan: { fontSize: 15, color: cores.textoSecundario, marginTop: 4, textAlign: 'center' },
  rodape: { flexDirection: 'row', justifyContent: 'center', marginTop: espaco.xl },
  link: { color: cores.primaria, fontWeight: '700' },
});
