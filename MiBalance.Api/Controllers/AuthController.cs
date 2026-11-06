using System.Security.Claims;
using MiBalance.Api.Data;
using MiBalance.Api.Dtos;
using MiBalance.Api.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace MiBalance.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly MiBalanceContext _context;
    private readonly IPasswordHasher<Usuario> _hasher;

    public AuthController(
        MiBalanceContext context,
        IPasswordHasher<Usuario> hasher)
    {
        _context = context;
        _hasher = hasher;
    }

    // POST: api/auth/registro
    [AllowAnonymous]
    [HttpPost("registro")]
    public async Task<IActionResult> Registro(RegistroRequest request)
    {
        var usuario = new Usuario
        {
            Nombre = request.Nombre.Trim(),
            Correo = request.Correo.Trim().ToLowerInvariant()
        };

        usuario.PasswordHash = _hasher.HashPassword(
            usuario, request.Password);

        _context.Usuarios.Add(usuario);

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
                mensaje = "Ya existe un usuario con ese correo."
            });
        }

        return StatusCode(StatusCodes.Status201Created, new
        {
            mensaje = "Usuario registrado correctamente.",
            usuario = new
            {
                usuario.IdUsuario,
                usuario.Nombre,
                usuario.Correo
            }
        });
    }

    // POST: api/auth/login
    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var correo = request.Correo.Trim().ToLowerInvariant();

        var usuario = await _context.Usuarios
            .SingleOrDefaultAsync(u => u.Correo == correo);

        if (usuario is null)
        {
            return Unauthorized(new
            {
                mensaje = "Correo o contraseña incorrectos."
            });
        }

        PasswordVerificationResult resultado;

        try
        {
            resultado = _hasher.VerifyHashedPassword(
                usuario, usuario.PasswordHash, request.Password);
        }
        catch (FormatException)
        {
            // Puede ocurrir con datos antiguos que no contienen un hash válido.
            resultado = PasswordVerificationResult.Failed;
        }

        if (resultado == PasswordVerificationResult.Failed)
        {
            return Unauthorized(new
            {
                mensaje = "Correo o contraseña incorrectos."
            });
        }

        if (resultado == PasswordVerificationResult.SuccessRehashNeeded)
        {
            usuario.PasswordHash = _hasher.HashPassword(
                usuario, request.Password);

            await _context.SaveChangesAsync();
        }

        var claims = new[]
        {
            new Claim(
                ClaimTypes.NameIdentifier,
                usuario.IdUsuario.ToString()),
            new Claim(ClaimTypes.Name, usuario.Nombre),
            new Claim(ClaimTypes.Email, usuario.Correo)
        };

        var identity = new ClaimsIdentity(
            claims,
            CookieAuthenticationDefaults.AuthenticationScheme);

        await HttpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            new ClaimsPrincipal(identity),
            new AuthenticationProperties
            {
                IsPersistent = false,
                AllowRefresh = false
            });

        return Ok(new
        {
            mensaje = "Sesión iniciada correctamente.",
            usuario = new
            {
                usuario.IdUsuario,
                usuario.Nombre,
                usuario.Correo
            }
        });
    }

    // GET: api/auth/me
    [Authorize]
    [HttpGet("me")]
    public IActionResult Me()
    {
        return Ok(new
        {
            idUsuario = int.Parse(
                User.FindFirstValue(ClaimTypes.NameIdentifier)!),
            nombre = User.FindFirstValue(ClaimTypes.Name),
            correo = User.FindFirstValue(ClaimTypes.Email)
        });
    }

    // POST: api/auth/logout
    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(
            CookieAuthenticationDefaults.AuthenticationScheme);

        return Ok(new { mensaje = "Sesión cerrada correctamente." });
    }
}