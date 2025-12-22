-- Script para agregar columna ultimo_logout a la tabla usuario
-- AppMed - Sistema de Gestión Médica
-- Fecha: 2025-12-22

USE AppMedDB;
GO

-- Verificar si la columna ya existe antes de agregarla
IF NOT EXISTS (
    SELECT 1 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'seg' 
    AND TABLE_NAME = 'usuario' 
    AND COLUMN_NAME = 'ultimo_logout'
)
BEGIN
    ALTER TABLE seg.usuario 
    ADD ultimo_logout DATETIME2(7) NULL;
    
    PRINT 'Columna ultimo_logout agregada exitosamente a seg.usuario';
END
ELSE
BEGIN
    PRINT 'La columna ultimo_logout ya existe en seg.usuario';
END
GO