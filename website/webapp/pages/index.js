import Card from "@/componentes/Card";
import VerticalNavBar from "@/componentes/Topo";
import FormAddDisp from "@/componentes/formAddDisp";
import styles from "@/styles/Styles.module.css";
import { useState, useEffect } from "react";


export default function Home() {
  const [dispositivo, setDispositivo] = useState([]);
  useEffect(()=>{
    const buscarDispositivos= async()=>{
      try{
        const response = await fetch('http://localhost:3001/api/dispositivos');
        if (!response.ok) {
          throw new Error('Erro ao buscar dispositivos');
        }
        else {
          const data=await response.json();
          setDispositivo(data);
        }
      } catch (error) {
        console.log('Erro ao buscar dispositivos:', error);
      }
    }
    buscarDispositivos();
  }, []);
  return (
    <div className={styles.dashboard}>
      <VerticalNavBar />
      {dispositivo.map((d) => (
        <Card key={d.id} 
        title={d.nome} 
        content={d.descricao} 
        datacriacao={new Date(d.criado_em).toLocaleDateString("pt-BR")} />
      ))}
      <FormAddDisp/>
    </div>
  );
}