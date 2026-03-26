document.addEventListener('DOMContentLoaded', () => {
    
    // Tornando variáveis globais para o acoes.js acessar
    window.chamadosGlobais = [];

    // =========================================
    // BANCO DE DADOS LOCAL E PREVENÇÃO DE ERROS
    // =========================================
    window.listaMateriaisPadrao = [
        "MONITOR 21,5 - POSITIVO MASTER A1120 (RESIDENCIAL)",
        "MONITOR 21,5 - LG 22MP55 (RESIDENCIAL) - CINZA",
        "MONITOR PRO 21,5\" ALL IN ONE - PROTOTYPE SEM WIFI",
        "MONITOR 19,5 - LG 20M35",
        "MONITOR 18,5 - LG 19EB13",
        "ANTENA INTELBRAS MIMO M5",
        "MÁQUINA DELL",
        "MÁQUINA NUC DELL",
        "MÁQUINA NUC LENOVO",
        "BOX VIVO 4G",
        "BOX CLARO 4G",
        "MODEM ELSYS",
        "REGUA 3 TOMADAS COM FUSIVEL",
        "SUPORTE RESIDENCIAL 21,5\"",
        "SUPORTE SPART-185",
        "SUPORTE SPFIX",
        "CABO PP 3X1,5MM",
        "CABO LAN UC300HS26 SF/UTP"
    ];

    window.materiaisCustomizados = [];
    window.materiaisPorChamado = {};
    window.statusPorChamado = {};
    
    // NOVOS ESTADOS (Motivos, Crítico, Encerrado)
    window.motivosPorChamado = {};
    window.criticoPorChamado = {};
    window.encerradoPorChamado = {};
    
    window.chamadoAtualModal = null; 

    try { window.materiaisCustomizados = JSON.parse(localStorage.getItem('noc_materiais_custom')) || []; } catch(e){}
    try { window.materiaisPorChamado = JSON.parse(localStorage.getItem('noc_materiais_chamados')) || {}; } catch(e){}
    try { window.statusPorChamado = JSON.parse(localStorage.getItem('noc_status_chamados')) || {}; } catch(e){}
    try { window.motivosPorChamado = JSON.parse(localStorage.getItem('noc_motivos_chamados')) || {}; } catch(e){}
    try { window.criticoPorChamado = JSON.parse(localStorage.getItem('noc_critico_chamados')) || {}; } catch(e){}
    try { window.encerradoPorChamado = JSON.parse(localStorage.getItem('noc_encerrado_chamados')) || {}; } catch(e){}

    if (!Array.isArray(window.materiaisCustomizados)) window.materiaisCustomizados = [];

    // =========================================
    // FUNÇÕES DE AÇÃO DA TABELA (Chamadas via Delegação)
    // =========================================
    
    function toggleHistorico(divElement) {
        if (divElement.classList.contains('expandido')) {
            divElement.classList.remove('expandido');
            divElement.style.webkitLineClamp = '2';
            divElement.style.whiteSpace = 'normal';
            divElement.style.borderColor = 'transparent';
        } else {
            divElement.classList.add('expandido');
            divElement.style.webkitLineClamp = 'unset';
            divElement.style.whiteSpace = 'pre-wrap';
            divElement.style.borderColor = '#ccc'; 
        }
    }

    function toggleCascata(btnElement) {
        const trAtual = btnElement.closest('tr');
        const trDetalhe = trAtual.nextElementSibling;
        if (trDetalhe) {
            const isVisible = trDetalhe.style.display === 'table-row';
            trDetalhe.style.display = isVisible ? 'none' : 'table-row';
            btnElement.innerHTML = isVisible ? '<i class="ph ph-caret-down"></i>' : '<i class="ph ph-caret-up"></i>';
        }
    }

    // =========================================
    // DELEGAÇÃO DE EVENTOS GERAIS DA TABELA
    // =========================================
    const tableBody = document.getElementById('tableBody');
    if (tableBody) {
        tableBody.addEventListener('click', (e) => {
            const btnMaterial = e.target.closest('.btn-abrir-modal');
            if (btnMaterial) {
                abrirModalMaterial(btnMaterial.dataset.id);
                return;
            }

            const btnCascata = e.target.closest('.btn-toggle-cascata');
            if (btnCascata) {
                toggleCascata(btnCascata);
                return;
            }

            const divHistorico = e.target.closest('.historico-text');
            if (divHistorico) {
                toggleHistorico(divHistorico);
                return;
            }
        });
    }

    // =========================================
    // 1. GESTÃO DO TEMA
    // =========================================
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    
    if (themeIcon && localStorage.getItem('noc_theme') === 'light') {
        themeIcon.classList.replace('ph-sun', 'ph-moon');
    }
    
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            document.documentElement.classList.toggle('light-mode');
            document.body.classList.toggle('light-mode');
            
            if (document.body.classList.contains('light-mode')) {
                localStorage.setItem('noc_theme', 'light');
                if (themeIcon) themeIcon.classList.replace('ph-sun', 'ph-moon');
            } else {
                localStorage.setItem('noc_theme', 'dark');
                if (themeIcon) themeIcon.classList.replace('ph-moon', 'ph-sun');
            }
        });
    }

    // =========================================
    // 2. SISTEMA DE UPLOAD (DRAG & DROP)
    // =========================================
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileUpload');

    if (dropArea && fileInput) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            window.addEventListener(eventName, preventDefaults, false);
            document.body.addEventListener(eventName, preventDefaults, false);
            dropArea.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }

        ['dragenter', 'dragover'].forEach(eventName => dropArea.addEventListener(eventName, () => dropArea.classList.add('drag-active'), false));
        ['dragleave', 'drop'].forEach(eventName => dropArea.addEventListener(eventName, () => dropArea.classList.remove('drag-active'), false));

        dropArea.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            if (dt.files && dt.files.length > 0) lerArquivoExcel(dt.files[0]);
        }, false);

        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) lerArquivoExcel(e.target.files[0]);
            e.target.value = ''; 
        });
    }

    // =========================================
    // 3. LEITURA DA PLANILHA
    // =========================================
    function lerArquivoExcel(file) {
        const validExtensions = ['.xlsx', '.xls', '.csv'];
        const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        
        if (!validExtensions.includes(fileExt)) {
            alert("Formato inválido! Por favor, insira um arquivo .xlsx, .xls ou .csv");
            return;
        }

        const tituloDrop = dropArea.querySelector('h3');
        const textoOriginal = tituloDrop.innerText;
        tituloDrop.innerText = "Lendo planilha, aguarde...";

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const dataRaw = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                const linhasUteis = dataRaw.slice(4).filter(row => row && row[0]);

                if (linhasUteis.length === 0) {
                    alert("A planilha parece estar vazia ou fora do padrão esperado.");
                    tituloDrop.innerText = textoOriginal;
                    return;
                }

                window.chamadosGlobais = linhasUteis;
                window.popularFiltros(window.chamadosGlobais);
                window.aplicarFiltros(); // Usa aplicarFiltros em vez de renderizar direto para pegar ordem
                tituloDrop.innerText = textoOriginal;
            } catch (erro) {
                alert("Ocorreu um erro ao ler a planilha. Verifique se o arquivo não está corrompido.");
                tituloDrop.innerText = textoOriginal;
            }
        };
        reader.readAsArrayBuffer(file);
    }

    // =========================================
    // 4. SISTEMA DE FILTROS GLOBAIS
    // =========================================
    const searchInput = document.getElementById('searchInput');
    const filterPraca = document.getElementById('filterPraca');
    const filterTecnico = document.getElementById('filterTecnico');
    const filterMaterial = document.getElementById('filterMaterial');
    const filterOrdem = document.getElementById('filterOrdem');
    const filterCritico = document.getElementById('filterCritico');
    const filterMotivo = document.getElementById('filterMotivo');

    window.popularFiltros = function(data) {
        const contagemPraca = {};
        const contagemTecnico = {};
        const contagemMaterial = {};
        const contagemMotivo = {};

        data.forEach(row => {
            const id = row[0] ? row[0].toString() : '';
            const praca = row[14] ? row[14].toString().trim() : 'Sem Praça';
            const tecnico = row[23] ? row[23].toString().trim() : 'Sem Técnico';

            contagemPraca[praca] = (contagemPraca[praca] || 0) + 1;
            contagemTecnico[tecnico] = (contagemTecnico[tecnico] || 0) + 1;

            // Só conta materiais pendentes de chamados NÃO ENCERRADOS
            if(window.materiaisPorChamado[id] && !window.encerradoPorChamado[id]) {
                const materiaisUnicosNesteChamado = new Set(window.materiaisPorChamado[id].map(m => m.nome));
                materiaisUnicosNesteChamado.forEach(nomeMat => {
                    contagemMaterial[nomeMat] = (contagemMaterial[nomeMat] || 0) + 1;
                });
            }

            // Conta os Motivos
            if(window.motivosPorChamado[id]) {
                window.motivosPorChamado[id].forEach(motivo => {
                    contagemMotivo[motivo] = (contagemMotivo[motivo] || 0) + 1;
                });
            }
        });

        filterPraca.innerHTML = '<option value="">Todas as Praças</option>';
        filterTecnico.innerHTML = '<option value="">Todos os Técnicos</option>';
        filterMaterial.innerHTML = '<option value="">Todos os Materiais</option>';
        filterMotivo.innerHTML = '<option value="">Todos os Motivos</option>';

        Object.keys(contagemPraca).sort().forEach(p => filterPraca.insertAdjacentHTML('beforeend', `<option value="${p}">${p} (${contagemPraca[p]})</option>`));
        Object.keys(contagemTecnico).sort().forEach(t => filterTecnico.insertAdjacentHTML('beforeend', `<option value="${t}">${t} (${contagemTecnico[t]})</option>`));
        Object.keys(contagemMaterial).sort().forEach(m => filterMaterial.insertAdjacentHTML('beforeend', `<option value="${m}">${m} (Pendentes: ${contagemMaterial[m]})</option>`));
        Object.keys(contagemMotivo).sort().forEach(m => filterMotivo.insertAdjacentHTML('beforeend', `<option value="${m}">${m} (${contagemMotivo[m]})</option>`));
    };

    window.aplicarFiltros = function() {
        if(!window.chamadosGlobais || window.chamadosGlobais.length === 0) return;

        const termo = searchInput.value.toLowerCase();
        const pracaSelecionada = filterPraca.value;
        const tecnicoSelecionado = filterTecnico.value;
        const materialSelecionado = filterMaterial.value;
        const motivoSelecionado = filterMotivo.value;
        const criticoSelecionado = filterCritico.value;

        // Adicionando processamento de datas para poder ordenar
        let dadosTratados = window.chamadosGlobais.map(row => {
            const dataCriacaoStr = row[21] ? row[21].toString() : '';
            let dataObj = new Date(0); // Padrão se não achar
            
            if (dataCriacaoStr) {
                if (!isNaN(dataCriacaoStr) && dataCriacaoStr.trim() !== "") {
                   dataObj = new Date((parseFloat(dataCriacaoStr) - (25567 + 1)) * 86400 * 1000);
                } else {
                   const parts = dataCriacaoStr.split(/[\/\-\s:]/);
                   if(parts.length >= 3 && parts[0].length === 2) { 
                       dataObj = new Date(parts[2], parts[1]-1, parts[0]); 
                   } else {
                       dataObj = new Date(dataCriacaoStr);
                   }
                }
            }
            return { row: row, dataObj: dataObj };
        });

        // Ordenação por data
        const ordemSelecionada = filterOrdem.value;
        dadosTratados.sort((a, b) => {
            if (ordemSelecionada === 'recentes') return b.dataObj - a.dataObj;
            return a.dataObj - b.dataObj; // antigos
        });

        // Extrai de volta os arrays das linhas após ordenar
        const dadosOrdenados = dadosTratados.map(item => item.row);

        const dadosFiltrados = dadosOrdenados.filter(row => {
            const id = row[0] ? row[0].toString() : '';
            const elt = row[1] ? row[1].toString().toLowerCase() : '';
            const codPonto = row[2] ? row[2].toString().toLowerCase() : '';
            const ponto = row[4] ? row[4].toString().toLowerCase() : '';
            const endereco = row[5] ? row[5].toString().toLowerCase() : '';
            const praca = row[14] ? row[14].toString().trim() : 'Sem Praça';
            const tecnico = row[23] ? row[23].toString().trim() : 'Sem Técnico';

            const matchPraca = pracaSelecionada === "" || praca === pracaSelecionada;
            const matchTecnico = tecnicoSelecionado === "" || tecnico === tecnicoSelecionado;
            
            let matchMaterial = true;
            if(materialSelecionado !== "") {
                matchMaterial = window.materiaisPorChamado[id] ? window.materiaisPorChamado[id].some(m => m.nome === materialSelecionado) : false;
            }

            let matchMotivo = true;
            if(motivoSelecionado !== "") {
                matchMotivo = window.motivosPorChamado[id] ? window.motivosPorChamado[id].includes(motivoSelecionado) : false;
            }

            let matchCritico = true;
            if(criticoSelecionado === "sim") {
                matchCritico = !!window.criticoPorChamado[id];
            }

            const matchBusca = termo === "" || id.toLowerCase().includes(termo) || elt.includes(termo) || codPonto.includes(termo) || ponto.includes(termo) || endereco.includes(termo) || tecnico.toLowerCase().includes(termo);

            return matchPraca && matchTecnico && matchMaterial && matchMotivo && matchCritico && matchBusca;
        });

        window.renderizarTabela(dadosFiltrados);
    };

    // Eventos dos filtros
    [searchInput, filterPraca, filterTecnico, filterMaterial, filterOrdem, filterCritico, filterMotivo].forEach(el => {
        if(el) el.addEventListener('change', window.aplicarFiltros);
        if(el === searchInput) el.addEventListener('input', window.aplicarFiltros);
    });

    // =========================================
    // 5. RENDERIZAÇÃO DA TABELA
    // =========================================
    window.renderizarTabela = function(data) {
        let rowsHtml = ''; 

        data.forEach((row, index) => {
            const id = row[0] ? row[0].toString() : `TEMP-${index + 1}`;          
            const elt = row[1] ? row[1].toString() : 'N/A';                       
            const codPonto = row[2] ? row[2].toString() : 'N/A';                  
            const ponto = row[4] ? row[4].toString() : 'Sem Nome';                
            const endereco = row[5] ? row[5].toString() : 'Sem Endereço';         
            const ambiente = row[9] ? row[9].toString() : 'N/A';                  
            const praca = row[14] ? row[14].toString() : 'N/A';                   
            const areaTrabalho = row[15] ? row[15].toString() : 'N/A';            
            const dataCriacaoStr = row[21] ? row[21].toString() : '';             
            const tecnico = row[23] ? row[23].toString() : 'Sem Técnico';         
            const primeiroHistorico = row[29] ? row[29].toString() : 'Vazio';     
            const ultimoHistorico = row[32] ? row[32].toString() : 'Sem atualização'; 
            
            let diasAbertos = 0;
            if (dataCriacaoStr) {
                let dataCriacao;
                if (!isNaN(dataCriacaoStr) && dataCriacaoStr.trim() !== "") {
                   dataCriacao = new Date((parseFloat(dataCriacaoStr) - (25567 + 1)) * 86400 * 1000);
                } else {
                   const parts = dataCriacaoStr.split(/[\/\-\s:]/);
                   if(parts.length >= 3 && parts[0].length === 2) { 
                       dataCriacao = new Date(parts[2], parts[1]-1, parts[0]); 
                   } else {
                       dataCriacao = new Date(dataCriacaoStr);
                   }
                }
                if (!isNaN(dataCriacao)) {
                    diasAbertos = Math.floor(Math.abs(new Date() - dataCriacao) / (1000 * 60 * 60 * 24));
                }
            }

            // Geração de Tags de Materiais e Motivos
            let tagsHtml = '';
            let hasTags = false;

            if (window.materiaisPorChamado[id] && window.materiaisPorChamado[id].length > 0) {
                hasTags = true;
                tagsHtml += '<div style="margin-top: 8px; border-top: 1px dashed var(--border-color, #ccc); padding-top: 5px;">';
                window.materiaisPorChamado[id].forEach(mat => tagsHtml += `<span class="tag-material">${mat.qtd} - ${mat.nome}</span>`);
            }
            
            if (window.motivosPorChamado[id] && window.motivosPorChamado[id].length > 0) {
                if(!hasTags) {
                    tagsHtml += '<div style="margin-top: 8px; border-top: 1px dashed var(--border-color, #ccc); padding-top: 5px;">';
                    hasTags = true;
                }
                window.motivosPorChamado[id].forEach(motivo => tagsHtml += `<span class="tag-motivo">${motivo}</span>`);
            }

            if(hasTags) tagsHtml += '</div>';

            const statusSalvo = window.statusPorChamado[id] || "";
            const isCritico = window.criticoPorChamado[id];
            const isEncerrado = window.encerradoPorChamado[id];

            // Classes da linha para cores
            let trClasses = [];
            if (isCritico) trClasses.push('row-critico');
            if (isEncerrado) trClasses.push('row-encerrado');

            rowsHtml += `
                <tr class="${trClasses.join(' ')}">
                    <td><input type="checkbox" class="ticket-checkbox"></td>
                    <td>
                        <strong>#${id}</strong><br>
                        <small style="color: var(--text-muted)">ELT: ${elt}</small><br>
                        <small style="color: var(--text-muted); font-weight: bold;">Aberto há: ${diasAbertos} dia(s)</small>
                    </td>
                    <td>${codPonto}</td>
                    <td>
                        ${ponto}<br>
                        <small style="color: var(--text-muted)">${endereco}</small><br>
                        <small style="color: var(--text-muted)"><strong>Ambiente:</strong> ${ambiente} | <strong>Praça:</strong> ${praca}</small>
                    </td>
                    <td>
                        ${tecnico}<br>
                        <small style="color: var(--text-muted)"><strong>Área:</strong> ${areaTrabalho}</small>
                        ${tagsHtml}
                    </td>
                    <td>
                        <div class="historico-text" title="Clique para ler tudo" style="width: 250px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; cursor: pointer; font-size: 0.85em; color: var(--text-muted); white-space: normal; background-color: rgba(0,0,0,0.02); padding: 5px; border-radius: 4px; border: 1px solid transparent;">
                            <strong style="color: #333;">Último:</strong> ${ultimoHistorico}
                        </div>
                    </td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <button type="button" class="icon-btn btn-abrir-modal" data-id="${id}" title="Adicionar Material">
                                <i class="ph ph-package"></i>
                            </button>
                            
                            <button type="button" class="icon-btn btn-critico" data-id="${id}" title="${isCritico ? 'Remover Crítico' : 'Marcar como Crítico'}" style="color: ${isCritico ? 'var(--danger)' : 'inherit'}">
                                <i class="ph ${isCritico ? 'ph-warning-circle' : 'ph-warning'}"></i>
                            </button>
                            
                            <button type="button" class="icon-btn btn-encerrar" data-id="${id}" title="${isEncerrado ? 'Reabrir Chamado' : 'Encerrar Chamado'}" style="color: ${isEncerrado ? 'var(--success)' : 'inherit'}">
                                <i class="ph ${isEncerrado ? 'ph-check-circle' : 'ph-check'}"></i>
                            </button>
                            
                            <button type="button" class="icon-btn btn-toggle-cascata" title="Ver Primeiro Histórico">
                                <i class="ph ph-caret-down"></i>
                            </button>
                            
                            <select class="form-control select-status select-status-chamado" data-id="${id}">
                                <option value="" disabled ${!statusSalvo ? 'selected' : ''}>Ação / Status...</option>
                                <option value="Tratativa" ${statusSalvo === 'Tratativa' ? 'selected' : ''}>Tratativa (Motivos)</option>
                                <option value="Troca de tela" ${statusSalvo === 'Troca de tela' ? 'selected' : ''}>Troca de tela</option>
                                <option value="Solicitado retorno" ${statusSalvo === 'Solicitado retorno' ? 'selected' : ''}>Solicitado retorno</option>
                                <option value="Solicitado / Retirado" ${statusSalvo === 'Solicitado / Retirado' ? 'selected' : ''}>Solicitado / Retirado</option>
                                <option value="Agendado Terceiro" ${statusSalvo === 'Agendado Terceiro' ? 'selected' : ''}>Agendado Terceiro</option>
                            </select>
                        </div>
                    </td>
                </tr>
                <tr style="display: none;">
                    <td colspan="7" style="background-color: rgba(0,0,0,0.03); padding: 15px; border-radius: 4px;">
                        <strong><i class="ph ph-clock-counter-clockwise"></i> Primeiro Histórico:</strong>
                        <div style="margin-top: 5px; font-size: 0.9em; color: var(--text-muted); white-space: pre-wrap;">${primeiroHistorico}</div>
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = rowsHtml;

        document.getElementById('dropArea').style.display = 'none';
        document.getElementById('toolbar').style.display = 'flex';
        document.getElementById('tableContainer').style.display = 'block';
    };

    // =========================================
    // 6. LÓGICA DO PAINEL (MODAL) DE MATERIAIS
    // =========================================
    const selectLista = document.getElementById('modalSelectLista');
    const inputQtd = document.getElementById('modalInputQtd');
    const inputNovo = document.getElementById('modalInputNovo');
    const lblQtd = document.getElementById('modalQtdLabel');
    const containerMateriais = document.getElementById('lista-materiais-corpo');

    function atualizarDropdownMateriais() {
        if (!selectLista) return;
        selectLista.innerHTML = '<option value="">Selecione um material...</option>';
        const todosOsMateriais = [...window.listaMateriaisPadrao, ...window.materiaisCustomizados];
        const materiaisUnicos = [...new Set(todosOsMateriais)].sort();
        
        materiaisUnicos.forEach(mat => selectLista.insertAdjacentHTML('beforeend', `<option value="${mat}">${mat}</option>`));
        verificarUnidade(); 
    }

    function abrirModalMaterial(id) {
        window.chamadoAtualModal = id;
        document.getElementById('modalOS').innerText = id;
        
        atualizarDropdownMateriais();
        renderizarListaInterna();
        
        const modal = document.getElementById('materialModal');
        if (modal) modal.classList.add('active');
    }

    function fecharModalMaterial() {
        const modal = document.getElementById('materialModal');
        if (modal) modal.classList.remove('active');
        
        window.chamadoAtualModal = null;
        if(inputNovo) inputNovo.value = '';
        if(selectLista) selectLista.value = '';
        if(inputQtd) inputQtd.value = '1';
        
        window.popularFiltros(window.chamadosGlobais);
        window.aplicarFiltros(); 
    }

    function verificarUnidade() {
        const txtDigitado = inputNovo ? inputNovo.value.toUpperCase() : '';
        const selectValor = selectLista ? selectLista.value.toUpperCase() : '';
        const materialAtivo = txtDigitado !== '' ? txtDigitado : selectValor;

        if (materialAtivo.includes('CABO')) {
            if(lblQtd) lblQtd.innerText = 'metros';
        } else {
            if(lblQtd) lblQtd.innerText = 'un';
        }
    }

    if(selectLista) selectLista.addEventListener('change', () => {
        if(selectLista.value !== "") inputNovo.value = "";
        verificarUnidade();
    });

    if(inputNovo) inputNovo.addEventListener('input', (e) => {
        if(e.target.value !== "") selectLista.value = "";
        verificarUnidade();
    });

    const btnFechar = document.getElementById('btnFecharModal');
    const btnFecharTop = document.getElementById('btnFecharModalTop');
    if (btnFechar) btnFechar.addEventListener('click', fecharModalMaterial);
    if (btnFecharTop) btnFecharTop.addEventListener('click', fecharModalMaterial);

    const btnAdicionarMaterial = document.getElementById('btnAdicionarMaterial');
    if (btnAdicionarMaterial) {
        btnAdicionarMaterial.addEventListener('click', () => {
            if (!window.chamadoAtualModal) return;
            
            const custom = inputNovo.value.trim().toUpperCase();
            const selecionado = selectLista.value;
            const qtdValor = inputQtd.value;
            
            const nomeMaterial = custom !== "" ? custom : selecionado;

            if (!nomeMaterial) {
                alert("Por favor, selecione ou digite um material.");
                return;
            }

            if (custom !== "" && !window.listaMateriaisPadrao.includes(custom) && !window.materiaisCustomizados.includes(custom)) {
                window.materiaisCustomizados.push(custom);
                localStorage.setItem('noc_materiais_custom', JSON.stringify(window.materiaisCustomizados));
                atualizarDropdownMateriais();
            }

            const isCabo = nomeMaterial.includes('CABO');
            const qtdStr = qtdValor + (isCabo ? 'm' : ' un');
            
            if (!window.materiaisPorChamado[window.chamadoAtualModal]) window.materiaisPorChamado[window.chamadoAtualModal] = [];
            window.materiaisPorChamado[window.chamadoAtualModal].push({ nome: nomeMaterial, qtd: qtdStr });
            localStorage.setItem('noc_materiais_chamados', JSON.stringify(window.materiaisPorChamado));

            inputNovo.value = "";
            selectLista.value = "";
            inputQtd.value = "1";
            verificarUnidade();
            
            renderizarListaInterna(); 
        });
    }

    function renderizarListaInterna() {
        if (!containerMateriais) return;
        
        const materiaisDesteChamado = window.materiaisPorChamado[window.chamadoAtualModal] || [];

        if (materiaisDesteChamado.length === 0) {
            containerMateriais.innerHTML = '<p style="color: var(--text-muted); font-size: 13px; font-style: italic; text-align: center; padding: 10px;">Nenhum item vinculado a este chamado.</p>';
            return;
        }

        containerMateriais.innerHTML = materiaisDesteChamado.map((m, idx) => `
            <div class="vinculado-item">
                <span style="color: var(--text-main);">
                    <span class="vinculado-qtd">${m.qtd}</span> ${m.nome}
                </span>
                <button type="button" class="btn-remover-item" data-index="${idx}" title="Remover Material">
                    <i class="ph ph-trash"></i>
                </button>
            </div>
        `).join('');
    }

    if (containerMateriais) {
        containerMateriais.addEventListener('click', (e) => {
            const btnRemover = e.target.closest('.btn-remover-item');
            if (btnRemover) {
                const index = btnRemover.dataset.index;
                removerMaterial(index);
            }
        });
    }

    function removerMaterial(index) {
        if (window.materiaisPorChamado[window.chamadoAtualModal]) {
            window.materiaisPorChamado[window.chamadoAtualModal].splice(index, 1);
            
            if(window.materiaisPorChamado[window.chamadoAtualModal].length === 0){
                delete window.materiaisPorChamado[window.chamadoAtualModal];
            }
            
            localStorage.setItem('noc_materiais_chamados', JSON.stringify(window.materiaisPorChamado));
            renderizarListaInterna();
        }
    }
});