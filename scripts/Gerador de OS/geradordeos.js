// scripts/Gerador de OS/geradordeos.js

document.addEventListener('DOMContentLoaded', () => {

    // =========================================
    // 1. ESTADO GLOBAL E SIMULAÇÃO DE BANCOS
    // =========================================
    
    // Tornando globais para o usuarios.js ter acesso
    window.usuarioLogado = { username: "joao.santos", nome: "João Santos", role: "Admin master" };

    // Atualizado com as novas categorias e os usuários solicitados
    window.usuariosBD = [
        { id: 1, username: "joao.santos", nome: "João Santos", role: "Admin master" },
        { id: 2, username: "rennan.avelino", nome: "Rennan Avelino", role: "Terceiro técnico de campo" },
        { id: 3, username: "david.lima", nome: "David Lima", role: "Terceiro empresa de elevador" },
        { id: 4, username: "gilmar.alves", nome: "Gilmar Alves", role: "Terceiro empresa de elevador" }
    ];

    const todosOsServicos = [
        "Troca de cabo", "Troca de tela", "Validação de antena", 
        "Religar régua", "Reparo elétrico", "Remanejamento de rack", "Vistoria", "Outros"
    ];

    let bancoOS = [
        {
            id: "mmf3yuow",
            code: "7464",
            name: "Mirante do Vale",
            address: "Avenida Prestes Maia, 241, Centro - SP",
            service_type: "Troca de cabo",
            company: "David Lima",
            status: "agendada", 
            assigned_tech: "Evandro Artioli", // OS vinculada ao sub-técnico do David Lima
            scheduled_date: "2026-03-25T09:00",
            contact: "11 98800-8094"
        },
        {
            id: "mmf4df4l",
            code: "19926",
            name: "Spazio Fellicita Tatuapé",
            address: "Rua Arnaldo Cintra, 190 - Tatuapé",
            service_type: "Verificar Antena",
            company: "",
            status: "concluida",
            assigned_tech: "Técnico Eletromidia (João)",
            scheduled_date: "2026-03-24T14:00",
            contact: ""
        }
    ];

    let configCustos = JSON.parse(localStorage.getItem('noc_custos_avancados')) || {};
    let prestadorSelecionadoParaConfig = null;

    // =========================================
    // 2. FUNÇÕES DE UTILIDADE E PERFIL
    // =========================================
    function getIniciais(nome) {
        let partes = nome.split(/[.\s]+/);
        if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase();
        return nome.substring(0, 2).toUpperCase();
    }

    function atualizarAvatarPerfil() {
        const imgElement = document.getElementById('profileAvatar');
        const isAdmin = window.usuarioLogado.role === 'Admin master';
        const isProvider = window.usuarioLogado.role.includes('Terceiro');

        const bgColor = isAdmin ? '8b5cf6' : 'ff6600';
        imgElement.src = `https://ui-avatars.com/api/?name=${getIniciais(window.usuarioLogado.nome)}&background=${bgColor}&color=fff`;
        
        // Esconde/Mostra ações do Admin
        const adminActions = document.getElementById('adminActions');
        const btnNovaOS = document.getElementById('btnNovaOS');
        const btnConfigOS = document.getElementById('btnConfigOS');
        const btnEquipe = document.getElementById('btnEquipeTecnica');

        if (isAdmin) {
            adminActions.style.display = 'flex';
            btnNovaOS.style.display = 'inline-flex';
            btnConfigOS.style.display = 'inline-flex';
            btnEquipe.style.display = 'none';
        } else if (isProvider) {
            adminActions.style.display = 'flex';
            btnNovaOS.style.display = 'none';
            btnConfigOS.style.display = 'none';
            btnEquipe.style.display = 'inline-flex'; // Habilita gestão de equipe
        } else {
            adminActions.style.display = 'none';
        }
    }

    // =========================================
    // 3. RENDERIZAÇÃO DOS CARDS DE OS
    // =========================================
    const containerOS = document.getElementById('containerOS');

    window.renderizarOS = function() {
        const busca = document.getElementById('buscaTopBar').value.toLowerCase();
        const filtroStatus = document.getElementById('filtroStatus').value;

        let html = '';

        // Pega os nomes dos técnicos da equipe deste prestador (se houver)
        const nomesMinhaEquipe = (window.bancoTecnicos || [])
            .filter(t => t.providerUsername === window.usuarioLogado.username)
            .map(t => t.nome);

        const osFiltradas = bancoOS.filter(os => {
            // Regra HIERÁRQUICA: 
            // O provedor pode ver a OS se estiver vinculada a ele (nome ou empresa) OU se estiver vinculada a um sub-técnico dele.
            if (window.usuarioLogado.role !== 'Admin master') {
                const isMinhaOS = os.assigned_tech === window.usuarioLogado.nome || 
                                  os.company === window.usuarioLogado.nome || 
                                  nomesMinhaEquipe.includes(os.assigned_tech);
                
                if (!isMinhaOS) return false;
            }
            
            if (filtroStatus && os.status !== filtroStatus) return false;
            if (busca && !os.name.toLowerCase().includes(busca) && !os.code.includes(busca) && !os.address.toLowerCase().includes(busca) && !os.assigned_tech.toLowerCase().includes(busca)) return false;

            return true;
        });

        if (osFiltradas.length === 0) {
            containerOS.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">Nenhuma Ordem de Serviço encontrada.</div>`;
            return;
        }

        osFiltradas.forEach(os => {
            const dataFormatada = os.scheduled_date ? new Date(os.scheduled_date).toLocaleString('pt-BR', {dateStyle: 'short', timeStyle: 'short'}) : 'Sem data';
            
            let btnPrincipal = '';
            if (os.status === 'agendada' || os.status === 'deslocamento') {
                btnPrincipal = `<button class="btn btn-primary" style="flex: 1;" onclick="alterarStatusOS('${os.id}', 'concluida')"><i class="ph ph-check-circle"></i> Concluir</button>`;
            } else if (os.status === 'concluida') {
                btnPrincipal = `<button class="btn btn-outline" style="flex: 1; border-color: #10b981; color: #10b981;" disabled><i class="ph ph-check"></i> Concluído</button>`;
            } else if (os.status === 'cancelada') {
                btnPrincipal = `<button class="btn btn-outline" style="flex: 1; border-color: #ef4444; color: #ef4444;" disabled><i class="ph ph-x"></i> Cancelado</button>`;
            }

            let acoesExtras = `<button class="btn btn-outline" title="Ver no Mapa" onclick="abrirMapa('${os.address}')"><i class="ph ph-map-trifold"></i></button>`;
            
            if (window.usuarioLogado.role === 'Admin master' && os.status !== 'cancelada' && os.status !== 'concluida') {
                if (os.status !== 'deslocamento') {
                    acoesExtras += `<button class="btn btn-outline" title="Converter para Deslocamento" onclick="alterarStatusOS('${os.id}', 'deslocamento')"><i class="ph ph-car" style="color: #f59e0b;"></i></button>`;
                }
                acoesExtras += `<button class="btn btn-outline" title="Cancelar OS" onclick="alterarStatusOS('${os.id}', 'cancelada')"><i class="ph ph-x-circle" style="color: #ef4444;"></i></button>`;
            }

            const tagElevador = os.company ? `<span style="font-size: 10px; background: rgba(0,0,0,0.1); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border-color); margin-left: 5px;">${os.company}</span>` : '';

            html += `
                <div class="os-card">
                    <div class="os-header">
                        <div><span style="font-family: monospace; font-size: 12px; color: var(--text-muted);">#${os.code}</span></div>
                        <span class="os-status status-${os.status}">${os.status}</span>
                    </div>
                    
                    <div class="os-body">
                        <div class="os-body-title" title="${os.name}">${os.name}</div>
                        <div class="os-body-address"><i class="ph ph-map-pin" style="color: var(--primary);"></i> ${os.address}</div>
                        
                        <div style="background: rgba(0,0,0,0.02); padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); margin-bottom: 10px;">
                            <p style="margin-bottom: 4px;"><i class="ph ph-wrench"></i> <strong>Serviço:</strong> ${os.service_type} ${tagElevador}</p>
                            <p><i class="ph ph-user"></i> <strong>Resp:</strong> <span style="color: var(--primary); font-weight: bold;">${os.assigned_tech}</span></p>
                        </div>
                        
                        <p><i class="ph ph-calendar"></i> <strong>Data/Hora:</strong> ${dataFormatada}</p>
                        ${os.contact ? `<p style="margin-top: 6px;"><a href="https://wa.me/55${os.contact.replace(/\D/g,'')}" target="_blank" style="font-size: 13px; font-weight: bold; color: #10b981; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;"><i class="ph ph-whatsapp-logo"></i> Chamar no WhatsApp</a></p>` : ''}
                    </div>

                    <div class="os-actions">
                        ${btnPrincipal}
                        ${acoesExtras}
                    </div>
                </div>
            `;
        });

        containerOS.innerHTML = html;
    };

    window.alterarStatusOS = function(id, novoStatus) {
        const mensagens = {
            'concluida': 'Confirmar a CONCLUSÃO deste serviço?',
            'deslocamento': 'Converter esta OS para um DESLOCAMENTO (Sem execução técnica)?',
            'cancelada': 'Tem certeza que deseja CANCELAR esta OS permanentemente?'
        };

        if(confirm(mensagens[novoStatus])) {
            const os = bancoOS.find(o => o.id === id);
            if(os) {
                os.status = novoStatus;
                renderizarOS();
            }
        }
    };

    window.abrirMapa = function(endereco) {
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`, '_blank');
    };

    // =========================================
    // 4. LÓGICAS DO MODAL NOVA OS (Integração de Equipes)
    // =========================================
    function popularSelectsTecnicos() {
        const selectTerceiro = document.getElementById('osTecnicoTerceiro');
        const selectElevador = document.getElementById('osEmpresaElevador');
        
        selectTerceiro.innerHTML = '<option value="">Selecione o terceiro...</option>';
        selectElevador.innerHTML = '<option value="">Selecione...</option>';

        // Preenche com os Prestadores Cabeças (Pai)
        window.usuariosBD.forEach(u => {
            if (u.role === "Terceiro técnico de campo") {
                selectTerceiro.insertAdjacentHTML('beforeend', `<option value="${u.nome}" style="font-weight: bold;">[Prestador] ${u.nome}</option>`);
            } else if (u.role === "Terceiro empresa de elevador") {
                selectElevador.insertAdjacentHTML('beforeend', `<option value="${u.nome}" style="font-weight: bold;">[Empresa] ${u.nome}</option>`);
            }
        });

        // Preenche com as Equipes subordinadas (Filhos)
        if (window.bancoTecnicos) {
            window.bancoTecnicos.forEach(t => {
                const pai = window.usuariosBD.find(u => u.username === t.providerUsername);
                if (pai) {
                    if (pai.role === "Terceiro técnico de campo") {
                        selectTerceiro.insertAdjacentHTML('beforeend', `<option value="${t.nome}">↳ ${t.nome}</option>`);
                    } else if (pai.role === "Terceiro empresa de elevador") {
                        selectElevador.insertAdjacentHTML('beforeend', `<option value="${t.nome}">↳ ${t.nome}</option>`);
                    }
                }
            });
        }
    }

    document.getElementById('btnNovaOS').addEventListener('click', () => {
        popularSelectsTecnicos();
        document.getElementById('formNovaOS').reset();
        document.getElementById('osServicoOutros').style.display = 'none';
        document.getElementById('osTecnicoEletro').style.display = 'block';
        document.getElementById('osTecnicoTerceiro').style.display = 'none';
        document.getElementById('boxElevador').style.display = 'none';
        document.getElementById('modalNovaOS').classList.add('active');
    });

    document.getElementById('btnCopiarEnd').addEventListener('click', () => {
        const nome = document.getElementById('osNome').value.trim();
        const endereco = document.getElementById('osEndereco').value.trim();
        if (!nome && !endereco) return alert('Preencha o Nome e o Endereço primeiro!');
        navigator.clipboard.writeText(`${nome} - ${endereco}`).then(() => alert('Copiado para a área de transferência!'));
    });

    document.getElementById('osServico').addEventListener('change', (e) => {
        document.getElementById('osServicoOutros').style.display = e.target.value === 'Outros' ? 'block' : 'none';
        document.getElementById('osServicoOutros').required = e.target.value === 'Outros';
    });

    document.querySelectorAll('input[name="osTipoTecnico"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const isEletro = e.target.value === 'eletromidia';
            document.getElementById('osTecnicoEletro').style.display = isEletro ? 'block' : 'none';
            document.getElementById('osTecnicoEletro').required = isEletro;
            document.getElementById('osTecnicoTerceiro').style.display = isEletro ? 'none' : 'block';
            document.getElementById('osTecnicoTerceiro').required = !isEletro;
        });
    });

    document.getElementById('toggleElevador').addEventListener('change', (e) => {
        document.getElementById('boxElevador').style.display = e.target.checked ? 'block' : 'none';
        document.getElementById('osEmpresaElevador').required = e.target.checked;
    });

    document.getElementById('formNovaOS').addEventListener('submit', (e) => {
        e.preventDefault();
        
        let servico = document.getElementById('osServico').value;
        if (servico === 'Outros') servico = document.getElementById('osServicoOutros').value;

        const isEletro = document.querySelector('input[name="osTipoTecnico"]:checked').value === 'eletromidia';
        const tecnicoFinal = isEletro ? `Técnico Eletromidia (${document.getElementById('osTecnicoEletro').value})` : document.getElementById('osTecnicoTerceiro').value;
        const empresaElevador = document.getElementById('toggleElevador').checked ? document.getElementById('osEmpresaElevador').value : "";

        bancoOS.push({
            id: Date.now().toString(),
            code: document.getElementById('osCodigo').value,
            name: document.getElementById('osNome').value,
            address: document.getElementById('osEndereco').value,
            service_type: servico,
            company: empresaElevador,
            status: "agendada",
            assigned_tech: tecnicoFinal,
            scheduled_date: document.getElementById('osAgendamento').value,
            contact: document.getElementById('osWhatsapp').value
        });
        
        document.getElementById('modalNovaOS').classList.remove('active');
        renderizarOS();
    });

    // =========================================
    // 5. MODAL CONFIGURAÇÃO DE CUSTOS AVANÇADO
    // =========================================
    const sidebarList = document.getElementById('configSidebarList');
    const mainArea = document.getElementById('configMainArea');

    document.getElementById('btnConfigOS').addEventListener('click', () => {
        renderizarSidebarPrestadores();
        mainArea.style.display = 'none'; 
        document.getElementById('modalConfigOS').classList.add('active');
    });

    function renderizarSidebarPrestadores() {
        const prestadores = window.usuariosBD.filter(u => u.role.includes('Terceiro'));
        
        sidebarList.innerHTML = prestadores.map(p => {
            const isElevador = p.role.includes('elevador');
            const icon = isElevador ? '<i class="ph ph-buildings"></i>' : '<i class="ph ph-user-gear"></i>';
            return `
                <div class="provider-item" onclick="abrirConfigPrestador('${p.nome}')" id="prov-${p.nome.replace(/\s+/g, '')}">
                    ${icon} ${p.nome}
                </div>
            `;
        }).join('');
    }

    window.abrirConfigPrestador = function(nome) {
        prestadorSelecionadoParaConfig = nome;
        
        document.querySelectorAll('.provider-item').forEach(el => el.classList.remove('active'));
        document.getElementById(`prov-${nome.replace(/\s+/g, '')}`).classList.add('active');
        
        if (!configCustos[nome]) {
            configCustos[nome] = { tipoCobranca: 'fixo', valorFixo: 0, valorDeslocamento: 0, valoresPorMotivo: {} };
        }
        const conf = configCustos[nome];

        document.getElementById('configProviderName').innerText = nome;
        document.getElementById('configTipoCobranca').value = conf.tipoCobranca;
        document.getElementById('configValorDeslocamento').value = conf.valorDeslocamento;
        document.getElementById('configValorFixo').value = conf.valorFixo;
        
        atualizarVisibilidadePainelCobranca(conf.tipoCobranca);
        renderizarListaValoresPorServico();

        mainArea.style.display = 'block';
    };

    document.getElementById('configTipoCobranca').addEventListener('change', (e) => {
        atualizarVisibilidadePainelCobranca(e.target.value);
    });

    function atualizarVisibilidadePainelCobranca(tipo) {
        if (tipo === 'fixo') {
            document.getElementById('painelValorFixo').style.display = 'block';
            document.getElementById('painelValorServico').style.display = 'none';
        } else {
            document.getElementById('painelValorFixo').style.display = 'none';
            document.getElementById('painelValorServico').style.display = 'block';
        }
    }

    function renderizarListaValoresPorServico() {
        const conf = configCustos[prestadorSelecionadoParaConfig];
        const container = document.getElementById('listaServicosValores');
        
        container.innerHTML = todosOsServicos.map((servico, idx) => {
            const valorAtual = conf.valoresPorMotivo[servico] || 0;
            return `
                <div class="service-row">
                    <div style="width: 40px; text-align: center;"><input type="checkbox" class="check-servico" value="${servico}"></div>
                    <div style="flex: 1;">${servico}</div>
                    <div style="width: 100px;">
                        <input type="number" class="form-control input-valor-servico" data-servico="${servico}" value="${valorAtual}" style="padding: 4px 8px; height: 30px;">
                    </div>
                </div>
            `;
        }).join('');
    }

    document.getElementById('checkTodosServicos').addEventListener('change', (e) => {
        document.querySelectorAll('.check-servico').forEach(cb => cb.checked = e.target.checked);
    });

    document.getElementById('btnAplicarLote').addEventListener('click', () => {
        const valorLote = parseFloat(document.getElementById('configLoteValor').value);
        if (isNaN(valorLote)) return alert("Digite um valor válido para aplicar em lote.");

        const checkboxes = document.querySelectorAll('.check-servico:checked');
        if (checkboxes.length === 0) return alert("Selecione pelo menos um serviço na lista abaixo.");

        checkboxes.forEach(cb => {
            const servico = cb.value;
            const input = document.querySelector(`.input-valor-servico[data-servico="${servico}"]`);
            if (input) input.value = valorLote;
        });
        
        document.getElementById('checkTodosServicos').checked = false;
        checkboxes.forEach(cb => cb.checked = false);
    });

    document.getElementById('btnSalvarConfig').addEventListener('click', () => {
        if (!prestadorSelecionadoParaConfig) return;

        const conf = configCustos[prestadorSelecionadoParaConfig];
        conf.tipoCobranca = document.getElementById('configTipoCobranca').value;
        conf.valorDeslocamento = parseFloat(document.getElementById('configValorDeslocamento').value) || 0;
        conf.valorFixo = parseFloat(document.getElementById('configValorFixo').value) || 0;

        document.querySelectorAll('.input-valor-servico').forEach(input => {
            const servico = input.dataset.servico;
            conf.valoresPorMotivo[servico] = parseFloat(input.value) || 0;
        });

        localStorage.setItem('noc_custos_avancados', JSON.stringify(configCustos));
        
        const feedback = document.getElementById('saveStatusFeedback');
        feedback.style.display = 'inline';
        setTimeout(() => feedback.style.display = 'none', 3000);
    });

    // Fechar modais
    document.querySelectorAll('.btn-fechar-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal-overlay');
            if(modal) modal.classList.remove('active');
        });
    });

    // =========================================
    // 6. EVENTOS DE PESQUISA E SIMULADOR
    // =========================================
    document.getElementById('buscaTopBar').addEventListener('input', renderizarOS);
    document.getElementById('filtroStatus').addEventListener('change', renderizarOS);

    document.getElementById('simuladorCargo').addEventListener('change', (e) => {
        // Encontra o usuário na base pelo username selecionado
        const usuario = window.usuariosBD.find(u => u.username === e.target.value);
        if (usuario) {
            window.usuarioLogado = { ...usuario };
        }
        atualizarAvatarPerfil();
        renderizarOS();
    });

    atualizarAvatarPerfil();
    renderizarOS();
});