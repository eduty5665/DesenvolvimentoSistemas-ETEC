create database bdaula;

use bdaula;

create table SUBCATEGORIAS(
	CODIGO_SUBCATEGORIA smallint not null,
    NOME_SUBCATEGORIA varchar(60) not null,
    DATA date,
    primary key(CODIGO_SUBCATEGORIA)
);

create table CATEGORIAS(
	CODIGO_CATEGORIA smallint not null,
    CODIGO_SUBCATEGORIA smallint not null,
    NOME_CATEGORIA varchar(60) not null,
    DATA date,
    primary key(CODIGO_CATEGORIA),
    foreign key(CODIGO_SUBCATEGORIA) references
    SUBCATEGORIAS(CODIGO_SUBCATEGORIA)
);

create table PRODUTOS(
	CODIGO_CATEGORIA smallint not null,
    CODIGO_PRODUTO smallint not null,
    NOME_PRODUTO varchar(60) not null,
    DESCRICAO_PRODUTO text,
    PRECO float not null,
    PESO float not null,
    DATA date,
    primary key(CODIGO_PRODUTO),
    foreign key(CODIGO_CATEGORIA) references
    CATEGORIAS(CODIGO_CATEGORIA)
);

alter table CATEGORIAS
add OBSERVACAO varchar(255);

alter table PRODUTOS
modify column PESO decimal(6,2);

alter table CATEGORIAS
drop column OBSERVACAO;

insert into SUBCATEGORIAS values(1, 'esportivo', '131208');
insert into SUBCATEGORIAS values(2, 'tecnologia', '131209');	
insert into SUBCATEGORIAS values(3, 'audio e video', '131210');	
insert into SUBCATEGORIAS values(4, 'eletrodomesticos', '131211');	
insert into SUBCATEGORIAS values(5, 'papelaria', '131212');		

