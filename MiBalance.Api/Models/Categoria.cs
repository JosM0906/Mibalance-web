using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MiBalance.Api.Models;

[Table("Categorias", Schema = "dbo")]
public class Categoria
{
    [Key]
    public int IdCategoria { get; set; }

    [Required]
    [MaxLength(80)]
    public string Nombre { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Descripcion { get; set; }
}