using System.ComponentModel.DataAnnotations;

namespace MiBalance.Api.Dtos;

public class TransaccionRequest : IValidatableObject
{
    [Range(1, int.MaxValue,
        ErrorMessage = "Selecciona una categoría válida.")]
    public int IdCategoria { get; set; }

    [Required]
    [RegularExpression("^(INGRESO|GASTO)$",
        ErrorMessage = "El tipo debe ser INGRESO o GASTO.")]
    public string Tipo { get; set; } = string.Empty;

    [Range(typeof(decimal), "0.01", "9999999999.99",
        ErrorMessage = "El monto debe estar entre 0.01 y 9999999999.99.")]
    public decimal Monto { get; set; }

    [Required(ErrorMessage = "La fecha es obligatoria.")]
    public DateOnly? Fecha { get; set; }

    [StringLength(250,
        ErrorMessage = "La descripción admite hasta 250 caracteres.")]
    public string? Descripcion { get; set; }

    public IEnumerable<ValidationResult> Validate(
        ValidationContext validationContext)
    {
        if (Monto != decimal.Round(Monto, 2))
        {
            yield return new ValidationResult(
                "El monto admite hasta dos decimales.",
                new[] { nameof(Monto) });
        }
    }
}