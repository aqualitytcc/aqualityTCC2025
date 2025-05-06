namespace DesktopApp.Models;
public class Usuario
{
    public string Nome { get; set; }
    public string Email { get; set; }
    public string Senha { get; set; }

    public bool ValidarLogin(string email, string senha)
    {
        // Simulação de login, depois você conecta com base de dados
        return Email == email && Senha == senha;a
    }
}