import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ArquivosCurriculo, SecoesCurriculo } from '../../components/Curriculo';
import Tela from '../../components/Tela';
import { Botao, Caixa, Campo, Carregando, Dado, Dados, Foto, MensagemErro, Secao } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useCarregar } from '../../hooks/useCarregar';
import { api } from '../../services/api';
import { cores, espaco, fontes } from '../../theme';
import { dataBR, veiculo } from '../../utils/formatar';

// Currículo do entregador (Figma): Dados Pessoais, Escolaridade, Experiências, Contatos e "ADD Arquivos".
// É o que a empresa vê antes de confirmar um candidato.
export default function Curriculo() {
  const { usuario } = useAuth();
  const { dados: curriculo, carregando, erro, recarregar } = useCarregar(() => api.get('/curriculo'));

  const [edicao, setEdicao] = useState(null); // { secao, item? }
  const [form, setForm] = useState({});
  const [erroForm, setErroForm] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erroArquivo, setErroArquivo] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (usuario.tipo !== 'ENTREGADOR') return <Redirect href="/minha-empresa" />;
  if (carregando) return <Carregando />;

  function abrir(secao, item) {
    setErroForm('');
    setForm({
      titulo: item?.titulo || '',
      subtitulo: item?.subtitulo || '',
      periodo: item?.periodo || '',
      descricao: item?.descricao || '',
    });
    setEdicao({ secao, item });
  }

  async function executar(fn) {
    setErroForm('');
    setSalvando(true);
    try {
      await fn();
      setEdicao(null);
      await recarregar();
    } catch (e) {
      setErroForm(e.message);
    } finally {
      setSalvando(false);
    }
  }

  const salvar = () =>
    executar(() =>
      edicao.item
        ? api.put(`/curriculo/itens/${edicao.item.id}`, form)
        : api.post('/curriculo/itens', { ...form, secao: edicao.secao.secao })
    );
  const remover = () => executar(() => api.del(`/curriculo/itens/${edicao.item.id}`));

  async function adicionarArquivo() {
    setErroArquivo('');
    const resultado = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      copyToCacheDirectory: true,
    });
    if (resultado.canceled) return;
    setEnviando(true);
    try {
      await api.enviarArquivo('/curriculo/arquivos', 'arquivo', resultado.assets[0]);
      await recarregar();
    } catch (e) {
      setErroArquivo(e.message);
    } finally {
      setEnviando(false);
    }
  }

  async function removerArquivo(arquivo) {
    setErroArquivo('');
    try {
      await api.del(`/curriculo/arquivos/${arquivo.id}`);
      await recarregar();
    } catch (e) {
      setErroArquivo(e.message);
    }
  }

  const campos = edicao?.secao.campos || {};

  return (
    <Tela titulo="Currículo">
      <View style={{ alignItems: 'center', marginTop: 8 }}>
        {usuario.fotoUrl ? <Foto url={usuario.fotoUrl} tamanho={150} /> : <Feather name="user" size={170} color={cores.azul} />}
      </View>
      <MensagemErro texto={erro} />

      <Secao
        titulo="Dados Pessoais"
        acao={<Botao titulo="Editar" icone="edit" tamanho="pequeno" onPress={() => router.push('/perfil')} />}
      >
        <Dados>
          <Dado rotulo="Nome" valor={usuario.nome} />
          <Dado rotulo="Nascimento" valor={usuario.dataNascimento ? dataBR(usuario.dataNascimento) : null} />
          <Dado rotulo="Telefone" valor={usuario.telefone} largo />
          <Dado rotulo="Veículo" valor={usuario.veiculo ? `${veiculo(usuario.veiculo)}${usuario.placa ? ` · ${usuario.placa}` : ''}` : null} />
          <Dado rotulo="CNH" valor={usuario.cnh} />
        </Dados>
      </Secao>

      {curriculo && (
        <>
          <SecoesCurriculo curriculo={curriculo} aoAdicionar={(s) => abrir(s)} aoEditar={abrir} />
          <ArquivosCurriculo arquivos={curriculo.arquivos} aoRemover={removerArquivo} />
        </>
      )}

      <View style={{ marginTop: espaco.xxl }}>
        <MensagemErro texto={erroArquivo} />
        <Botao titulo="ADD Arquivos" onPress={adicionarArquivo} carregando={enviando} largura={210} />
        <Text style={st.dica}>PDF, imagem ou Word, até 8 MB (CNH, certificados...). Máximo de 5 arquivos.</Text>
      </View>

      {/* ---------- caixa: adicionar/editar item ---------- */}
      <Caixa visivel={Boolean(edicao)} aoFechar={() => setEdicao(null)} largura={300} rolavel>
        <Text style={st.caixaTitulo}>{edicao?.secao.titulo}</Text>
        <View style={{ alignSelf: 'stretch' }}>
          {Object.entries(campos).map(([campo, placeholder]) => (
            <Campo
              key={campo}
              value={form[campo]}
              onChangeText={(t) => setForm((f) => ({ ...f, [campo]: t }))}
              placeholder={placeholder}
              multiline={campo === 'descricao'}
            />
          ))}
        </View>
        <MensagemErro texto={erroForm} />
        <Botao titulo="Confirmar" onPress={salvar} carregando={salvando} />
        {edicao?.item && (
          <Botao titulo="Excluir" variante="perigo" tamanho="pequeno" onPress={remover} desabilitado={salvando} style={{ marginTop: espaco.md }} />
        )}
      </Caixa>
    </Tela>
  );
}

const st = StyleSheet.create({
  dica: { fontFamily: fontes.corpo, color: cores.textoSuave, fontSize: 12, textAlign: 'center', marginTop: 10, lineHeight: 17 },
  caixaTitulo: { fontFamily: fontes.secao, color: cores.branco, fontSize: 20, marginBottom: espaco.lg },
});
