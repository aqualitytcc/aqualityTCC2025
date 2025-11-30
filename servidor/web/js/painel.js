// Ficheiro: js/painel.js (VERSÃO ATUALIZADA E MAIS LIMPA)
/**
 * Mostra uma notificação toast no canto do ecrã.
 * @param {string} message A mensagem a ser exibida.
 * @param {string} type O tipo de toast: 'success' (verde) ou 'error' (vermelho).
 */
function showToast(message, type = 'success') {
    const toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) return;

    const toastId = 'toast-' + Math.random().toString(36).substr(2, 9);
    const bgClass = type === 'success' ? 'bg-success' : 'bg-danger';
    const toastHTML = `
        <div id="${toastId}" class="toast text-white ${bgClass}" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header text-white ${bgClass}">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'} me-2"></i>
                <strong class="me-auto">${type === 'success' ? 'Sucesso' : 'Erro'}</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;

    toastContainer.insertAdjacentHTML('beforeend', toastHTML);

    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { delay: 5000 }); // Desaparece em 5 segundos

    // Importante: Remover o elemento do DOM depois de escondido
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });

    toast.show();
}
// Variáveis globais
let activeCharts = {}; // Usar um objeto para gerir os gráficos por nome
let allDevices = [];
let currentViewingDeviceId = null;
let notifiedAlerts = new Set();
let dadosGraficoPrincipal = null;

// Função principal chamada quando o DOM está pronto
document.addEventListener('DOMContentLoaded', () => {
    inicializarpainel();
    setupEventListeners();
});

async function inicializarpainel() {
    const nomeUsuario = localStorage.getItem('usuario_nome');
    if (nomeUsuario) {
        document.getElementById('nome-usuario').textContent = nomeUsuario;
        // Se houver mais locais a exibir o nome, atualize aqui também
        const nomeDisplayNavbar = document.getElementById('usuarioNomeDisplay');
        if (nomeDisplayNavbar) nomeDisplayNavbar.textContent = nomeUsuario;
    } else {
        showToast("Sessão não encontrada. Por favor, faça login novamente.", 'error');
        window.location.href = 'index.html';
        return;
    }

    await fetchDevices();

    verificarAlertas(); // Faz uma verificação imediata ao carregar a página
    setInterval(atualizarDadospainel, 61000); // E depois repete a cada 30 segundos
}

function setupEventListeners() {
    // Evento para o botão de logout
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }

    // Evento para alternar a sidebar
    const menuToggle = document.getElementById('menu-toggle');
    const wrapper = document.getElementById('wrapper');
    if (menuToggle && wrapper) {
        menuToggle.onclick = () => {
            wrapper.classList.toggle("toggled");
        };
    }

    // Lógica do Modo Escuro
    const darkModeSwitch = document.getElementById('darkModeSwitch');
    if (darkModeSwitch) {
        if (localStorage.getItem('darkMode') === 'true') {
            document.body.classList.add('dark-mode');
            darkModeSwitch.checked = true;
        }
        darkModeSwitch.addEventListener('change', () => {
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
        });
    }
    const controlesGrafico = document.getElementById('grafico-principal-controles');
    if (controlesGrafico) {
        controlesGrafico.addEventListener('click', (event) => {
            // Verifica se o que foi clicado foi realmente um botão
            if (event.target.tagName === 'BUTTON') {
                const parametro = event.target.dataset.param; // Pega o valor de 'data-param'
                if (parametro) {
                    mudarGraficoPrincipal(parametro);
                }
            }
        });
    }
}

async function fetchDevices() {
    try {
        const response = await fetch('api/dispositivos/listar.php');
        const resultado = await response.json();



        if (resultado.status === 'erro') {
            showToast(resultado.mensagem, 'error');
            window.location.href = 'index.html';
            return;
        }

        allDevices = resultado.dados.map(d => ({
            id: d.id,
            nome: d.nome_dispositivo,
            localizacao: d.localizacao || 'Não definida', // Garante que não é nulo
            modo_alerta: d.modo_alerta,
            ultima_leitura: d.ultima_leitura
        }));

        renderAllDevices();
        updateSummary();
        criarGraficoPrincipal(); // Atualiza o gráfico de resumo

    } catch (error) {
        console.error('Erro ao buscar dispositivos:', error);
    }
}
function atualizarPainelStatusRapido(dados) {
    const painel = document.getElementById('status-rapido-painel');
    if (!painel) return;

    painel.innerHTML = ''; // Limpa o painel

    const leituras = dados.leituras;
    const notificacoes = dados.notificacoes;

    // Se não houver leituras, exibe a mensagem padrão
    if (Object.keys(leituras).length === 0) {
        painel.innerHTML = '<p class="text-muted col-12">Nenhuma leitura recente encontrada.</p>';
        return;
    }

    // Pega a leitura do primeiro (e principal) dispositivo
    const dispositivoId = Object.keys(leituras)[0];
    const leitura = leituras[dispositivoId];

    // Mapeamento de parâmetros para ícones, unidades e cores
    const parametrosConfig = {
        ph: { label: 'pH', icon: 'fas fa-vial', unit: '' },
        temperatura: { label: 'Temperatura', icon: 'fas fa-thermometer-half', unit: '°C' },
        condutividade: { label: 'Condutividade', icon: 'fas fa-bolt', unit: 'ppm' },
        turbidez: { label: 'Turbidez', icon: 'fas fa-smog', unit: '%' }
    };

    // Gera um card para cada parâmetro
    for (const param in parametrosConfig) {
        if (leitura[param] !== null && leitura[param] !== undefined) {
            const config = parametrosConfig[param];
            const valor = leitura[param];

            // Verifica se este parâmetro está em alerta
            const emAlerta = notificacoes.some(notif => notif.toLowerCase().includes(param));
            const valorClass = emAlerta ? 'value in-alert' : 'value';

            const cardHtml = `
                <div class="col-12 col-sm-6">
                    <div class="quick-status-item">
                        <div class="icon ${emAlerta ? 'text-danger' : 'primary-text'}">
                            <i class="${config.icon}"></i>
                        </div>
                        <div class="info">
                            <p class="label">${config.label}</p>
                            <p class="${valorClass}">${valor} ${config.unit}</p>
                        </div>
                    </div>
                </div>
            `;
            painel.innerHTML += cardHtml;
        }
    }
}
// VERSÃO SEGURA - PODE SUBSTITUIR A SUA FUNÇÃO INTEIRA
function renderAllDevices() {
    const deviceList = document.getElementById('device-list');
    const noDevicesMessage = document.getElementById('no-devices-message');
    deviceList.innerHTML = ''; // Limpa a lista

    if (allDevices.length === 0) {
        if (noDevicesMessage) noDevicesMessage.style.display = 'block';
        return; // Sai da função mais cedo
    }

    if (noDevicesMessage) noDevicesMessage.style.display = 'none';

    allDevices.forEach(device => {
        // --- Criação segura dos elementos ---
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4';

        const card = document.createElement('div');
        card.className = 'content-card device-card h-100';

        const DEZ_MINUTOS_MS = 10 * 60 * 1000;
        const agora = new Date();
        if (device.ultima_leitura) {
            const ultimaLeituraDate = new Date(device.ultima_leitura.replace(' ', 'T'));
            if ((agora - ultimaLeituraDate) < DEZ_MINUTOS_MS) {
                card.style.borderLeftColor = '#198754'; // Verde para online
            }
        }

        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';

        const title = document.createElement('h5');
        title.className = 'card-title';
        title.textContent = device.nome; // Usa .textContent (SEGURO)

        const subtitle = document.createElement('h6');
        subtitle.className = 'card-subtitle mb-2 text-muted';
        subtitle.textContent = device.localizacao; // Usa .textContent (SEGURO)

        const hr = document.createElement('hr');

        const btnReadings = document.createElement('button');
        btnReadings.className = 'btn-custom btn-custom-primary';
        btnReadings.textContent = 'Ver Leituras';
        btnReadings.onclick = () => showDeviceReadings(device.id, device.nome);

        const btnSettings = document.createElement('button');
        btnSettings.className = 'btn-custom btn-custom-secondary';
        btnSettings.textContent = 'Configurar';
        btnSettings.onclick = () => openDeviceSettings(device.id);

        const btnRemove = document.createElement('button');
        btnRemove.className = 'btn-custom btn-custom-danger';
        btnRemove.textContent = 'Remover';
        btnRemove.onclick = () => removeDevice(device.id);

        // Monta a estrutura
        cardBody.appendChild(title);
        cardBody.appendChild(subtitle);
        cardBody.appendChild(hr);

        // 1. Cria um contentor para os botões
        const actionsWrapper = document.createElement('div');
        actionsWrapper.className = 'device-card-actions';

        // 2. Adiciona os botões DENTRO do novo contentor
        actionsWrapper.appendChild(btnReadings);
        actionsWrapper.appendChild(btnSettings);
        actionsWrapper.appendChild(btnRemove);

        // 3. Adiciona o contentor de botões ao corpo do cartão
        cardBody.appendChild(actionsWrapper);

        card.appendChild(cardBody);
        col.appendChild(card);
        deviceList.appendChild(col);
    });
}

async function atualizarDadospainel() {
    console.log("A atualizar dados do painel...", new Date().toLocaleTimeString());
    await fetchDevices(); // Esta função já atualiza a lista, o resumo e o gráfico principal
    await verificarAlertas(); // Esta função atualiza os alertas e o painel de status
}

function updateSummary() {
    document.getElementById('total-devices-value').textContent = allDevices.length;

    // Lógica para contar dispositivos online
    const DEZ_MINUTOS_MS = 10 * 60 * 1000;
    const agora = new Date();

    const onlineCount = allDevices.filter(device => {
        if (!device.ultima_leitura) return false;
        const ultimaLeituraDate = new Date(device.ultima_leitura.replace(' ', 'T'));
        return (agora - ultimaLeituraDate) < DEZ_MINUTOS_MS;
    }).length;

    document.getElementById('online-devices-value').textContent = onlineCount;

    // O cartão de alertas será atualizado pela função verificarAlertas()
}


async function showDeviceReadings(deviceId, deviceName, dataInicio = null, dataFim = null) {
    currentViewingDeviceId = deviceId;

    try {
        let apiUrl = `api/leituras/buscar.php?dispositivo_id=${deviceId}`;
        if (dataInicio) apiUrl += `&data_inicio=${dataInicio}`;
        if (dataFim) apiUrl += `&data_fim=${dataFim}`;

        const response = await fetch(apiUrl);
        const leituras = await response.json();

        if (leituras.status === 'erro') {
            showToast(leituras.mensagem, 'error');
            return;
        }

        const readingsMenuLink = document.querySelector('a[onclick*="leituras-section"]');
        showSection('leituras-section', readingsMenuLink);
        document.getElementById('readings-title').innerText = `Leituras de: ${deviceName}`;

        const chartsContainer = document.getElementById('charts-container');

        // --- MUDANÇA PRINCIPAL AQUI ---
        // Agora, cada gráfico fica num cartão que ocupa a linha inteira, para melhor visualização.
        chartsContainer.innerHTML = `
            <div class="col-md-12 mb-4">
                <div class="content-card">
                    <div class="card-body">
                        <h5 class="card-title">Temperatura (°C)</h5>
                        <div style="height: 300px;"><canvas id="temperatureChart"></canvas></div>
                    </div>
                </div>
            </div>
            <div class="col-md-12 mb-4">
                <div class="content-card">
                    <div class="card-body">
                        <h5 class="card-title">pH</h5>
                        <div style="height: 300px;"><canvas id="phChart"></canvas></div>
                    </div>
                </div>
            </div>
            <div class="col-md-12 mb-4">
                <div class="content-card">
                    <div class="card-body">
                        <h5 class="card-title">Condutividade (ppm)</h5>
                        <div style="height: 300px;"><canvas id="tdsChart"></canvas></div>
                    </div>
                </div>
            </div>
            <div class="col-md-12 mb-4">
                <div class="content-card">
                    <div class="card-body">
                        <h5 class="card-title">Turbidez (%)</h5>
                        <div style="height: 300px;"><canvas id="turbidityChart"></canvas></div>
                    </div>
                </div>
            </div>
        `;

        // Destroi gráficos antigos antes de criar novos
        Object.values(activeCharts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });

        const labels = leituras.dados.map(l => new Date(l.data_hora.replace(' ', 'T')).toLocaleString('pt-BR'));

        activeCharts['temp'] = initializeChart('temperatureChart', 'Temperatura (°C)', labels, leituras.dados.map(l => l.temperatura), 'rgb(75, 192, 192)');
        activeCharts['ph'] = initializeChart('phChart', 'pH', labels, leituras.dados.map(l => l.ph), 'rgb(255, 159, 64)');
        activeCharts['tds'] = initializeChart('tdsChart', 'Condutividade (ppm)', labels, leituras.dados.map(l => l.condutividade), 'rgb(153, 102, 255)');
        activeCharts['turbidez'] = initializeChart('turbidityChart', 'Turbidez (%)', labels, leituras.dados.map(l => l.turbidez), 'rgb(255, 99, 132)');

    } catch (error) {
        console.error('Erro ao buscar leituras:', error);
    }
}

// Funções para os filtros de data
function applyDateFilter() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    if (!currentViewingDeviceId) return;
    const currentDevice = allDevices.find(d => d.id === currentViewingDeviceId);
    showDeviceReadings(currentDevice.id, currentDevice.nome, startDate, endDate);
}

function clearDateFilter() {
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    if (!currentViewingDeviceId) return;
    const currentDevice = allDevices.find(d => d.id === currentViewingDeviceId);
    showDeviceReadings(currentDevice.id, currentDevice.nome);
}

// O resto das suas funções (addDevice, removeDevice, openDeviceSettings, saveDeviceSettings, deleteAccount, logout, openProfileSettings, saveProfileSettings, etc.) continuam aqui, sem alterações.
// Colei as funções restantes abaixo para garantir que o ficheiro fica completo.

async function addDevice() {
    const nomeDispositivo = document.getElementById('deviceName').value;
    const localizacao = document.getElementById('deviceLocation').value;
    const codigoVerificacao = document.getElementById('deviceIdentifier').value;

    if (!nomeDispositivo || !codigoVerificacao) {
        showToast("Por favor, preencha o Nome do Dispositivo e o Identificador Único.", 'error');
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
            showToast(resultado.mensagem);
            document.querySelector('#addDeviceModal form').reset();
            bootstrap.Modal.getInstance(document.getElementById('addDeviceModal')).hide();
            fetchDevices();
        } else {
            showToast(resultado.mensagem, 'error');
        }
    } catch (error) {
        console.error('Erro ao adicionar dispositivo:', error);
    }
}

// Função removeDevice ATUALIZADA
async function removeDevice(deviceId) {
    const confirmationModal = new bootstrap.Modal(document.getElementById('confirmationModal'));
    const modalBody = document.getElementById('confirmationModalBody');
    const confirmButton = document.getElementById('confirmButton');

    modalBody.textContent = "Tem a certeza de que deseja remover este dispositivo? Esta ação não pode ser desfeita.";

    // A mágica está aqui: definimos o que o botão de confirmar fará
    const handleConfirm = async () => {
        try {
            const response = await fetch('api/dispositivos/remover.php', {
                method: 'POST', // Sugestão: Mudar para DELETE na API também
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dispositivo_id: deviceId })
            });
            const resultado = await response.json();
            if (resultado.status === 'sucesso') {
                showToast(resultado.mensagem, 'success');
                fetchDevices();
            } else {
                showToast(resultado.mensagem, 'error');
            }
        } catch (error) {
            console.error('Erro ao remover dispositivo:', error);
            showToast('Falha na comunicação com o servidor.', 'error');
        } finally {
            confirmationModal.hide(); // Esconde o modal independentemente do resultado
        }
    };

    // Adiciona o evento de clique UMA VEZ para evitar múltiplos cliques
    confirmButton.replaceWith(confirmButton.cloneNode(true)); // Limpa listeners antigos
    document.getElementById('confirmButton').addEventListener('click', handleConfirm, { once: true });

    confirmationModal.show();
}

function openDeviceSettings(deviceId) {
    const device = allDevices.find(d => d.id === deviceId);
    if (!device) return;

    document.getElementById('editDeviceId').value = device.id;
    document.getElementById('editDeviceName').value = device.nome;
    document.getElementById('editDeviceLocation').value = device.localizacao;

    // Configura os rádio-botões do modo de alerta
    if (device.modo_alerta === 'padrão') {
        document.getElementById('modoAlertaPadrao').checked = true;
    } else {
        document.getElementById('modoAlertaPersonalizado').checked = true;
    }

    // Adiciona os listeners para os rádio-botões para gerir a visibilidade
    // (Pode ser necessário remover listeners antigos se a função for chamada várias vezes
    // mas para este caso simples, reatribuir o .onchange é suficiente)
    document.getElementById('modoAlertaPadrao').onchange = gerirVisibilidadeAlertas;
    document.getElementById('modoAlertaPersonalizado').onchange = gerirVisibilidadeAlertas;

    // Carrega as regras de alerta para o dispositivo e gerencia a visibilidade da área personalizada
    listarAlertas(deviceId);
    gerirVisibilidadeAlertas();

    // Mostra o modal
    new bootstrap.Modal(document.getElementById('deviceSettingsModal')).show();

    // Reset para a primeira aba ('Geral') quando o modal abre (boa prática)
    const someTabTriggerEl = document.querySelector('#deviceSettingsTabs button[data-bs-target="#geral-tab-pane"]')
    const tab = new bootstrap.Tab(someTabTriggerEl)
    tab.show()
}

async function saveDeviceSettings() {
    const dispositivoId = document.getElementById('editDeviceId').value;
    const nomeDispositivo = document.getElementById('editDeviceName').value;
    const localizacao = document.getElementById('editDeviceLocation').value;

    // Pega o valor do rádio-botão selecionado para o modo de alerta
    const modoAlerta = document.querySelector('input[name="modoAlerta"]:checked').value;

    const dadosAtualizados = {
        dispositivo_id: dispositivoId,
        nome_dispositivo: nomeDispositivo,
        localizacao: localizacao,
        modo_alerta: modoAlerta // Adiciona o modo_alerta aqui
    };

    try {
        const response = await fetch('api/dispositivos/atualizar.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosAtualizados)
        });
        const resultado = await response.json();

        if (resultado.status === 'sucesso') {
            showToast(resultado.mensagem);
            // Atualiza a lista de dispositivos no frontend para refletir a mudança
            await fetchDevices();
            // Fecha o modal
            bootstrap.Modal.getInstance(document.getElementById('deviceSettingsModal')).hide();
        } else {
            showToast(resultado.mensagem, 'error');
        }
    } catch (error) {
        console.error("Erro ao salvar configurações do dispositivo:", error);
        showToast('Ocorreu um erro ao salvar as configurações. Verifique a consola.', 'error');
    }
}

function openProfileSettings() {
    document.getElementById('editProfileName').value = '';
    document.getElementById('editProfileSobrenome').value = '';
    document.getElementById('editProfileOldPassword').value = '';
    document.getElementById('editProfileNewPassword').value = '';
    new bootstrap.Modal(document.getElementById('profileSettingsModal')).show();
}

async function saveProfileSettings() {
    const nome = document.getElementById('editProfileName').value;
    const sobrenome = document.getElementById('editProfileSobrenome').value;
    const senha_antiga = document.getElementById('editProfileOldPassword').value;
    const nova_senha = document.getElementById('editProfileNewPassword').value;

    if (!nome || !sobrenome) {
        showToast("Nome e Sobrenome são obrigatórios.", 'error');
        return;
    }

    const dadosPerfil = { nome, sobrenome, senha_antiga, nova_senha };

    try {
        const response = await fetch('api/usuarios/atualizar_perfil.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosPerfil)
        });
        const resultado = await response.json();
        if (resultado.status === 'sucesso') {
            showToast(resultado.mensagem);
            document.getElementById('nome-usuario').textContent = nome;
            localStorage.setItem('usuario_nome', nome);
            bootstrap.Modal.getInstance(document.getElementById('profileSettingsModal')).hide();
        } else {
            showToast(resultado.mensagem, 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar perfil:', error);
    }
}

// 1. A função que o botão no modal de perfil chama
function deleteAccount() {
    // Apenas limpa o campo e mostra o novo modal
    const passwordInput = document.getElementById('deleteConfirmPassword');
    const errorFeedback = document.getElementById('deleteErrorFeedback');
    passwordInput.value = '';
    passwordInput.classList.remove('is-invalid');
    errorFeedback.textContent = '';
    new bootstrap.Modal(document.getElementById('deleteAccountModal')).show();
}

// 2. A nova função que o modal de exclusão chama ao confirmar
async function confirmDeleteAccount() {
    const senha_confirmacao = document.getElementById('deleteConfirmPassword').value;
    const passwordInput = document.getElementById('deleteConfirmPassword');
    const errorFeedback = document.getElementById('deleteErrorFeedback');

    if (!senha_confirmacao) {
        passwordInput.classList.add('is-invalid');
        errorFeedback.textContent = 'A senha é obrigatória.';
        return;
    }

    try {
        const response = await fetch('api/usuarios/excluir_conta.php', {
            method: 'POST', // ou DELETE
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ senha: senha_confirmacao })
        });
        const resultado = await response.json();
        if (resultado.status === 'sucesso') {
            bootstrap.Modal.getInstance(document.getElementById('deleteAccountModal')).hide();
            showToast(resultado.mensagem, 'success');
            // Dá um pequeno tempo para o toast ser visto antes de redirecionar
            setTimeout(() => {
                localStorage.removeItem('usuario_nome');
                window.location.href = 'index.html';
            }, 2000);
        } else {
            passwordInput.classList.add('is-invalid');
            errorFeedback.textContent = resultado.mensagem;
        }
    } catch (error) {
        console.error('Erro ao excluir conta:', error);
        passwordInput.classList.add('is-invalid');
        errorFeedback.textContent = 'Falha na comunicação com o servidor.';
    }
}

async function logout() {
    try {
        const response = await fetch('api/usuarios/logout.php', { method: 'POST' });
        const resultado = await response.json();
        if (resultado.status === 'sucesso') {
            localStorage.removeItem('usuario_nome');
            showToast(resultado.mensagem);
            window.location.href = 'index.html';
        } else {
            showToast('Erro ao tentar fazer logout.', 'error');
        }
    } catch (error) {
        console.error('Erro no logout:', error);
    }
}
// Função para listar as regras de alerta de um dispositivo específico
// Versão 100% segura de listarAlertas (opcional)
async function listarAlertas(dispositivoId) {
    const listaUI = document.getElementById('lista-regras-alertas');
    listaUI.innerHTML = '<li class="list-group-item">Carregando regras...</li>';

    try {
        const response = await fetch(`api/alertas/listar.php?dispositivo_id=${dispositivoId}`);
        const resultado = await response.json();

        listaUI.innerHTML = ''; // Limpa a lista

        if (resultado.status === 'sucesso' && resultado.dados.length > 0) {
            resultado.dados.forEach(regra => {
                const item = document.createElement('li');
                item.className = 'list-group-item d-flex justify-content-between align-items-center';

                const span = document.createElement('span');

                // --- CORREÇÃO DA LÓGICA DA FRASE ---
                // Cria a frase de forma mais limpa e gramaticalmente correta
                const condicaoFormatada = (regra.condicao || '').replace('_', ' ');
                span.innerHTML = 'Se <b></b> for <b></b> <b></b>'; // Estrutura: Se [param] for [condicao] [valor]

                const bolds = span.querySelectorAll('b');
                bolds[0].textContent = regra.parametro;
                bolds[1].textContent = condicaoFormatada;
                bolds[2].textContent = regra.valor;
                // --- FIM DA CORREÇÃO ---

                const button = document.createElement('button');
                button.className = 'btn btn-sm btn-outline-danger';
                button.innerHTML = '<i class="fas fa-trash"></i>';
                button.onclick = () => removerAlerta(regra.id, dispositivoId);

                item.appendChild(span);
                item.appendChild(button);
                listaUI.appendChild(item);
            });
        } else {
            listaUI.innerHTML = '<li class="list-group-item">Nenhuma regra de alerta personalizada encontrada.</li>';
        }
    } catch (error) {
        console.error("Erro ao listar alertas:", error);
        listaUI.innerHTML = '<li class="list-group-item text-danger">Erro ao carregar regras.</li>';
    }
}

// Função para criar uma nova regra de alerta
async function criarAlerta() {
    const dispositivoId = document.getElementById('editDeviceId').value;
    const parametro = document.getElementById('alerta-parametro').value;
    const condicao = document.getElementById('alerta-condicao').value;
    const valor = document.getElementById('alerta-valor').value;

    if (!valor) {
        showToast('Por favor, insira um valor para a regra.', 'error');
        return;
    }

    // Validação básica para garantir que o valor é um número
    if (isNaN(parseFloat(valor))) {
        showToast('O valor do alerta deve ser um número.', 'error');
        return;
    }

    try {
        const response = await fetch('api/alertas/criar.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dispositivo_id: dispositivoId, parametro, condicao, valor: parseFloat(valor) }) // Envia o valor como float
        });
        const resultado = await response.json();

        if (resultado.status === 'sucesso') {
            showToast(resultado.mensagem);
            document.getElementById('form-criar-alerta').reset(); // Limpa o formulário
            listarAlertas(dispositivoId); // Atualiza a lista de regras
        } else {
            showToast(resultado.mensagem, 'error');
        }
    } catch (error) {
        console.error("Erro ao criar alerta:", error);
        showToast('Ocorreu um erro ao tentar criar o alerta. Verifique a consola para mais detalhes.');
    }
}

// Função para remover uma regra de alerta
// VERSÃO ATUALIZADA de removerAlerta() para usar o modal
async function removerAlerta(regraId, dispositivoId) {
    const handleConfirm = async () => {
        try {
            const response = await fetch('api/alertas/remover.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ regra_id: regraId })
            });
            const resultado = await response.json();

            if (resultado.status === 'sucesso') {
                showToast(resultado.mensagem, 'success');
                listarAlertas(dispositivoId); // Atualiza a lista
            } else {
                showToast(resultado.mensagem, 'error');
            }
        } catch (error) {
            console.error("Erro ao remover alerta:", error);
            showToast('Falha na comunicação com o servidor.', 'error');
        }
    };

    // Reutiliza a lógica do modal de confirmação
    const confirmationModal = new bootstrap.Modal(document.getElementById('confirmationModal'));
    document.getElementById('confirmationModalBody').textContent = 'Tem a certeza de que deseja remover esta regra de alerta?';

    const confirmButton = document.getElementById('confirmButton');
    confirmButton.replaceWith(confirmButton.cloneNode(true));
    document.getElementById('confirmButton').addEventListener('click', () => {
        handleConfirm();
        confirmationModal.hide();
    }, { once: true });

    confirmationModal.show();
}
// Função para gerir a visibilidade da área de alertas personalizados
function gerirVisibilidadeAlertas() {
    const modoPersonalizado = document.getElementById('modoAlertaPersonalizado').checked;
    const areaAlertasPersonalizados = document.getElementById('area-alertas-personalizados');
    if (areaAlertasPersonalizados) { // Verifica se o elemento existe
        areaAlertasPersonalizados.style.display = modoPersonalizado ? 'block' : 'none';
    }
}

// Verifica periodicamente por novas violações de regras de alerta.
async function verificarAlertas() {
    try {
        const response = await fetch('api/alertas/verificar.php');
        const resultado = await response.json();

        // Pega o elemento do cartão de alertas no HTML
        const alertsValueElement = document.getElementById('alerts-value');

        // Atualiza o número no cartão
        if (alertsValueElement && resultado.status === 'sucesso') {
            const alertCount = resultado.dados.notificacoes.length; // O número de alertas é o tamanho do array de dados
            alertsValueElement.textContent = alertCount;
        }

        if (resultado.status === 'sucesso') {
            atualizarPainelStatusRapido(resultado.dados);
        }

        if (resultado.status === 'sucesso' && resultado.dados.notificacoes.length > 0) {
            const novasNotificacoes = new Set();

            resultado.dados.notificacoes.forEach(mensagem => {
                novasNotificacoes.add(mensagem); // Adiciona a mensagem ao conjunto de notificações ativas

                // Só mostra o toast se esta notificação exata ainda não foi mostrada
                if (!notifiedAlerts.has(mensagem)) {
                    showToast(mensagem, 'error');
                    notifiedAlerts.add(mensagem); // Marca como notificada
                }
            });

            // Limpa notificações antigas que não estão mais ativas
            notifiedAlerts.forEach(notificacaoAntiga => {
                if (!novasNotificacoes.has(notificacaoAntiga)) {
                    notifiedAlerts.delete(notificacaoAntiga);
                }
            });
        } else if (resultado.status === 'sucesso') {
            // Se não há alertas, limpa todas as notificações antigas
            notifiedAlerts.clear();
        }
    } catch (error) {
        console.error("Erro ao verificar alertas:", error);
    }
}
async function criarGraficoPrincipal() {
    // Pega o container do gráfico, que sempre existirá
    const chartContainer = document.getElementById('home-chart-container');
    if (!chartContainer) return; // Segurança extra

    if (allDevices.length === 0) {
        chartContainer.innerHTML = `<p class="text-center text-muted mt-5">Nenhum dispositivo cadastrado.</p>`;
        return;
    }

    const principalDevice = allDevices[0];
    const agora = new Date();
    const ontem = new Date(agora);
    ontem.setDate(agora.getDate() - 1);
    const dataInicio = ontem.toISOString().split('T')[0]; const apiUrl = `api/leituras/buscar.php?dispositivo_id=${principalDevice.id}&limite=15`;

    try {
        const response = await fetch(apiUrl);
        const resultado = await response.json();

        if (resultado.status === 'sucesso' && resultado.dados.length > 0) {
            // Se há dados, garante que o canvas exista antes de desenhar
            chartContainer.innerHTML = '<canvas id="home-main-chart"></canvas>';
            dadosGraficoPrincipal = resultado.dados;
            mudarGraficoPrincipal('ph'); // Desenha o gráfico inicial (pH)
        } else {
            // Se não há dados, mostra a mensagem dentro do container
            chartContainer.innerHTML = `<p class="text-center text-muted mt-5">Nenhuma leitura encontrada para o dispositivo principal.</p>`;
        }
    } catch (error) {
        console.error('Erro ao criar gráfico principal:', error);
        chartContainer.innerHTML = `<p class="text-center text-danger mt-5">Erro ao carregar o gráfico.</p>`;
    }
}
function mudarGraficoPrincipal(parametro) {
    if (!dadosGraficoPrincipal) return; // Se não houver dados, não faz nada

    // 1. Define os detalhes (título, cor) com base no parâmetro escolhido
    const detalhes = {
        ph: { label: 'pH', color: 'rgb(255, 159, 64)' },
        temperatura: { label: 'Temperatura (°C)', color: 'rgb(75, 192, 192)' },
        condutividade: { label: 'Condutividade (ppm)', color: 'rgb(153, 102, 255)' },
        turbidez: { label: 'Turbidez (%)', color: 'rgb(255, 99, 132)' }
    };
    const detalheAtual = detalhes[parametro];

    // 2. Prepara os dados para o gráfico
    const labels = dadosGraficoPrincipal.map(l => new Date(l.data_hora.replace(' ', 'T')).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    const data = dadosGraficoPrincipal.map(l => l[parametro]);

    // 3. Destroi o gráfico antigo para evitar sobreposição
    if (activeCharts['home']) {
        activeCharts['home'].destroy();
    }

    // 4. Desenha o novo gráfico
    const principalDeviceName = allDevices.length > 0 ? allDevices[0].nome : '';
    activeCharts['home'] = initializeChart('home-main-chart', `${detalheAtual.label} - ${principalDeviceName}`, labels, data, detalheAtual.color);

    // 5. Atualiza o estilo do botão ativo
    const botoesControle = document.querySelectorAll('#grafico-principal-controles button');
    botoesControle.forEach(btn => {
        // Reseta todos os botões para o estado inativo
        btn.classList.remove('active', 'btn-primary');
        btn.classList.add('btn-outline-primary');

        // Ativa apenas o botão cujo 'data-param' corresponde ao parâmetro clicado
        if (btn.dataset.param === parametro) {
            btn.classList.remove('btn-outline-primary');
            btn.classList.add('active', 'btn-primary');
        }
    });
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
                fill: true,
                spanGaps: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}
//Função para exportar as leituras atuais para um ficheiro CSV.
function exportarLeiturasParaCSV() {
    // Verifica se um dispositivo está selecionado para visualização
    if (!currentViewingDeviceId) {
        showToast('Por favor, selecione um dispositivo e visualize as leituras primeiro.', 'error');
        return;
    }

    // Pega os valores atuais dos filtros de data
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    // Constrói a URL base para o novo endpoint de exportação
    let exportUrl = `api/leituras/exportar_csv.php?dispositivo_id=${currentViewingDeviceId}`;

    // Adiciona os parâmetros de data à URL, se estiverem preenchidos
    if (startDate) {
        exportUrl += `&data_inicio=${startDate}`;
    }
    if (endDate) {
        exportUrl += `&data_fim=${endDate}`;
    }

    // Redireciona o navegador para a URL de exportação.
    // O navegador irá tratar disso como um download de ficheiro devido aos cabeçalhos no PHP.
    window.location.href = exportUrl;
}
/**
 * Busca e exibe o histórico de todos os alertas do utilizador.
 */
async function mostrarHistoricoAlertas() {
    const tabelaBody = document.getElementById('tabela-historico-alertas');
    if (!tabelaBody) return;

    tabelaBody.innerHTML = '<tr><td colspan="4" class="text-center">A carregar histórico...</td></tr>';

    try {
        const response = await fetch('api/alertas/historico.php');
        const resultado = await response.json();

        if (resultado.status === 'sucesso') {
            tabelaBody.innerHTML = ''; // Limpa a mensagem "A carregar..."

            if (resultado.dados.length === 0) {
                tabelaBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Nenhum alerta encontrado no histórico.</td></tr>';
                return;
            }

            resultado.dados.forEach(alerta => {
                const tr = document.createElement('tr');

                // Mapeia o nível do alerta para uma cor e ícone do Bootstrap
                const niveis = {
                    'info': { cor: 'table-info', icone: 'fas fa-info-circle' },
                    'warning': { cor: 'table-warning', icone: 'fas fa-exclamation-triangle' },
                    'critical': { cor: 'table-danger', icone: 'fas fa-exclamation-circle' }
                };
                const estilo = niveis[alerta.nivel] || { cor: '', icone: 'fas fa-question-circle' };

                tr.classList.add(estilo.cor);

                tr.innerHTML = `
                    <td><i class="${estilo.icone} me-2"></i> ${alerta.nivel.charAt(0).toUpperCase() + alerta.nivel.slice(1)}</td>
                    <td>${new Date(alerta.data_criacao.replace(' ', 'T')).toLocaleString('pt-BR')}</td>
                    <td>${alerta.nome_dispositivo}</td>
                    <td>${alerta.mensagem}</td>
                `;
                tabelaBody.appendChild(tr);
            });

        } else {
            showToast(resultado.mensagem, 'error');
            tabelaBody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Erro ao carregar o histórico.</td></tr>';
        }
    } catch (error) {
        console.error('Erro ao buscar histórico de alertas:', error);
        tabelaBody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Falha na comunicação com o servidor.</td></tr>';
    }
}

// Modifica a função showSection para carregar os dados quando a secção é mostrada
function showSection(sectionId, element) {
    document.querySelectorAll('.content-section').forEach(section => section.style.display = 'none');
    document.getElementById(sectionId).style.display = 'block';

    document.querySelectorAll('#sidebar-menu .list-group-item').forEach(link => {
        link.classList.remove('active');
    });
    element.classList.add('active');

    // NOVO: Chama a função para carregar os dados quando a secção de histórico é aberta
    if (sectionId === 'historico-alertas-section') {
        mostrarHistoricoAlertas();
    }
}s