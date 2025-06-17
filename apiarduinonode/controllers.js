import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import mysql2 from 'mysql2';

// Conectando ao banco de dados MySQL
// Certifique-se de que o MySQL está rodando e as credenciais estão corretas
const conn= mysql2.createConnection({
    host:'localhost',
    user:'root',
    password:'master',
    database:'aquality'});


//Criando as listas para armazenar os dados
let dispositivos=[];
let usuarios=[];
let leituras=[];
// Exportando as funções para serem usadas nas rotas
// Obter todos os dispositivos
export const obterDispositivos = (req, res) => {
    conn.query('SELECT * FROM dispositivos', (error, dados) => {
        if(error){
            res.status(500).json({message: 'Erro ao obter dispositivos'});
            return;
        }
        dispositivos = dados.map(d => ({
            id: d.id,
            nome: d.nome,
            usuario_id: d.usuario_id,
            descricao: d.descricao,
            criado_em: d.criado_em
        }));
    res.json(dispositivos);
    });
}
// Adicionar um novo dispositivo
export const adicionarDispositivo = (req, res) => {
    const { usuario_id, nome, descricao } = req.body;
    if (!usuario_id || !nome || !descricao ) {
        res.status(400).json({ message: 'Todos os campos são obrigatórios' });
        return;
    }
    const sqlQuery = 'INSERT INTO dispositivos (usuario_id, nome, descricao) VALUES (?, ?, ?)';
    conn.query(sqlQuery, [parseInt(usuario_id), nome, descricao], (error, results) => {
        if (error) {
            res.status(500).json({ message: 'Erro ao adicionar dispositivo', error: error.message });
            return;
        }
        res.status(201).json({ message: 'Dispositivo adicionado com sucesso'});
    });
}
// Atualizar um dispositivo existente
export const atualizarDispositivo = (req, res) => {
    const {id}=req.params;
    const { usuario_id, nome, descricao } = req.body;
    if (!usuario_id || !nome || !descricao){
        res.status(400).json({message:'Preencha todos os campos'});
        return;
    }
    const sqlQuery = 'UPDATE dispositivos SET usuario_id=?, nome=?, descricao=? WHERE id=?';
    conn.query(sqlQuery, [parseInt(usuario_id), nome, descricao, parseInt(id)], (error, results) => {
        if(error){
            res.status(500).json({message: 'Erro ao atualizar dispositivo', error: error.message});
            return;
        }
        res.status(200).json({message: 'Dispositivo atualizado com sucesso'});
    }); 
}

// Remover um dispositivo existente
export const removerDispositivo= (req, res) => {
    const { id } = req.params;
    const sqlQuery = 'DELETE FROM dispositivos WHERE id=?';
    conn.query(sqlQuery, [parseInt(id)], (error, results) => {
        if(error){
            res.status(500).json({message: 'Erro ao remover dispositivo', error: error.message});
            return;
        }
        res.status(200).json({message: 'Dispositivo removido com sucesso'});
    });
}