// Cartões do Figma: moldura branca com o miolo azul, título em caixa alta e texto centralizado
import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { cores, espaco, fontes } from '../theme';
import { horaCurta, moeda, situacao } from '../utils/formatar';
import { Contador } from './ui';

const CORES_SITUACAO = { aviso: cores.aviso, sucesso: cores.sucesso, perigo: cores.perigo, suave: cores.textoSuave };

function Cartao({ titulo, linhas, valor, etiqueta, naoLidas, onPress, largura = 268 }) {
  return (
    <Pressable
      onPress={onPress}
      role="button"
      style={({ pressed }) => [st.cartao, { width: largura, opacity: pressed ? 0.85 : 1 }]}
    >
      <View style={st.miolo}>
        <Text style={st.titulo} numberOfLines={1}>{titulo}</Text>
        {linhas.filter(Boolean).map((linha, i) => (
          <Text key={i} style={st.linha} numberOfLines={2}>{linha}</Text>
        ))}
        {valor ? <Text style={st.valor}>{valor}</Text> : null}
      </View>
      {etiqueta ? (
        <View style={st.etiqueta}>
          <View style={[st.ponto, { backgroundColor: CORES_SITUACAO[etiqueta.cor] }]} />
          <Text style={st.etiquetaTexto}>{etiqueta.rotulo}</Text>
        </View>
      ) : null}
      <Contador numero={naoLidas} style={st.contador} />
    </Pressable>
  );
}

// Entrega aberta (Oportunidades): carga, endereço de destino e valor
export function CartaoOportunidade({ entrega, largura }) {
  const { usuario } = useAuth();
  const jaCandidato = entrega.minhaCandidatura && entrega.minhaCandidatura.status !== 'RECUSADA';
  return (
    <Cartao
      largura={largura}
      titulo={`ENTREGA EM ${entrega.cidadeEntrega}`}
      linhas={[entrega.carga, `${entrega.enderecoEntrega}, ${entrega.cidadeEntrega}`]}
      valor={moeda(entrega.valor)}
      etiqueta={jaCandidato ? { rotulo: 'Você se candidatou', cor: 'aviso' } : situacao(entrega, usuario)}
      naoLidas={entrega.minhaCandidatura?.naoLidas}
      onPress={() => router.push(`/entrega/${entrega.id}`)}
    />
  );
}

// Entrega do usuário (Entregas): onde carregar, onde descarregar e a situação
export function CartaoEntrega({ entrega, largura }) {
  const { usuario } = useAuth();
  return (
    <Cartao
      largura={largura}
      titulo={`ENTREGA EM ${entrega.cidadeEntrega}`}
      linhas={[
        `Carregar em ${entrega.cidadeRetirada} às ${horaCurta(entrega.horarioRetirada)}`,
        `Descarregar em ${entrega.cidadeEntrega} às ${horaCurta(entrega.horarioEntrega)}`,
        `${entrega.enderecoEntrega}, ${entrega.cidadeEntrega}`,
      ]}
      etiqueta={situacao(entrega, usuario)}
      naoLidas={entrega.minhaCandidatura?.naoLidas ?? entrega.naoLidas}
      onPress={() => router.push(`/entrega/${entrega.id}`)}
    />
  );
}

export function CartaoEmpresa({ empresa, largura }) {
  const abertas = empresa.entregasAbertas;
  return (
    <Cartao
      largura={largura}
      titulo={empresa.nome}
      linhas={[
        empresa.historia,
        empresa.nicho ? `Seu nicho é ${empresa.nicho.toLowerCase()}` : null,
        empresa.localizacao,
      ]}
      etiqueta={abertas ? { rotulo: `${abertas} entrega${abertas > 1 ? 's' : ''} aberta${abertas > 1 ? 's' : ''}`, cor: 'sucesso' } : null}
      onPress={() => router.push(`/empresa/${empresa.id}`)}
    />
  );
}

// Faixa da Home: título, "ver mais" e os cartões rolando para o lado
export function Carrossel({ titulo, verMais, dados, renderItem, vazio }) {
  return (
    <View style={st.carrossel}>
      <View style={st.carrosselTopo}>
        <Text style={st.carrosselTitulo}>{titulo}</Text>
        {verMais ? (
          <Pressable onPress={verMais} hitSlop={10} role="button">
            <Text style={st.verMais}>ver mais</Text>
          </Pressable>
        ) : null}
      </View>
      {dados.length ? (
        <FlatList
          horizontal
          data={dados}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 36, paddingTop: 10, gap: 42, alignItems: 'flex-start' }}
        />
      ) : (
        <Text style={st.vazio}>{vazio}</Text>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  cartao: { backgroundColor: cores.branco, padding: 18, alignSelf: 'center' },
  miolo: { backgroundColor: cores.azul, minHeight: 122, paddingHorizontal: 8, paddingTop: 2, paddingBottom: 8 },
  titulo: { fontFamily: fontes.cartaoTitulo, fontSize: 18.5, color: cores.preto, textTransform: 'uppercase', lineHeight: 32 },
  linha: { fontFamily: fontes.cartaoTexto, fontSize: 14.5, color: '#1E1E1E', textAlign: 'center', lineHeight: 19 },
  valor: { fontFamily: fontes.valor, fontSize: 15, color: '#1E1E1E', textAlign: 'center', marginTop: 1 },
  etiqueta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8, marginBottom: -8 },
  ponto: { width: 9, height: 9, borderRadius: 5, borderWidth: 1, borderColor: '#555' },
  etiquetaTexto: { fontFamily: fontes.corpoForte, fontSize: 12, color: '#333' },
  contador: { position: 'absolute', top: -8, right: -8 },
  carrossel: { marginTop: 26 },
  carrosselTopo: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingLeft: 32, paddingRight: 20, marginBottom: 10,
  },
  carrosselTitulo: { fontFamily: fontes.corpoForte, fontSize: 24, color: cores.branco },
  verMais: { fontFamily: fontes.corpoForte, fontSize: 18, color: cores.branco },
  vazio: { fontFamily: fontes.corpo, color: cores.textoSuave, fontSize: 14, paddingHorizontal: 32, paddingVertical: espaco.lg },
});
