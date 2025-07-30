const express = require("express");

const app = express();

app.use(express.json());

app.use(express.urlencoded({extended:true}));


const categoriaController = require("./controller/CategoriaController");
app.use("/", categoriaController);

const produtoController = require("./controller/ProdutoController");
app.use("/", produtoController);

app.listen(3000, ()=>{
    console.log('Atividade pw2 rodando em: http://localhost:3000');
});