using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.Common;
using System.Linq;
using System.Threading.Tasks;
using System.Web;

namespace Elevator.Models
{

    public class Concrete : IDisposable
    {
        /// <summary>
        /// Список всех соединений, которые были сделаны черех объект
        /// </summary>
        protected List<DbConnection> ConnectionHistory = new List<DbConnection>();

        /// <summary>
        /// Страка подключения
        /// </summary>
        protected string ConnectionString { get; set; }

        /// <summary>
        /// Фабрика объектов
        /// </summary>
        protected DbProviderFactory Factory { get; set; }

        /// <summary>
        /// Конструктор по типу ConnectionStringSettings
        /// </summary>
        /// <param name="settings">Параметры подключения</param>
        public Concrete(ConnectionStringSettings settings) : this(settings.ConnectionString, settings.ProviderName) { }

        /// <summary>
        /// Конструктор по строкам (подключение, провайдер)
        /// </summary>
        /// <param name="connectionString">Строка подклчения</param>
        /// <param name="providerName">Имя провайдера</param>
        public Concrete(string connectionString, string providerName)
            : this(connectionString, DbProviderFactories.GetFactory(providerName)) { }

        /// <summary>
        /// Конструктор по строке подключения и фабрике (конечный в цепочке, к нему все сводится)
        /// </summary>
        /// <param name="connectionString">Строка подклчения</param>
        /// <param name="factory">Фабрика</param>
        public Concrete(string connectionString, DbProviderFactory factory)
        {
            ConnectionString = connectionString;
            Factory = factory;
        }

        /// <summary>
        /// Выполнить действие с БД и закрыть соединение
        /// </summary>
        /// <param name="action">Обработчик</param>
        public void UseConnection(Action<DbConnection> action)
        {
            DbConnection cnt = OpenConnection();
            try
            {
                action(cnt);
            }
            finally
            {
                cnt.Dispose();
            }
        }

        /// <summary>
        /// (Асинхронно) Выполнить действие с БД и закрыть соединение
        /// </summary>
        /// <param name="action">Обработчик</param>
        public async Task UseConnectionAsync(Action<DbConnection> action)
        {
            DbConnection cnt = await OpenConnectionAsync();
            try
            {
                action(cnt);
            }
            finally
            {
                cnt.Dispose();
            }
        }

        /// <summary>
        /// Открыть соединение
        /// </summary>
        /// <returns>Объект соедниение с БД</returns>
        public DbConnection OpenConnection()
        {
            DbConnection cnt = Factory.CreateConnection();
            cnt.ConnectionString = ConnectionString;
            cnt.Open();

            ConnectionHistory.Add(cnt);

            return cnt;
        }

        /// <summary>
        /// (Асинхронно) Открыть соединение
        /// </summary>
        /// <returns>Объект соедниение с БД</returns>
        public async Task<DbConnection> OpenConnectionAsync()
        {
            DbConnection cnt = Factory.CreateConnection();
            cnt.ConnectionString = ConnectionString;

            await cnt.OpenAsync();
            ConnectionHistory.Add(cnt);

            return cnt;
        }

        /// <summary>
        /// Закрыть все соединения
        /// </summary>
        public void Dispose()
        {
            ConnectionHistory.ForEach(cnt => {
                if (cnt.State != System.Data.ConnectionState.Closed) cnt.Close();
            });
        }
    }
}