/**
 * Ficheiro: js/main.js
 * Contém toda a lógica da página inicial (index.html).
 */

// Espera que todo o conteúdo da página seja carregado antes de executar o script.
document.addEventListener('DOMContentLoaded', () => {

    // Inicializa o widget de acessibilidade VLibras
    new window.VLibras.Widget('https://vlibras.gov.br/app');

    // Lógica para a barra de navegação que muda com o scrol
    // 1. Seleciona todos os elementos que queremos animar.
    const elementsToAnimate = document.querySelectorAll('.step-card, .inovacao-card');
    const navbar = document.querySelector('.navbar');
    const heroSection = document.querySelector('#hero');
    const nav = document.querySelector('nav');
    const heroObserverOptions = {
        root: null,
        rootMargin: '-80px 0px 0px 0px',
        threshold: 0.01
    };

    const navbarObserver = new IntersectionObserver((entries) => {
        const [entry] = entries;
        if (!entry.isIntersecting) {
            navbar.classList.add('scrolled');
            nav.classList.add('navbar-light');
            nav.classList.remove('navbar-dark');
        } else {
            navbar.classList.remove('scrolled');
            nav.classList.remove('navbar-light');
            nav.classList.add('navbar-dark');
        }
    }, heroObserverOptions);

    navbarObserver.observe(heroSection);

    // 2. Cria o observador com uma função que será executada.
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Se está visível, adiciona a classe para mostrar a animação.
                entry.target.classList.add('section-visible');
                entry.target.classList.remove('section-hidden');
                observer.unobserve(entry.target); // Para de observar após a animação.
            }
        });
    }, {
        threshold: 0.5
    });

    // 3. Inicia a observação para cada elemento selecionado.
    elementsToAnimate.forEach(element => {
        element.classList.add('section-hidden');
        observer.observe(element);
    });

});

/**
 * Função para REGISTAR um novo utilizador na API.
 */
async function enviar() {
    const nome = document.getElementById('nome').value;
    const sobrenome = document.getElementById('snome').value;
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;

    const dadosUsuario = { nome, sobrenome, email, senha };

    try {
        const response = await fetch('api/usuarios/registrar.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosUsuario)
        });
        const resultado = await response.json();

        if (resultado.status === 'sucesso') {
            showToast(resultado.mensagem, 'success');
            var modalCadastro = bootstrap.Modal.getInstance(document.getElementById('cadasdiv'));
            modalCadastro.hide();
            new bootstrap.Modal(document.getElementById('logindiv')).show();
        } else {
            showToast(resultado.mensagem, 'error');
        }
    } catch (error) {
        console.error('Falha na requisição:', error);
        showToast('Não foi possível conectar-se ao servidor.', 'error');
    }
}

/**
 * Função para ENVIAR os dados de LOGIN para a API.
 */
async function login() {
    const email = document.getElementById('lemail').value;
    const senha = document.getElementById('lsenha').value;

    const dadosLogin = { email, senha };

    try {
        const response = await fetch('api/usuarios/login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosLogin)
        });
        const resultado = await response.json();

        if (resultado.status === 'sucesso') {
            showToast(resultado.mensagem, 'success');
            localStorage.setItem('usuario_nome', resultado.dados.nome);
            window.location.href = 'dashboard.html';
        } else {
            showToast(resultado.mensagem, 'error');
        }
    } catch (error) {
        console.error('Falha na requisição:', error);
        showToast('Não foi possível conectar-se ao servidor.', 'error');
    }
}

/**
 * Mostra uma notificação toast no canto do ecrã.
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
    const toast = new bootstrap.Toast(toastElement, { delay: 5000 });
    toastElement.addEventListener('hidden.bs.toast', () => toastElement.remove());
    toast.show();
}