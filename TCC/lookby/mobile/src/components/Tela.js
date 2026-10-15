// Moldura de todas as telas internas: cabeçalho cinza do Figma, menu do círculo "LookBy"
// e o popup do usuário (log out).
import { Feather } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useAvisos } from '../contexts/AvisosContext';
import { cores, espaco, fontes } from '../theme';
import { Botao, Caixa, CirculoLookBy, Contador } from './ui';

const MENU_ENTREGADOR = [
  { rotulo: 'Home', icone: 'home', rota: '/home' },
  { rotulo: 'Oportunidades', icone: 'grid', rota: '/oportunidades' },
  { rotulo: 'Entregas', icone: 'truck', rota: '/entregas', contador: true },
  { rotulo: 'Empresas', icone: 'briefcase', rota: '/empresas' },
  { rotulo: 'Currículo', icone: 'user', rota: '/curriculo' },
];

const MENU_CLIENTE = [
  { rotulo: 'Home', icone: 'home', rota: '/home' },
  { rotulo: 'Publicar', icone: 'plus-square', rota: '/publicar' },
  { rotulo: 'Entregas', icone: 'truck', rota: '/entregas', contador: true },
  { rotulo: 'Empresa', icone: 'briefcase', rota: '/minha-empresa' },
];

export default function Tela({ titulo, voltar, perfil, rolavel = true, refreshControl, children, estiloConteudo }) {
  const insets = useSafeAreaInsets();
  const caminho = usePathname();
  const { usuario, sair } = useAuth();
  const { resumo } = useAvisos();
  const [menu, setMenu] = useState(false);
  const [popup, setPopup] = useState(false);

  const itens = usuario?.tipo === 'CLIENTE' ? MENU_CLIENTE : MENU_ENTREGADOR;
  const total = resumo.naoLidas;
  const contar = (tipo) => (tipo ? total : 0);

  function ir(rota) {
    setMenu(false);
    if (rota !== caminho) router.navigate(rota);
  }

  function aoVoltar() {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  }

  async function logout() {
    setMenu(false);
    setPopup(false);
    await sair();
  }

  return (
    <View style={st.tela}>
      {/* ---------- cabeçalho ---------- */}
      <View style={[st.cabecalho, { paddingTop: insets.top }]}>
        <View style={st.barra}>
          {voltar ? (
            <Pressable onPress={aoVoltar} hitSlop={10} style={st.lado} role="button" aria-label="Voltar">
              <Feather name="arrow-left" size={46} color={cores.azul} />
            </Pressable>
          ) : (
            <Pressable onPress={() => setMenu(true)} hitSlop={6} style={st.lado} role="button" aria-label="Abrir menu">
              <CirculoLookBy />
              <Contador numero={total} style={st.contadorMenu} />
            </Pressable>
          )}
          <Text style={st.titulo} numberOfLines={1} adjustsFontSizeToFit>{titulo}</Text>
          <Pressable
            onPress={() => (perfil ? setPopup(true) : router.navigate('/perfil'))}
            hitSlop={8}
            style={[st.lado, { alignItems: 'flex-end' }]}
            role="button"
            aria-label={perfil ? 'Conta' : 'Meu perfil'}
          >
            <Feather name="user" size={44} color={cores.azul} />
          </Pressable>
        </View>
      </View>

      {/* ---------- conteúdo (sobe junto quando o teclado abre) ---------- */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        {rolavel ? (
          <ScrollView
            contentContainerStyle={[st.conteudo, { paddingBottom: insets.bottom + 40 }, estiloConteudo]}
            keyboardShouldPersistTaps="handled"
            refreshControl={refreshControl}
          >
            {children}
          </ScrollView>
        ) : (
          children
        )}
      </KeyboardAvoidingView>

      {/* ---------- menu (abre no círculo LookBy) ---------- */}
      <Modal visible={menu} transparent animationType="fade" onRequestClose={() => setMenu(false)}>
        <Pressable style={{ flex: 1 }} onPress={() => setMenu(false)}>
          <Pressable style={[st.menu, { paddingTop: insets.top }]} onPress={() => {}}>
            <View style={st.menuTopo}>
              <Pressable onPress={() => setMenu(false)} role="button" aria-label="Fechar menu">
                <CirculoLookBy />
              </Pressable>
              <Text style={st.menuTitulo}>Menu</Text>
            </View>
            {itens.map((item) => (
              <Pressable key={item.rota} style={st.menuItem} onPress={() => ir(item.rota)} role="button">
                <Feather name={item.icone} size={38} color={cores.azul} style={st.menuIcone} />
                <Text style={st.menuRotulo}>{item.rotulo}</Text>
                <Contador numero={contar(item.contador)} />
              </Pressable>
            ))}
            <Pressable style={st.menuItem} onPress={logout} role="button">
              <Feather name="log-out" size={38} color={cores.azul} style={[st.menuIcone, { transform: [{ scaleX: -1 }] }]} />
              <Text style={st.menuRotulo}>logout</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ---------- popup do usuário (ícone da direita, na tela de perfil) ---------- */}
      <Caixa visivel={popup} aoFechar={() => setPopup(false)} largura={230}>
        <CirculoLookBy tamanho={74} />
        <Text style={st.popupNome}>{usuario?.usuario}</Text>
        <Text style={st.popupEmail} numberOfLines={1}>{usuario?.email}</Text>
        <Botao titulo="log out" onPress={logout} style={{ marginTop: espaco.lg }} />
      </Caixa>
    </View>
  );
}

const st = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  cabecalho: { backgroundColor: cores.cabecalho },
  barra: { height: 66, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  lado: { width: 64, justifyContent: 'center' },
  titulo: { flex: 1, textAlign: 'center', color: cores.branco, fontFamily: fontes.titulo, fontSize: 28 },
  contadorMenu: { position: 'absolute', top: -2, left: 40 },
  conteudo: { paddingHorizontal: espaco.xl, paddingTop: espaco.xl },
  menu: {
    width: 258, backgroundColor: cores.fundo,
    elevation: 12, shadowColor: '#000', shadowOpacity: 0.6, shadowRadius: 8, shadowOffset: { width: 2, height: 4 },
  },
  menuTopo: { height: 66, backgroundColor: cores.menuTopo, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  menuTitulo: { flex: 1, textAlign: 'center', marginRight: 40, color: cores.branco, fontFamily: fontes.corpoForte, fontSize: 19 },
  menuItem: { height: 63, flexDirection: 'row', alignItems: 'center', paddingRight: 14 },
  menuIcone: { width: 96, textAlign: 'center' },
  menuRotulo: { flex: 1, textAlign: 'center', marginRight: 30, color: cores.branco, fontFamily: fontes.corpoForte, fontSize: 20 },
  popupNome: { fontFamily: fontes.corpoForte, color: cores.branco, fontSize: 19, marginTop: espaco.md },
  popupEmail: { fontFamily: fontes.corpo, color: cores.branco, fontSize: 11, textDecorationLine: 'underline', marginTop: 4 },
});
