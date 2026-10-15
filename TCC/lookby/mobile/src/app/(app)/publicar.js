import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Tela from '../../components/Tela';
import { Botao, Campo, MensagemErro, Opcoes, Secao } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { cores, espaco, fontes } from '../../theme';
import { dataISO, lerValor, mascaras, TIPOS_CARGA } from '../../utils/formatar';

const VAZIO = {
  titulo: '', carga: '', tipoCarga: null, data: '', horarioRetirada: '', horarioEntrega: '',
  enderecoRetirada: '', cidadeRetirada: '', enderecoEntrega: '', cidadeEntrega: '', observacoes: '', valor: '',
};

// O cliente publica uma entrega. Ela aparece na hora em "Oportunidades" para os entregadores.
export default function Publicar() {
  const { usuario } = useAuth();
  const [form, setForm] = useState(VAZIO);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const alterar = (campo) => (valor) => setForm((f) => ({ ...f, [campo]: valor }));

  if (usuario.tipo !== 'CLIENTE') return <Redirect href="/home" />;

  async function publicar() {
    setErro('');
    const data = dataISO(form.data);
    if (!data) return setErro('Informe a data no formato DD/MM/AAAA');
    const valor = lerValor(form.valor);
    if (!valor) return setErro('Informe o valor que você oferece pela entrega');

    setEnviando(true);
    try {
      const entrega = await api.post('/entregas', { ...form, data, valor, observacoes: form.observacoes || null });
      router.replace(`/entrega/${entrega.id}`);
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Tela titulo="Publicar">
      <Secao titulo="Dados da entrega">
        <Campo rotulo="Título" value={form.titulo} onChangeText={alterar('titulo')} placeholder="Ex.: Entrega Cajamar" maxLength={60} />
        <Campo rotulo="Carga" value={form.carga} onChangeText={alterar('carga')} placeholder="O que será transportado, quantidade, peso..." multiline />
        <Opcoes rotulo="Tipo da carga" opcoes={TIPOS_CARGA} valor={form.tipoCarga} onChange={alterar('tipoCarga')} />
        <Campo rotulo="Data" value={form.data} onChangeText={alterar('data')} mascara={mascaras.data} placeholder="DD/MM/AAAA" keyboardType="number-pad" />
      </Secao>

      <Secao titulo="Retirada">
        <View style={st.linha}>
          <Campo rotulo="Cidade" value={form.cidadeRetirada} onChangeText={alterar('cidadeRetirada')} placeholder="Barueri" style={{ flex: 1 }} />
          <Campo rotulo="Horário" value={form.horarioRetirada} onChangeText={alterar('horarioRetirada')} mascara={mascaras.hora} placeholder="16:00" keyboardType="number-pad" style={{ width: 92 }} />
        </View>
        <Campo rotulo="Endereço" value={form.enderecoRetirada} onChangeText={alterar('enderecoRetirada')} placeholder="Rua, número - bairro" />
      </Secao>

      <Secao titulo="Entrega">
        <View style={st.linha}>
          <Campo rotulo="Cidade" value={form.cidadeEntrega} onChangeText={alterar('cidadeEntrega')} placeholder="Santo Amaro" style={{ flex: 1 }} />
          <Campo rotulo="Horário" value={form.horarioEntrega} onChangeText={alterar('horarioEntrega')} mascara={mascaras.hora} placeholder="18:00" keyboardType="number-pad" style={{ width: 92 }} />
        </View>
        <Campo rotulo="Endereço" value={form.enderecoEntrega} onChangeText={alterar('enderecoEntrega')} placeholder="Rua, número - bairro" />
      </Secao>

      <Secao titulo="Valor">
        <Campo rotulo="Quanto você oferece (R$)" value={form.valor} onChangeText={alterar('valor')} mascara={mascaras.valor} placeholder="Ex.: 150,00" keyboardType="decimal-pad" />
        <Text style={st.dica}>Os candidatos podem propor outro valor pelo chat antes de você confirmar.</Text>
        <Campo rotulo="Observações (opcional)" value={form.observacoes} onChangeText={alterar('observacoes')} placeholder="Tipo de veículo necessário, cuidados com a carga..." multiline />
      </Secao>

      <View style={{ marginTop: espaco.xl }}>
        <MensagemErro texto={erro} />
        <Botao titulo="Publicar" tamanho="grande" largura={235} onPress={publicar} carregando={enviando} />
      </View>
    </Tela>
  );
}

const st = StyleSheet.create({
  linha: { flexDirection: 'row', gap: espaco.md },
  dica: { fontFamily: fontes.corpo, color: cores.textoSuave, fontSize: 12.5, marginTop: -4, marginBottom: espaco.md, lineHeight: 18 },
});
