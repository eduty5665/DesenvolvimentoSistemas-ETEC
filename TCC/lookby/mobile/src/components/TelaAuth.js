import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cores, espaco, fontes } from '../theme';
import Logo from './Logo';
import { Botao, Campo, MensagemErro } from './ui';

// Moldura das telas de entrada (login, cadastro, recuperar senha):
// logo no alto e o formulário estreito e centralizado, como no Figma
export default function TelaAuth({ children, erro, aviso }) {
  return (
    <SafeAreaView style={st.tela}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView contentContainerStyle={st.conteudo} keyboardShouldPersistTaps="handled">
          <Logo />
          <View style={st.form}>
            {aviso ? <Text style={st.aviso}>{aviso}</Text> : null}
            <MensagemErro texto={erro} />
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function CampoAuth(props) {
  return <Campo autoCapitalize="none" estiloInput={st.input} style={{ marginBottom: 14 }} {...props} />;
}

export function BotaoAuth(props) {
  return <Botao tamanho="fino" style={{ alignSelf: 'stretch', marginTop: 2 }} {...props} />;
}

// Linha de baixo: texto branco à esquerda e link azul à direita
export function LinksAuth({ esquerda, aoEsquerda, direita, aoDireita }) {
  return (
    <View style={[st.links, !direita && { justifyContent: 'center' }]}>
      <Pressable onPress={aoEsquerda} disabled={!aoEsquerda} hitSlop={8} role={aoEsquerda ? 'link' : undefined}>
        <Text style={st.link}>{esquerda}</Text>
      </Pressable>
      {direita ? (
        <Pressable onPress={aoDireita} hitSlop={8} role="link">
          <Text style={[st.link, { color: cores.azul }]}>{direita}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: espaco.xxl, paddingBottom: 120 },
  form: { width: 251, marginTop: 38 },
  input: { minHeight: 36, fontSize: 12.5, paddingVertical: 6 },
  links: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingHorizontal: 3 },
  link: { fontFamily: fontes.corpo, color: cores.branco, fontSize: 12.5 },
  aviso: { fontFamily: fontes.corpo, color: cores.textoSuave, fontSize: 12.5, textAlign: 'center', marginBottom: 14, lineHeight: 18 },
});
