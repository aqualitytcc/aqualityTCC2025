using Avalonia.Controls;
using DesktopApp.ViewModels;

namespace DesktopApp
{
    public partial class MainWindow : Window
    {
        public MainWindow()
        {
            InitializeComponent();
            DataContext = new LoginViewModel(); // Definindo o contexto aqui
        }
    }
}
