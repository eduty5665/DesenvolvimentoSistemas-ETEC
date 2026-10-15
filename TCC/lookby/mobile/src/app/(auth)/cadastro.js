import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import TelaAuth, { BotaoAuth, CampoAuth, LinksAuth } from '../../components/TelaAuth';
import { Opcoes } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { cores, fontes } from '../../theme';

const TIPOS = [
  { valor: 'ENTREGADOR', rotulo: 'Faço entregas' },
  { valor: 'CLIENTE', rotulo: 'Preciso de entregas' },
];

// Cadastro em dois passos:
//  1) e-mail e senha (tela do Figma)
//  2) nome e se a pessoa é entregador ou cliente/empresa
export default function Cadastro() {
  const { cadastrar } = useAuth();
  const [passo, setPasso] = useState(1);
  const [form, setForm] = useState({ email: '', senha: '', confirmar: '', nome: '', tipo: null });
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const alterar = (campo) => (valor) => setForm((f) => ({ ...f, [campo]: valor }));

  function continuar() {
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return setErro('Informe um e-mail válido');
    if (form.senha.length < 6) return setErro('A senha deve ter pelo menos 6 caracteres');
    if (form.senha !== form.confirmar) return setErro('As senhas não são iguais');
    setErro('');
    setPasso(2);
  }

  async function concluir() {
    if (!form.tipo) return setErro('Escolha como você vai usar o LookBy');
    setErro('');
    setEnviando(true);
    try {
      await cadastrar({ email: form.email, senha: form.senha, nome: form.nome, tipo: form.tipo });
    } catch (e) {
      setErro(e.message);
      if (/e-mail/i.test(e.message)) setPasso(1);
    } finally {
      setEnviando(false);
    }
  }

  if (passo === 1) {
    return (
      <TelaAuth erro={erro}>
        <CampoAuth value={form.email} onChangeText={alterar('email')} placeholder="E-mail" keyboardType="email-address" />
        <CampoAuth value={form.senha} onChangeText={alterar('senha')} placeholder="Senha" secureTextEntry />
        <CampoAuth
          value={form.confirmar}
          onChangeText={alterar('confirmar')}
          placeholder="Confirmar senha"
          secureTextEntry
          onSubmitEditing={continuar}
        />
        <BotaoAuth titulo="Cadastrar" onPress={continuar} />
        <LinksAuth esquerda="Tenho uma conta." direita="Faça login!" aoDireita={() => router.replace('/login')} />
      </TelaAuth>
    );
  }

  return (
    <TelaAuth erro={erro}>
      <Text style={st.pergunta}>Como você vai usar o LookBy?</Text>
      <Opcoes opcoes={TIPOS} valor={form.tipo} onChange={alterar('tipo')} centralizado />
      <CampoAuth
        value={form.nome}
        onChangeText={alterar('nome')}
        placeholder={form.tipo === 'CLIENTE' ? 'Nome da empresa ou seu nome' : 'Nome completo'}
        autoCapitalize="words"
        onSubmitEditing={concluir}
      />
      <BotaoAuth titulo="Concluir cadastro" onPress={concluir} carregando={enviando} />
      <LinksAuth esquerda="Voltar" aoEsquerda={() => setPasso(1)} />
    </TelaAuth>
  );
}

const st = StyleSheet.create({
  pergunta: { fontFamily: fontes.corpoMedio, color: cores.branco, fontSize: 14, textAlign: 'center', marginBottom: 12 },
});
