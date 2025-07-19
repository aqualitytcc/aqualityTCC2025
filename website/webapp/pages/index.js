import Card from "@/componentes/Card";
import VerticalNavBar from "@/componentes/Topo";
import styles from "@/styles/Styles.module.css";
import { useState, useEffect } from "react";


export default function Home() {
  const [dispositivo, setDispositivo] = useState(['']);
useEffect(() => {
  const buscarDispositivos= async()=>{
    const response = await fetch('http://localhost:3001/api/dispositivos');
    if (!response.ok) {
      throw new Error('Erro ao buscar dispositivos');
    }
    const data=await response.json();
    setDispositivo(data);
  }
  buscarDispositivos();
}, []);
  return (
    <div className={styles.dashboard}>
      <VerticalNavBar />
      {dispositivo.map((dispositivo, index) => (
        <Card key={index} title={dispositivo.nome} content={dispositivo.id} />
      ))} 
    </div>
  );
}