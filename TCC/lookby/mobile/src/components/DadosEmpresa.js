import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { cores, fontes } from '../theme';
import { Dado, Dados, Estrelas, Secao } from './ui';

// Tela "empre-exemplo" do Figma: ícone, nome e os dados da empresa
export default function DadosEmpresa({ empresa, acao }) {
  const { avaliacoes } = empresa;
  const historico = `${empresa.entregasConcluidas} concluída${empresa.entregasConcluidas === 1 ? '' : 's'} de ${empresa.entregasPublicadas} publicada${empresa.entregasPublicadas === 1 ? '' : 's'}`;
  return (
    <>
      <View style={st.topo}>
        <Feather name="layers" size={96} color={cores.azul} />
        <Text style={st.nome}>{empresa.nome}</Text>
        {avaliacoes?.total > 0 && (
          <View style={st.nota}>
            <Estrelas nota={avaliacoes.media} tamanho={16} />
            <Text style={st.sub}>{avaliacoes.media} ({avaliacoes.total})</Text>
          </View>
        )}
      </View>
      <Secao titulo="Dados da empresa" acao={acao}>
        <Dados>
          <Dado rotulo="Nome" valor={empresa.nome} />
          <Dado rotulo="CNPJ" valor={empresa.cnpj} />
          <Dado rotulo="Localização" valor={empresa.localizacao} largo />
          <Dado rotulo="Nicho" valor={empresa.nicho} />
          <Dado rotulo="Histórico" valor={historico} />
          <Dado rotulo="História da empresa" valor={empresa.historia} largo />
        </Dados>
      </Secao>
    </>
  );
}

const st = StyleSheet.create({
  topo: { alignItems: 'center', marginTop: 20 },
  nome: { fontFamily: fontes.destaque, color: cores.branco, fontSize: 56, lineHeight: 50, marginTop: 16, textAlign: 'center' },
  nota: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sub: { fontFamily: fontes.corpo, color: cores.textoSuave, fontSize: 13 },
});
