USE MiBalance;
GO
IF OBJECT_ID(N'dbo.Presupuestos', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Presupuestos (
        IdPresupuesto INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Presupuestos PRIMARY KEY,
        IdUsuario INT NOT NULL,
        IdCategoria INT NOT NULL,
        Nombre NVARCHAR(100) NOT NULL,
        MontoLimite DECIMAL(12,2) NOT NULL,
        Mes DATE NOT NULL,
        CONSTRAINT FK_Presupuestos_Usuarios FOREIGN KEY (IdUsuario) REFERENCES dbo.Usuarios(IdUsuario),
        CONSTRAINT FK_Presupuestos_Categorias FOREIGN KEY (IdCategoria) REFERENCES dbo.Categorias(IdCategoria),
        CONSTRAINT UQ_Presupuestos_Usuario_Categoria_Mes UNIQUE (IdUsuario, IdCategoria, Mes),
        CONSTRAINT CK_Presupuestos_Nombre CHECK (LEN(LTRIM(RTRIM(Nombre))) > 0),
        CONSTRAINT CK_Presupuestos_Monto CHECK (MontoLimite > 0),
        CONSTRAINT CK_Presupuestos_Mes CHECK (DAY(Mes) = 1)
    );
END;
GO
