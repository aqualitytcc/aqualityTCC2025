import React from 'react';
import styles from '@/styles/Styles.module.css';
export default function Card(props) {
    return (
        <div className={styles.card}>
            <h2>{props.title}</h2>
            <p>{props.content}</p>
            <p>{props.datacriacao}</p>
        </div>
    );
}