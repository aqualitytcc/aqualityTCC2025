let activeCharts = [];
let allDevices = [];

function updateSummary() {
    const totalDevices = allDevices.length;
    document.getElementById('total-devices-value').innerText = totalDevices;
    const onlineDevices = allDevices.filter(d => d.status === 'Online').length;
    document.getElementById('online-devices-value').innerText = onlineDevices;
    const alertDevices = allDevices.filter(d => d.status === 'Alerta').length;
    document.getElementById('alerts-value').innerText = alertDevices;
}

function showSection(sectionId, element) {
    document.querySelectorAll('.content-section').forEach(section => section.style.display = 'none');
    document.getElementById(sectionId).style.display = 'block';
    document.querySelectorAll('#sidebar-menu .nav-link').forEach(link => {
        link.classList.remove('active');
        link.classList.add('text-white');
    });
    element.classList.add('active');
    element.classList.remove('text-white');
}

function addDevice() {
    const deviceName = document.getElementById('deviceName').value;
    const deviceLocation = document.getElementById('deviceLocation').value;
    const deviceIdentifier = document.getElementById('deviceIdentifier').value;
    if (!deviceName || !deviceLocation || !deviceIdentifier) {
        alert("Por favor, preencha todos os campos.");
        return;
    }
    if (allDevices.some(d => d.identifier === deviceIdentifier)) {
        alert("Já existe um dispositivo com este identificador.");
        return;
    }
    const newDevice = {
        name: deviceName,
        location: deviceLocation,
        identifier: deviceIdentifier,
        readings: { temperature: '23.5°C', ph: '7.8', tds: '150 ppm' },
        alertLimits: { phMax: 7.5 },
        status: 'Online'
    };
    allDevices.push(newDevice);
    renderAllDevices();
    document.querySelector('#addDeviceModal form').reset();
    const modalEl = document.getElementById('addDeviceModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) { modal.hide(); }
}

function removeDevice(identifier) {
    if (confirm("Tem certeza que deseja remover este dispositivo?")) {
        allDevices = allDevices.filter(d => d.identifier !== identifier);
        renderAllDevices();
    }
}

function renderAllDevices() {
    const deviceList = document.getElementById('device-list');
    deviceList.innerHTML = '';
    if (allDevices.length === 0) {
        document.getElementById('no-devices-message').style.display = 'block';
    } else {
        document.getElementById('no-devices-message').style.display = 'none';
        allDevices.forEach(device => {
            let phValue = parseFloat(device.readings.ph);
            let phAlertMax = device.alertLimits.phMax;
            device.status = (phValue > phAlertMax) ? 'Alerta' : 'Online';

            const deviceCardHTML = `<div class="col-md-6 col-lg-4"><div class="card device-card status-${device.status.toLowerCase()}"><div class="card-body"><div class="d-flex justify-content-between align-items-start"><div><h5 class="card-title mb-1">${device.name}</h5><h6 class="card-subtitle mb-2 text-muted">${device.location}</h6></div><div class="status-indicator"><span class="status-dot ${device.status.toLowerCase()}"></span>${device.status}</div></div><hr><div class="readings-container mt-3"><div class="reading-item"><i class="fa-solid fa-temperature-half"></i><div><strong>Temperatura:</strong> <span>${device.readings.temperature}</span></div></div><div class="reading-item"><i class="fa-solid fa-flask-vial"></i><div><strong>pH:</strong> <span>${device.readings.ph}</span></div></div><div class="reading-item"><i class="fa-solid fa-droplet"></i><div><strong>TDS:</strong> <span>${device.readings.tds}</span></div></div></div></div><div class="card-footer bg-light d-flex justify-content-end"><button class="btn btn-sm btn-primary me-2" onclick='showDeviceReadings(${JSON.stringify(device)})'>Ver Leituras</button><button class="btn btn-sm btn-outline-secondary me-2" onclick="openDeviceSettings('${device.identifier}')">Configurações</button><button class="btn btn-sm btn-danger" onclick="removeDevice('${device.identifier}')">Remover</button></div></div></div>`;
            deviceList.innerHTML += deviceCardHTML;
        });
    }
    updateSummary();
}

function showDeviceReadings(deviceData) {
    const readingsMenuLink = document.querySelector('a[onclick*="leituras-section"]');
    showSection('leituras-section', readingsMenuLink);
    document.getElementById('readings-title').innerText = `Leituras de: ${deviceData.name}`;
    const chartsContainer = document.getElementById('charts-container');
    let allChartsHTML = buildChartCardHTML('temperatureChart', 'Temperatura') + buildChartCardHTML('phChart', 'pH') + buildChartCardHTML('tdsChart', 'TDS (Condutividade)');
    chartsContainer.innerHTML = allChartsHTML;
    
    // Limpa intervalos de atualização de gráficos antigos para evitar memory leaks
    activeCharts.forEach(chart => {
        if(chart.updateInterval) {
            clearInterval(chart.updateInterval);
        }
        chart.destroy();
    });
    activeCharts = [];

    activeCharts.push(initializeChart('temperatureChart', 'Temperatura', deviceData.readings.temperature));
    activeCharts.push(initializeChart('phChart', 'pH', deviceData.readings.ph, deviceData.alertLimits.phMax));
    activeCharts.push(initializeChart('tdsChart', 'TDS (Condutividade)', deviceData.readings.tds));
}

function openDeviceSettings(identifier) {
    const device = allDevices.find(d => d.identifier === identifier);
    if (!device) return;
    document.getElementById('editDeviceIdentifier').value = device.identifier;
    document.getElementById('editDeviceName').value = device.name;
    document.getElementById('editDeviceLocation').value = device.location;
    document.getElementById('alertPhMax').value = device.alertLimits.phMax;
    const modal = new bootstrap.Modal(document.getElementById('deviceSettingsModal'));
    modal.show();
}

function saveDeviceSettings() {
    const identifier = document.getElementById('editDeviceIdentifier').value;
    const deviceIndex = allDevices.findIndex(d => d.identifier === identifier);
    if (deviceIndex === -1) return;
    allDevices[deviceIndex].name = document.getElementById('editDeviceName').value;
    allDevices[deviceIndex].location = document.getElementById('editDeviceLocation').value;
    allDevices[deviceIndex].alertLimits.phMax = parseFloat(document.getElementById('alertPhMax').value);
    renderAllDevices();
    const modalEl = document.getElementById('deviceSettingsModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) {
        modal.hide();
    }
}

function buildChartCardHTML(canvasId, label) { 
    return `<div class="col-md-6 col-lg-4 mb-4"><div class="card"><div class="card-header">${label}</div><div class="card-body"><canvas id="${canvasId}"></canvas></div></div></div>`; 
}

function initializeChart(canvasId, label, readingData, alertThreshold = null) {
    const initialValue = parseFloat(readingData);
    let chartColor = 'rgb(75, 192, 192)'; 
    let chartBackgroundColor = 'rgba(75, 192, 192, 0.1)';
    if (alertThreshold && initialValue > alertThreshold) {
        chartColor = 'rgb(220, 53, 69)'; 
        chartBackgroundColor = 'rgba(220, 53, 69, 0.1)';
    }
    const historicalLabels = ['-25s', '-20s', '-15s', '-10s', '-5s', 'Agora'];
    const historicalData = [ initialValue - Math.random(), initialValue + Math.random(), initialValue - Math.random() * 0.5, initialValue + Math.random() * 0.2, initialValue - Math.random() * 0.3, initialValue ];
    const ctx = document.getElementById(canvasId).getContext('2d');
    const chart = new Chart(ctx, { 
        type: 'line', 
        data: { 
            labels: historicalLabels, 
            datasets: [{ 
                label: label, 
                data: historicalData, 
                borderColor: chartColor, 
                backgroundColor: chartBackgroundColor, 
                tension: 0.2, 
                fill: true 
            }] 
        } 
    });

    const updateInterval = setInterval(() => {
        const lastValue = chart.data.datasets[0].data[chart.data.datasets[0].data.length - 1];
        const newValue = lastValue + (Math.random() - 0.5) * 0.2; // Variação mais suave
        
        chart.data.datasets[0].data.push(newValue.toFixed(1));
        chart.data.labels.push('Agora');
        
        if (chart.data.datasets[0].data.length > 6) {
            chart.data.datasets[0].data.shift();
            chart.data.labels.shift();
        }
        chart.update();
    }, 5000);
    
    chart.updateInterval = updateInterval; // Armazena a referência do intervalo no objeto do gráfico
    return chart;
}

// Lógica do Modo Escuro e Inicialização
const darkModeSwitch = document.getElementById('darkModeSwitch');
if (darkModeSwitch) {
    darkModeSwitch.addEventListener('change', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        if(darkModeSwitch) {
            darkModeSwitch.checked = true;
        }
    }
    updateSummary();
});