using ReactiveUI;
using DesktopApp.Models;
using System.Reactive;
using System;

namespace DesktopApp.ViewModels
{
    public class LoginViewModel : ReactiveObject
    {
        private string _email = string.Empty;
        private string _senha = string.Empty;
        private string _mensagemErro = string.Empty;

        public string Email
        {
            get => _email;
            set => this.RaiseAndSetIfChanged(ref _email, value);
        }

        public string Senha
        {
            get => _senha;
            set => this.RaiseAndSetIfChanged(ref _senha, value);
        }

        public string MensagemErro
        {
            get => _mensagemErro;
            set => this.RaiseAndSetIfChanged(ref _mensagemErro, value);
        }

        public ReactiveCommand<Unit, Unit> LoginCommand { get; }

        public LoginViewModel()
        {
            LoginCommand = ReactiveCommand.Create(ExecutarLogin);
        }

        private void ExecutarLogin()
        {
            var usuario = new Usuario
            {
                Email = "admin@email.com",
                Senha = "123456"
            };

            if (usuario.ValidarLogin(Email, Senha))
            {
                MensagemErro = "Login bem-sucedido!";
                // Aqui você pode navegar para outra view depois
            }
            else
            {
                MensagemErro = "Email ou senha inválidos.";
            }
        }
    }
}
