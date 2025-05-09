namespace DesktopApp.Models
{
    public class Usuario
    {
        public string Nome { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Senha { get; set; } = string.Empty;

        public bool ValidarLogin(string email, string senha)
        {
            return email == Email && senha == Senha;
        }
    }
}
