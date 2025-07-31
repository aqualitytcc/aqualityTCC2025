import { useEffect, useState } from "react";
import styles from "@/styles/Styles.module.css";
export default function FormAddDisp() {
    const [nome,setnome]=useState('');
    const [descricao,setdescricao]=useState('');
    const [aberto, setaberto]=useState(false);
    useEffect(()=>{
        console.log(aberto)
    },[aberto]);
    if(aberto){
        return(
                <div className="frmAdd">
                    <label>Nome do dispositivo:</label>
                    <input type="text" value={nome} onChange={(e)=>{setnome(e.target.value)}} placeholder="Nome do dispositivo" />
                    <label>Descrição: </label>
                    <input type="text" value={descricao} onChange={(e)=>{setdescricao(e.target.value)}} placeholder="Descreva sua função"/>
                    <button>Adicionar</button>
                </div>
            );
    }
    else{
        return(
            <button className={styles.btnAdd} onClick={()=>{setaberto(!aberto)}}>Adicionar</button>
        );
    }
}