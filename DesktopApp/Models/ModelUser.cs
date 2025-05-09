namespace DesktopApp.Models;
public class Usuario
{
    public string Nome { get; set; }
    public string Email { get; set; }
    public string Senha { get; set; }

    public bool ValidarLogin(string email, string senha)
    {
        return email == Email && senha == Senha;
    }