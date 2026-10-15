// Componentes visuais reutilizados, no estilo do protótipo do Figma
import { Feather } from '@expo/vector-icons';
import {
  ActivityIndicator, Image, KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { urlArquivo } from '../services/api';
import { cores, espaco, fontes } from '../theme';

// Círculo azul "LookBy" (abre o menu no cabeçalho e aparece nas caixas de confirmação)
export function CirculoLookBy({ tamanho = 56 }) {
  return (
    <View style={[st.circulo, { width: tamanho, height: tamanho, borderRadius: tamanho / 2 }]}>
      <Text style={[st.circuloTexto, { fontSize: tamanho * 0.215 }]}>LookBy</Text>
    </View>
  );
}

// Botão azul com borda branca (Candidatar-se, Confirmar, Chat, Editar, SIM/NÃO...)
export function Botao({
  titulo, onPress, icone, tamanho = 'medio', variante = 'azul', carregando, desabilitado, largura, style, ...resto
}) {
  const medidas = {
    grande: { altura: 40, fonte: 22, icone: 24, padding: 22 },
    medio: { altura: 38, fonte: 20, icone: 22, padding: 20 },
    pequeno: { altura: 28, fonte: 12, icone: 14, padding: 16 },
    fino: { altura: 36, fonte: 13, icone: 16, padding: 16 }, // botões das telas de login
  }[tamanho];
  const coresBotao = {
    azul: { fundo: cores.azul, texto: cores.branco, borda: cores.branco },
    contorno: { fundo: 'transparent', texto: cores.branco, borda: cores.branco },
    perigo: { fundo: 'transparent', texto: cores.perigo, borda: cores.perigo },
  }[variante];
  const inativo = desabilitado || carregando;

  return (
    <Pressable
      onPress={onPress}
      disabled={inativo}
      role="button"
      style={({ pressed }) => [
        st.botao,
        {
          height: medidas.altura, paddingHorizontal: medidas.padding, width: largura,
          backgroundColor: coresBotao.fundo, borderColor: coresBotao.borda,
          borderWidth: tamanho === 'fino' && variante === 'azul' ? 0 : 1,
          opacity: inativo ? 0.55 : pressed ? 0.8 : 1,
        },
        style,
      ]}
      {...resto}
    >
      {carregando ? (
        <ActivityIndicator color={coresBotao.texto} size="small" />
      ) : (
        <>
          {icone && <Feather name={icone} size={medidas.icone} color={coresBotao.texto} style={{ marginRight: 8 }} />}
          <Text
            style={{
              color: coresBotao.texto, fontSize: medidas.fonte,
              fontFamily: tamanho === 'fino' ? fontes.corpo : fontes.corpoForte,
            }}
            numberOfLines={1}
          >
            {titulo}
          </Text>
        </>
      )}
    </Pressable>
  );
}

// Campo de texto escuro com borda branca arredondada (igual aos do login do Figma)
export function Campo({ rotulo, style, estiloInput, mascara, onChangeText, ...props }) {
  return (
    <View style={[{ marginBottom: espaco.md }, style]}>
      {rotulo ? <Text style={st.rotulo}>{rotulo}</Text> : null}
      <TextInput
        placeholderTextColor="#9A9A9A"
        style={[st.input, props.multiline && { minHeight: 76, paddingTop: 10, textAlignVertical: 'top' }, estiloInput]}
        onChangeText={(t) => onChangeText?.(mascara ? mascara(t) : t)}
        {...props}
      />
    </View>
  );
}

// Opções em linha (tipo de carga, veículo, entregador/cliente)
export function Opcoes({ rotulo, opcoes, valor, onChange, style, centralizado }) {
  return (
    <View style={[{ marginBottom: espaco.md }, style]}>
      {rotulo ? <Text style={st.rotulo}>{rotulo}</Text> : null}
      <View style={[st.opcoes, centralizado && { justifyContent: 'center' }]}>
        {opcoes.map((o) => {
          const ativo = o.valor === valor;
          return (
            <Pressable
              key={String(o.valor)}
              onPress={() => onChange(o.valor)}
              style={[st.opcao, ativo && { backgroundColor: cores.azul, borderColor: cores.azul }]}
            >
              <Text style={[st.opcaoTexto, ativo && { fontFamily: fontes.corpoForte }]}>{o.rotulo}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function MensagemErro({ texto, style }) {
  if (!texto) return null;
  return (
    <View style={[st.erro, style]}>
      <Feather name="alert-circle" size={16} color={cores.perigo} />
      <Text style={st.erroTexto}>{texto}</Text>
    </View>
  );
}

export function Carregando() {
  return (
    <View style={st.centro}>
      <ActivityIndicator size="large" color={cores.azul} />
    </View>
  );
}

export function Vazio({ icone = 'inbox', titulo, texto, children }) {
  return (
    <View style={st.vazio}>
      <Feather name={icone} size={54} color={cores.azul} />
      <Text style={st.vazioTitulo}>{titulo}</Text>
      {texto ? <Text style={st.vazioTexto}>{texto}</Text> : null}
      {children}
    </View>
  );
}

// Título de seção ("Dados da entrega", "Dados da empresa"...)
export function Secao({ titulo, children, acao, estilo = 'corpo' }) {
  return (
    <View style={st.secao}>
      <View style={st.secaoTopo}>
        <Text style={estilo === 'perfil' ? st.secaoTituloPerfil : st.secaoTitulo}>{titulo}</Text>
        {acao}
      </View>
      {children}
    </View>
  );
}

// Um dado com rótulo pequeno e valor em destaque. Use dentro de <Dados>.
export function Dado({ rotulo, valor, largo }) {
  return (
    <View style={[st.dado, largo && { width: '100%' }]}>
      <Text style={st.dadoRotulo}>{rotulo}</Text>
      <Text style={st.dadoValor}>{valor || '—'}</Text>
    </View>
  );
}

// Grade de dados em duas colunas, centralizada como no Figma
export function Dados({ children }) {
  return <View style={st.dados}>{children}</View>;
}

// Caixa cinza com "X" no canto (popups do Figma)
export function Caixa({ visivel, aoFechar, children, largura = 250, rolavel }) {
  const Corpo = rolavel ? ScrollView : View;
  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={aoFechar}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <Pressable style={st.fundoModal} onPress={aoFechar}>
        <Pressable style={[st.caixa, { width: largura }]} onPress={() => {}}>
          <Pressable style={st.fechar} onPress={aoFechar} hitSlop={10} role="button" aria-label="Fechar">
            <Text style={st.fecharTexto}>X</Text>
          </Pressable>
          <Corpo
            {...(rolavel
              ? { contentContainerStyle: st.caixaCorpo, keyboardShouldPersistTaps: 'handled', style: { maxHeight: 520 } }
              : { style: st.caixaCorpo })}
          >
            {children}
          </Corpo>
        </Pressable>
      </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Pergunta de SIM / NÃO com explicação embaixo ("Deseja se candidatar a vaga?")
export function Confirmacao({ visivel, pergunta, explicacao, aoConfirmar, aoFechar, carregando, erro, children }) {
  return (
    <Caixa visivel={visivel} aoFechar={aoFechar} largura={240}>
      <CirculoLookBy tamanho={70} />
      <Text style={st.pergunta}>{pergunta}</Text>
      {children}
      <View style={st.simNao}>
        <Botao titulo="SIM" tamanho="pequeno" largura={76} onPress={aoConfirmar} carregando={carregando} />
        <Botao titulo="NÃO" tamanho="pequeno" largura={76} onPress={aoFechar} desabilitado={carregando} />
      </View>
      <MensagemErro texto={erro} style={{ marginTop: espaco.md }} />
      {explicacao ? <Text style={st.explicacao}>{explicacao}</Text> : null}
    </Caixa>
  );
}

// Foto redonda do usuário; sem foto, mostra o bonequinho azul do Figma
export function Foto({ url, tamanho = 44 }) {
  if (url) {
    return (
      <Image
        source={{ uri: urlArquivo(url) }}
        style={{ width: tamanho, height: tamanho, borderRadius: tamanho / 2, backgroundColor: cores.cabecalho }}
      />
    );
  }
  return <Feather name="user" size={tamanho} color={cores.azul} />;
}

export function Estrelas({ nota = 0, tamanho = 16, onChange }) {
  const estrela = (n) => (
    <Text style={{ fontSize: tamanho, color: n <= Math.round(nota) ? cores.aviso : '#8A8A8A' }}>★</Text>
  );
  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {[1, 2, 3, 4, 5].map((n) =>
        onChange ? (
          <Pressable key={n} onPress={() => onChange(n)} hitSlop={4} role="button" aria-label={`${n} estrela${n > 1 ? 's' : ''}`}>
            {estrela(n)}
          </Pressable>
        ) : (
          <View key={n}>{estrela(n)}</View>
        )
      )}
    </View>
  );
}

// Bolinha vermelha com número (mensagens não lidas)
export function Contador({ numero, style }) {
  if (!numero) return null;
  return (
    <View style={[st.contador, style]}>
      <Text style={st.contadorTexto}>{numero > 9 ? '9+' : numero}</Text>
    </View>
  );
}

export const st = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: cores.fundo },
  circulo: { backgroundColor: cores.azul, alignItems: 'center', justifyContent: 'center' },
  circuloTexto: { color: cores.branco, fontFamily: fontes.corpoForte },
  botao: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 10, alignSelf: 'center',
  },
  rotulo: { fontFamily: fontes.corpoMedio, color: cores.branco, fontSize: 13, marginBottom: 6 },
  input: {
    minHeight: 38, borderWidth: 1, borderColor: cores.branco, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, color: cores.branco, fontFamily: fontes.corpo, fontSize: 14,
  },
  opcoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opcao: { borderWidth: 1, borderColor: cores.branco, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  opcaoTexto: { color: cores.branco, fontFamily: fontes.corpo, fontSize: 13 },
  erro: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: espaco.md, alignSelf: 'stretch' },
  erroTexto: { flex: 1, color: cores.perigo, fontFamily: fontes.corpoMedio, fontSize: 13 },
  vazio: { alignItems: 'center', paddingHorizontal: espaco.xxl, paddingVertical: 48 },
  vazioTitulo: { fontFamily: fontes.corpoForte, color: cores.branco, fontSize: 18, marginTop: espaco.lg, textAlign: 'center' },
  vazioTexto: { fontFamily: fontes.corpo, color: cores.textoSuave, fontSize: 14, marginTop: 6, textAlign: 'center', lineHeight: 20 },
  secao: { marginTop: espaco.xl },
  secaoTopo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: espaco.sm },
  secaoTitulo: { fontFamily: fontes.corpoMedio, color: cores.branco, fontSize: 22 },
  secaoTituloPerfil: { fontFamily: fontes.secao, color: cores.branco, fontSize: 21, marginLeft: espaco.xl },
  dados: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', rowGap: 10 },
  dado: { width: '50%', alignItems: 'center', paddingHorizontal: 2 },
  dadoRotulo: { fontFamily: fontes.corpoMedio, color: cores.azul, fontSize: 12 },
  dadoValor: { fontFamily: fontes.corpoForte, color: cores.branco, fontSize: 15.5, textAlign: 'center', marginTop: 1 },
  fundoModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: espaco.lg },
  caixa: {
    backgroundColor: cores.modal, maxWidth: '100%',
    elevation: 10, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
  },
  caixaCorpo: { alignItems: 'center', paddingHorizontal: 12, paddingTop: 14, paddingBottom: espaco.lg },
  fechar: { position: 'absolute', top: 4, right: 10, zIndex: 2 },
  fecharTexto: { color: cores.azul, fontFamily: fontes.corpoForte, fontSize: 26 },
  pergunta: { fontFamily: fontes.corpoForte, color: cores.branco, fontSize: 15, textAlign: 'center', marginTop: espaco.md },
  simNao: { flexDirection: 'row', gap: 26, marginTop: espaco.md },
  explicacao: { fontFamily: fontes.corpoForte, color: cores.branco, fontSize: 10.5, textAlign: 'center', marginTop: espaco.xl, lineHeight: 14 },
  contador: {
    minWidth: 20, height: 20, borderRadius: 10, backgroundColor: '#E5484D',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5,
  },
  contadorTexto: { color: cores.branco, fontFamily: fontes.corpoForte, fontSize: 11 },
});
