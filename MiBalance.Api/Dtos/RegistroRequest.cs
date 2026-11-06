using System.ComponentModel.DataAnnotations;

namespace MiBalance.Api.Dtos;

public class RegistroRequest
{
    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [StringLength(100)]
    public string Nombre { get; set; } = string.Empty;

    [Required]
    [EmailAddress(ErrorMessage = "Escribe un correo válido.")]
    [StringLength(150)]
    public string Correo { get; set; } = string.Empty;

    [Required]
    [StringLength(128, MinimumLength = 8,
        ErrorMessage = "La contraseña debe tener entre 8 y 128 caracteres.")]
    public string Password { get; set; } = string.Empty;
}