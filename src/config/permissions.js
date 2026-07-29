const MODULOS = {
  dashboard: { label: 'Dashboard', acciones: ['read'] },
  recepcion: { label: 'Recepción', acciones: ['read', 'write'] },
  auditorio: { label: 'Auditorio', acciones: ['read', 'write', 'delete'] },
  talleres: { label: 'Talleres', acciones: ['read', 'write', 'delete'] },
  asistencia: { label: 'Asistencia', acciones: ['read', 'write'] },
  biblioteca: { label: 'Biblioteca', acciones: ['read', 'write', 'delete'] },
  inventario_obras: { label: 'Inventario de Bóveda', acciones: ['read', 'write', 'delete'] },
  rrhh: { label: 'Recursos Humanos', acciones: ['read', 'write', 'delete'] },
  educacion: { label: 'Educación', acciones: ['read', 'write', 'delete'] },
  auditoria: { label: 'Auditoría', acciones: ['read'] },
  catalogos: { label: 'Catálogos', acciones: ['read', 'write', 'delete'] },
  configuracion: { label: 'Configuración', acciones: ['read', 'write'] },
  papelera: { label: 'Papelera', acciones: ['read', 'write', 'delete'] },
  usuarios: { label: 'Usuarios', acciones: ['read', 'write', 'delete'] },
};

function tienePermiso(permisos, modulo, accion) {
  if (!permisos || permisos === 'all') return true;
  try {
    const parsed = typeof permisos === 'string' ? JSON.parse(permisos) : permisos;
    return parsed[modulo]?.includes(accion) || false;
  } catch {
    return false;
  }
}

function permisosCompletos() {
  const result = {};
  for (const [key, mod] of Object.entries(MODULOS)) {
    result[key] = [...mod.acciones];
  }
  return result;
}

module.exports = { MODULOS, tienePermiso, permisosCompletos };
