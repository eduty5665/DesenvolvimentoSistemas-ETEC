import { Image, FlatList, SafeAreaView, StyleProp, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const produtos = [
    {
        codigo_produto:1,
        codigo_categoria:5,
        nome_produto:'Hyper X, TECLADO MECANICO HYPERX ALLOY ORIGINS 60 ',
        valor_produto:'599,00',
        imagem_livro:require('../assets/imagens/aparelhos/teclado.jpg'),
        descricao_produto:'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla neque libero, tempor id blandit id, interdum ut sapien.'
    },
    {
        codigo_produto:2,
        codigo_categoria:5,
        nome_produto:'MOUSE GAMER LOGITECH G203 LIGHTSYNC RGB',
        valor_produto:'386,99',
        imagem_livro:require('../assets/imagens/aparelhos/mouse.jpg'),
        descricao_produto:'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla neque libero, tempor id blandit id, interdum ut sapien.'
    },
    {
        codigo_produto:3,
        codigo_categoria:2,
        nome_produto:'Relogio inteligente Smart Watch Unisexx ',
        valor_produto:'41,99',
        imagem_livro:require('../assets/imagens/aparelhos/relogio.jpg'),
        descricao_produto:'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla neque libero, tempor id blandit id, interdum ut sapien.'
    },
    {
        codigo_produto:4,
        codigo_categoria:3,
        nome_produto:'Apple iPhone 14 (128 GB) azul',
        valor_produto:'7.599,00',
        imagem_livro:require('../assets/imagens/aparelhos/iphone.jpg'),
        descricao_produto:'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla neque libero, tempor id blandit id, interdum ut sapien.'
    },
    {
        codigo_produto:5,
        codigo_categoria:5,
        nome_produto:'FIFINE Headset Gamer Fone De Ouvido',
        valor_produto:'275,00',
        imagem_livro:require('../assets/imagens/aparelhos/fone.jpg'),
        descricao_produto:'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla neque libero, tempor id blandit id, interdum ut sapien.'
    },
    {
        codigo_produto:6,
        codigo_categoria:5,
        nome_produto:'MONITOR GAMER LG 27" IPS FULL HD 75HZ',
        valor_produto:'710,58',
        imagem_livro:require('../assets/imagens/aparelhos/monitor.jpg'),
        descricao_produto:'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla neque libero, tempor id blandit id, interdum ut sapien.'
    },
    {
        codigo_produto:7,
        codigo_categoria:5,
        nome_produto:'Mouse Pad Gamer 20x24cm Personalizado Borracha e Tecido Hacker Geek MSK',
        valor_produto:'22,50',
        imagem_livro:require('../assets/imagens/aparelhos/mousepad.jpg'),
        descricao_produto:'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla neque libero, tempor id blandit id, interdum ut sapien.'
    },
    {
        codigo_produto:8,
        codigo_categoria:1,
        nome_produto:'PLACA DE VIDEO NVIDIA GEFORCE RTX 2060 GDDR6 6GB',
        valor_produto:'2.799,90',
        imagem_livro:require('../assets/imagens/aparelhos/placavideo.jpg'),
        descricao_produto:'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla neque libero, tempor id blandit id, interdum ut sapien.'
    },
    {
        codigo_produto:9,
        codigo_categoria:1,
        nome_produto:'Processador AMD Ryzen 7 5700X Socket AM4',
        valor_produto:'2.890,00',
        imagem_livro:require('../assets/imagens/aparelhos/procesador.jpg'),
        descricao_produto:'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla neque libero, tempor id blandit id, interdum ut sapien.'
    },
    {
        codigo_produto:10,
        codigo_categoria:2,
        nome_produto:'CADEIRA GAMER FOX RACER RGB BRANCA COM ILUMINAÇÃO (LED)',
        valor_produto:'915,86',
        imagem_livro:require('../assets/imagens/aparelhos/cadeira.jpg'),
        descricao_produto:'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla neque libero, tempor id blandit id, interdum ut sapien.'
    },
];

const prodItem = ({ item }) => {
    return (
        <View style={styles.prod_container}>

            <Image
                style={styles.prod_image}
                source={item.imagem_livro}
            />

            <View style={styles.prod_text_container}>

                <Text style={styles.prod_data}>{item.nome_produto}</Text>

                <Text style={styles.prod_data}>{item.valor_produto}</Text>

                <TouchableOpacity style={styles.prod_button_details}>
                    <Text style={styles.prod_button_text}>DETALHES</Text>
                </TouchableOpacity>

            </View>

        </View>
    )
}

export default function Produtos() {
    return (
        <SafeAreaView style={styles.container}>

            <FlatList
                data={produtos}
                renderItem={prodItem}
                ListEmptyComponent={<Text>A LISTA DE PRODUTOS ESTÁ VAZIA</Text>}
                keyExtractor={produtos => produtos.codigo_produto}
            />

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    header_container: {
        flex: 1,
        flexDirection: 'row',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    header_title: {
        color: '#333',
        fontSize: 25,
        fontWeight: 'bold',
    },
    icone: {
        width: 60,
        height: 60,
        marginRight: 20,
    },
    prod_list_header: {
        height: 100,
    },
    prod_container: {
        flex: 1,
        flexDirection: 'row',
        padding: 10,
        borderWidth: 2,
        borderRadius: 10,
        borderColor: '#CCC',
        marginBottom: 10,
        backgroundColor: '#CCC',
    },
    prod_image: {
        width: 150,
        height: 220,
        marginRight: 10,
        marginBottom: 10,
    },
    prod_text_container: {
        width: 200,
        justifyContent: 'center',
    },
    prod_data: {
        fontSize: 20,
        color: '#00F',
        fontWeight: '600',
        width: '100%',
        textAlign: 'left',
    },
    prod_author: {
        fontSize: 14,
        fontWeight: '400',
        width: '100%',
        textAlign: 'left',
        color: '#CCC',
        marginBottom: 10,
    },
    prod_button_details: {
        alignItems: 'center',
        backgroundColor: '#64CBF2',
        padding: 10,
        borderRadius: 5,
        marginTop: 90,
        width: '100%',
    },
    prod_button_text: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});