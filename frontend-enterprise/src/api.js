const RAW_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';
const BASE = RAW_BASE ? RAW_BASE.replace(/\/+$/, '') : '';

function getToken() {
    return localStorage.getItem('token');
}

function authHeaders() {
    const t = getToken();
    return t ? { Authorization: `Bearer ${t}` } : {};
}

async function request(method, path, { body } = {}) {
    const opts = { method, headers: { ...authHeaders() } };

    if (body) {
        opts.headers['Content-Type'] = 'application/json';
        opts.body = JSON.stringify(body);
    }

    const res = await fetch(`${BASE}${path}`, opts);

    if (res.status === 204) return null;

    const data = res.headers.get('content-type')?.includes('json')
        ? await res.json()
        : await res.text();

    if (!res.ok) {
        const errorDetail = data?.detail || data;
        if (res.status === 401) {
            window.dispatchEvent(new CustomEvent('unauthorized'));
        }
        throw { status: res.status, detail: errorDetail };
    }
    return data;
}

const api = {
    // Auth
    login: (d) => request('POST', '/auth/login', { body: d }),
    register: (d) => request('POST', '/auth/register', { body: {...d, role: 'enterprise'} }),
    
    // Enterprise specific
    createOrg: (d) => request('POST', '/enterprise/orgs', { body: d }),
    getOrg: () => request('GET', '/enterprise/orgs/me'),
    generateApiKey: () => request('POST', '/enterprise/orgs/me/api-key'),
    
    createCluster: (d) => request('POST', '/enterprise/clusters', { body: d }),
    listClusters: () => request('GET', '/enterprise/clusters'),
};

export default api;
