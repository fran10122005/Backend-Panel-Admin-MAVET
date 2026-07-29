const sequelize = require('../config/db');
const Role = require('../modules/auth/models/Role.model');
const { permisosCompletos } = require('../config/permissions');

async function seedWebEditor() {
  try {
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida.');

    // Verificar si ya existe
    const existingRole = await Role.findOne({ where: { nombre_rol: 'WEB_EDITOR' } });

    if (existingRole) {
      console.log('El rol WEB_EDITOR ya existe con ID:', existingRole.id_rol);
    } else {
      const basePermisos = permisosCompletos();
      const webEditorPermisos = {
        dashboard: basePermisos.dashboard,
        biblioteca: ['read'],
        inventario_obras: ['read'],
        talleres: ['read'],
        auditorio: ['read'],
      };
      const newRole = await Role.create({
        nombre_rol: 'WEB_EDITOR',
        permisos: JSON.stringify(webEditorPermisos),
      });
      console.log('Rol WEB_EDITOR creado exitosamente con ID:', newRole.id_rol);
    }
  } catch (error) {
    console.error('Error al insertar el rol:', error);
  } finally {
    await sequelize.close();
  }
}

seedWebEditor();
