import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import mysql2 from 'mysql2';

const conn= mysql2.createConnection({
    host:'localhost',
    user:'root',
    password:'master',
    database:'aquality'});
let dispositivos=[];
let usuarios=[];
let leituras=[];
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
export const adicionarDispositivo = (req, res) => {
    const { id, usuario_id, nome, descricao, criado_em } = req.body;
    conn.query(`INSERT INTO dispositivos VALUES (${id}, ${usuario_id}, ${nome}, ${descricao}, ${criado_em})`, (error, results) => {
        if (error) {
            res.status(500).json({ message: 'Erro ao adicionar dispositivo', error: error.message });
            return;
        }
        res.status(201).json({
            id: id.length + 1,
            usuario_id,
            nome,
            descricao,
            criado_em
        });
    });
};
/*
export const atualizarDispositivo = (req, res) => {
    const id= parseInt(req.params.id);
    const dispositivo = req.body;
    const index = dispositivos.findIndex(d => d.id === id);
    if(index === -1){
        res.status(404).json({message: 'Dispositivo não encontrado'});
    }
    else{
        dispositivos[index] = dispositivo;
        res.json(dispositivo);
    }
}
export const removerDispositivo=(req, res)=>{
    const id= parseInt(req.params.id);
    const dispositivo = req.body;
    const index = dispositivos.findIndex(d => d.id === id);
    if(index === -1){
        res.status(404).json({message: 'Dispositivo não encontrado'});
    }
    else{
        dispositivos.splice(index, 1);
        res.json({message: 'Dispositivo removido com sucesso'});
    }
}*/