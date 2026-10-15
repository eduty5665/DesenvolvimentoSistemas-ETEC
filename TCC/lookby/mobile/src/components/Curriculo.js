// Blocos do currículo (Escolaridade, Experiências, Contatos e arquivos).
// Usado na tela "Currículo" do entregador (editável) e quando o cliente abre o perfil de um candidato.
import { Feather } from '@expo/vector-icons';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { urlArquivo } from '../services/api';
import { cores, espaco, fontes } from '../theme';
import { Secao } from './ui';

export const SECOES = [
  {
    chave: 'escolaridade', secao: 'ESCOLARIDADE', titulo: 'Escolaridade',
    campos: { titulo: 'Curso', subtitulo: 'Instituição', periodo: 'Período (ex.: 2020 - 2022)', descricao: 'Observações (opcional)' },
    vazio: 'Nenhum curso informado.',
  },
  {
    chave: 'experiencias', secao: 'EXPERIENCIA', titulo: 'Experiências',
    campos: { titulo: 'Cargo ou função', subtitulo: 'Empresa', periodo: 'Período (ex.: 2019 - 2023)', descricao: 'O que você fazia (opcional)' },
    vazio: 'Nenhuma experiência informada.',
  },
  {
    chave: 'contatos', secao: 'CONTATO', titulo: 'Contatos',
    campos: { titulo: 'Tipo (WhatsApp, e-mail...)', subtitulo: 'Contato' },
    vazio: 'Nenhum contato informado.',
  },
];

export function SecoesCurriculo({ curriculo, aoAdicionar, aoEditar }) {
  return SECOES.map((s) => (
    <Secao
      key={s.chave}
      titulo={s.titulo}
      acao={
        aoAdicionar ? (
          <Pressable onPress={() => aoAdicionar(s)} hitSlop={10} role="button" aria-label={`Adicionar em ${s.titulo}`}>
            <Feather name="plus-circle" size={26} color={cores.azul} />
          </Pressable>
        ) : null
      }
    >
      {curriculo[s.chave].length === 0 ? (
        <Text style={st.vazio}>{s.vazio}</Text>
      ) : (
        curriculo[s.chave].map((item) => (
          <Pressable
            key={item.id}
            style={st.item}
            onPress={aoEditar ? () => aoEditar(s, item) : undefined}
            disabled={!aoEditar}
            role={aoEditar ? 'button' : undefined}
          >
            <View style={st.linha}>
              <Text style={st.forte}>{item.titulo}</Text>
              {item.periodo ? <Text style={st.forte}>{item.periodo}</Text> : null}
            </View>
            {item.subtitulo ? <Text style={st.forte}>{item.subtitulo}</Text> : null}
            {item.descricao ? <Text style={st.descricao}>{item.descricao}</Text> : null}
          </Pressable>
        ))
      )}
    </Secao>
  ));
}

export function ArquivosCurriculo({ arquivos, aoRemover }) {
  if (!arquivos.length) return null;
  return (
    <Secao titulo="Arquivos">
      {arquivos.map((a) => (
        <View key={a.id} style={st.arquivo}>
          <Pressable style={st.arquivoNome} onPress={() => Linking.openURL(urlArquivo(a.url))} role="link">
            <Feather name="file-text" size={20} color={cores.azul} />
            <Text style={st.arquivoTexto} numberOfLines={1}>{a.nome}</Text>
          </Pressable>
          {aoRemover && (
            <Pressable onPress={() => aoRemover(a)} hitSlop={10} role="button" aria-label={`Remover ${a.nome}`}>
              <Feather name="trash-2" size={20} color={cores.perigo} />
            </Pressable>
          )}
        </View>
      ))}
    </Secao>
  );
}

const st = StyleSheet.create({
  vazio: { fontFamily: fontes.corpo, color: cores.textoSuave, fontSize: 14, textAlign: 'center', marginTop: 4 },
  item: { alignItems: 'center', marginTop: 8, marginBottom: 6 },
  linha: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 28 },
  forte: { fontFamily: fontes.corpoForte, color: cores.branco, fontSize: 16, textAlign: 'center', lineHeight: 23 },
  descricao: { fontFamily: fontes.corpo, color: cores.textoSuave, fontSize: 14, textAlign: 'center', marginTop: 2 },
  arquivo: { flexDirection: 'row', alignItems: 'center', gap: espaco.md, marginTop: 10 },
  arquivoNome: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  arquivoTexto: { flex: 1, fontFamily: fontes.corpoMedio, color: cores.branco, fontSize: 15, textDecorationLine: 'underline' },
});
