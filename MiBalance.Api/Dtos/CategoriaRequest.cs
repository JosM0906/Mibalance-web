using System.ComponentModel.DataAnnotations;

namespace MiBalance.Api.Dtos;

public class CategoriaRequest
{
    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [StringLength(80, ErrorMessage = "El nombre admite hasta 80 caracteres.")]
    public string Nombre { get; set; } = string.Empty;

    [StringLength(200, ErrorMessage = "La descripción admite hasta 200 caracteres.")]
    public string? Descripcion { get; set; }
}