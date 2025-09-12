import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import mysql2 from 'mysql2';
import base64 from 'base-64';
import session from 'express-session';
import pool from './pool.js'
//Entrar
export const loginUsuario = async(req, res) => {
    const {email, senha}   = req.body;
    if(!email || !senha){
       return res.status(400).json({message: 'Email e senha são obrigatórios'});
    }
    try{
        const sqlQuery = 'SELECT * FROM usuarios WHERE email=? AND senha_hash=?';
        const [result]=await pool.query(sqlQuery, [email, senha]);
        if (result.length === 0) {
            return res.status(401).json({ message: 'Email ou senha inválidos' });
        }
        return res.status(200).json({
           message:'Login feito com sucesso'
        });
    }
    catch(error){
        return res.status(500).json({ message: 'Erro ao realizar login' });
    }

}
//Sair
export const logoutUsuario=(req,res)=>{ 
    req.session.destroy(err=>{
        if(err){
            return res.status(500).json({message:'Erro ao fazer logout'});
        }
        return res.status(200).json({ message: 'Logout realizado com sucesso' });
    });
}
export const CadastrarUsuario=async(req,res)=>{
    const {nome,email, senha}= req.body;
    if(!nome || !email || !senha){
        return res.status(400).json({message: 'Email e senha são obrigatórios'});
    }
    try{
        const sqlQuery='INSERT INTO usuarios (nome, email,senha_hash) VALUES (?, ?, ?)';
        await pool.query(sqlQuery, [nome,email, senha]);
        return res.status(200).json({message:'Usuario criado com sucesso'})
    }
    catch(error){
        return res.status(500).json({message:'Erro ao criar usuário'})
    }
}
//Apagar conta
export const DeletarUsuario=async(req,res)=>{
    const {id}= req.params;
    try{
        const sqlQuery='DELETE FROM usuarios WHERE id=?';
        const [result]=await pool.query(sqlQuery, [id]);
        if (result.affectedRows === 0) {return res.status(404).json({message:'Usuario não encontrado'})}
        return res.status(200).json({message:'Usuario deletado com sucesso'})
    }
    catch(error){
        return res.status(500).json({message:'Erro ao deletar usuário', error})
    }
}