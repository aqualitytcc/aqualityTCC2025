import { useEffect, useState } from "react";

export default function FormAddDisp() {
    const [novodispositivo,setnovodispositivo]=useState('');
    useEffect(()=>{
        const addDispositivo=async()=>{
            const response=await fetch('http://localhost:3001/api/dispositivos');
            if(!response.ok){
            }
            const numerodisp=await dispositivos.json;
            const id=dispositivos.lenght+1;
        }   
    })
    return(
        <div className="frmAdd">
            <label>Nome do dispositivo:</label>
            <input type="text" value={novodispositivo} placeholder="Nome do dispositivo" />
            <label>Descrição: </label>
            <input type="text" placeholder="Descreva sua função"/>
            <input type="submit">Adicionar</input>            
        </div>
    );
}