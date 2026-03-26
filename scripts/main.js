// Aguarda o documento HTML ser totalmente carregado
document.addEventListener('DOMContentLoaded', () => {
    
    // Captura o botão e o corpo (body) da página
    const themeToggleBtn = document.getElementById('theme-toggle');
    const body = document.body;
    
    // Captura o ícone dentro do botão para podermos mudar de Sol para Lua
    const icon = themeToggleBtn.querySelector('i');

    // Verifica se o usuário já escolheu um tema anteriormente (salvo no navegador)
    const savedTheme = localStorage.getItem('hubTheme');
    
    if (savedTheme === 'light') {
        body.classList.add('light-mode');
        icon.classList.replace('ph-sun', 'ph-moon'); // Troca o ícone para Lua
    }

    // Função que é executada quando o usuário clica no botão
    themeToggleBtn.addEventListener('click', () => {
        
        // Alterna a classe 'light-mode' no body
        body.classList.toggle('light-mode');
        
        // Verifica se a classe foi adicionada (modo claro) ou removida (modo escuro)
        if (body.classList.contains('light-mode')) {
            localStorage.setItem('hubTheme', 'light'); // Salva a escolha
            icon.classList.replace('ph-sun', 'ph-moon'); // Muda o ícone
        } else {
            localStorage.setItem('hubTheme', 'dark'); // Salva a escolha
            icon.classList.replace('ph-moon', 'ph-sun'); // Muda o ícone
        }
    });
});