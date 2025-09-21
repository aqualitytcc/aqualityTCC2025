// Ficheiro: js/dashboard.js

// Variáveis globais para guardar o estado dos gráficos e dispositivos
let activeCharts = [];
let allDevices = [];
let currentViewingDeviceId = null; 

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
                        
                        <button class="btn btn-sm btn-secondary ms-2" onclick='openDeviceSettings(${device.id})'>Configurar</button>
                        
                        <button class="btn btn-sm btn-danger ms-2" onclick='removeDevice(${device.id})'>Remover</button>
                    </div>
                </div>
            </div>`;
            deviceList.innerHTML += deviceCardHTML;
        });
    }
}
async function logout() {
    try {
        const response = await fetch('api/usuarios/logout.php', {
            method: 'POST' // Usar POST por boas práticas, mesmo sem enviar dados.
        });

        const resultado = await response.json();

        if (resultado.status === 'sucesso') {
            // Limpa o nome do utilizador guardado no navegador
            localStorage.removeItem('usuario_nome');

            alert(resultado.mensagem);

            // Redireciona para a página inicial
            window.location.href = 'index.html';
        } else {
            alert('Erro ao tentar fazer logout.');
        }

    } catch (error) {
        console.error('Erro no logout:', error);
    }
}
// Função para ABRIR o modal de configurações com os dados do dispositivo
function openDeviceSettings(deviceId) {
    // Encontra o dispositivo na nossa lista 'allDevices'
    const device = allDevices.find(d => d.id === deviceId);
    if (!device) {
        console.error("Dispositivo não encontrado!");
        return;
    }

    // Preenche os campos do modal com as informações atuais
    document.getElementById('editDeviceId').value = device.id;
    document.getElementById('editDeviceName').value = device.nome;
    document.getElementById('editDeviceLocation').value = device.localizacao;

    // Abre o modal
    const modal = new bootstrap.Modal(document.getElementById('deviceSettingsModal'));
    modal.show();
}

// Função para SALVAR as alterações enviando-as para a API
async function saveDeviceSettings() {
    // Pega os dados atualizados do formulário do modal
    const dispositivoId = document.getElementById('editDeviceId').value;
    const nomeDispositivo = document.getElementById('editDeviceName').value;
    const localizacao = document.getElementById('editDeviceLocation').value;

    if (!nomeDispositivo) {
        alert("O nome do dispositivo não pode ficar em branco.");
        return;
    }

    const dadosAtualizados = {
        dispositivo_id: dispositivoId,
        nome_dispositivo: nomeDispositivo,
        localizacao: localizacao
    };

    try {
        const response = await fetch('api/dispositivos/atualizar.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosAtualizados)
        });

        const resultado = await response.json();

        if (resultado.status === 'sucesso') {
            alert(resultado.mensagem);

            // Fecha o modal
            const modalEl = document.getElementById('deviceSettingsModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();

            // Atualiza a lista de dispositivos na página para refletir as alterações
            fetchDevices();
        } else {
            alert('Erro: ' + resultado.mensagem);
        }
    } catch (error) {
        console.error('Erro ao salvar configurações:', error);
        alert('Ocorreu um erro na comunicação com o servidor.');
    }
}
// Busca as leituras de um dispositivo e exibe os gráficos
async function showDeviceReadings(deviceId, deviceName, dataInicio = null, dataFim = null) {
    // Guarda o ID do dispositivo que estamos a ver
    currentViewingDeviceId = deviceId;
    
    try {
        // Constrói a URL da API, adicionando os filtros de data se eles existirem
        let apiUrl = `api/leituras/buscar.php?dispositivo_id=${deviceId}`;
        if (dataInicio) {
            apiUrl += `&data_inicio=${dataInicio}`;
        }
        if (dataFim) {
            apiUrl += `&data_fim=${dataFim}`;
        }

        const response = await fetch(apiUrl);
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
        
        activeCharts.forEach(chart => chart.destroy());
        activeCharts = [];

        // Prepara os dados para os gráficos
        const labels = leituras.map(l => new Date(l.data_hora.replace(' ', 'T')).toLocaleString('pt-BR'));
        const tempData = leituras.map(l => l.temperatura);
        const phData = leituras.map(l => l.ph);
        const condData = leituras.map(l => l.condutividade);
        
        activeCharts.push(initializeChart('temperatureChart', 'Temperatura', labels, tempData, 'rgb(75, 192, 192)'));
        activeCharts.push(initializeChart('phChart', 'pH', labels, phData, 'rgb(255, 159, 64)'));
        activeCharts.push(initializeChart('tdsChart', 'Condutividade (ppm)', labels, condData, 'rgb(153, 102, 255)'));

    } catch (error) {
        console.error('Erro ao buscar leituras:', error);
    }
}

// ADICIONE ESTA NOVA FUNÇÃO
function applyDateFilter() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    if (!currentViewingDeviceId) {
        alert("Por favor, selecione um dispositivo primeiro.");
        return;
    }
    
    const currentDevice = allDevices.find(d => d.id === currentViewingDeviceId);
    // Re-chama a função showDeviceReadings com as novas datas
    showDeviceReadings(currentDevice.id, currentDevice.nome, startDate, endDate);
}

// ADICIONE ESTA NOVA FUNÇÃO
function clearDateFilter() {
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    
    if (!currentViewingDeviceId) {
        alert("Por favor, selecione um dispositivo primeiro.");
        return;
    }

    const currentDevice = allDevices.find(d => d.id === currentViewingDeviceId);
    // Re-chama a função sem as datas para limpar o filtro
    showDeviceReadings(currentDevice.id, currentDevice.nome);
}
// Função para ABRIR o modal de configurações do perfil
function openProfileSettings() {
    // No futuro, podemos pré-preencher estes campos com dados da API
    document.getElementById('editProfileName').value = '';
    document.getElementById('editProfileSobrenome').value = '';
    document.getElementById('editProfileOldPassword').value = '';
    document.getElementById('editProfileNewPassword').value = '';

    const modal = new bootstrap.Modal(document.getElementById('profileSettingsModal'));
    modal.show();
}

// Função para SALVAR as alterações do perfil
async function saveProfileSettings() {
    const nome = document.getElementById('editProfileName').value;
    const sobrenome = document.getElementById('editProfileSobrenome').value;
    const senha_antiga = document.getElementById('editProfileOldPassword').value;
    const nova_senha = document.getElementById('editProfileNewPassword').value;

    if (!nome || !sobrenome) {
        alert("Nome e Sobrenome são obrigatórios.");
        return;
    }

    const dadosPerfil = {
        nome: nome,
        sobrenome: sobrenome,
        senha_antiga: senha_antiga,
        nova_senha: nova_senha
    };

    try {
        const response = await fetch('api/usuarios/atualizar_perfil.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosPerfil)
        });

        const resultado = await response.json();

        if (resultado.status === 'sucesso') {
            alert(resultado.mensagem);

            // Atualiza o nome do utilizador no ecrã
            document.getElementById('nome-usuario').textContent = nome;
            localStorage.setItem('usuario_nome', nome);

            // Fecha o modal
            const modalEl = document.getElementById('profileSettingsModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();
        } else {
            alert('Erro: ' + resultado.mensagem);
        }
    } catch (error) {
        console.error('Erro ao salvar perfil:', error);
        alert('Ocorreu um erro na comunicação com o servidor.');
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
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', function (event) {
            event.preventDefault(); // Impede que o link '#' faça a página saltar
            logout();
        });
    }
    // Inicializa o dashboard assim que a página estiver pronta
    inicializarDashboard();
});