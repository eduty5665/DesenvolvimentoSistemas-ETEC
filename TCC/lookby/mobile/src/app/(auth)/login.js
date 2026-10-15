import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import TelaAuth, { BotaoAuth, CampoAuth, LinksAuth } from '../../components/TelaAuth';
import { useAuth } from '../../contexts/AuthContext';

export default function Login() {
  const { entrar } = useAuth();
  const { aviso } = useLocalSearchParams(); // ex.: "Senha alterada" vindo da recuperação
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
    <TelaAuth erro={erro} aviso={aviso}>
      <CampoAuth
        value={email}
        onChangeText={setEmail}
        placeholder="E-mail"
        keyboardType="email-address"
        autoComplete="email"
      />
      <CampoAuth
        value={senha}
        onChangeText={setSenha}
        placeholder="Senha"
        secureTextEntry
        onSubmitEditing={handleEntrar}
      />
      <BotaoAuth titulo="Entrar" onPress={handleEntrar} carregando={enviando} />
      <LinksAuth
        esquerda="Esqueci minha senha."
        aoEsquerda={() => router.push('/esqueci-senha')}
        direita="Cadastre-se!"
        aoDireita={() => router.push('/cadastro')}
      />
    </TelaAuth>
  );
}
