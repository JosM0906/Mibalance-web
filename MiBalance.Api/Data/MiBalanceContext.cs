using MiBalance.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace MiBalance.Api.Data;

public class MiBalanceContext : DbContext
{
    public MiBalanceContext(DbContextOptions<MiBalanceContext> options)
        : base(options)
    {
    }

    public DbSet<Categoria> Categorias => Set<Categoria>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Transaccion> Transacciones => Set<Transaccion>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Categoria>()
            .HasIndex(c => c.Nombre)
            .IsUnique()
            .HasDatabaseName("UQ_Categorias_Nombre");

        modelBuilder.Entity<Usuario>()
            .HasIndex(u => u.Correo)
            .IsUnique()
            .HasDatabaseName("UQ_Usuarios_Correo");

        modelBuilder.Entity<Transaccion>()
            .HasOne<Usuario>()
            .WithMany()
            .HasForeignKey(t => t.IdUsuario)
            .OnDelete(DeleteBehavior.NoAction)
            .HasConstraintName("FK_Transacciones_Usuarios");

        modelBuilder.Entity<Transaccion>()
            .HasOne<Categoria>()
            .WithMany()
            .HasForeignKey(t => t.IdCategoria)
            .OnDelete(DeleteBehavior.NoAction)
            .HasConstraintName("FK_Transacciones_Categorias");
    }
}