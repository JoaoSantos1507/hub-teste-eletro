// scripts/N2/acoes.js

document.addEventListener('DOMContentLoaded', () => {

    // =========================================
    // 1. DELEGAÇÃO DE EVENTOS DE AÇÃO NA TABELA
    // =========================================
    const tableBody = document.getElementById('tableBody');

    if (tableBody) {
        tableBody.addEventListener('click', (e) => {
            
            // --- BOTÃO DE CRÍTICO ---
            const btnCritico = e.target.closest('.btn-critico');
            if (btnCritico) {
                const id = btnCritico.dataset.id;
                // Alternar estado crítico
                if (window.criticoPorChamado[id]) {
                    delete window.criticoPorChamado[id];
                } else {
                    window.criticoPorChamado[id] = true;
                }
                localStorage.setItem('noc_critico_chamados', JSON.stringify(window.criticoPorChamado));
                
                // Atualiza visual
                window.aplicarFiltros();
                return;
            }

            // --- BOTÃO DE ENCERRAMENTO ---
            const btnEncerrar = e.target.closest('.btn-encerrar');
            if (btnEncerrar) {
                const id = btnEncerrar.dataset.id;
                // Alternar estado encerrado
                if (window.encerradoPorChamado[id]) {
                    delete window.encerradoPorChamado[id];
                } else {
                    window.encerradoPorChamado[id] = true;
                }
                localStorage.setItem('noc_encerrado_chamados', JSON.stringify(window.encerradoPorChamado));
                
                // Ao encerrar ou reabrir, refaz a contagem de filtros pendentes e re-renderiza
                window.popularFiltros(window.chamadosGlobais);
                window.aplicarFiltros();
                return;
            }
        });

        // --- MENU SUSPENSO DE STATUS E ATALHOS ---
        tableBody.addEventListener('change', (e) => {
            if (e.target.classList.contains('select-status-chamado')) {
                const id = e.target.dataset.id;
                const valorSelecionado = e.target.value;

                // Salva o status principal no dropdown (para não perdermos a função original)
                window.statusPorChamado[id] = valorSelecionado;
                localStorage.setItem('noc_status_chamados', JSON.stringify(window.statusPorChamado));

                // Validação de atalhos e modais
                if (valorSelecionado === "Tratativa") {
                    abrirModalTratativa(id);
                } 
                else if (["Troca de tela", "Solicitado retorno", "Solicitado / Retirado"].includes(valorSelecionado)) {
                    // Adiciona automaticamente o atalho como um "Motivo/Tag" laranja
                    adicionarMotivoDireto(id, valorSelecionado);
                }
            }
        });
    }

    // =========================================
    // 2. FUNÇÕES DO MODAL DE TRATATIVA (MOTIVOS)
    // =========================================
    let chamadoTratativaModal = null;
    const selectMotivo = document.getElementById('modalSelectMotivo');
    const containerMotivos = document.getElementById('lista-motivos-corpo');

    function abrirModalTratativa(id) {
        chamadoTratativaModal = id;
        document.getElementById('modalTratativaOS').innerText = id;
        
        renderizarListaMotivos();
        
        const modal = document.getElementById('tratativaModal');
        if (modal) modal.classList.add('active');
    }

    function fecharModalTratativa() {
        const modal = document.getElementById('tratativaModal');
        if (modal) modal.classList.remove('active');
        
        chamadoTratativaModal = null;
        if(selectMotivo) selectMotivo.value = '';
        
        // Atualiza a tabela para exibir as tags inseridas
        window.popularFiltros(window.chamadosGlobais);
        window.aplicarFiltros(); 
    }

    // Eventos de Fechar Modal
    const btnFechar = document.getElementById('btnFecharTratativa');
    const btnFecharTop = document.getElementById('btnFecharTratativaTop');
    if (btnFechar) btnFechar.addEventListener('click', fecharModalTratativa);
    if (btnFecharTop) btnFecharTop.addEventListener('click', fecharModalTratativa);

    // Adicionar Motivo pelo Modal
    const btnAdicionarMotivo = document.getElementById('btnAdicionarMotivo');
    if (btnAdicionarMotivo) {
        btnAdicionarMotivo.addEventListener('click', () => {
            if (!chamadoTratativaModal) return;
            
            const motivoSelecionado = selectMotivo.value;
            if (!motivoSelecionado) {
                alert("Por favor, selecione um motivo.");
                return;
            }

            adicionarMotivoDireto(chamadoTratativaModal, motivoSelecionado);
            selectMotivo.value = "";
            renderizarListaMotivos();
        });
    }

    // Atalho para injetar Motivo sem abrir o painel
    function adicionarMotivoDireto(idChamado, motivo) {
        if (!window.motivosPorChamado[idChamado]) {
            window.motivosPorChamado[idChamado] = [];
        }

        // Verifica se a tag já não existe para evitar duplicações
        if (!window.motivosPorChamado[idChamado].includes(motivo)) {
            window.motivosPorChamado[idChamado].push(motivo);
            localStorage.setItem('noc_motivos_chamados', JSON.stringify(window.motivosPorChamado));
        }

        // Se estivermos com o modal aberto e injetarmos via atalho, já atualiza lá
        if (chamadoTratativaModal === idChamado) {
            renderizarListaMotivos();
        } else {
            // Se foi pelo atalho na tabela, re-renderiza direto
            window.popularFiltros(window.chamadosGlobais);
            window.aplicarFiltros();
        }
    }

    // Renderizar a lista dentro do Modal
    function renderizarListaMotivos() {
        if (!containerMotivos) return;
        
        const motivosDesteChamado = window.motivosPorChamado[chamadoTratativaModal] || [];

        if (motivosDesteChamado.length === 0) {
            containerMotivos.innerHTML = '<p style="color: var(--text-muted); font-size: 13px; font-style: italic; text-align: center; padding: 10px;">Nenhum motivo vinculado a este chamado.</p>';
            return;
        }

        containerMotivos.innerHTML = motivosDesteChamado.map((motivo, idx) => `
            <div class="vinculado-item" style="border-left: 3px solid var(--primary, #ff6600);">
                <span style="color: var(--text-main); font-weight: 500;">
                    ${motivo}
                </span>
                <button type="button" class="btn-remover-motivo" data-index="${idx}" title="Remover Motivo">
                    <i class="ph ph-trash" style="color: var(--danger);"></i>
                </button>
            </div>
        `).join('');
    }

    // Remover Motivo do Modal
    if (containerMotivos) {
        containerMotivos.addEventListener('click', (e) => {
            const btnRemover = e.target.closest('.btn-remover-motivo');
            if (btnRemover) {
                const index = btnRemover.dataset.index;
                if (window.motivosPorChamado[chamadoTratativaModal]) {
                    window.motivosPorChamado[chamadoTratativaModal].splice(index, 1);
                    
                    if (window.motivosPorChamado[chamadoTratativaModal].length === 0) {
                        delete window.motivosPorChamado[chamadoTratativaModal];
                    }
                    
                    localStorage.setItem('noc_motivos_chamados', JSON.stringify(window.motivosPorChamado));
                    renderizarListaMotivos();
                }
            }
        });
    }

});