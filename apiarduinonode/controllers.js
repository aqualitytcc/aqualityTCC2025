import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

let dispositivos=[];

export const obterDispositivos = (req, res) => {
    res.json(dispositivos);
}
export const adicionarDispositivo = (req,res) => {
    const dispostivo=req.body;
    dispositivos.push(dispostivo);
    res.status(201).json(dispostivo);
}
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
}