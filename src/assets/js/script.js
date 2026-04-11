document.addEventListener('DOMContentLoaded', () => {
    console.log('Frontend carregado!');
    // Adicione interações aqui (ex: filtros, atualizações via API)
});

// Utility function to get API base
function getApiBase() {
    return window.API_BASE || 'https://hugmebot.blazebr.com:26173'; // Fallback
}

// Utility to check if logged in
function isLoggedIn() {
    return !!localStorage.getItem('access_token');
}

// Logout function
function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('admin_token');
    window.location.href = './home.html';
}

// Wrapper para fetch com tratamento automático de 401
async function apiCall(url, options = {}) {
    const token = localStorage.getItem('access_token');
    
    const headers = {
        'Accept': 'application/json',
        ...options.headers
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
        const response = await fetch(url, {
            ...options,
            headers
        });
        
        // Se token expirou ou é inválido
        if (response.status === 401) {
            console.warn('Token inválido ou expirado');
            logout();
            return null;
        }
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Erro desconhecido' }));
            throw new Error(error.detail || `HTTP ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Error:', error.message);
        throw error;
    }
}

// Dashboard functions
function loadDashboard() {
    const API_BASE = getApiBase();
    const token = localStorage.getItem('access_token');

    if (!token) {
        window.location.href = './home.html';
        return;
    }

    apiCall(`${API_BASE}/dashboard`)
    .then(data => {
        if (!data) return; // 401 foi tratado
        
        const user = data.user || {};
        document.getElementById('welcome').textContent = `Bem-vindo, ${user.username || 'Usuário'}!`;
        if (user.admin) {
            const adminLink = document.getElementById('adminLink');
            if (adminLink) adminLink.style.display = 'inline';
        }
        
        const tbody = document.getElementById('apoiadoresBody');
        if (tbody && data.apoiadores && Array.isArray(data.apoiadores)) {
            data.apoiadores.forEach(apoiador => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${apoiador.discord_id || '-'}</td>
                    <td>${apoiador.tipo_apoio || '-'}</td>
                    <td class="status-${apoiador.ativo ? 'ativo' : 'inativo'}">${apoiador.ativo ? 'Ativo' : 'Inativo'}</td>
                    <td>${apoiador.data_expiracao ? new Date(apoiador.data_expiracao).toLocaleDateString('pt-BR') : '-'}</td>
                `;
                tbody.appendChild(row);
            });
        }
    })
    .catch(error => {
        console.error('Erro ao carregar dashboard:', error);
        const welcomeEl = document.getElementById('welcome');
        if (welcomeEl) welcomeEl.textContent = `Erro: ${error.message}`;
    });
}

// Servers functions
function loadServers() {
    const API_BASE = getApiBase();
    const token = localStorage.getItem('access_token');

    if (!token) {
        window.location.href = './home.html';
        return;
    }

    apiCall(`${API_BASE}/servers`)
    .then(data => {
        if (!data) return; // 401 foi tratado
        
        const ul = document.getElementById('guildsList');
        if (ul && data.guilds && Array.isArray(data.guilds)) {
            data.guilds.forEach(guild => {
                const li = document.createElement('li');
                li.innerHTML = `<strong>${guild.name || 'Servidor'}</strong> (ID: ${guild.id || '?'})`;
                ul.appendChild(li);
            });
        }
    })
    .catch(error => {
        console.error('Erro ao carregar servidores:', error);
        alert(`Erro ao carregar servidores: ${error.message}`);
    });
}

// Admin functions
function loadAdmin() {
    const API_BASE = getApiBase();
    const token = localStorage.getItem('access_token');
    const adminToken = localStorage.getItem('admin_token') || prompt('Enter admin token:');

    if (!token || !adminToken) {
        window.location.href = './home.html';
        return;
    }

    apiCall(`${API_BASE}/admin`)
    .then(data => {
        if (!data) return; // 401 foi tratado
        
        // Metrics
        const metricasDiv = document.getElementById('metricas');
        if (metricasDiv && data.metricas) {
            metricasDiv.innerHTML = `
                <div class="metrica">
                    <h3>Total de Doações</h3>
                    <p>${data.metricas.total_donations || 0}</p>
                </div>
                <div class="metrica">
                    <h3>Apoiadores Ativos</h3>
                    <p>${data.metricas.active_supporters || 0}</p>
                </div>
                <div class="metrica">
                    <h3>Expirados</h3>
                    <p>${data.metricas.expired_supporters || 0}</p>
                </div>
                <div class="metrica">
                    <h3>Taxa de Renovação</h3>
                    <p>${data.metricas.renewal_rate || 0}%</p>
                </div>
                <div class="metrica warning">
                    <h3>Cargos Pendentes</h3>
                    <p>${data.metricas.pending_role_assignments || 0}</p>
                </div>
                <div class="metrica danger">
                    <h3>Falhas Webhook</h3>
                    <p>${data.metricas.webhook_failure_count || 0}</p>
                </div>
            `;
        }

        // Apoiadores table
        const tbody = document.getElementById('apoiadoresBody');
        if (tbody && data.apoiadores && Array.isArray(data.apoiadores)) {
            data.apoiadores.forEach(apoiador => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${apoiador.discord_id || '-'}</td>
                    <td>${apoiador.guild_id || '-'}</td>
                    <td>${apoiador.tipo_apoio || '-'}</td>
                    <td class="status-${apoiador.ativo ? 'ativo' : 'inativo'}">${apoiador.ativo ? 'Ativo' : 'Inativo'}</td>
                    <td>${apoiador.ultimo_pagamento ? new Date(apoiador.ultimo_pagamento).toLocaleDateString('pt-BR') : '-'}</td>
                    <td>${apoiador.data_expiracao ? new Date(apoiador.data_expiracao).toLocaleDateString('pt-BR') : '-'}</td>
                    <td>${apoiador.cargo_atribuido ? '✅ Sim' : '❌ Não'}</td>
                `;
                tbody.appendChild(row);
            });
        }
    })
    .catch(error => {
        console.error('Erro ao carregar admin:', error);
        alert(`Erro ao carregar admin: ${error.message}`);
    });

    // Form submit
    const formEl = document.getElementById('roleConfigForm');
    if (formEl) {
        formEl.addEventListener('submit', async (e) => {
            e.preventDefault();
            const guildId = document.getElementById('guild_id').value;
            const supporter_roles = {};
            for (let i = 1; i <= 9; i++) {
                const val = document.getElementById(`role_${i}`).value.trim();
                if (val) supporter_roles[String(i)] = val;
            }
            const formData = { guild_id: guildId, supporter_roles };
            
            try {
                const response = await fetch(`${API_BASE}/admin/set-supporter-roles`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${adminToken}`
                    },
                    body: JSON.stringify(formData)
                });
                
                if (response.status === 401) {
                    logout();
                    return;
                }
                
                const result = await response.json();
                if (response.ok) {
                    alert(`Configuração salva! Servidor: ${result.guild_id}`);
                } else {
                    alert(`Erro: ${result.detail || 'Falha ao salvar configuração'}`);
                }
            } catch (error) {
                console.error('Error:', error);
                alert(`Erro na comunicação com o servidor: ${error.message}`);
            }
        });
    }
}

// Home function
function setupHome() {
    const API_BASE = getApiBase();
    const loginLink = document.getElementById('loginLink');
    if (loginLink) {
        loginLink.href = API_BASE + '/login';
    }
}
