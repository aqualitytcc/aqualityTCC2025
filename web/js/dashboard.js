// Ficheiro: js/dashboard.js

// Variáveis globais para guardar o estado dos gráficos e dispositivos
let activeCharts = [];
let allDevices = [];

// Função principal que é chamada quando a página carrega
async function inicializarDashboard() {
    // Busca o nome do usuário que foi guardado no localStorage
    const nomeUsuario = localStorage.getItem('usuario_nome');
    if (nomeUsuario) {
        document.getElementById('nome-usuario').textContent = nomeUsuario;
    } else {
        // Se não encontrar o nome, volta para a página de login por segurança
        alert("Sessão não encontrada. Por favor, faça login novamente.");
        window.location.href = 'index.html';
        return; // Para a execução do script
    }

    // Depois de confirmar o usuário, busca os dispositivos dele
    await fetchDevices();
}

// Função para buscar os dispositivos do usuário na API
async function fetchDevices() {
    try {
        const response = await fetch('api/dispositivos/listar.php');
        const resultado = await response.json();
        
        if (resultado.status === 'erro') {
            alert(resultado.mensagem);
            window.location.href = 'index.html';
            return;
        }

        // AGORA USA O CAMPO 'nome_dispositivo' REAL VINDO DO BANCO DE DADOS
        allDevices = resultado.dados.map(d => ({
            id: d.id,
            nome: d.nome_dispositivo, // <-- MUDANÇA AQUI
            localizacao: d.localizacao,
            readings: { temperature: 'N/A', ph: 'N/A', tds: 'N/A' },
            status: 'Offline'
        }));
        
        renderAllDevices();
        updateSummary();

    } catch (error) {
        console.error('Erro ao buscar dispositivos:', error);
    }
}
// Função para associar um novo dispositivo (VERSÃO ATUALIZADA)
async function addDevice() {
    // AGORA LÊ OS TRÊS CAMPOS DO FORMULÁRIO
    const nomeDispositivo = document.getElementById('deviceName').value;
    const localizacao = document.getElementById('deviceLocation').value;
    const codigoVerificacao = document.getElementById('deviceIdentifier').value;

    if (!nomeDispositivo || !codigoVerificacao) {
        alert("Por favor, preencha o Nome do Dispositivo e o Identificador Único.");
        return;
    }

    const dadosDispositivo = {
        nome_dispositivo: nomeDispositivo,
        localizacao: localizacao,
        codigo_verificacao: codigoVerificacao
    };

    try {
        const response = await fetch('api/dispositivos/criar.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosDispositivo)
        });

        const resultado = await response.json();

        if (resultado.status === 'sucesso') {
            alert(resultado.mensagem);
            document.querySelector('#addDeviceModal form').reset();
            const modalEl = document.getElementById('addDeviceModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();
            fetchDevices(); // Atualiza a lista na tela
        } else {
            alert('Erro: ' + resultado.mensagem);
        }

    } catch (error) {
        console.error('Erro ao adicionar dispositivo:', error);
        alert('Ocorreu um erro na comunicação com o servidor.');
    }
}
async function removeDevice(deviceId) {
    // Pede confirmação ao utilizador antes de apagar
    if (!confirm("Tem a certeza de que deseja remover este dispositivo? Esta ação é irreversível.")) {
        return;
    }

    try {
        const response = await fetch('api/dispositivos/remover.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ dispositivo_id: deviceId })
        });

        const resultado = await response.json();

        if (resultado.status === 'sucesso') {
            alert(resultado.mensagem);
            fetchDevices(); // Atualiza a lista de dispositivos na página
        } else {
            alert('Erro: ' + resultado.mensagem);
        }

    } catch (error) {
        console.error('Erro ao remover dispositivo:', error);
        alert('Ocorreu um erro na comunicação com o servidor.');
    }
}
// Atualiza os cartões de resumo no topo do dashboard
function updateSummary() {
    document.getElementById('total-devices-value').innerText = allDevices.length;
    // Lógicas de online/alerta podem ser implementadas no futuro
    document.getElementById('online-devices-value').innerText = '0';
    document.getElementById('alerts-value').innerText = '0';
}

