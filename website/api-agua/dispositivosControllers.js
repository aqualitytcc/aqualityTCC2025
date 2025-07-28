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
    res.json(dispositivos);
  } catch (error) {
    res.json({ error: error.message });
  }
};
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