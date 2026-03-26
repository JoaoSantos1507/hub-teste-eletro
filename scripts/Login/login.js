// scripts/Login/login.js

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorMsg = document.getElementById('errorMsg');
    const btnTogglePassword = document.getElementById('btnTogglePassword');
    const passwordInput = document.getElementById('password');
    const btnLogin = document.getElementById('btnLogin');

    // Funcionalidade de mostrar/ocultar palavra-passe
    btnTogglePassword.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        // Altera o ícone de olho fechado/aberto
        const icon = btnTogglePassword.querySelector('i');
        icon.className = type === 'password' ? 'ph ph-eye' : 'ph ph-eye-slash';
    });

    // Submissão do formulário
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Impede a página de recarregar
        
        const username = document.getElementById('username').value.trim();
        const password = passwordInput.value;

        // Limpa mensagens anteriores
        errorMsg.style.display = 'none';
        
        // Estado de carregamento do botão
        btnLogin.disabled = true;
        btnLogin.innerHTML = '<i class="ph ph-spinner ph-spin"></i> A validar...';

        try {
            // Envia os dados para o ficheiro PHP
            const response = await fetch('scripts/Login/login.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username: username, password: password })
            });

            const data = await response.json();

            if (data.success) {
                // Login efetuado com sucesso!
                // Salvar dados do utilizador no LocalStorage para usar no HUB
                localStorage.setItem('noc_userLogado', JSON.stringify(data.user));
                
                // Redireciona para o HUB
                window.location.href = 'index.html';
            } else {
                // Erro (utilizador não encontrado ou palavra-passe incorreta)
                mostrarErro(data.message || 'Credenciais inválidas.');
            }
        } catch (error) {
            console.error("Erro na requisição:", error);
            mostrarErro('Erro de comunicação com o servidor. Tente novamente.');
        } finally {
            // Restaura o botão
            btnLogin.disabled = false;
            btnLogin.innerHTML = '<span>Entrar no NOC</span><i class="ph ph-sign-in"></i>';
        }
    });

    function mostrarErro(mensagem) {
        errorMsg.textContent = mensagem;
        errorMsg.style.display = 'block';
    }
});
