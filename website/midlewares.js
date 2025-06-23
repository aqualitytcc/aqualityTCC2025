import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import base64 from 'base-64';
import session from 'express-session';
//Autenticação de usuario
export const autenticar = (req, res, next) => {
    if(req.session.usuario){
        next();
    }
    else{
        res.redirect('/');
    }
}