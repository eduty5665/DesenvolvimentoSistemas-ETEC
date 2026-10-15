import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { api, API_URL, aoSessaoExpirar, definirToken } from '../services/api';
import * as armazenamento from '../services/armazenamento';

const AuthContext = createContext(null);
const CHAVE = 'entregas.sessao';

// Guarda o usuário logado, o token e a conexão em tempo real (socket)
export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [socket, setSocket] = useState(null);

  const iniciarSessao = useCallback(async ({ token, usuario: u }, persistir = true) => {
    definirToken(token);
    setUsuario(u);
    setSocket(io(API_URL, { auth: { token }, transports: ['websocket'] }));
    if (persistir) await armazenamento.salvar(CHAVE, JSON.stringify({ token, usuario: u }));
  }, []);

  const sair = useCallback(async () => {
    definirToken(null);
    setUsuario(null);
    setSocket((s) => {
      s?.disconnect();
      return null;
    });
    await armazenamento.remover(CHAVE);
  }, []);

  // Recupera a sessão salva ao abrir o app
  useEffect(() => {
    aoSessaoExpirar(sair);
    (async () => {
      try {
        const salvo = await armazenamento.ler(CHAVE);
        if (salvo) {
          const sessao = JSON.parse(salvo);
          await iniciarSessao(sessao, false);
          // Confere se o token ainda vale e atualiza os dados
          const atual = await api.get('/usuarios/me').catch(() => null);
          if (atual) setUsuario(atual);
        }
      } finally {
        setCarregando(false);
      }
    })();
  }, [iniciarSessao, sair]);

  const entrar = async (email, senha) => iniciarSessao(await api.post('/auth/login', { email, senha }));
  const cadastrar = async (dados) => iniciarSessao(await api.post('/auth/cadastro', dados));

  const atualizarUsuario = async () => {
    const atual = await api.get('/usuarios/me');
    setUsuario(atual);
    return atual;
  };

  return (
    <AuthContext.Provider
      value={{ usuario, carregando, socket, entrar, cadastrar, sair, atualizarUsuario }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// Escuta um evento em tempo real enquanto a tela estiver montada.
// Ex.: useEvento('mensagem:nova', (dados) => ...)
export function useEvento(nome, callback) {
  const { socket } = useAuth();
  const ref = useRef(callback);
  ref.current = callback;
  useEffect(() => {
    if (!socket) return;
    const handler = (dados) => ref.current(dados);
    socket.on(nome, handler);
    return () => socket.off(nome, handler);
  }, [socket, nome]);
}
