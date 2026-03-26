// scripts/Login/login.js

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorMsg = document.getElementById('errorMsg');
    const btnTogglePassword = document.getElementById('btnTogglePassword');
    const passwordInput = document.getElementById('password');
    const btnLogin = document.getElementById('btnLogin');

    // BANCO DE DADOS INTERNO PARA VALIDAÇÃO IMEDIATA
    const usuariosPermitidos = [
        { 
            id: 1, 
            nome: "João Santos", 
            username: "joao.santos", 
            senha: "sJ0r@jt5_", 
            role: "Admin master" 
        },
        { 
            id: 2, 
            nome: "Rennan Avelino", 
            username: "rennan.avelino", 
            senha: "123", 
            role: "Terceiro técnico de campo" 
        },
        { 
            id: 3, 
            nome: "David Lima", 
            username: "david.lima", 
            senha: "123", 
            role: "Terceiro empresa de elevador" 
        }
    ];

    // Mostrar/Ocultar Senha
    if (btnTogglePassword) {
        btnTogglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            btnTogglePassword.querySelector('i').className = type === 'password' ? 'ph ph-eye' : 'ph ph-eye-slash';
        });
    }

    // Lógica de Login
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const usernameDigitado = document.getElementById('username').value.trim();
        const senhaDigitada = passwordInput.value;

        errorMsg.style.display = 'none';
        btnLogin.disabled = true;
        btnLogin.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Autenticando...';

        // Procura o usuário no banco interno
        const usuarioEncontrado = usuariosPermitidos.find(u => 
            u.username === usernameDigitado && u.senha === senhaDigitada
        );

        // Simula um pequeno atraso para parecer processamento real
        setTimeout(() => {
            if (usuarioEncontrado) {
                // Criar objeto de sessão (sem a senha por segurança)
                const sessaoUsuario = {
                    id: usuarioEncontrado.id,
                    nome: usuarioEncontrado.nome,
                    username: usuarioEncontrado.username,
                    role: usuarioEncontrado.role
                };

                // SALVA NA MEMÓRIA DO NAVEGADOR
                localStorage.setItem('noc_userLogado', JSON.stringify(sessaoUsuario));
                
                // REDIRECIONA
                window.location.href = 'index.html';
            } else {
                errorMsg.textContent = "Utilizador ou senha incorretos.";
                errorMsg.style.display = 'block';
                btnLogin.disabled = false;
                btnLogin.innerHTML = '<span>Entrar no NOC</span><i class="ph ph-sign-in"></i>';
            }
        }, 800);
    });
});
