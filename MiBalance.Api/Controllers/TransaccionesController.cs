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
[Route("api/transacciones")]
public class TransaccionesController : ControllerBase
{
    private readonly MiBalanceContext _context;

    public TransaccionesController(MiBalanceContext context)
    {
        _context = context;
    }

    private int IdUsuarioActual =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // GET: api/transacciones
    [HttpGet]
    public async Task<ActionResult<List<Transaccion>>> ObtenerTodas()
    {
        var idUsuario = IdUsuarioActual;

        return await _context.Transacciones
            .AsNoTracking()
            .Where(t => t.IdUsuario == idUsuario)
            .OrderByDescending(t => t.Fecha)
            .ThenByDescending(t => t.IdTransaccion)
            .ToListAsync();
    }

    // GET: api/transacciones/1
    [HttpGet("{id:int}")]
    public async Task<ActionResult<Transaccion>> ObtenerPorId(int id)
    {
        var idUsuario = IdUsuarioActual;

        var transaccion = await _context.Transacciones
            .AsNoTracking()
            .FirstOrDefaultAsync(t =>
                t.IdTransaccion == id &&
                t.IdUsuario == idUsuario);

        if (transaccion is null)
        {
            return NotFound(new
            {
                mensaje = "La transacción no existe o no te pertenece."
            });
        }

        return Ok(transaccion);
    }

    // POST: api/transacciones
    [HttpPost]
    public async Task<ActionResult<Transaccion>> Crear(
        TransaccionRequest request)
    {
        var categoriaExiste = await _context.Categorias
            .AnyAsync(c => c.IdCategoria == request.IdCategoria);

        if (!categoriaExiste)
        {
            return BadRequest(new
            {
                mensaje = "La categoría seleccionada no existe."
            });
        }

        var transaccion = new Transaccion
        {
            IdUsuario = IdUsuarioActual,
            IdCategoria = request.IdCategoria,
            Tipo = request.Tipo,
            Monto = request.Monto,
            Fecha = request.Fecha!.Value,
            Descripcion = request.Descripcion?.Trim()
        };

        _context.Transacciones.Add(transaccion);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
            when (ex.InnerException is SqlException { Number: 547 })
        {
            return Conflict(new
            {
                mensaje = "No se pudo guardar. Comprueba que el usuario y la categoría sigan existiendo y que los datos sean válidos."
            });
        }

        return CreatedAtAction(
            nameof(ObtenerPorId),
            new { id = transaccion.IdTransaccion },
            transaccion);
    }

    // PUT: api/transacciones/1
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Actualizar(
        int id,
        TransaccionRequest request)
    {
        var idUsuario = IdUsuarioActual;

        var transaccion = await _context.Transacciones
            .FirstOrDefaultAsync(t =>
                t.IdTransaccion == id &&
                t.IdUsuario == idUsuario);

        if (transaccion is null)
        {
            return NotFound(new
            {
                mensaje = "La transacción no existe o no te pertenece."
            });
        }

        var categoriaExiste = await _context.Categorias
            .AnyAsync(c => c.IdCategoria == request.IdCategoria);

        if (!categoriaExiste)
        {
            return BadRequest(new
            {
                mensaje = "La categoría seleccionada no existe."
            });
        }

        transaccion.IdCategoria = request.IdCategoria;
        transaccion.Tipo = request.Tipo;
        transaccion.Monto = request.Monto;
        transaccion.Fecha = request.Fecha!.Value;
        transaccion.Descripcion = request.Descripcion?.Trim();

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
            when (ex.InnerException is SqlException { Number: 547 })
        {
            return Conflict(new
            {
                mensaje = "No se pudo actualizar. Comprueba que la categoría siga existiendo y que los datos sean válidos."
            });
        }

        return NoContent();
    }

    // DELETE: api/transacciones/1
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Eliminar(int id)
    {
        var idUsuario = IdUsuarioActual;

        var transaccion = await _context.Transacciones
            .FirstOrDefaultAsync(t =>
                t.IdTransaccion == id &&
                t.IdUsuario == idUsuario);

        if (transaccion is null)
        {
            return NotFound(new
            {
                mensaje = "La transacción no existe o no te pertenece."
            });
        }

        _context.Transacciones.Remove(transaccion);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}