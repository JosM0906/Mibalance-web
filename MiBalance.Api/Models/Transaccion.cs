using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MiBalance.Api.Models;

[Table("Transacciones", Schema = "dbo")]
public class Transaccion
{
    [Key]
    public int IdTransaccion { get; set; }

    public int IdUsuario { get; set; }

    public int IdCategoria { get; set; }

    [Required]
    [Column(TypeName = "varchar(7)")]
    public string Tipo { get; set; } = string.Empty;

    [Column(TypeName = "decimal(12,2)")]
    public decimal Monto { get; set; }

    [Column(TypeName = "date")]
    public DateOnly Fecha { get; set; }

    [MaxLength(250)]
    public string? Descripcion { get; set; }
}