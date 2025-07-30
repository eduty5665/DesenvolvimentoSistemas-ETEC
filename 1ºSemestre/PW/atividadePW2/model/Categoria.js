const sequelize = require("sequelize");

const connection = require("../database/database");

const Categoria = connection.define(
    'tbl_categoria',
    {
        codigo_categoria:{
            type: sequelize.INTEGER,
            unsigned:true,
            autoIncrement:true,
            primaryKey:true
        },
        nome_categoria:{
            type: sequelize.STRING(255),
            allowNull:false
        },
        observacoes_categoria:{
            type: sequelize.TEXT,
            allowNull:false
        }
    }
)

Categoria.sync({force:false});

module.exports = Categoria;