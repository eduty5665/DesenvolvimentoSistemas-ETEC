import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../services/api';
import { cores, espaco, fontes } from '../theme';
import { useAuth, useEvento, useEventos } from './AuthContext';

const AvisosContext = createContext(null);

// Avisos dentro do app:
//  - "resumo": quantas mensagens não lidas e candidaturas pendentes (bolinha no menu)
//  - faixa no topo quando chega mensagem ou candidatura e a pessoa está em outra tela
export function AvisosProvider({ children }) {
  const { usuario } = useAuth();
  const insets = useSafeAreaInsets();
  const [resumo, setResumo] = useState({ naoLidas: 0, candidaturasPendentes: 0 });
  const [faixa, setFaixa] = useState(null);
  const chatAberto = useRef(null); // id da candidatura cujo chat está na tela
  const timer = useRef(null);

  const recarregarResumo = useCallback(() => {
    api.get('/usuarios/resumo').then(setResumo).catch(() => {});
  }, []);

  useEffect(() => {
    recarregarResumo();
  }, [recarregarResumo]);

  const mostrar = useCallback((aviso) => {
    setFaixa(aviso);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setFaixa(null), 5000);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);

  useEvento('mensagem:nova', ({ candidaturaId, mensagem }) => {
    recarregarResumo();
    if (mensagem.autorId === usuario.id || chatAberto.current === candidaturaId) return;
    mostrar({
      icone: mensagem.tipo === 'SISTEMA' ? 'bell' : 'message-circle',
      titulo: mensagem.tipo === 'SISTEMA' ? 'LookBy' : mensagem.autorNome,
      texto: mensagem.texto,
      rota: `/chat/${candidaturaId}`,
    });
  });

  useEvento('candidatura:nova', ({ entregaId }) => {
    recarregarResumo();
    mostrar({
      icone: 'user-plus',
      titulo: 'Nova candidatura',
      texto: 'Um entregador se candidatou à sua entrega. Toque para ver.',
      rota: `/entrega/${entregaId}`,
    });
  });

  useEventos(['candidatura:atualizada', 'entrega:atualizada', 'mensagens:lidas'], recarregarResumo);

  return (
    <AvisosContext.Provider value={{ resumo, recarregarResumo, chatAberto }}>
      {children}
      {faixa && (
        <Pressable
          style={[st.faixa, { top: insets.top + 8 }]}
          onPress={() => {
            setFaixa(null);
            router.push(faixa.rota);
          }}
        >
          <Feather name={faixa.icone} size={22} color={cores.azul} />
          <View style={{ flex: 1 }}>
            <Text style={st.titulo} numberOfLines={1}>{faixa.titulo}</Text>
            <Text style={st.texto} numberOfLines={2}>{faixa.texto}</Text>
          </View>
        </Pressable>
      )}
    </AvisosContext.Provider>
  );
}

export const useAvisos = () => useContext(AvisosContext);

const st = StyleSheet.create({
  faixa: {
    position: 'absolute', left: espaco.md, right: espaco.md, zIndex: 100,
    flexDirection: 'row', alignItems: 'center', gap: espaco.md,
    backgroundColor: cores.preto, borderRadius: 12, borderWidth: 1, borderColor: cores.azul,
    paddingHorizontal: espaco.lg, paddingVertical: espaco.md,
    elevation: 8, shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
  titulo: { fontFamily: fontes.corpoForte, color: cores.branco, fontSize: 14 },
  texto: { fontFamily: fontes.corpo, color: cores.textoSuave, fontSize: 13, marginTop: 2 },
});
