import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar, Botao, Campo, Cartao, Estrelas, MensagemErro, Opcoes } from '../../../components/ui';
import { useAuth } from '../../../contexts/AuthContext';
import { useCarregar } from '../../../hooks/useCarregar';
import { api, API_URL } from '../../../services/api';
import { cores, espaco } from '../../../theme';
import { veiculo, VEICULOS } from '../../../utils/formatar';

export default function Perfil() {
  const { usuario, sair, atualizarUsuario } = useAuth();
  const { dados } = useCarregar(() => atualizarUsuario());
  const u = dados || usuario;
  const entregador = u.tipo === 'ENTREGADOR';

  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({});
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const alterar = (campo) => (valor) => setForm((f) => ({ ...f, [campo]: valor }));

  function abrirEdicao() {
    setForm({
      nome: u.nome,
      telefone: u.telefone,
      ...(entregador ? { veiculo: u.veiculo, placa: u.placa || '' } : {}),
    });
    setErro('');
    setEditando(true);
  }

  async function salvar() {
    setSalvando(true);
    setErro('');
    try {
      await api.put('/usuarios/me', form);
      await atualizarUsuario();
      setEditando(false);
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={st.container}>
      <View style={st.topo}>
        <Avatar nome={u.nome} tamanho={80} />
        <Text style={st.nome}>{u.nome}</Text>
        <Text style={st.tipo}>{entregador ? 'Entregador' : 'Cliente'}</Text>
        {u.avaliacoes?.total > 0 ? (
          <View style={st.nota}>
            <Estrelas nota={u.avaliacoes.media} />
            <Text style={st.notaTexto}>
              {u.avaliacoes.media} ({u.avaliacoes.total} avaliaç{u.avaliacoes.total > 1 ? 'ões' : 'ão'})
            </Text>
          </View>
        ) : (
          <Text style={st.notaTexto}>Ainda sem avaliações</Text>
        )}
      </View>

      {editando ? (
        <Cartao>
          <Campo rotulo="Nome" value={form.nome} onChangeText={alterar('nome')} />
          <Campo rotulo="Telefone" value={form.telefone} onChangeText={alterar('telefone')} keyboardType="phone-pad" />
          {entregador && (
            <>
              <Opcoes rotulo="Veículo" opcoes={VEICULOS} valor={form.veiculo} onChange={alterar('veiculo')} />
              <Campo rotulo="Placa" value={form.placa} onChangeText={alterar('placa')} autoCapitalize="characters" />
            </>
          )}
          <MensagemErro texto={erro} />
          <Botao titulo="Salvar" onPress={salvar} carregando={salvando} />
          <Botao titulo="Cancelar" variante="secundario" onPress={() => setEditando(false)} style={{ marginTop: espaco.sm }} />
        </Cartao>
      ) : (
        <Cartao>
          <Info rotulo="E-mail" valor={u.email} />
          <Info rotulo="Telefone" valor={u.telefone} />
          {entregador && (
            <>
              <Info rotulo="Veículo" valor={veiculo(u.veiculo)} />
              <Info rotulo="Placa" valor={u.placa || '—'} />
              <Info rotulo="Entregas concluídas" valor={String(u.entregasConcluidas ?? 0)} />
            </>
          )}
          <Botao titulo="Editar dados" variante="secundario" icone="create-outline" onPress={abrirEdicao} style={{ marginTop: espaco.md }} />
        </Cartao>
      )}

      <Botao titulo="Sair da conta" variante="perigo" icone="log-out-outline" onPress={sair} style={{ marginTop: espaco.xl }} />
      <Text style={st.servidor}>Servidor: {API_URL}</Text>
    </ScrollView>
  );
}

function Info({ rotulo, valor }) {
  return (
    <View style={st.info}>
      <Text style={st.infoRotulo}>{rotulo}</Text>
      <Text style={st.infoValor}>{valor}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  container: { padding: espaco.lg, paddingBottom: 40 },
  topo: { alignItems: 'center', marginBottom: espaco.xl },
  nome: { fontSize: 22, fontWeight: '800', color: cores.texto, marginTop: espaco.md },
  tipo: { fontSize: 14, color: cores.primaria, fontWeight: '600', marginTop: 2 },
  nota: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: espaco.sm },
  notaTexto: { fontSize: 13, color: cores.textoSecundario, marginTop: espaco.sm },
  info: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: cores.borda },
  infoRotulo: { fontSize: 14, color: cores.textoSecundario },
  infoValor: { fontSize: 14, color: cores.texto, fontWeight: '600', flexShrink: 1, textAlign: 'right', marginLeft: 12 },
  servidor: { fontSize: 11, color: cores.textoSecundario, textAlign: 'center', marginTop: espaco.lg },
});
