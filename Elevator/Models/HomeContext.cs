using Dapper;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Web;

namespace Elevator.Models
{
    public class HomeContext : DataContext<HomeContext>
    {
        public IEnumerable<int> testProcedure()
        {
            IEnumerable<int> result = null;
            using (var cnt = Concrete.OpenConnection())
            {
                result = cnt.Query<int>("testProcedure", new
                {
                }, commandType: CommandType.StoredProcedure);
            }
            return result;
        }
    }
}