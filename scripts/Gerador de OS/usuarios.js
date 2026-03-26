// scripts/Gerador de OS/usuarios.js

document.addEventListener('DOMContentLoaded', () => {

    // Banco de Dados Simulado dos Técnicos Cadastrados pelos Prestadores
    window.bancoTecnicos = [
        { id: 1, nome: "Evandro Artioli", whatsapp: "11 975508661", placa: "", providerUsername: "david.lima" },
        { id: 2, nome: "Lucas de Morais", whatsapp: "11 960631307", placa: "", providerUsername: "david.lima" },
        { id: 3, nome: "David Gomes", whatsapp: "11 982750559", placa: "", providerUsername: "david.lima" }
    ];

    // =========================================
    // GESTÃO DE EQUIPE TÉCNICA (Modal)
    // =========================================
    const btnEquipe = document.getElementById('btnEquipeTecnica');
    const modalEquipe = document.getElementById('modalEquipe');
    const formEquipe = document.getElementById('formEquipe');
    const listaEquipe = document.getElementById('listaEquipe');

    if (btnEquipe) {
        btnEquipe.addEventListener('click', () => {
            renderizarListaEquipe();
            modalEquipe.classList.add('active');
        });
    }

    if (formEquipe) {
        formEquipe.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Pega o username do provedor atual (Ex: rennan.avelino)
            const providerUsername = window.usuarioLogado.username;

            const novoTech = {
                id: Date.now(),
                nome: document.getElementById('techNome').value,
                whatsapp: document.getElementById('techWhatsapp').value,
                placa: document.getElementById('techPlaca').value,
                providerUsername: providerUsername
            };

            window.bancoTecnicos.push(novoTech);
            
            formEquipe.reset();
            renderizarListaEquipe();
            
            // Opcional: re-renderizar a tela de OS para refletir mudanças se necessário
            if (typeof window.renderizarOS === 'function') window.renderizarOS();
        });
    }

    // Função Global para remover técnico via botão na lista
    window.removerTecnico = function(id) {
        if (confirm("Tem certeza que deseja remover este técnico da sua equipe?")) {
            window.bancoTecnicos = window.bancoTecnicos.filter(t => t.id !== id);
            renderizarListaEquipe();
            if (typeof window.renderizarOS === 'function') window.renderizarOS();
        }
    };

    function renderizarListaEquipe() {
        if (!listaEquipe) return;

        // Filtra os técnicos que pertencem a quem está logado
        const providerUsername = window.usuarioLogado.username;
        const meusTecnicos = window.bancoTecnicos.filter(t => t.providerUsername === providerUsername);

        if (meusTecnicos.length === 0) {
            listaEquipe.innerHTML = '<p style="color: var(--text-muted); font-size: 12px; font-style: italic;">Você ainda não possui nenhum técnico cadastrado.</p>';
            return;
        }

        listaEquipe.innerHTML = meusTecnicos.map(t => `
            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.03); padding: 10px; border-radius: 8px; border: 1px solid var(--border-color);">
                <div>
                    <strong style="font-size: 13px; color: var(--text-main);">${t.nome}</strong><br>
                    <small style="color: var(--text-muted);"><i class="ph ph-whatsapp-logo" style="color: #10b981;"></i> ${t.whatsapp} ${t.placa ? `| Placa: ${t.placa}` : ''}</small>
                </div>
                <button type="button" onclick="removerTecnico(${t.id})" class="icon-btn" style="color: var(--danger);"><i class="ph ph-trash"></i></button>
            </div>
        `).join('');
    }

});