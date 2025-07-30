import { StyleSheet, Text, SafeAreaView, Image, View, TextInput, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function Login() {
    return (
        <SafeAreaView style={styles.container}>
            {/*imagem de login */}
            <View style={styles.topo}>
                <Image
                    style={styles.login}
                    source={require('../assets/imagens/login.png')}
                />
            </View>
            {/*titulo de login */}
            <Text style={styles.texto}>LOGIN</Text>

            {/*TEXTINPUT DE E-MAIL */}
            <View style={styles.containerTextInput}>
                <MaterialIcons name='email' size={20} color={'#666'} />
                <TextInput style={styles.textInput} placeholder='E-MAIL' keyboardType='email-address' />
            </View>

            {/*TEXTINPUT DE SENHA */}
            <View style={styles.containerTextInput}>
                <MaterialIcons name='form-textbox-password' size={20} color={'#666'} />
                <TextInput style={styles.textInput} placeholder='SENHA' secureTextEntry={true} />
            </View>
            {/* BOTÃO DE LOGIN */}
            <TouchableOpacity style={styles.btnLogin}>
                <Text style={styles.txtLogin}>LOGIN</Text>
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
        backgroundColor:'#3480EB',
        padding:20,
        borderRadius:10,
        marginBottom:30
    },
    txtLogin:{
        textAlign:'center',
        fontWeight:'700',
        fontSize:16,
        color:'#fff'
    }

});
