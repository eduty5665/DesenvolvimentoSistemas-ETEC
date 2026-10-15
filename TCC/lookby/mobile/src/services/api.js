import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Endereço da API.
// 1) Se existir EXPO_PUBLIC_API_URL no arquivo .env, usa ele.
// 2) Senão, descobre o IP do computador que está rodando o Expo e usa a porta 3333.
//    Assim o app funciona no celular (Expo Go) sem configurar nada,
//    desde que celular e computador estejam na mesma rede Wi-Fi.
function descobrirUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host) return `http://${host}:3333`;
  if (Platform.OS === 'android') return 'http://10.0.2.2:3333'; // emulador Android
  return 'http://localhost:3333';
}

export const API_URL = descobrirUrl();

// "/uploads/abc.jpg" -> "http://192.168.0.10:3333/uploads/abc.jpg"
export const urlArquivo = (caminho) => (caminho ? API_URL + caminho : null);

let tokenAtual = null;
export function definirToken(token) {
  tokenAtual = token;
}

let aoExpirar = null;
export function aoSessaoExpirar(callback) {
  aoExpirar = callback;
}

async function requisicao(metodo, rota, corpo, ehArquivo = false) {
  let resposta;
  try {
    resposta = await fetch(API_URL + rota, {
      method: metodo,
      headers: {
        // Em upload (FormData) o próprio fetch define o Content-Type
        ...(ehArquivo ? {} : { 'Content-Type': 'application/json' }),
        ...(tokenAtual ? { Authorization: `Bearer ${tokenAtual}` } : {}),
      },
      body: ehArquivo ? corpo : corpo ? JSON.stringify(corpo) : undefined,
    });
  } catch {
    throw new Error(`Não foi possível conectar ao servidor (${API_URL}). Ele está ligado?`);
  }

  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    if (resposta.status === 401 && tokenAtual && aoExpirar && !rota.startsWith('/usuarios/me/conta')) aoExpirar();
    throw new Error(dados.erro || 'Algo deu errado. Tente novamente.');
  }
  return dados;
}

// Envia um arquivo escolhido com expo-image-picker ou expo-document-picker
function enviarArquivo(rota, campo, arquivo) {
  const form = new FormData();
  if (arquivo.file) {
    form.append(campo, arquivo.file); // navegador
  } else {
    form.append(campo, {
      uri: arquivo.uri,
      name: arquivo.name || arquivo.fileName || `arquivo.${(arquivo.mimeType || 'image/jpeg').split('/')[1]}`,
      type: arquivo.mimeType || 'application/octet-stream',
    });
  }
  return requisicao('POST', rota, form, true);
}

export const api = {
  get: (rota) => requisicao('GET', rota),
  post: (rota, corpo) => requisicao('POST', rota, corpo),
  put: (rota, corpo) => requisicao('PUT', rota, corpo),
  del: (rota) => requisicao('DELETE', rota),
  enviarArquivo,
};
