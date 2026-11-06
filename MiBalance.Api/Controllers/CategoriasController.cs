using MiBalance.Api.Data;
using MiBalance.Api.Dtos;
using MiBalance.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace MiBalance.Api.Controllers;
[Authorize]
[ApiController]
[Route("api/categorias")]
public class CategoriasController : ControllerBase
{
    private readonly MiBalanceContext _context;

    public CategoriasController(MiBalanceContext context)
    {
        _context = context;
    }

    // GET: api/categorias
    [HttpGet]
    public async Task<ActionResult<List<Categoria>>> ObtenerTodas()
    {
        return await _context.Categorias
            .AsNoTracking()
            .OrderBy(c => c.Nombre)
            .ToListAsync();
    }

    // GET: api/categorias/1
    [HttpGet("{id:int}")]
    public async Task<ActionResult<Categoria>> ObtenerPorId(int id)
    {
        var categoria = await _context.Categorias
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.IdCategoria == id);

        if (categoria is null)
        {
            return NotFound(new { mensaje = "La categoría no existe." });
        }

        return Ok(categoria);
    }

    // POST: api/categorias
    [HttpPost]
    public async Task<ActionResult<Categoria>> Crear(
        CategoriaRequest request)
    {
        var categoria = new Categoria
        {
            Nombre = request.Nombre.Trim(),
            Descripcion = request.Descripcion?.Trim()
        };

        _context.Categorias.Add(categoria);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
            when (ex.InnerException is SqlException
                { Number: 2601 or 2627 })
        {
            return Conflict(new
            {
                mensaje = "Ya existe una categoría con ese nombre."
            });
        }

        return CreatedAtAction(
            nameof(ObtenerPorId),
            new { id = categoria.IdCategoria },
            categoria);
    }

    // PUT: api/categorias/1
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Actualizar(
        int id,
        CategoriaRequest request)
    {
        var categoria = await _context.Categorias.FindAsync(id);

        if (categoria is null)
        {
            return NotFound(new { mensaje = "La categoría no existe." });
        }

        categoria.Nombre = request.Nombre.Trim();
        categoria.Descripcion = request.Descripcion?.Trim();

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
            when (ex.InnerException is SqlException
                { Number: 2601 or 2627 })
        {
            return Conflict(new
            {
                mensaje = "Ya existe una categoría con ese nombre."
            });
        }

        return NoContent();
    }

    // DELETE: api/categorias/1
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Eliminar(int id)
    {
        var categoria = await _context.Categorias.FindAsync(id);

        if (categoria is null)
        {
            return NotFound(new { mensaje = "La categoría no existe." });
        }

        _context.Categorias.Remove(categoria);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
            when (ex.InnerException is SqlException { Number: 547 })
        {
            return Conflict(new
            {
                mensaje = "No puedes eliminar una categoría que tiene transacciones asociadas."
            });
        }

        return NoContent();
    }
}