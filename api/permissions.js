const PERMISSION_GROUPS = {
    products: {
        title: 'Produtos',
        permissions: {
            addProduct: { roles: ['root', 'admin'] },
            editProduct: { roles: ['root', 'admin'] },
            deleteProduct: { roles: ['root', 'admin'] },
            exportCsv: { roles: ['root', 'admin'] },
        }
    },
    services: {
        title: 'Serviços',
        permissions: {
            addService: { roles: ['root', 'admin'] },
            editService: { roles: ['root', 'admin'] },
            deleteService: { roles: ['root', 'admin'] },
        }
    },
    siteContent: {
        title: 'Conteúdo do Site',
        permissions: {
            manageBanners: { roles: ['root', 'admin'] },
        }
    },
    admin: {
        title: 'Administração',
        permissions: {
            viewDashboardCharts: { roles: ['root'] },
            viewSalesHistory: { roles: ['root', 'admin'] },
            viewActivityLog: { roles: ['root'] },
            manageClients: { roles: ['root', 'admin'] },
        }
    },
    root: {
        title: 'Super Admin (Root)',
        permissions: {
            manageUsers: { roles: ['root'] },
            resetUserPassword: { roles: ['root'] },
            manageBackup: { roles: ['root'] },
        }
    }
};

const getDefaultPermissions = (role) => {
    const permissions = {};
    Object.values(PERMISSION_GROUPS).forEach(group => {
        for (const key in group.permissions) {
            permissions[key] = group.permissions[key].roles.includes(role);
        }
    });
    return permissions;
};

module.exports = { getDefaultPermissions };