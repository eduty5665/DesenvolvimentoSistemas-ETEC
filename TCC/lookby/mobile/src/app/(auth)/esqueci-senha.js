import { router } from 'expo-router';
import { useState } from 'react';
import TelaAuth, { BotaoAuth, CampoAuth, LinksAuth } from '../../components/TelaAuth';
import { api } from '../../services/api';
import { mascaras } from '../../utils/formatar';

// Recuperação de senha, as três telas do Figma em sequência:
//  1) informa o e-mail  -> "Enviar Código"
//  2) digita o código   -> "Autenticar Código"
//  3) cria a nova senha -> "Confirmar nova senha"
export default function EsqueciSenha() {
  const [passo, setPasso] = useState(1);
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [token, setToken] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function executar(fn) {
    setErro('');
    setEnviando(true);
    try {
      await fn();
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  }

  const enviarCodigo = () =>
    executar(async () => {
      const r = await api.post('/auth/esqueci-senha', { email });
      // Em desenvolvimento a API devolve o código, já que ainda não há envio de e-mail
      setAviso(r.codigoDev ? `Modo de teste: seu código é ${r.codigoDev}` : r.mensagem);
      setPasso(2);
    });

  const autenticar = () =>
    executar(async () => {
      const r = await api.post('/auth/verificar-codigo', { email, codigo });
      setToken(r.tokenRedefinicao);
      setAviso('Crie sua nova senha.');
      setPasso(3);
    });

  const trocarSenha = () =>
    executar(async () => {
      if (senha !== confirmar) throw new Error('As senhas não são iguais');
      await api.post('/auth/nova-senha', { tokenRedefinicao: token, senha });
      router.replace({ pathname: '/login', params: { aviso: 'Senha alterada. Entre com a nova senha.' } });
    });

  if (passo === 1) {
    return (
      <TelaAuth erro={erro}>
        <CampoAuth
          value={email}
          onChangeText={setEmail}
          placeholder="E-mail"
          keyboardType="email-address"
          onSubmitEditing={enviarCodigo}
        />
        <BotaoAuth titulo="Enviar Código" onPress={enviarCodigo} carregando={enviando} />
        <LinksAuth esquerda="Voltar ao Login" aoEsquerda={() => router.back()} />
      </TelaAuth>
    );
  }

  if (passo === 2) {
    return (
      <TelaAuth erro={erro} aviso={aviso}>
        <CampoAuth
          value={codigo}
          onChangeText={(t) => setCodigo(mascaras.numeros(t).slice(0, 4))}
          placeholder="Código de 4 dígitos"
          keyboardType="number-pad"
          maxLength={4}
          onSubmitEditing={autenticar}
        />
        <BotaoAuth titulo="Autenticar Código" onPress={autenticar} carregando={enviando} />
        <LinksAuth esquerda="Enviar outro código" aoEsquerda={enviarCodigo} />
      </TelaAuth>
    );
  }

  return (
    <TelaAuth erro={erro} aviso={aviso}>
      <CampoAuth value={senha} onChangeText={setSenha} placeholder="Nova senha" secureTextEntry />
      <CampoAuth
        value={confirmar}
        onChangeText={setConfirmar}
        placeholder="Confirmar nova senha"
        secureTextEntry
        onSubmitEditing={trocarSenha}
      />
      <BotaoAuth titulo="Confirmar nova senha" onPress={trocarSenha} carregando={enviando} />
    </TelaAuth>
  );
}
