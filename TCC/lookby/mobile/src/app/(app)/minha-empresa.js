import { Redirect } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import DadosEmpresa from '../../components/DadosEmpresa';
import Tela from '../../components/Tela';
import { Botao, Caixa, Campo, Carregando, MensagemErro } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useCarregar } from '../../hooks/useCarregar';
import { api } from '../../services/api';
import { cores, espaco, fontes } from '../../theme';
import { mascaras } from '../../utils/formatar';

// "Empresa" no menu do cliente: os dados que os entregadores veem antes de se candidatar
export default function MinhaEmpresa() {
  const { usuario, setUsuario } = useAuth();
  const { dados: empresa, carregando, erro, recarregar } = useCarregar(() => api.get(`/empresas/${usuario.id}`));
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({});
  const [erroForm, setErroForm] = useState('');
  const [salvando, setSalvando] = useState(false);
  const alterar = (campo) => (valor) => setForm((f) => ({ ...f, [campo]: valor }));

  if (usuario.tipo !== 'CLIENTE') return <Redirect href="/curriculo" />;
  if (carregando) return <Carregando />;

  function abrir() {
    setErroForm('');
    setForm({
      nome: empresa.nome || '',
      cnpj: empresa.cnpj || '',
      localizacao: empresa.localizacao || '',
      nicho: empresa.nicho || '',
      historia: empresa.historia || '',
    });
    setEditando(true);
  }

  async function salvar() {
    setSalvando(true);
    setErroForm('');
    try {
      setUsuario(await api.put('/usuarios/me', form));
      setEditando(false);
      await recarregar();
    } catch (e) {
      setErroForm(e.message);
    } finally {
      setSalvando(false);
    }
  }

  const incompleta = empresa && (!empresa.localizacao || !empresa.nicho);

  return (
    <Tela titulo="Empresa">
      <MensagemErro texto={erro} />
      {empresa && (
        <>
          <DadosEmpresa
            empresa={empresa}
            acao={<Botao titulo="Editar" icone="edit" tamanho="pequeno" onPress={abrir} />}
          />
          {incompleta && (
            <Text style={st.dica}>
              Complete os dados da empresa. Os entregadores veem essas informações antes de se candidatar.
            </Text>
          )}
        </>
      )}

      <Caixa visivel={editando} aoFechar={() => setEditando(false)} largura={300} rolavel>
        <Text style={st.caixaTitulo}>Dados da empresa</Text>
        <View style={{ alignSelf: 'stretch' }}>
          <Campo rotulo="Nome" value={form.nome} onChangeText={alterar('nome')} />
          <Campo rotulo="CNPJ" value={form.cnpj} onChangeText={alterar('cnpj')} mascara={mascaras.cnpj} placeholder="00.000.000/0000-00" keyboardType="number-pad" />
          <Campo rotulo="Localização" value={form.localizacao} onChangeText={alterar('localizacao')} placeholder="Rua, número - bairro, cidade" />
          <Campo rotulo="Nicho" value={form.nicho} onChangeText={alterar('nicho')} placeholder="Ex.: materiais escolares" />
          <Campo rotulo="História da empresa" value={form.historia} onChangeText={alterar('historia')} multiline placeholder="Conte um pouco sobre a empresa" />
        </View>
        <MensagemErro texto={erroForm} />
        <Botao titulo="Confirmar" onPress={salvar} carregando={salvando} />
      </Caixa>
    </Tela>
  );
}

const st = StyleSheet.create({
  dica: { fontFamily: fontes.corpoMedio, color: cores.aviso, fontSize: 13, textAlign: 'center', marginTop: espaco.xl, lineHeight: 19 },
  caixaTitulo: { fontFamily: fontes.secao, color: cores.branco, fontSize: 20, marginBottom: espaco.lg },
});
