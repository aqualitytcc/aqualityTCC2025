using System;
using MySql.Data.MySqlClient;

public class ClasseBanco
{
    private MySqlConnection conexao;

    public ClasseBanco()
    {
        string conexaoString = "Server=seu_servidor;Database=seu_banco;User ID=seu_usuario;Password=sua_senha;";
        conexao = new MySqlConnection(conexaoString);
        conexao.Open();
    }

    public bool AutenticarUsuario(string nome, string senha)
    {
        string sql = "SELECT COUNT(*) FROM Usuarios WHERE Nome = @Nome AND Senha = @Senha";
        using var cmd = new MySqlCommand(sql, conexao);
        cmd.Parameters.AddWithValue("@Nome", nome);
        cmd.Parameters.AddWithValue("@Senha", senha);

        return Convert.ToInt32(cmd.ExecuteScalar()) > 0;
    }
}
