using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MiBalance.Api.Models;

[Table("Presupuestos", Schema = "dbo")]
public class Presupuesto
{
    [Key]
    public int IdPresupuesto { get; set; }

    public int IdUsuario { get; set; }
    public int IdCategoria { get; set; }

    [Required, MaxLength(100)]
    public string Nombre { get; set; } = string.Empty;

    [Column(TypeName = "decimal(12,2)")]
    public decimal MontoLimite { get; set; }

    [Column(TypeName = "date")]
    public DateOnly Mes { get; set; }
}
