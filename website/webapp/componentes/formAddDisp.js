import { useEffect, useState } from "react";
import styles from '@/styles/Styles.module.css';
export default function FormAddDisp(props) {
    const [nome,setnome]=useState('');
    const [descricao,setdescricao]=useState('');
    const [aberto, setaberto]=useState(false);
    const adicionarDisp = async()=>{
        const response= await fetch(' http://localhost:3001/api/dispositivos',{method: 'POST',
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({"nome": nome, "descricao": descricao})
            })
       }
    useEffect(()=>{
       
    },[]);
    if(props.open===true){
        return(
                <div className={styles.backdrop}>
                    <div className={styles.frmAddDisp}>
                        <label>Nome do dispositivo:</label>
                        <input type="text" value={nome} onChange={(e)=>{setnome(e.target.value)}} placeholder="Nome do dispositivo" />
                        <label>Descrição: </label>
                        <input type="text" value={descricao} onChange={(e)=>{setdescricao(e.target.value)}} placeholder="Descreva sua função"/>
                        <button onClick={()=>{adicionarDisp()}}>Adicionar</button>
                    </div>
                </div>
            );
    }
}