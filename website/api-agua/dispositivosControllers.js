import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import mysql2 from 'mysql2';
import base64 from 'base-64';
import pool from './pool.js';

export const obterDispositivos = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM dispositivos');
    const dispositivos = rows.map(d => ({
      id: d.id,
      nome: d.nome,
      usuario_id: d.usuario_id,
      descricao: d.descricao,
      criado_em: d.criado_em
    }));
    return res.status(200).json(dispositivos);
  } catch (error) {
        return res.status(500).json({ error: error.message });
  }
};
// Adicionar um novo dispositivo
export const adicionarDispositivo =async (req, res) => {
    //No momento usuario_id sera igual a 2 pois ainda nao desenvolvi a parte do multiusuarios
    const usuario_id ='2';
    const { nome, descricao } = req.body;
    if ( !nome || !descricao ) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
    }
    try{
    const sqlQuery = 'INSERT INTO dispositivos (usuario_id, nome, descricao) VALUES (?, ?, ?)';
    await pool.query(sqlQuery, [parseInt(usuario_id), nome, descricao]);
    return res.status(201).json({ message: 'Dispositivo adicionado com sucesso'});
    }
    catch(error){
        return res.status(500).json({ message: 'Erro ao adicionar dispositivo', error: error.message })
    }
}
// Atualizar um dispositivo existente
export const atualizarDispositivo = async(req, res) => {
    const {id}=req.params;
    const { usuario_id, nome, descricao } = req.body;
    if (!usuario_id || !nome || !descricao){
        return res.status(400).json({message:'Preencha todos os campos'});
    }
    try{
    const sqlQuery = 'UPDATE dispositivos SET usuario_id=?, nome=?, descricao=? WHERE id=?';
    const [result]=await pool.query(sqlQuery, [parseInt(usuario_id), nome, descricao, parseInt(id)]);
    if(result.affectedRows===0){
        return res.status(404).json({message: 'Dispositivo não encontrado'});
    }
    return res.status(200).json({message: 'Dispositivo atualizado com sucesso'});
    }
    catch(error){
        return res.status(500).json({message: 'Erro ao atualizar dispositivo', error: error.message});
    }
}

// Remover um dispositivo existente
export const removerDispositivo= async(req, res) => {
    const { id } = req.params;
    try{
        const sqlQuery = 'DELETE FROM dispositivos WHERE id=?';
        const [result]=await pool.query(sqlQuery, [parseInt(id)]);
        if(result.affectedRows===0){
            return res.status(404).json({message: 'Dispositivo não encontrado'});
        }
        return res.status(200).json({message: 'Dispositivo removido com sucesso'});
    }
    catch(error){
        return res.status(500).json({message: 'Erro ao remover dispositivo', error: error.message});
    }
}