-- Ejecutar en SQL Server Management Studio.
-- Crea únicamente los objetos que no existen. No borra datos existentes.
USE master;
GO
IF DB_ID(N'MiBalance') IS NULL
    EXEC(N'CREATE DATABASE MiBalance');
GO
USE MiBalance;
GO
IF OBJECT_ID(N'dbo.Usuarios', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Usuarios (
        IdUsuario INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Usuarios PRIMARY KEY,
        Nombre NVARCHAR(100) NOT NULL,
        Correo NVARCHAR(150) NOT NULL,
        PasswordHash NVARCHAR(255) NOT NULL,
        CONSTRAINT UQ_Usuarios_Correo UNIQUE (Correo)
    );
END;
GO
IF OBJECT_ID(N'dbo.Categorias', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Categorias (
        IdCategoria INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Categorias PRIMARY KEY,
        Nombre NVARCHAR(80) NOT NULL,
        Descripcion NVARCHAR(200) NULL,
        CONSTRAINT UQ_Categorias_Nombre UNIQUE (Nombre)
    );
END;
GO
IF OBJECT_ID(N'dbo.Transacciones', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Transacciones (
        IdTransaccion INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Transacciones PRIMARY KEY,
        IdUsuario INT NOT NULL,
        IdCategoria INT NOT NULL,
        Tipo VARCHAR(7) NOT NULL,
        Monto DECIMAL(12,2) NOT NULL,
        Fecha DATE NOT NULL,
        Descripcion NVARCHAR(250) NULL,
        CONSTRAINT FK_Transacciones_Usuarios FOREIGN KEY (IdUsuario) REFERENCES dbo.Usuarios(IdUsuario),
        CONSTRAINT FK_Transacciones_Categorias FOREIGN KEY (IdCategoria) REFERENCES dbo.Categorias(IdCategoria),
        CONSTRAINT CK_Transacciones_Tipo CHECK (Tipo IN ('INGRESO','GASTO')),
        CONSTRAINT CK_Transacciones_Monto CHECK (Monto > 0)
    );
END;
GO
-- Las cuentas deben crearse desde el formulario de registro de la aplicación.
-- La API genera el hash de contraseña; no insertar contraseñas en texto plano.
