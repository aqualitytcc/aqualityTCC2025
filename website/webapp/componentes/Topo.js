import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import styles from '@/styles/Styles.module.css';
export default function VerticalNavBar() {
  return (
    <header className={styles.verticalNavBar}>
      <h2>aquality</h2>
      <ul style={{ listStyle: 'none' }}>
        <li>Dispositivos</li>
        <li>Leituras</li>
        <li><FontAwesomeIcon icon={faRightFromBracket} /> Login</li>
      </ul>
    </header>
  );
}