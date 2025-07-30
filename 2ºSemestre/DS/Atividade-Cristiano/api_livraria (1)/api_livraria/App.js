import { StyleSheet, Text, SafeAreaView, Image, View, TextInput, TouchableOpacity } from 'react-native';

export default function Login() {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.topo}>
                <Image
                    style={styles.login}
                    source={require('../assets/imagens/login.png')}
                />
            </View>
            <Text style={styles.texto}>Cadastro de Categoria</Text>

            <View style={styles.containerTextInput}>
                <TextInput style={styles.textInput} placeholder='Nome da Categoria' keyboardType='email-address' />
            </View>

            <View style={styles.containerTextInput}>
                <TextInput style={[styles.textInput, styles.multilineText]} placeholder='Observações' multiline />
            </View>
            <TouchableOpacity style={styles.btnLogin}>
                <Text style={styles.txtLogin}>CADASTRAR</Text>
            </TouchableOpacity>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 15
    },
    topo: {
        alignItems: 'center'
    },
    login: {
        width: 350
    },
    texto: {
        fontSize: 28,
        fontWeight: '500',
        color: '#333',
        marginBottom: 30
    },
    containerTextInput: {
        flexDirection:'row',
        borderBottomColor: '#ccc',
        borderBottomWidth: 1,
        paddingBottom: 8,
        marginBottom: 25,
        alignItems:'center'
    },
    textInput: {
        padding: 10
    },
    btnLogin:{
        backgroundColor:'#16b5e7',
        padding:20,
        borderRadius:10,
        marginBottom:30
    },
    txtLogin:{
        textAlign:'center',
        fontWeight:'700',
        fontSize:16,
        color:'#fff'
    },
    multilineText: {
        minHeight: 100,
        textAlignVertical:'top'
    }

});
