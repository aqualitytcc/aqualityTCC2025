import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import styles from '@/styles/Navbar.module.css';
export default function VerticalNavBar() {
  return (
    <div className={styles.verticalNavBar}>
      <h2>aquality</h2>
      <ul>
        <li>Dispositivos</li>
        <li>Leituras</li>
        <li id="config"></li>
        <li><FontAwesomeIcon icon={faRightFromBracket} /> Login</li>
      </ul>
    </div>
  );
}