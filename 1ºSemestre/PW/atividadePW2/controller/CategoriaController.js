const express = require("express");

const router = express.Router();

router.post("/categoria/cadastrarCategoria", (req, res) =>{
    res.send("Categoria cadastrada com sucesso");
});

router.get("/categoria/listarCategoria", (req, res) =>{
    res.send("Categoria listada com sucesso");
});

router.put("/categoria/alterarCategoria", (req, res) =>{
    res.send("Categoria alterada com sucesso");
});

router.delete("/categoria/excluirCategoria", (req, res) =>{
    res.send("Categoria excluida com sucesso");
});

module.exports = router;