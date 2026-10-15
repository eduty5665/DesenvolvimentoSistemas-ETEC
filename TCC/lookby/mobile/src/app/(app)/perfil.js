import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Tela from '../../components/Tela';
import { Botao, Caixa, Campo, Dado, Dados, Estrelas, MensagemErro, Opcoes, Secao } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useCarregar } from '../../hooks/useCarregar';
import { api, urlArquivo } from '../../services/api';
import { cores, espaco, fontes } from '../../theme';
import { dataBR, dataISO, mascaras, veiculo, VEICULOS } from '../../utils/formatar';

// Perfil do Figma: foto, "Dados Pessoais" e "Dados da Conta", cada um com seu botão Editar.
// O ícone da direita no cabeçalho abre a caixa com o "log out".
export default function Perfil() {
  const { usuario, setUsuario, atualizarUsuario } = useAuth();
  useCarregar(() => atualizarUsuario());
  const entregador = usuario.tipo === 'ENTREGADOR';

  const [editando, setEditando] = useState(null); // 'pessoais' | 'conta'
  const [form, setForm] = useState({});
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [erroFoto, setErroFoto] = useState('');
  const alterar = (campo) => (valor) => setForm((f) => ({ ...f, [campo]: valor }));

  function abrir(qual) {
    setErro('');
    setForm(
      qual === 'pessoais'
        ? {
            nome: usuario.nome || '',
            dataNascimento: usuario.dataNascimento ? dataBR(usuario.dataNascimento) : '',
            cpf: usuario.cpf || '',
            cnh: usuario.cnh || '',
            telefone: usuario.telefone || '',
            telefone2: usuario.telefone2 || '',
            veiculo: usuario.veiculo || null,
            placa: usuario.placa || '',
          }
        : { usuario: usuario.usuario, email: usuario.email, novaSenha: '', senhaAtual: '' }
    );
    setEditando(qual);
  }

  async function salvar() {
    setErro('');
    setSalvando(true);
    try {
      let atualizado;
      if (editando === 'pessoais') {
        const nascimento = form.dataNascimento ? dataISO(form.dataNascimento) : null;
        if (form.dataNascimento && !nascimento) throw new Error('Data de nascimento inválida (use DD/MM/AAAA)');
        const dados = { nome: form.nome, cpf: form.cpf, telefone: form.telefone, telefone2: form.telefone2 };
        if (entregador) Object.assign(dados, { dataNascimento: nascimento, cnh: form.cnh, veiculo: form.veiculo, placa: form.placa });
        atualizado = await api.put('/usuarios/me', dados);
      } else {
        atualizado = await api.put('/usuarios/me/conta', {
          usuario: form.usuario,
          email: form.email,
          novaSenha: form.novaSenha || undefined,
          senhaAtual: form.senhaAtual,
        });
      }
      setUsuario(atualizado);
      setEditando(null);
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  async function trocarFoto() {
    setErroFoto('');
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (resultado.canceled) return;
    setEnviandoFoto(true);
    try {
      setUsuario(await api.enviarArquivo('/usuarios/me/foto', 'foto', resultado.assets[0]));
    } catch (e) {
      setErroFoto(e.message);
    } finally {
      setEnviandoFoto(false);
    }
  }

  return (
    <Tela titulo={entregador ? 'Perfil Entregador' : 'Perfil Cliente'} voltar perfil>
      {/* ---------- foto ---------- */}
      <Pressable style={st.anel} onPress={trocarFoto} role="button" aria-label="Trocar foto">
        {usuario.fotoUrl ? (
          <Image source={{ uri: urlArquivo(usuario.fotoUrl) }} style={st.foto} />
        ) : (
          <View style={st.foto}>
            <Text style={st.fotoTexto}>FOTO</Text>
          </View>
        )}
        {enviandoFoto && <ActivityIndicator style={StyleSheet.absoluteFill} color={cores.branco} size="large" />}
      </Pressable>
      <MensagemErro texto={erroFoto} style={{ marginTop: espaco.md }} />

      {usuario.avaliacoes?.total > 0 && (
        <View style={st.nota}>
          <Estrelas nota={usuario.avaliacoes.media} tamanho={18} />
          <Text style={st.notaTexto}>
            {usuario.avaliacoes.media} · {usuario.entregasConcluidas} entrega{usuario.entregasConcluidas === 1 ? '' : 's'} concluída{usuario.entregasConcluidas === 1 ? '' : 's'}
          </Text>
        </View>
      )}

      {/* ---------- dados pessoais ---------- */}
      <Secao titulo="Dados Pessoais" estilo="perfil">
        <Dados>
          <Dado rotulo="Nome" valor={usuario.nome} />
          {entregador ? (
            <>
              <Dado rotulo="Nascimento" valor={usuario.dataNascimento ? dataBR(usuario.dataNascimento) : null} />
              <Dado rotulo="CPF" valor={usuario.cpf} />
              <Dado rotulo="CNH" valor={usuario.cnh} />
            </>
          ) : (
            <Dado rotulo="CPF do responsável" valor={usuario.cpf} />
          )}
          <Dado rotulo="Telefone" valor={usuario.telefone} />
          <Dado rotulo="Telefone 2" valor={usuario.telefone2} />
          {entregador && (
            <>
              <Dado rotulo="Veículo" valor={usuario.veiculo ? veiculo(usuario.veiculo) : null} />
              <Dado rotulo="Placa" valor={usuario.placa} />
            </>
          )}
        </Dados>
        <Botao titulo="Editar" icone="edit" tamanho="grande" onPress={() => abrir('pessoais')} style={st.editar} aria-label="Editar dados pessoais" />
      </Secao>

      {/* ---------- dados da conta ---------- */}
      <Secao titulo="Dados da Conta" estilo="perfil">
        <View style={st.conta}>
          <Text style={st.contaTexto}>{usuario.usuario}</Text>
          <Text style={st.contaTexto}>{usuario.email}</Text>
          <Text style={st.contaTexto}>**************</Text>
        </View>
        <Botao titulo="Editar" icone="edit" tamanho="grande" onPress={() => abrir('conta')} style={st.editar} aria-label="Editar dados da conta" />
      </Secao>

      {/* ---------- caixa: editar dados pessoais ---------- */}
      <Caixa visivel={editando === 'pessoais'} aoFechar={() => setEditando(null)} largura={300} rolavel>
        <Text style={st.caixaTitulo}>Dados Pessoais</Text>
        <View style={{ alignSelf: 'stretch' }}>
          <Campo rotulo={entregador ? 'Nome completo' : 'Nome da empresa ou seu nome'} value={form.nome} onChangeText={alterar('nome')} />
          {entregador && (
            <Campo rotulo="Data de nascimento" value={form.dataNascimento} onChangeText={alterar('dataNascimento')} mascara={mascaras.data} placeholder="DD/MM/AAAA" keyboardType="number-pad" />
          )}
          <Campo rotulo={entregador ? 'CPF' : 'CPF do responsável'} value={form.cpf} onChangeText={alterar('cpf')} mascara={mascaras.cpf} placeholder="000.000.000-00" keyboardType="number-pad" />
          {entregador && (
            <Campo rotulo="CNH" value={form.cnh} onChangeText={alterar('cnh')} mascara={mascaras.numeros} placeholder="Número da CNH" keyboardType="number-pad" />
          )}
          <Campo rotulo="Telefone" value={form.telefone} onChangeText={alterar('telefone')} mascara={mascaras.telefone} placeholder="(11) 99999-9999" keyboardType="phone-pad" />
          <Campo rotulo="Telefone 2 (opcional)" value={form.telefone2} onChangeText={alterar('telefone2')} mascara={mascaras.telefone} keyboardType="phone-pad" />
          {entregador && (
            <>
              <Opcoes rotulo="Veículo" opcoes={VEICULOS} valor={form.veiculo} onChange={alterar('veiculo')} />
              {form.veiculo && form.veiculo !== 'BICICLETA' && (
                <Campo rotulo="Placa" value={form.placa} onChangeText={alterar('placa')} mascara={mascaras.placa} placeholder="ABC1D23" autoCapitalize="characters" />
              )}
            </>
          )}
        </View>
        <MensagemErro texto={erro} />
        <Botao titulo="Confirmar" onPress={salvar} carregando={salvando} />
      </Caixa>

      {/* ---------- caixa: editar dados da conta ---------- */}
      <Caixa visivel={editando === 'conta'} aoFechar={() => setEditando(null)} largura={300} rolavel>
        <Text style={st.caixaTitulo}>Dados da Conta</Text>
        <View style={{ alignSelf: 'stretch' }}>
          <Campo rotulo="Nome de usuário" value={form.usuario} onChangeText={alterar('usuario')} autoCapitalize="none" />
          <Campo rotulo="E-mail" value={form.email} onChangeText={alterar('email')} autoCapitalize="none" keyboardType="email-address" />
          <Campo rotulo="Nova senha (opcional)" value={form.novaSenha} onChangeText={alterar('novaSenha')} secureTextEntry placeholder="Deixe em branco para manter" />
          <Campo rotulo="Senha atual" value={form.senhaAtual} onChangeText={alterar('senhaAtual')} secureTextEntry placeholder="Para confirmar a alteração" />
        </View>
        <MensagemErro texto={erro} />
        <Botao titulo="Confirmar" onPress={salvar} carregando={salvando} />
      </Caixa>
    </Tela>
  );
}

const st = StyleSheet.create({
  anel: {
    width: 142, height: 142, borderRadius: 71, backgroundColor: cores.branco,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 28,
  },
  foto: { width: 112, height: 112, borderRadius: 56, backgroundColor: cores.azul, alignItems: 'center', justifyContent: 'center' },
  fotoTexto: { fontFamily: fontes.corpoForte, color: cores.branco, fontSize: 18 },
  nota: { alignItems: 'center', marginTop: espaco.lg, gap: 4 },
  notaTexto: { fontFamily: fontes.corpoMedio, color: cores.textoSuave, fontSize: 13 },
  editar: { marginTop: espaco.lg, height: 48, borderRadius: 8 },
  conta: { paddingLeft: 2, gap: 5 },
  contaTexto: { fontFamily: fontes.corpoForte, color: cores.branco, fontSize: 18 },
  caixaTitulo: { fontFamily: fontes.secao, color: cores.branco, fontSize: 20, marginBottom: espaco.lg },
});
