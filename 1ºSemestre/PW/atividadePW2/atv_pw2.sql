CREATE DATABASE atv_pw2;

CREATE TABLE tbl_categoria(
	codigo_categoria INT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome_categoria VARCHAR(255) NOT NULL,
    observacoes_categoria TEXT NOT NULL
);

CREATE TABLE tbl_produto(
	codigo_produto INT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome_produto VARCHAR(255) NOT NULL,
    valor_produto DECIMAL(10,2) NOT NULL,
    imagem_produto VARCHAR(500) NOT NULL,
    descricao_produto TEXT NOT NULL
);

drop table tbl_produto;