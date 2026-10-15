import { Image, StyleSheet, Text, View } from 'react-native';
import { cores, fontes } from '../theme';

// Logo do Figma: o entregador azul com "LookBy entregas" ao lado
export default function Logo({ escala = 1 }) {
  return (
    <View style={st.logo}>
      <Image
        source={require('../../assets/logo.png')}
        style={{ width: 92 * escala, height: 100 * escala }}
        resizeMode="contain"
      />
      <View style={{ marginLeft: 6 * escala, marginTop: -8 * escala }}>
        <Text style={[st.nome, { fontSize: 36 * escala, lineHeight: 38 * escala }]}>LookBy</Text>
        <Text style={[st.sub, { fontSize: 19 * escala, lineHeight: 20 * escala }]}>entregas</Text>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  logo: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center' },
  nome: { fontFamily: fontes.secao, color: cores.branco },
  sub: { fontFamily: fontes.chat, color: cores.branco, textAlign: 'right' },
});
