CREATE DATABASE  IF NOT EXISTS `aquality_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 */;
USE `aquality_db`;
-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: aquality_db.mysql.dbaas.com.br    Database: aquality_db
-- ------------------------------------------------------
-- Server version	5.7.32-35-log

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `alertas`
--

DROP TABLE IF EXISTS `alertas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alertas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `dispositivo_id` int(11) NOT NULL,
  `regra_id` int(11) DEFAULT NULL,
  `tipo` varchar(50) NOT NULL DEFAULT 'qualidade_agua',
  `nivel` enum('info','warning','critical') NOT NULL DEFAULT 'info',
  `titulo` varchar(200) NOT NULL,
  `mensagem` text NOT NULL,
  `valor_atual` decimal(10,2) DEFAULT NULL,
  `valor_limite` decimal(10,2) DEFAULT NULL,
  `lido` tinyint(1) NOT NULL DEFAULT '0',
  `resolvido` tinyint(1) NOT NULL DEFAULT '0',
  `data_criacao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `data_resolucao` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_usuario` (`usuario_id`),
  KEY `idx_dispositivo` (`dispositivo_id`),
  KEY `idx_regra` (`regra_id`),
  KEY `idx_tipo` (`tipo`),
  KEY `idx_nivel` (`nivel`),
  KEY `idx_lido` (`lido`),
  KEY `idx_resolvido` (`resolvido`),
  KEY `idx_data_criacao` (`data_criacao`),
  CONSTRAINT `alertas_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE,
  CONSTRAINT `alertas_ibfk_2` FOREIGN KEY (`dispositivo_id`) REFERENCES `dispositivos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `alertas_ibfk_3` FOREIGN KEY (`regra_id`) REFERENCES `regras_alerta` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alertas`
--

LOCK TABLES `alertas` WRITE;
/*!40000 ALTER TABLE `alertas` DISABLE KEYS */;
INSERT INTO `alertas` VALUES (1,1,1,NULL,'qualidade_agua','warning','Alerta de Teste','Este é um alerta de teste criado pelo aplicativo mobile.',25.50,20.00,1,0,'2025-09-29 02:20:23',NULL),(2,1,1,NULL,'qualidade_agua','warning','Alerta de Teste','Este é um alerta de teste criado pelo aplicativo mobile.',25.50,20.00,1,0,'2025-09-29 02:40:06',NULL),(3,1,1,NULL,'qualidade_agua','warning','Alerta de Teste','Este é um alerta de teste criado pelo aplicativo mobile.',25.50,20.00,1,0,'2025-09-29 02:50:34',NULL),(4,1,1,NULL,'qualidade_agua','warning','Alerta de Teste','Este é um alerta de teste criado pelo aplicativo mobile.',25.50,20.00,1,0,'2025-09-29 02:51:09',NULL),(5,1,1,NULL,'qualidade_agua','warning','Alerta de Teste','Este é um alerta de teste criado pelo aplicativo mobile.',25.50,20.00,1,0,'2025-09-29 02:51:26',NULL);
/*!40000 ALTER TABLE `alertas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dispositivos`
--

DROP TABLE IF EXISTS `dispositivos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dispositivos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) DEFAULT NULL,
  `nome_dispositivo` varchar(100) DEFAULT NULL,
  `codigo_verificacao` varchar(20) NOT NULL,
  `localizacao` varchar(100) DEFAULT 'Não definido',
  `modo_alerta` varchar(15) NOT NULL DEFAULT 'personalizado',
  `data_criacao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo_verificacao_UNIQUE` (`codigo_verificacao`),
  KEY `fk_dispositivo_usuario_idx` (`usuario_id`),
  CONSTRAINT `fk_dispositivo_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dispositivos`
--

