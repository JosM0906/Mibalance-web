using System.Security.Claims;
using MiBalance.Api.Data;
using MiBalance.Api.Dtos;
using MiBalance.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace MiBalance.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/presupuestos")]
public class PresupuestosController(MiBalanceContext context) : ControllerBase
{
    private int IdUsuarioActual => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<List<Presupuesto>>> Listar(CancellationToken cancellationToken)
    {
        var idUsuario = IdUsuarioActual;
        return await context.Presupuestos.AsNoTracking()
            .Where(p => p.IdUsuario == idUsuario)
            .OrderByDescending(p => p.Mes).ThenBy(p => p.Nombre)
            .ToListAsync(cancellationToken);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Presupuesto>> Obtener(int id, CancellationToken cancellationToken)
    {
        var idUsuario = IdUsuarioActual;
        var presupuesto = await context.Presupuestos.AsNoTracking()
            .FirstOrDefaultAsync(p => p.IdPresupuesto == id && p.IdUsuario == idUsuario, cancellationToken);
        if (presupuesto is null) return NotFound(new { mensaje = "El presupuesto no existe o no te pertenece." });
        return Ok(presupuesto);
    }

    [HttpPost]
    public async Task<ActionResult<Presupuesto>> Crear(PresupuestoRequest request, CancellationToken cancellationToken)
    {
        if (!await context.Categorias.AnyAsync(c => c.IdCategoria == request.IdCategoria, cancellationToken))
            return BadRequest(new { mensaje = "La categoría seleccionada no existe." });

        var presupuesto = new Presupuesto
        {
            IdUsuario = IdUsuarioActual,
            IdCategoria = request.IdCategoria,
            Nombre = request.Nombre.Trim(),
            MontoLimite = request.MontoLimite,
            Mes = request.Mes!.Value
        };
        context.Presupuestos.Add(presupuesto);

        try { await context.SaveChangesAsync(cancellationToken); }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException { Number: 2601 or 2627 })
        {
            return Conflict(new { mensaje = "Ya tienes un presupuesto para esa categoría y mes." });
        }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException { Number: 547 })
        {
            return Conflict(new { mensaje = "Comprueba que la categoría y el usuario sigan existiendo." });
        }
        return CreatedAtAction(nameof(Obtener), new { id = presupuesto.IdPresupuesto }, presupuesto);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Editar(int id, PresupuestoRequest request, CancellationToken cancellationToken)
    {
        var idUsuario = IdUsuarioActual;
        var presupuesto = await context.Presupuestos
            .FirstOrDefaultAsync(p => p.IdPresupuesto == id && p.IdUsuario == idUsuario, cancellationToken);
        if (presupuesto is null) return NotFound(new { mensaje = "El presupuesto no existe o no te pertenece." });

        if (!await context.Categorias.AnyAsync(c => c.IdCategoria == request.IdCategoria, cancellationToken))
            return BadRequest(new { mensaje = "La categoría seleccionada no existe." });

        presupuesto.Nombre = request.Nombre.Trim();
        presupuesto.IdCategoria = request.IdCategoria;
        presupuesto.MontoLimite = request.MontoLimite;
        presupuesto.Mes = request.Mes!.Value;

        try { await context.SaveChangesAsync(cancellationToken); }
        catch (DbUpdateConcurrencyException)
        {
            return NotFound(new { mensaje = "El presupuesto fue eliminado. Actualiza el listado." });
        }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException { Number: 2601 or 2627 })
        {
            return Conflict(new { mensaje = "Ya tienes un presupuesto para esa categoría y mes." });
        }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException { Number: 547 })
        {
            return Conflict(new { mensaje = "La categoría seleccionada ya no está disponible." });
        }
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Eliminar(int id, CancellationToken cancellationToken)
    {
        var idUsuario = IdUsuarioActual;
        var eliminados = await context.Presupuestos
            .Where(p => p.IdPresupuesto == id && p.IdUsuario == idUsuario)
            .ExecuteDeleteAsync(cancellationToken);
        if (eliminados == 0) return NotFound(new { mensaje = "El presupuesto no existe o no te pertenece." });
        return NoContent();
    }
}
