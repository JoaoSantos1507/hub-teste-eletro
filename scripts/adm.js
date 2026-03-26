document.addEventListener('DOMContentLoaded', () => {

    // =========================================
    // 1. ESTADO GLOBAL E SIMULAÇÃO DE BACK-END
    // =========================================
    
    // Simula o usuário logado e atualiza suas iniciais
    let usuarioLogado = {
        role: "Admin master",
        username: "joao.santos" // Exemplo
    };

    const niveisDeAcesso = [
        "Admin master", 
        "Vice admin", 
        "Supervisores", 
        "Analista", 
        "Técnicos de campo terceiro", 
        "Técnico empresa de elevador"
    ];

    // Permissões padrão para novos usuários baseados no cargo
    const permDefaultMaster = { hub_n1: true, hub_n2: true, hub_n3: true, hub_gerador: true, hub_relatorio: true, hub_treinamento: true, hub_adm: true, n2_upload: true, n2_encerrar: true, n2_tratar: true, n2_consultar: true };
    const permDefaultTech = { hub_n1: false, hub_n2: false, hub_n3: false, hub_gerador: true, hub_relatorio: false, hub_treinamento: false, hub_adm: false, n2_upload: false, n2_encerrar: false, n2_tratar: false, n2_consultar: false };

    // Banco de Dados Mockado (Pronto para API)
    let bancoUsuarios = [
        { id: 1, nome: "João Santos", username: "joao.santos", email: "joao@eletromidia.com.br", senha: "senha_segura", role: "Admin master", status: "Ativo", permissoes: {...permDefaultMaster} },
        { id: 2, nome: "Ana Paula", username: "ana.paula", email: "ana.paula@eletromidia.com.br", senha: "senha_vice", role: "Vice admin", status: "Ativo", permissoes: {...permDefaultMaster, hub_adm: false} },
        { id: 3, nome: "Marcos Nogueira", username: "marcos.nogueira", email: "marcos@parceiro.com.br", senha: "senha_super", role: "Supervisores", status: "Ativo", permissoes: { hub_n1: true, hub_n2: true, hub_n3: true, hub_gerador: true, hub_relatorio: true, hub_treinamento: true, hub_adm: false, n2_upload: false, n2_encerrar: true, n2_tratar: true, n2_consultar: true } },
        { id: 4, nome: "Técnico Silva", username: "tec.silva", email: "", senha: "", role: "Técnicos de campo terceiro", status: "Ativo", permissoes: {...permDefaultTech} },
        { id: 5, nome: "Elevadores Z", username: "elevadores.z", email: "contato@elevadores.com", senha: "", role: "Técnico empresa de elevador", status: "Ativo", permissoes: {...permDefaultTech} }
    ];

    // =========================================
    // 2. FUNÇÕES DE UTILIDADE (AVATAR INICIAIS)
    // =========================================
    function getIniciais(nomeOuUsuario) {
        // Divide por ponto ou espaço
        let partes = nomeOuUsuario.split(/[.\s]+/);
        if (partes.length >= 2) {
            return (partes[0][0] + partes[1][0]).toUpperCase();
        }
        return nomeOuUsuario.substring(0, 2).toUpperCase();
    }

    function atualizarAvatarPerfil() {
        const imgElement = document.getElementById('profileAvatar');
        const bgColor = usuarioLogado.role === 'Admin master' ? '8b5cf6' : '3b82f6';
        const iniciais = getIniciais(usuarioLogado.username);
        imgElement.src = `https://ui-avatars.com/api/?name=${iniciais}&background=${bgColor}&color=fff&font-size=0.4`;
    }
    atualizarAvatarPerfil();

    // =========================================
    // 3. RENDERIZAÇÃO DA TABELA E CASCATA
    // =========================================
    const tbody = document.getElementById('tabelaUsuariosBody');

    window.renderizarTabela = function() {
        const busca = document.getElementById('buscaUsuario').value.toLowerCase();
        const filtroStatus = document.getElementById('filtroStatus').value;

        let html = '';

        bancoUsuarios.forEach(user => {
            if (filtroStatus && user.status !== filtroStatus) return;
            if (busca && !user.nome.toLowerCase().includes(busca) && !user.username.toLowerCase().includes(busca) && !user.email.toLowerCase().includes(busca)) return;

            let roleClass = 'role-user';
            if (user.role === 'Admin master') roleClass = 'role-master';
            else if (user.role === 'Vice admin') roleClass = 'role-vice';
            else if (user.role.includes('Técnico')) roleClass = 'role-tech';

            const statusBadge = user.status === 'Ativo' ? 'badge-ativo' : 'badge-bloqueado';
            const podeExcluir = !(usuarioLogado.role === 'Vice admin' && user.role === 'Admin master');
            
            const btnVerSenha = (usuarioLogado.role === 'Admin master' && !user.role.includes('Técnico'))
                ? `<button class="icon-btn" onclick="verSenhaUsuario(${user.id})" title="Ver Senha"><i class="ph ph-eye"></i></button>`
                : '';

            html += `
                <tr>
                    <td class="${roleClass}">
                        <strong>${user.nome}</strong><br>
                        <small style="color: var(--text-muted);">@${user.username}</small>
                    </td>
                    <td>${user.email || '<span style="color: var(--text-muted); font-style: italic;">Sem email</span>'}</td>
                    <td><span class="badge" style="background: rgba(0,0,0,0.05); color: var(--text-main); border: 1px solid var(--border-color);">${user.role}</span></td>
                    <td><span class="badge ${statusBadge}">${user.status}</span></td>
                    <td>
                        <div style="display: flex; gap: 5px; align-items: center;">
                            ${btnVerSenha}
                            <button class="icon-btn" onclick="editarUsuario(${user.id})" title="Editar"><i class="ph ph-pencil-simple"></i></button>
                            <button class="icon-btn" onclick="alternarBloqueio(${user.id})" title="${user.status === 'Ativo' ? 'Bloquear' : 'Desbloquear'}"><i class="ph ${user.status === 'Ativo' ? 'ph-lock-key' : 'ph-lock-key-open'}"></i></button>
                            ${podeExcluir ? `<button class="icon-btn" onclick="excluirUsuario(${user.id})" title="Excluir" style="color: var(--danger);"><i class="ph ph-trash"></i></button>` : ''}
                            <button class="icon-btn" onclick="toggleCascata(${user.id})" title="Permissões">
                                <i class="ph ph-caret-down" id="caret-${user.id}"></i>
                            </button>
                        </div>
                    </td>
                </tr>
                <tr id="perm-${user.id}" style="display: none;">
                    <td colspan="5" style="padding: 15px;">
                        <div class="permissoes-panel">
                            
                            <div class="permissao-group">
                                <h4>Visibilidade do HUB</h4>
                                ${gerarToggle(user, 'hub_n1', 'N1 (Triagem)')}
                                ${gerarToggle(user, 'hub_n2', 'N2 (Análise)')}
                                ${gerarToggle(user, 'hub_n3', 'N3 (Engenharia)')}
                                ${gerarToggle(user, 'hub_gerador', 'Gerador de OS')}
                                ${gerarToggle(user, 'hub_relatorio', 'Relatórios')}
                                ${gerarToggle(user, 'hub_treinamento', 'Portal Treinamento')}
                                ${gerarToggle(user, 'hub_adm', 'Configuração ADM')}
                            </div>

                            <div class="permissao-group">
                                <h4>Permissões: Análise N2</h4>
                                ${gerarToggle(user, 'n2_consultar', 'Consultar Chamados')}
                                ${gerarToggle(user, 'n2_upload', 'Subir Novas Planilhas')}
                                ${gerarToggle(user, 'n2_tratar', 'Tratar Chamados (Motivos)')}
                                ${gerarToggle(user, 'n2_encerrar', 'Encerrar Chamados')}
                            </div>

                        </div>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    };

    // Gera o HTML do switch
    function gerarToggle(user, chavePermissao, label) {
        const isChecked = user.permissoes[chavePermissao] ? 'checked' : '';
        return `
            <div class="permissao-item">
                <span>${label}</span>
                <label class="switch">
                    <input type="checkbox" ${isChecked} onchange="atualizarPermissao(${user.id}, '${chavePermissao}', this.checked)">
                    <span class="slider"></span>
                </label>
            </div>
        `;
    }

    // =========================================
    // 4. AÇÕES DA TABELA E CASCATA
    // =========================================

    window.toggleCascata = function(id) {
        const tr = document.getElementById(`perm-${id}`);
        const icon = document.getElementById(`caret-${id}`);
        if (tr.style.display === 'none') {
            tr.style.display = 'table-row';
            icon.classList.replace('ph-caret-down', 'ph-caret-up');
        } else {
            tr.style.display = 'none';
            icon.classList.replace('ph-caret-up', 'ph-caret-down');
        }
    };

    window.atualizarPermissao = function(idUser, chave, valorBooleano) {
        const user = bancoUsuarios.find(u => u.id === idUser);
        if(user) {
            user.permissoes[chave] = valorBooleano;
            // Opcional: Console log para simular chamada na API
            console.log(`Atualizando BD -> Usuário: ${user.username} | Permissão: ${chave} = ${valorBooleano}`);
        }
    };

    window.verSenhaUsuario = function(id) {
        const user = bancoUsuarios.find(u => u.id === id);
        if (user) alert(`A senha de @${user.username} é: \n\n${user.senha}`);
    };

    window.alternarBloqueio = function(id) {
        const user = bancoUsuarios.find(u => u.id === id);
        if (user) {
            if (usuarioLogado.role === 'Vice admin' && user.role === 'Admin master') return alert("Ação não permitida.");
            user.status = user.status === 'Ativo' ? 'Bloqueado' : 'Ativo';
            renderizarTabela();
        }
    };

    window.excluirUsuario = function(id) {
        if(confirm("Tem certeza que deseja excluir este usuário permanentemente?")) {
            bancoUsuarios = bancoUsuarios.filter(u => u.id !== id);
            renderizarTabela();
        }
    };

    // =========================================
    // 5. GESTÃO DE MODAIS E FORMULÁRIOS
    // =========================================
    
    function popularSelectCargos() {
        const select = document.getElementById('userRole');
        select.innerHTML = '<option value="">Selecione...</option>';
        niveisDeAcesso.forEach(nivel => {
            if (usuarioLogado.role === 'Vice admin' && nivel === 'Admin master') return;
            select.innerHTML += `<option value="${nivel}">${nivel}</option>`;
        });
    }

    // Lógica para esconder a senha se for Técnico
    document.getElementById('userRole').addEventListener('change', (e) => {
        const containerSenha = document.getElementById('containerSenha');
        const inputSenha = document.getElementById('userSenha');
        
        if (e.target.value.includes('Técnico')) {
            containerSenha.style.display = 'none';
            inputSenha.required = false;
        } else {
            containerSenha.style.display = 'block';
            inputSenha.required = true;
        }
    });

    window.editarUsuario = function(id) {
        popularSelectCargos();
        document.getElementById('modalUsuarioTitulo').innerHTML = '<i class="ph ph-pencil-simple"></i> Editar Usuário';
        
        const user = bancoUsuarios.find(u => u.id === id);
        if (user) {
            document.getElementById('userId').value = user.id;
            document.getElementById('userNome').value = user.nome;
            document.getElementById('userUsername').value = user.username;
            document.getElementById('userEmail').value = user.email;
            document.getElementById('userRole').value = user.role;
            
            // Dispara o evento change para esconder a senha se for técnico
            const event = new Event('change');
            document.getElementById('userRole').dispatchEvent(event);

            const inputSenha = document.getElementById('userSenha');
            if (usuarioLogado.role === 'Admin master') {
                inputSenha.value = user.senha;
                inputSenha.disabled = false;
            } else {
                inputSenha.value = "********";
                inputSenha.disabled = true; 
            }
        }
        document.getElementById('modalUsuario').classList.add('active');
    };

    document.getElementById('btnNovoUsuario').addEventListener('click', () => {
        popularSelectCargos();
        document.getElementById('formUsuario').reset();
        document.getElementById('userId').value = '';
        document.getElementById('modalUsuarioTitulo').innerHTML = '<i class="ph ph-user-plus"></i> Novo Usuário';
        document.getElementById('userSenha').disabled = false;
        
        // Dispara change para mostrar a senha por padrão
        const event = new Event('change');
        document.getElementById('userRole').dispatchEvent(event);

        document.getElementById('modalUsuario').classList.add('active');
    });

    // Submissão do Formulário
    document.getElementById('formUsuario').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const idStr = document.getElementById('userId').value;
        const nome = document.getElementById('userNome').value;
        const username = document.getElementById('userUsername').value;
        const email = document.getElementById('userEmail').value;
        const role = document.getElementById('userRole').value;
        const senha = document.getElementById('userSenha').value;

        if (idStr) {
            // Edição
            const user = bancoUsuarios.find(u => u.id === parseInt(idStr));
            if (user) {
                user.nome = nome;
                user.username = username;
                user.email = email;
                user.role = role;
                if (usuarioLogado.role === 'Admin master') user.senha = senha;
            }
        } else {
            // Criação
            const novoId = bancoUsuarios.length > 0 ? Math.max(...bancoUsuarios.map(u => u.id)) + 1 : 1;
            
            // Define permissões padrão baseadas no cargo
            let permIniciais = role.includes('Técnico') ? {...permDefaultTech} : {...permDefaultMaster};

            bancoUsuarios.push({
                id: novoId,
                nome: nome,
                username: username,
                email: email,
                senha: role.includes('Técnico') ? "" : senha,
                role: role,
                status: "Ativo",
                permissoes: permIniciais
            });
        }

        document.getElementById('modalUsuario').classList.remove('active');
        renderizarTabela();
    });

    // =========================================
    // 6. EVENTOS GERAIS E SIMULADOR
    // =========================================
    
    document.getElementById('btnConfigGlobais').addEventListener('click', () => {
        document.getElementById('modalGlobais').classList.add('active');
    });

    document.querySelectorAll('.btn-fechar-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal-overlay');
            if(modal) modal.classList.remove('active');
        });
    });

    document.getElementById('buscaUsuario').addEventListener('input', renderizarTabela);
    document.getElementById('filtroStatus').addEventListener('change', renderizarTabela);

    document.getElementById('simuladorCargo').addEventListener('change', (e) => {
        usuarioLogado.role = e.target.value;
        usuarioLogado.username = e.target.value === 'Admin master' ? 'joao.santos' : 'vice.admin';
        atualizarAvatarPerfil();
        renderizarTabela();
    });

    renderizarTabela();
});