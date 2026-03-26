// scripts/adm.js
document.addEventListener('DOMContentLoaded', () => {

    let usuarioLogado = { role: "Admin master", username: "joao.santos" };

    // NOVAS CATEGORIAS ATUALIZADAS
    const niveisDeAcesso = [
        "Admin master", 
        "Vice admin", 
        "Supervisores", 
        "Analista", 
        "Terceiro técnico de campo", 
        "Terceiro empresa de elevador"
    ];

    const permDefaultMaster = { hub_n1: true, hub_n2: true, hub_n3: true, hub_gerador: true, hub_relatorio: true, hub_treinamento: true, hub_adm: true, n2_upload: true, n2_encerrar: true, n2_tratar: true, n2_consultar: true };
    const permDefaultTech = { hub_n1: false, hub_n2: false, hub_n3: false, hub_gerador: true, hub_relatorio: false, hub_treinamento: false, hub_adm: false, n2_upload: false, n2_encerrar: false, n2_tratar: false, n2_consultar: false };

    // DADOS REAIS FORNECIDOS POR VOCÊ
    let bancoUsuarios = [
        { id: 1, nome: "João Santos", username: "joao.santos", email: "joao@eletromidia.com.br", senha: "senha_segura", role: "Admin master", status: "Ativo", permissoes: {...permDefaultMaster} },
        { id: 2, nome: "Rennan Avelino", username: "rennan.avelino", email: "", senha: "", role: "Terceiro técnico de campo", status: "Ativo", permissoes: {...permDefaultTech} },
        { id: 3, nome: "David Lima", username: "david.lima", email: "", senha: "", role: "Terceiro empresa de elevador", status: "Ativo", permissoes: {...permDefaultTech} },
        { id: 4, nome: "Gilmar Alves", username: "gilmar.alves", email: "", senha: "", role: "Terceiro empresa de elevador", status: "Ativo", permissoes: {...permDefaultTech} }
    ];

    // BANCO DOS TÉCNICOS AGREGADOS
    let bancoTecnicos = [
        { id: 1, nome: "Evandro Artioli", whatsapp: "11 975508661", placa: "", providerId: 3 }, // ID 3 = david.lima
        { id: 2, nome: "Lucas de Morais", whatsapp: "11 960631307", placa: "", providerId: 3 },
        { id: 3, nome: "David Gomes", whatsapp: "11 982750559", placa: "", providerId: 3 }
    ];

    function getIniciais(nome) {
        let partes = nome.split(/[.\s]+/);
        if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase();
        return nome.substring(0, 2).toUpperCase();
    }

    function atualizarAvatarPerfil() {
        const imgElement = document.getElementById('profileAvatar');
        const bgColor = usuarioLogado.role === 'Admin master' ? '8b5cf6' : '3b82f6';
        imgElement.src = `https://ui-avatars.com/api/?name=${getIniciais(usuarioLogado.username)}&background=${bgColor}&color=fff&font-size=0.4`;
    }
    atualizarAvatarPerfil();

    const tbody = document.getElementById('tabelaUsuariosBody');

    window.renderizarTabela = function() {
        const busca = document.getElementById('buscaUsuario').value.toLowerCase();
        const filtroStatus = document.getElementById('filtroStatus').value;
        let html = '';

        bancoUsuarios.forEach(user => {
            if (filtroStatus && user.status !== filtroStatus) return;
            if (busca && !user.nome.toLowerCase().includes(busca) && !user.username.toLowerCase().includes(busca)) return;

            let roleClass = 'role-user';
            if (user.role === 'Admin master') roleClass = 'role-master';
            else if (user.role === 'Vice admin') roleClass = 'role-vice';
            else if (user.role.includes('Terceiro')) roleClass = 'role-tech';

            const statusBadge = user.status === 'Ativo' ? 'badge-ativo' : 'badge-bloqueado';
            const podeExcluir = !(usuarioLogado.role === 'Vice admin' && user.role === 'Admin master');
            const btnVerSenha = (usuarioLogado.role === 'Admin master' && !user.role.includes('Terceiro'))
                ? `<button class="icon-btn" onclick="verSenhaUsuario(${user.id})" title="Ver Senha"><i class="ph ph-eye"></i></button>` : '';

            // Renderiza o Prestador (Pai)
            html += `
                <tr>
                    <td class="${roleClass}">
                        <strong>${user.nome}</strong><br>
                        <small style="color: var(--text-muted);">@${user.username}</small>
                    </td>
                    <td>${user.email || '<span style="color: var(--text-muted); font-style: italic;">Sem email (Login apenas)</span>'}</td>
                    <td><span class="badge" style="background: rgba(0,0,0,0.05); color: var(--text-main); border: 1px solid var(--border-color);">${user.role}</span></td>
                    <td><span class="badge ${statusBadge}">${user.status}</span></td>
                    <td>
                        <div style="display: flex; gap: 5px; align-items: center;">
                            ${btnVerSenha}
                            <button class="icon-btn" onclick="editarUsuario(${user.id})" title="Editar"><i class="ph ph-pencil-simple"></i></button>
                            <button class="icon-btn" onclick="alternarBloqueio(${user.id})" title="Bloquear/Desbloquear"><i class="ph ${user.status === 'Ativo' ? 'ph-lock-key' : 'ph-lock-key-open'}"></i></button>
                            ${podeExcluir ? `<button class="icon-btn" onclick="excluirUsuario(${user.id})" title="Excluir" style="color: var(--danger);"><i class="ph ph-trash"></i></button>` : ''}
                            <button class="icon-btn" onclick="toggleCascata(${user.id})" title="Permissões do Painel"><i class="ph ph-caret-down" id="caret-${user.id}"></i></button>
                        </div>
                    </td>
                </tr>
                
                <tr id="perm-${user.id}" style="display: none;">
                    <td colspan="5" style="padding: 15px;">
                        <div class="permissoes-panel">
                            <div class="permissao-group">
                                <h4>Visibilidade do HUB</h4>
                                ${gerarToggle(user, 'hub_n2', 'N2 (Análise)')}
                                ${gerarToggle(user, 'hub_gerador', 'Gerador de OS')}
                                ${gerarToggle(user, 'hub_adm', 'Configuração ADM')}
                            </div>
                        </div>
                    </td>
                </tr>
            `;

            // Pulo do Gato: Busca os técnicos vinculados a este prestador
            const tecnicosVinculados = bancoTecnicos.filter(t => t.providerId === user.id);
            if(tecnicosVinculados.length > 0) {
                tecnicosVinculados.forEach(tech => {
                    html += `
                    <tr class="row-sub-tech">
                        <td style="padding-left: 45px; position: relative;">
                            <i class="ph ph-arrow-elbow-down-right" style="position: absolute; left: 20px; top: 20px; color: var(--text-muted); font-size: 18px;"></i>
                            <strong style="color: var(--text-muted); font-size: 13px;">${tech.nome}</strong><br>
                            <small style="color: var(--primary); font-size: 10px; font-weight: bold;">Técnico Agregado</small>
                        </td>
                        <td style="font-size: 13px; color: var(--text-muted);"><i class="ph ph-whatsapp-logo" style="color: #10b981;"></i> ${tech.whatsapp}</td>
                        <td><span class="badge" style="background: transparent; color: var(--text-muted); border: 1px dashed var(--border-color);">Equipe de @${user.username}</span></td>
                        <td>-</td>
                        <td style="font-size: 12px; color: var(--text-muted);">Placa: ${tech.placa || 'Não informada'}</td>
                    </tr>`;
                });
            }
        });

        tbody.innerHTML = html;
    };

    function gerarToggle(user, chavePermissao, label) {
        const isChecked = user.permissoes[chavePermissao] ? 'checked' : '';
        return `<div class="permissao-item"><span>${label}</span><label class="switch"><input type="checkbox" ${isChecked} onchange="atualizarPermissao(${user.id}, '${chavePermissao}', this.checked)"><span class="slider"></span></label></div>`;
    }

    window.toggleCascata = (id) => {
        const tr = document.getElementById(`perm-${id}`);
        const icon = document.getElementById(`caret-${id}`);
        const isHidden = tr.style.display === 'none';
        tr.style.display = isHidden ? 'table-row' : 'none';
        icon.className = isHidden ? 'ph ph-caret-up' : 'ph ph-caret-down';
    };

    window.atualizarPermissao = (id, chave, valor) => {
        const user = bancoUsuarios.find(u => u.id === id);
        if(user) user.permissoes[chave] = valor;
    };

    function popularSelectCargos() {
        const select = document.getElementById('userRole');
        select.innerHTML = '<option value="">Selecione...</option>';
        niveisDeAcesso.forEach(nivel => {
            if (usuarioLogado.role === 'Vice admin' && nivel === 'Admin master') return;
            select.innerHTML += `<option value="${nivel}">${nivel}</option>`;
        });
    }

    document.getElementById('userRole').addEventListener('change', (e) => {
        const containerSenha = document.getElementById('containerSenha');
        const inputSenha = document.getElementById('userSenha');
        if (e.target.value.includes('Terceiro')) {
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
            document.getElementById('userRole').dispatchEvent(new Event('change'));
            document.getElementById('modalUsuario').classList.add('active');
        }
    };

    document.getElementById('btnNovoUsuario').addEventListener('click', () => {
        popularSelectCargos();
        document.getElementById('formUsuario').reset();
        document.getElementById('userId').value = '';
        document.getElementById('modalUsuarioTitulo').innerHTML = '<i class="ph ph-user-plus"></i> Novo Usuário';
        document.getElementById('userRole').dispatchEvent(new Event('change'));
        document.getElementById('modalUsuario').classList.add('active');
    });

    document.getElementById('formUsuario').addEventListener('submit', (e) => {
        e.preventDefault();
        const role = document.getElementById('userRole').value;
        const idStr = document.getElementById('userId').value;
        
        if (!idStr) { // Novo
            bancoUsuarios.push({
                id: Date.now(),
                nome: document.getElementById('userNome').value,
                username: document.getElementById('userUsername').value,
                email: document.getElementById('userEmail').value,
                senha: role.includes('Terceiro') ? "" : document.getElementById('userSenha').value,
                role: role,
                status: "Ativo",
                permissoes: role.includes('Terceiro') ? {...permDefaultTech} : {...permDefaultMaster}
            });
        }
        document.getElementById('modalUsuario').classList.remove('active');
        renderizarTabela();
    });

    document.getElementById('simuladorCargo').addEventListener('change', (e) => {
        usuarioLogado.role = e.target.value;
        renderizarTabela();
    });

    document.querySelectorAll('.btn-fechar-modal').forEach(btn => btn.addEventListener('click', e => e.target.closest('.modal-overlay').classList.remove('active')));

    renderizarTabela();
});