// Controla a exibição das secções (Home, Dispositivos, Leituras)
function showSection(sectionId, element) {
    document.querySelectorAll('.content-section').forEach(section => section.style.display = 'none');
    document.getElementById(sectionId).style.display = 'block';
    document.querySelectorAll('#sidebar-menu .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    element.classList.add('active');
}

// Desenha os cartões de dispositivos na página
function renderAllDevices() {
    const deviceList = document.getElementById('device-list');
    deviceList.innerHTML = '';
    if (allDevices.length === 0) {
        document.getElementById('no-devices-message').style.display = 'block';
    } else {
        document.getElementById('no-devices-message').style.display = 'none';
        allDevices.forEach(device => {
            const deviceCardHTML = `
            <div class="col-md-6 col-lg-4">
                <div class="card device-card">
                    <div class="card-body">
                        <h5 class="card-title">${device.nome}</h5>
                        <h6 class="card-subtitle mb-2 text-muted">${device.localizacao}</h6>
                        <hr>
                        <button class="btn btn-sm btn-primary" onclick='showDeviceReadings(${device.id}, "${device.nome}")'>Ver Leituras</button>
                        
                        <button class="btn btn-sm btn-danger ms-2" onclick='removeDevice(${device.id})'>Remover</button>
                    </div>
                </div>
            </div>`;
            deviceList.innerHTML += deviceCardHTML;
        });
    }
}

// Busca as leituras de um dispositivo e exibe os gráficos
async function showDeviceReadings(deviceId, deviceName) {
    try {
        const response = await fetch(`api/leituras/buscar.php?dispositivo_id=${deviceId}`);
        const leituras = await response.json();

        if (leituras.status === 'erro') {
            alert(leituras.mensagem);
            return;
        }

        const readingsMenuLink = document.querySelector('a[onclick*="leituras-section"]');
        showSection('leituras-section', readingsMenuLink);
        document.getElementById('readings-title').innerText = `Leituras de: ${deviceName}`;

        const chartsContainer = document.getElementById('charts-container');
        chartsContainer.innerHTML = buildChartCardHTML('temperatureChart', 'Temperatura') + buildChartCardHTML('phChart', 'pH') + buildChartCardHTML('tdsChart', 'Condutividade');

        // Destrói gráficos antigos para não sobrecarregar a memória
        activeCharts.forEach(chart => chart.destroy());
        activeCharts = [];

        // Prepara os dados para os gráficos
        const labels = leituras.map(l => new Date(l.data_hora.replace(' ', 'T')).toLocaleTimeString('pt-BR'));
        const tempData = leituras.map(l => l.temperatura);
        const phData = leituras.map(l => l.ph);
        const condData = leituras.map(l => l.condutividade);

        // Inicializa os gráficos com os dados reais
        activeCharts.push(initializeChart('temperatureChart', 'Temperatura', labels, tempData, 'rgb(75, 192, 192)'));
        activeCharts.push(initializeChart('phChart', 'pH', labels, phData, 'rgb(255, 159, 64)'));
        activeCharts.push(initializeChart('tdsChart', 'Condutividade (ppm)', labels, condData, 'rgb(153, 102, 255)'));

    } catch (error) {
        console.error('Erro ao buscar leituras:', error);
    }
}

// Função auxiliar para criar o HTML de um cartão de gráfico
function buildChartCardHTML(canvasId, label) {
    return `<div class="col-md-12 mb-4"><div class="card"><div class="card-header">${label}</div><div class="card-body"><canvas id="${canvasId}"></canvas></div></div></div>`;
}

// Função auxiliar para inicializar um novo gráfico com Chart.js
function initializeChart(canvasId, label, chartLabels, chartData, color) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartLabels,
            datasets: [{
                label: label,
                data: chartData,
                borderColor: color,
                backgroundColor: color.replace('rgb', 'rgba').replace(')', ', 0.1)'),
                tension: 0.1,
                fill: true
            }]
        }
    });
}

// --- Lógica do Modo Escuro e Inicialização ---
document.addEventListener('DOMContentLoaded', () => {
    const darkModeSwitch = document.getElementById('darkModeSwitch');
    if (darkModeSwitch) {
        darkModeSwitch.addEventListener('change', () => {
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
        });
    }

    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        if (darkModeSwitch) {
            darkModeSwitch.checked = true;
        }
    }

    // Inicializa o dashboard assim que a página estiver pronta
    inicializarDashboard();
});