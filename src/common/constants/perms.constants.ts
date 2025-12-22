// Constantes de permisos del sistema
// Los valores deben coincidir con los códigos en la tabla seg.permiso

export const PERMS_KEY = 'perms';

// Permisos del módulo de Pacientes
export const PACIENTES_PERMS = {
  VER: 'PAC_VER',
  CREAR: 'PAC_CREAR',
  EDITAR: 'PAC_EDITAR',
  ELIMINAR: 'PAC_ELIMINAR',
} as const;

// Permisos del módulo de Médicos
export const MEDICOS_PERMS = {
  VER: 'MED_VER',
  CREAR: 'MED_CREAR',
  EDITAR: 'MED_EDITAR',
  ELIMINAR: 'MED_ELIMINAR',
} as const;

// Permisos del módulo de Fichas Médicas
export const FICHAS_MEDICAS_PERMS = {
  VER: 'FICHA_VER',
  CREAR: 'FICHA_CREAR',
  EDITAR: 'FICHA_EDITAR',
} as const;

// Permisos del módulo de Seguridad
export const SEGURIDAD_PERMS = {
  USR_VER: 'USR_VER',
  USR_CREAR: 'USR_CREAR',
  USR_EDITAR: 'USR_EDITAR',
  USR_ELIMINAR: 'USR_ELIMINAR',
  ROL_VER: 'ROL_VER',
  ROL_CREAR: 'ROL_CREAR',
  ROL_EDITAR: 'ROL_EDITAR',
  ROL_ELIMINAR: 'ROL_ELIMINAR',
  PERM_ASIGNAR: 'PERM_ASIGNAR',
} as const;
