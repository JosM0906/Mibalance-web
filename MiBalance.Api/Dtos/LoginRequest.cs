using System.ComponentModel.DataAnnotations;

namespace MiBalance.Api.Dtos;

public class LoginRequest
{
    [Required]
    [EmailAddress]
    [StringLength(150)]
    public string Correo { get; set; } = string.Empty;

    [Required]
    [StringLength(128)]
    public string Password { get; set; } = string.Empty;
}