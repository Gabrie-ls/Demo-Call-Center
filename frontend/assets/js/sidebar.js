/* ============================================================
   CALLCENTER PRO - Shared Sidebar Component
   ============================================================ */

const buildSidebar = (activePage) => {
  const user = Auth.getUser();
  const isAdmin = user?.role === 'admin';
  const isSupervisorOrAdmin = ['admin','supervisor'].includes(user?.role);

  return `
    <div class="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-brand">
          <div class="brand-icon">CC</div>
          <div>
            <div class="brand-name">CallCenter Pro</div>
            <div class="brand-version">v1.0.0-enterprise</div>
          </div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section-title">Principal</div>
        <a class="nav-item ${activePage==='dashboard'?'active':''}" data-page="dashboard" href="/pages/dashboard.html">
           Dashboard
        </a>

        <div class="nav-section-title">Operaciones</div>
        <a class="nav-item ${activePage==='calls'?'active':''}" data-page="calls" href="/pages/calls.html">
           Llamadas
        </a>
        <a class="nav-item ${activePage==='clients'?'active':''}" data-page="clients" href="/pages/clients.html">
           Clientes CRM
        </a>

        ${isSupervisorOrAdmin ? `
        <div class="nav-section-title">Gestión</div>
        <a class="nav-item ${activePage==='users'?'active':''}" data-page="users" href="/pages/users.html">
           Agentes y Usuarios
        </a>
        <a class="nav-item ${activePage==='reports'?'active':''}" data-page="reports" href="/pages/reports.html">
           Reportes
        </a>
        ` : ''}
      </nav>

      <div class="sidebar-user" id="sidebar-user"></div>
    </div>
  `;
};
