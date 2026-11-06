using MiBalance.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MiBalance.Api.Controllers;

[ApiController]
[Route("api/conexion")]
public class ConexionController : ControllerBase
{
    private readonly MiBalanceContext _context;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<ConexionController> _logger;

    public ConexionController(
        MiBalanceContext context,
        IWebHostEnvironment environment,
        ILogger<ConexionController> logger)
    {
        _context = context;
        _environment = environment;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> Get(
        CancellationToken cancellationToken)
    {
        // Esta prueba solo estará disponible en desarrollo.
        if (!_environment.IsDevelopment())
        {
            return NotFound();
        }

        try
        {
            await _context.Database.OpenConnectionAsync(cancellationToken);
            await _context.Database.CloseConnectionAsync();

            return Ok(new
            {
                conectado = true,
                mensaje = "Conexión a MiBalance exitosa."
            });
        }
        catch (Exception exception)
            when (exception is not OperationCanceledException)
        {
            _logger.LogError(
                exception,
                "No se pudo conectar a MiBalance.");

            return StatusCode(503, new
            {
                conectado = false,
                mensaje = "No se pudo conectar a MiBalance. Revisa el error en la terminal."
            });
        }
    }
}