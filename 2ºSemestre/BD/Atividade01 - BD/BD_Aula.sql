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
    primary key(CODIGO_CATEGORIA),
    foreign key(CODIGO_SUBCATEGORIA) references
    SUBCATEGORIAS(CODIGO_SUBCATEGORIA)
    );
    
    create table PRODUTOS(
    CODIGO_PRODUTO smallint not null,
    CODIGO_CATEGORIA smallint not null,
    NOME_PRODUTO varchar(80) not null,
    DESCRICAO_PRODUTO text,
    PRECO float not null,
    PESO float not null,
    primary key(CODIGO_PRODUTO),
    foreign key(CODIGO_CATEGORIA) REFERENCES
    CATEGORIAS(CODIGO_CATEGORIA)
    );
    
    alter table categorias
    add observacao varchar (255);
    
    alter table produtos
    modify column peso decimal (6,2);
    
    alter table categorias drop column observacao;
    
    insert into subcategorias values(1,'esportivo','131208');
    
    insert into subcategorias values(2,'tecnologia','131208');
    
    insert into subcategorias values(3,'audio e video','131208');
    
    insert into subcategorias values(4,'eletrodomesticos','121208');
    
    insert into subcategorias values(5,'papelaria','121208');
    
    
    select * from subcategorias;
    
	insert into categorias values(1,1,'esportivo');
    
    insert into categorias values(2,2,'tecnologia');
    
    insert into categorias values(3,3,'audio e video');
    
    insert into categorias values(4,4,'eletrodomesticos');
    
    insert into categorias values(5,5,'papelaria');
    
    
    select * from subcategorias;
    select * from categorias;
    
    
    insert into produtos values(1,1,'camiseta do gremio','camiseta com listras na cor azul,preto e branco',89,95);
    
    insert into produtos values(2,2,'notebook compaq presario','computador portatil pentium',3300,3);
    
    insert into produtos values(3,3,'monitor samsung','monitor colorido de 14 polegadas',450,8);
    
    insert into produtos values(4,4,'cafeteria','cafeteria 14 xicaras arno',55,50);
    
    insert into produtos values(5,5,'caneta bic','pacote com 3 unidades',4.50,3);
    
    delete from produtos where CODIGO_PRODUTO = 5;
    
    select * from subcategorias;
    
    select * from produtos;
    
    ####################################
    Use bdaula;
    update produtos
    set preco=32.5
	where NOME_PRODUTO='camiseta do gremio';
    
	Use bdaula;
    update produtos
    set preco=1000
     where NOME_PRODUTO = 'notebook compaq presario';
    
	Use bdaula;
    update produtos
    set preco=500
    where NOME_PRODUTO = 'monitor sansung';
    
    desc categorias;
    
    alter table categorias
    add (observacao varchar(255)),
    add (campo2 smallint),
    add (campo3 text);
    desc categorias;
    
    use bdaula;
    
    desc categorias;
    
    alter table categorias
    add (cidade varchar(255)),
    add (campo4 Smallint),
    add (campo5 text);
    
    desc categorias;
    
    desc subcategorias;
    
    alter table subcategorias
    add (pais varchar(255)),
    add (campo4 smallint),
	add (campo5 text);

alter table categorias drop campo2;

alter table categorias drop campo3;

alter table categorias drop cidade;

select nome_produto, preco, preco*3 
from produtos;

select nome_produto, preco, preco*0.15
from produtos;

select nome_produto, preco, preco*1.15
from produtos;

select * from SUBCATEGORIAS;
select nome_subcategoria, data, pais from subcategorias
where codigo_subcategoria < 2;

select * from SUBCATEGORIAS;
select nome_subcategoria, data, pais from subcategorias
where codigo_subcategoria = 2;

select * from SUBCATEGORIAS;
select nome_subcategoria, data, pais from subcategorias
where codigo_subcategoria <= 2;

select * from SUBCATEGORIAS;
select nome_subcategoria, data, pais from subcategorias
where codigo_subcategoria >= 2;

select nome_categoria, codigo_subcategoria, observacao, codigo_categoria
from categorias 
where codigo_categoria 
between 2 
and 4;

select nome_produto
from produtos 
where codigo_produto = 1 
and peso = 15;

select * from produtos;

select nome_produto, preco, categoria.nome_categoria, categorias.codigo_categoria 
from produtos cross join categorias 
where codigo_produto = 1 
and categorias.codigo_categoria = 1;

    
    
    
    
    