import { StyleSheet, Text, SafeAreaView, Image, View, TextInput, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function Login({navigation}) {
    return (
        <SafeAreaView style={styles.container}>
            {/*imagem de login */}
            <View style={styles.topo}>
                <Image
                    style={styles.login}
                    source={require('../assets/login2.jpg')}
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
            <TouchableOpacity style={styles.btnLogin} onPress={()=>{navigation.navigate('DrawerMenu')}}>
                <Text style={styles.txtLogin}>LOGIN</Text>
            </TouchableOpacity>

            {/* LOGIN ALTERNATIVO (REDES SOCIAIS) */}
            <Text style={styles.logarCom}>
                Logar com ...
            </Text>

            <View style={styles.containerLoginCom}>

                <TouchableOpacity style={styles.btnLoginCom}>
                    <Image
                        source={require('../assets/imagens/google.png')}
                    />
                </TouchableOpacity>

                <TouchableOpacity style={styles.btnLoginCom}>
                    <Image
                        source={require('../assets/imagens/facebook.png')}
                    />
                </TouchableOpacity>

            </View>

            {/* CRIAÇÃO DE USUÁRIO */}
            <View style={styles.containerLoginCom}>
                <TouchableOpacity
                onPress={()=>{
                    navigation.navigate('CreateUser')
                }}
                >
                    <Text style={styles.btnRegistro}>CRIAR CONTA</Text>
                </TouchableOpacity>
            </View>
            

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
        width: 200,
        height: 200

    },
    texto: {
        fontSize: 28,
        fontWeight: '500',
        color: '#00F',
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
        marginBottom:20
    },
    txtLogin:{
        textAlign:'center',
        fontWeight:'700',
        fontSize:16,
        color:'#fff'
    },
    logarCom:{
        textAlign:'center',
        color:'#666',
        marginBottom:30
    },
    containerLoginCom:{
        flexDirection:'row',
        justifyContent:'center',
        marginBottom:20
    },
    btnLoginCom:{
        borderBlockColor:'#DDD',
        borderWidth:2,
        borderRadius:10,
        paddingHorizontal:30,
        paddingVertical:10,
        marginRight:10
    },
    btnRegistro:{
        color:'#3480EB',
        fontWeight:'700'
    }

});
