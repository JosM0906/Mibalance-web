using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace MiBalance.Api.Models;

[Table("Usuarios", Schema = "dbo")]
public class Usuario
{
    [Key]
    public int IdUsuario { get; set; }

    [Required]
    [MaxLength(100)]
    public string Nombre { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    public string Correo { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    [JsonIgnore]
    public string PasswordHash { get; set; } = string.Empty;
}