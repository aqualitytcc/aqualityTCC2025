using Avalonia.Controls;
using Avalonia.Markup.Xaml;
using ReactiveUI;

namespace DesktopApp.ViewModels
{
    public class LoginViewModel : ReactiveObject
    {
        private string _email;
        private string _senha;
        private string _mensagemerro;
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
        private void ExecutarLogin(){
            var usuario = new Usuario
        
            }
        }
    }
}

