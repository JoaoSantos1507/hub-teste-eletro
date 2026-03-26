// scripts/Login/login.js

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorMsg = document.getElementById('errorMsg');
    const btnTogglePassword = document.getElementById('btnTogglePassword');
    const passwordInput = document.getElementById('password');
    const btnLogin = document.getElementById('btnLogin');

    // Funcionalidade de mostrar/ocultar palavra-passe
    if (btnTogglePassword) {
        btnTogglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Altera o ícone de olho
            const icon = btnTogglePassword.querySelector('i');
            icon.className = type === 'password' ? 'ph ph-eye' : 'ph ph-eye-slash';
        });
    }

    // Submissão do formulário
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Impede a página de recarregar
        
        const username = document.getElementById('username').value.trim();
        const password = passwordInput.value;

        // Esconde o erro e mostra carregamento
        errorMsg.style.display = 'none';
        btnLogin.disabled = true;
        btnLogin.innerHTML = '<i class="ph ph-spinner ph-spin"></i> A validar...';

        try {
            // Envia os dados para o ficheiro PHP (Backend)
            const response = await fetch('scripts/Login/login.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username: username, password: password })
            });

            // Lê a resposta do PHP
            const data = await response.json();

            if (data.success) {
                // Sucesso: Salva os dados do utilizador (sem a senha) e redireciona
                localStorage.setItem('noc_userLogado', JSON.stringify(data.user));
                window.location.href = 'index.html';
            } else {
                // Erro: Mostra a mensagem vinda do PHP
                errorMsg.textContent = data.message || 'Credenciais inválidas.';
                errorMsg.style.display = 'block';
            }
        } catch (error) {
            console.error("Erro na requisição:", error);
            // Este erro ocorre se o JS não encontrar o PHP (ex: rodando direto no PC sem XAMPP ou no GitHub)
            errorMsg.textContent = 'Erro ao contactar o servidor (Verifique se o PHP está a rodar).';
            errorMsg.style.display = 'block';
        } finally {
            // Restaura o botão
            btnLogin.disabled = false;
            btnLogin.innerHTML = '<span>Entrar no NOC</span><i class="ph ph-sign-in"></i>';
        }
    });
});
