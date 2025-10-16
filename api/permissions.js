const PERMISSION_GROUPS = {
    products: {
        title: 'Produtos',
        permissions: {
            addProduct: { roles: ['root', 'user'] },
            editProduct: { roles: ['root', 'user'] },
            deleteProduct: { roles: ['root', 'user'] },
            exportCsv: { roles: ['root', 'user'] },
        }
    },
    services: {
        title: 'Serviços',
        permissions: {
            addService: { roles: ['root', 'user'] },
            editService: { roles: ['root', 'user'] },
            deleteService: { roles: ['root', 'user'] },
        }
    },
    siteContent: {
        title: 'Conteúdo do Site',
        permissions: {
            manageBanners: { roles: ['root', 'user'] },
        }
    },
    admin: {
        title: 'Administração',
        permissions: {
            viewDashboardCharts: { roles: ['root'] },
            viewSalesHistory: { roles: ['root', 'user'] },
            viewUserSalesReport: { roles: ['root', 'user'] },
            viewDreReport: { roles: ['root', 'user'] },
            viewActivityLog: { roles: ['root'] },
            manageClients: { roles: ['root', 'user'] },
            manageUsers: { roles: ['root', 'user'] },
        }
    },
    root: {
        title: 'Super Admin (Root)',
        permissions: {
            resetUserPassword: { roles: ['root'] },
            manageBackup: { roles: ['root'] },
            manageTheme: { roles: ['root'] },
        }
    }
};

const getDefaultPermissions = (role) => {
    const permissions = {};
    Object.values(PERMISSION_GROUPS).forEach(group => {
        for (const key in group.permissions) {
            if (role === 'root') {
                permissions[key] = true;
            } else {
                permissions[key] = group.permissions[key].roles.includes(role);
            }
        }
    });
    return permissions;
};

module.exports = { PERMISSION_GROUPS, getDefaultPermissions };