// scripts/Login/login.js

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorMsg = document.getElementById('errorMsg');
    const passwordInput = document.getElementById('password');
    const btnLogin = document.getElementById('btnLogin');
    const btnTogglePassword = document.getElementById('btnTogglePassword');

    // Funcionalidade de mostrar/ocultar palavra-passe (mantida para a UI continuar a funcionar)
    if (btnTogglePassword) {
        btnTogglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            const icon = btnTogglePassword.querySelector('i');
            icon.className = type === 'password' ? 'ph ph-eye' : 'ph ph-eye-slash';
        });
    }

    // Submissão do formulário
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Impede a página de recarregar
        
        const username = document.getElementById('username').value.trim();

        // Esconde erros anteriores e mostra estado de carregamento
        errorMsg.style.display = 'none';
        btnLogin.disabled = true;
        btnLogin.innerHTML = '<i class="ph ph-spinner ph-spin"></i> A validar...';

        // Simula um tempo de resposta da internet (800ms)
        setTimeout(() => {
            // LOGIN FAKE: Verifica apenas se o nome de utilizador é joao.santos
            if (username === 'joao.santos') {
                
                // Cria um utilizador simulado
                const usuarioFake = {
                    id: 1, 
                    nome: "João Santos", 
                    username: "joao.santos", 
                    role: "Admin master"
                };

                // Salva os dados no navegador para libertar o acesso às outras páginas
                localStorage.setItem('noc_userLogado', JSON.stringify(usuarioFake));
                
                // Redireciona para o painel principal
                window.location.href = 'index.html';
                
            } else {
                // Se digitar outra coisa, mostra erro
                errorMsg.textContent = 'Acesso restrito: Utilize "joao.santos" para testar.';
                errorMsg.style.display = 'block';
                
                // Restaura o botão
                btnLogin.disabled = false;
                btnLogin.innerHTML = '<span>Entrar no NOC</span><i class="ph ph-sign-in"></i>';
            }
        }, 800);
    });
});