LOCK TABLES `dispositivos` WRITE;
/*!40000 ALTER TABLE `dispositivos` DISABLE KEYS */;
INSERT INTO `dispositivos` VALUES (1,1,'Aquality-01','ESP-AQUALITY-01','Agua','personalizado','2025-09-16 05:56:26');
/*!40000 ALTER TABLE `dispositivos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leitura`
--

DROP TABLE IF EXISTS `leitura`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leitura` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `dispositivo_id` int(11) NOT NULL,
  `data_hora` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `temperatura` decimal(5,2) DEFAULT NULL,
  `ph` decimal(4,2) DEFAULT NULL,
  `turbidez` decimal(5,2) DEFAULT NULL,
  `condutividade` decimal(7,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_leitura_dispositivo_idx` (`dispositivo_id`),
  CONSTRAINT `fk_leitura_dispositivo` FOREIGN KEY (`dispositivo_id`) REFERENCES `dispositivos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=168 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leitura`
--

LOCK TABLES `leitura` WRITE;
/*!40000 ALTER TABLE `leitura` DISABLE KEYS */;
INSERT INTO `leitura` VALUES (30,1,'2025-09-28 22:34:50',19.00,6.26,17.34,0.00),(31,1,'2025-09-28 22:35:54',19.00,6.14,17.34,0.00),(51,1,'2025-09-28 22:45:03',19.37,6.25,17.34,0.00),(52,1,'2025-09-28 22:46:09',19.44,6.09,17.34,0.00),(53,1,'2025-09-28 22:47:12',19.44,6.18,17.34,0.00),(54,1,'2025-09-28 22:48:15',19.50,6.02,17.92,0.00),(55,1,'2025-09-28 22:49:22',19.56,6.05,17.92,0.00),(59,1,'2025-09-28 22:52:30',20.56,6.59,17.34,0.00),(60,1,'2025-09-28 22:53:33',20.75,6.37,17.34,0.00),(61,1,'2025-09-28 22:54:36',20.94,6.41,17.92,0.00),(62,1,'2025-09-28 22:55:39',21.00,6.42,17.92,0.00),(63,1,'2025-09-28 22:56:41',21.12,6.26,17.92,0.00),(64,1,'2025-09-28 22:57:44',21.19,6.36,17.92,0.00),(65,1,'2025-09-28 22:58:47',21.19,6.29,17.92,0.00),(66,1,'2025-09-28 22:59:51',21.19,6.29,17.92,0.00),(67,1,'2025-09-28 23:00:54',21.19,6.35,17.92,0.00),(70,1,'2025-09-28 23:03:00',21.25,6.38,17.92,0.00),(71,1,'2025-09-28 23:04:04',21.25,6.37,17.92,0.00),(72,1,'2025-09-28 23:05:07',21.19,6.31,17.92,0.00),(73,1,'2025-09-28 23:06:10',21.19,6.14,18.50,0.00),(74,1,'2025-09-28 23:07:14',21.19,6.48,17.92,0.00),(75,1,'2025-09-28 23:08:19',21.19,6.31,17.92,0.00),(79,1,'2025-09-28 23:11:22',21.25,6.22,17.92,0.00),(83,1,'2025-09-28 23:13:32',21.25,6.18,18.50,0.00),(84,1,'2025-09-28 23:14:34',21.25,6.40,17.92,0.00),(85,1,'2025-09-28 23:15:37',21.31,6.30,17.92,0.00),(86,1,'2025-09-28 23:16:40',21.31,6.07,19.08,0.00),(87,1,'2025-09-28 23:17:43',21.31,6.40,18.50,0.00),(88,1,'2025-09-28 23:18:46',21.25,6.38,17.92,0.00),(89,1,'2025-09-28 23:19:48',21.31,6.41,17.92,0.00),(90,1,'2025-09-28 23:20:53',21.37,6.28,17.92,0.00),(93,1,'2025-09-28 23:22:59',21.37,6.27,18.50,0.00),(94,1,'2025-09-28 23:24:02',21.31,6.22,18.50,0.00),(95,1,'2025-09-28 23:25:05',21.31,6.23,17.92,0.00),(96,1,'2025-09-28 23:26:08',21.31,6.17,18.50,0.00),(97,1,'2025-09-28 23:27:11',21.25,6.18,17.92,0.00),(98,1,'2025-09-28 23:28:14',21.25,6.29,17.92,0.00),(99,1,'2025-09-28 23:29:20',21.25,6.32,17.92,0.00),(100,1,'2025-09-28 23:30:23',21.31,5.94,17.92,0.00),(105,1,'2025-09-28 23:33:35',21.31,6.07,17.92,0.00),(106,1,'2025-09-28 23:34:38',21.31,6.30,17.92,0.00),(107,1,'2025-09-28 23:35:41',21.37,6.17,17.92,0.00),(108,1,'2025-09-28 23:36:44',85.00,6.24,18.50,0.00),(109,1,'2025-09-28 23:37:47',21.37,6.30,17.92,0.00),(110,1,'2025-09-28 23:38:50',21.50,5.99,17.92,0.00),(111,1,'2025-09-28 23:39:53',21.50,6.25,17.92,0.00),(116,1,'2025-09-28 23:43:50',21.37,6.10,17.92,0.00),(117,1,'2025-09-28 23:45:54',21.44,6.53,17.92,0.00),(118,1,'2025-09-28 23:47:58',21.37,6.27,17.92,0.00),(119,1,'2025-09-28 23:49:21',21.37,6.18,17.92,0.00),(120,1,'2025-09-28 23:51:27',21.31,6.36,17.92,0.00),(121,1,'2025-09-28 23:53:35',21.31,6.00,18.50,0.00),(122,1,'2025-09-28 23:55:41',21.31,6.45,17.92,0.00),(123,1,'2025-09-28 23:57:47',21.25,6.23,17.92,0.00),(124,1,'2025-09-28 23:59:54',21.25,6.28,17.92,0.00),(125,1,'2025-09-29 00:01:30',21.25,6.31,17.92,0.00),(126,1,'2025-09-29 00:03:35',21.19,6.38,17.92,0.00),(127,1,'2025-09-29 00:05:39',21.19,6.51,17.92,0.00),(128,1,'2025-09-29 00:07:43',21.19,6.19,17.92,0.00),(129,1,'2025-09-29 00:09:47',21.25,6.15,17.92,0.00),(130,1,'2025-09-29 00:11:51',21.19,6.36,17.92,0.00),(131,1,'2025-09-29 00:13:55',21.19,6.39,17.92,0.00),(132,1,'2025-09-29 00:15:59',21.12,6.20,17.92,0.00),(133,1,'2025-09-29 00:17:51',21.12,6.17,17.92,0.00),(134,1,'2025-09-29 00:19:58',21.12,6.68,17.92,0.00),(135,1,'2025-09-29 00:21:09',21.06,5.96,17.92,0.00),(136,1,'2025-09-29 00:23:14',21.06,6.29,18.50,0.00),(137,1,'2025-09-29 00:25:18',21.00,6.23,17.92,0.00),(138,1,'2025-09-29 00:27:22',21.00,6.19,17.92,0.00),(139,1,'2025-09-29 00:29:26',21.00,6.39,18.50,0.00),(140,1,'2025-09-29 00:31:33',21.06,6.50,18.50,0.00),(141,1,'2025-09-29 00:33:41',21.00,6.31,17.92,0.00),(142,1,'2025-09-29 01:11:32',21.25,5.91,15.00,0.00),(143,1,'2025-09-29 01:12:34',21.25,5.66,15.00,0.00),(144,1,'2025-09-29 01:13:37',21.25,5.88,15.00,0.00),(145,1,'2025-09-29 01:14:41',21.25,5.98,15.00,0.00),(146,1,'2025-09-29 01:15:44',21.25,5.91,15.00,0.00),(147,1,'2025-09-29 01:16:46',21.25,5.93,15.00,0.00),(148,1,'2025-09-29 01:17:48',21.25,5.74,15.00,0.00),(149,1,'2025-09-29 01:18:53',21.25,6.02,15.00,0.00),(150,1,'2025-09-29 01:19:55',21.25,5.70,15.00,0.00),(151,1,'2025-09-29 01:20:57',21.25,5.79,16.00,0.00),(152,1,'2025-09-29 01:22:00',21.25,5.97,15.00,0.00),(153,1,'2025-09-29 01:23:02',21.25,5.60,15.00,3.79),(154,1,'2025-09-29 01:24:04',21.25,6.09,15.00,0.00),(155,1,'2025-09-29 01:25:07',21.25,5.95,15.00,0.00),(156,1,'2025-09-29 01:26:09',21.25,6.04,15.00,0.00),(157,1,'2025-09-29 01:27:11',21.25,6.00,15.00,0.00),(158,1,'2025-09-29 01:28:14',21.19,5.84,16.00,0.00),(159,1,'2025-09-29 01:29:16',21.19,5.64,15.00,0.00),(160,1,'2025-09-29 01:30:18',21.19,5.69,15.00,0.00),(161,1,'2025-09-29 01:31:21',21.25,5.72,15.00,0.00),(162,1,'2025-09-29 01:32:24',21.25,5.97,15.00,0.00),(163,1,'2025-09-29 01:33:26',21.25,5.64,16.00,0.00),(164,1,'2025-09-29 01:34:28',21.25,5.68,16.00,0.00),(165,1,'2025-09-29 01:35:30',21.25,5.69,15.00,0.00),(166,1,'2025-09-29 01:36:33',21.19,5.71,15.00,0.00),(167,1,'2025-09-29 01:37:35',21.19,6.06,16.00,0.00);
/*!40000 ALTER TABLE `leitura` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `regras_alerta`
--

DROP TABLE IF EXISTS `regras_alerta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `regras_alerta` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `regra_id` int(11) DEFAULT NULL,
  `dispositivo_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `parametro` varchar(20) NOT NULL COMMENT 'Ex: temperatura, ph, condutividade',
  `condicao` varchar(15) NOT NULL COMMENT 'Ex: maior_que, menor_que',
  `valor` decimal(10,2) NOT NULL,
  `data_criacao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_alerta_dispositivo_idx` (`dispositivo_id`),
  KEY `fk_alerta_usuario_idx` (`usuario_id`),
  KEY `idx_regras_usuario` (`usuario_id`),
  KEY `idx_regras_dispositivo` (`dispositivo_id`),
  KEY `idx_regras_parametro` (`parametro`),
  CONSTRAINT `fk_alerta_dispositivo` FOREIGN KEY (`dispositivo_id`) REFERENCES `dispositivos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_alerta_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `regras_alerta`
--

LOCK TABLES `regras_alerta` WRITE;
/*!40000 ALTER TABLE `regras_alerta` DISABLE KEYS */;
INSERT INTO `regras_alerta` VALUES (24,NULL,1,1,'temperatura','maior_que',30.00,'2025-09-26 01:57:42'),(25,NULL,1,1,'ph','menor_que',6.50,'2025-09-26 01:57:42'),(27,NULL,1,1,'condutividade','maior_que',1000.00,'2025-09-26 01:57:42');
/*!40000 ALTER TABLE `regras_alerta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario`
--

DROP TABLE IF EXISTS `usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(20) NOT NULL,
  `sobrenome` varchar(50) NOT NULL,
  `email` varchar(80) NOT NULL,
  `senha` varchar(255) NOT NULL,
  `foto_perfil` varchar(500) DEFAULT NULL COMMENT 'URL da foto de perfil do usuário',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_usuario_foto` (`foto_perfil`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario`
--

LOCK TABLES `usuario` WRITE;
/*!40000 ALTER TABLE `usuario` DISABLE KEYS */;
INSERT INTO `usuario` VALUES (1,'Rodinei','Almirante Silva','aquality@tcc.com','$2y$10$qpBA.TchlAMJciiR73m4jOaVD3.ZvTUB5Xuqr4uVyFEQUb9ylu/MG',NULL),(2,'Carlos','Ronaldo','carlinhos@tcc.com','$2y$10$JqX21ITALDPnCMa6ge96t.c3j/mb3oBksDruH2pzkU3q61c3676t.',NULL),(3,'Serginho','Ramos','sergioramos0800@gmail.com','$2y$10$eHfOcUQeJZERkSZuJGQQR.yCPEu2Jg8q6D6Zt3H0lw56gPLVtVr1m',NULL),(4,'Fellipe','Conradi Pires','fellipe.pires@etec.sp.gov.br','$2y$10$Lko.FVTTlIE2leefoO1Za.M0XYT48tpXz6KnDvUWTiZJ5mnQw3oUu',NULL),(5,'Teste','API','teste.api@aquality.com','$2y$10$8MQAZ9BqiVNefA9b3x7Qf.UXl/LQZedsHQ50tImPdgVUufF2Z5Rr.',NULL),(6,'Teste','Mobile','teste1758252827162@aquality.com','$2y$10$TFSorlWc7UnJvFfgTDe1a.BdbhIcmEAj7sv8WPjw1odcT1OBgSSu6',NULL),(7,'Marcio','Matador','marcinhovp@gmail.com','$2y$10$fvdNuWJQ6BfxcDW5CgZDQOzLRJIF34QRPY7PLDJ/yYGfzw1preBLi',NULL),(8,'Teste','Mobile','teste1758253742002@aquality.com','$2y$10$I7UjweKLbQQH0SGdkkZFL.4oqcoqxLuSbnZeHMpxSi2KvPzG5cbA.',NULL),(9,'ALEXSANDRA','MARIS','alexsandra.maris1@gmail.com','$2y$10$b7/us3OkHnzn/nnAEFKIYuvHrWOEC4xfp9r9oCdOwOm9F2v2PVrCy',NULL),(13,'Teste','Mobile','teste1758489177517@aquality.com','$2y$10$Knrq4c7wgNSopOaQ5ktHkO/Mie8pEj49Y1mP7mlwFuRImTaxZRkUS',NULL),(14,'claudinho','dopneu','claudinho@pneu.com','$2y$10$OA7U/nDuyd6BLYyKw73Cr.vfu3aI2MP8hQHdum4mWHewGdPME7ze.',NULL),(17,'Henzo','dos Santos Silva','henzodossantos7@gmail.com','$2y$10$NvTwB74GgVFxO6MTail2xeXI0d2UwbKsLFe7EzaDRUaTza.FHfVWu',NULL);
/*!40000 ALTER TABLE `usuario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'aquality_db'
--

--
-- Dumping routines for database 'aquality_db'
--
/*!50003 DROP PROCEDURE IF EXISTS `PopularTabelaLeitura` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE DEFINER=`aquality_db`@`%` PROCEDURE `PopularTabelaLeitura`(IN quantidade_registros INT)
BEGIN
    -- Variável para controlar o loop
    DECLARE i INT DEFAULT 0;
    
    -- Variáveis para armazenar os dados de cada linha
    DECLARE v_data_hora DATETIME;
    DECLARE v_temperatura DECIMAL(5,2);
    DECLARE v_ph DECIMAL(4,2);
    DECLARE v_turbidez DECIMAL(5,2);
    DECLARE v_condutividade DECIMAL(6,2);

    -- Loop para criar a quantidade de registros especificada
    WHILE i < quantidade_registros DO
        -- Gera dados aleatórios para cada coluna
        -- Os dados são gerados de forma decrescente a partir da data/hora atual para simular um histórico
        SET v_data_hora = NOW() - INTERVAL FLOOR(RAND() * 43200) MINUTE; -- Dados aleatórios nos últimos 30 dias
        SET v_temperatura = ROUND(18.00 + RAND() * 14, 2);  -- Temperatura entre 18.00 e 32.00 ºC
        SET v_ph = ROUND(6.5 + RAND() * 2, 2);           -- pH entre 6.5 e 8.5
        SET v_turbidez = ROUND(0.5 + RAND() * 50, 2);        -- Turbidez entre 0.5 e 50.5 NTU
        SET v_condutividade = ROUND(100 + RAND() * 1400, 2); -- Condutividade entre 100 e 1500 µS/cm

        -- Insere a linha com os dados gerados na tabela 'leitura'
        INSERT INTO leitura (dispositivo_id, data_hora, temperatura, ph, turbidez, condutividade)
        VALUES (1, v_data_hora, v_temperatura, v_ph, v_turbidez, v_condutividade);

        -- Incrementa o contador do loop
        SET i = i + 1;
    END WHILE;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-09-29  1:55:51
