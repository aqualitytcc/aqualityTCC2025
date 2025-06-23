import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import mysql2 from 'mysql2';
import base64 from 'base-64';

// Conectando ao banco de dados MySQL
// Certifique-se de que o MySQL está rodando e as credenciais estão corretas
const conn= mysql2.createConnection({
    host:'localhost',
    user:'root',
    password:'master',
    database:'aquality'});


//Criando as listas para armazenar os dados
let usuarios=[];

//Configurar usuarios
const obterUsuarios = (req, res) => {
    conn.query('SELECT * FROM usuarios', (error, dados) => {
        if(error){
            res.status(500).json({message: 'Erro ao obter usuários'});
            return;
        }
        usuarios = dados.map(u => ({
            id: u.id,
            email: u.email,
            senha_hash: u.senha_hash
        }));
        res.json(usuarios);
    });
}
export const loginUsuario = (req, res) => {
    const {email, senha}   = req.body;
    if(!email || !senha){
        res.status(400).json({message: 'Email e senha são obrigatórios'});
        return;
    }
    const sqlQuery = 'SELECT * FROM usuarios WHERE email=? AND senha_hash=?';
    conn.query(sqlQuery, [email, base64.encode(senha)], (error, results) => {
        if (error) {
            res.status(500).json({ message: 'Erro ao realizar login' });
            return;
        }
        if (results.length === 0) {
            res.status(401).json({ message: 'Email ou senha inválidos' });
            return;
        }
        const usuario = results[0];
        res.redirect('/dashboard');
    });
}