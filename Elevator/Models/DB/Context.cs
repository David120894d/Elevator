using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Threading.Tasks;
using System.Web;

namespace Elevator.Models
{

    public class DataContext<TContext> : IDisposable
        where TContext : DataContext<TContext>
    {

        /// <summary>
        /// Имя строки соединения с БД
        /// </summary>
        public static string DefaultConnectionName
        {
            get
            {
                return ConfigurationManager.AppSettings["connectionName"];
            }
        }

        public static Concrete CreateConcrete(string connectionName = null)
        {
            return new Concrete(ConfigurationManager.ConnectionStrings[DefaultConnectionName ?? connectionName]);
        }

        protected Concrete Concrete { get; private set; }

        /// <summary>
        /// Создать экземпляр контекста
        /// </summary>
        /// <typeparam name="T">тип контекста</typeparam>
        /// <param name="connectionName">имя соедиение, если отличное от соединения по-умолчанию</param>
        /// <returns></returns>
        public static TContext Create(string connectionName = null)
        {
            TContext context = Activator.CreateInstance<TContext>();
            context.Concrete = CreateConcrete(connectionName);
            return context;
        }


        /// <summary>
        /// Shortcut для вызова одиночных методов контекста с освобождением ресурсов
        /// </summary>
        /// <typeparam name="TResult"></typeparam>
        /// <param name="operation">выполняемая операция</param>
        /// <param name="connectionName">имя соедиение, если отличное от соединения по-умолчанию</param>
        /// <returns></returns>
        public static TResult Exec<TResult>(Func<TContext, TResult> operation, string connectionName = null)
        {
            if (operation == null) throw new ArgumentNullException("operation");

            using (var context = DataContext<TContext>.Create(connectionName))
            {
                return operation(context);
            }
        }


        /// <summary>
        /// Shortcut для вызова одиночных методов контекста с освобождением ресурсов
        /// </summary>
        /// <typeparam name="TResult"></typeparam>
        /// <param name="operation">выполняемая операция</param>
        /// <param name="connectionName">имя соедиение, если отличное от соединения по-умолчанию</param>
        /// <returns></returns>
        public static Task<TResult> ExecAsync<TResult>(Func<TContext, Task<TResult>> operation, string connectionName = null)
        {
            if (operation == null) throw new ArgumentNullException("operation");

            var context = DataContext<TContext>.Create(connectionName);

            var task = operation(context);

            task.ContinueWith(t => context.Dispose(), TaskContinuationOptions.ExecuteSynchronously);

            return task;
        }

        public void Dispose()
        {
            Concrete.Dispose();
        }
    }
}