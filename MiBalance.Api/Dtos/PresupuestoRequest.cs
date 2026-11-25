using System.ComponentModel.DataAnnotations;

namespace MiBalance.Api.Dtos;

public class PresupuestoRequest : IValidatableObject
{
    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [StringLength(100)]
    public string Nombre { get; set; } = string.Empty;

    [Range(1, int.MaxValue, ErrorMessage = "Selecciona una categoría válida.")]
    public int IdCategoria { get; set; }

    [Range(typeof(decimal), "0.01", "9999999999.99",
        ErrorMessage = "El límite debe estar entre 0.01 y 9999999999.99.")]
    public decimal MontoLimite { get; set; }

    [Required(ErrorMessage = "El mes es obligatorio.")]
    public DateOnly? Mes { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (MontoLimite != decimal.Round(MontoLimite, 2))
            yield return new ValidationResult("El límite admite hasta dos decimales.", new[] { nameof(MontoLimite) });

        if (Mes is { Day: not 1 })
            yield return new ValidationResult("El mes debe representarse con su primer día.", new[] { nameof(Mes) });
    }
}
