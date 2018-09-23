using Dapper;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Web;
using Elevator.Models;

namespace Elevator.Models
{
    public class HomeContext : DataContext<HomeContext>
    {
        public IEnumerable<Region> GetRegion()
        {
            IEnumerable<Region> regions = null;
            using (var cnt = Concrete.OpenConnection())
            {
                regions = cnt.Query<Region>("GetRegion", new
                {
                }, commandType: CommandType.StoredProcedure);
            }
            return regions;
        }

        public IEnumerable<Object> GetOldObjectsBySubject(int id)
        {
            IEnumerable<Object> objects = null;
            using (var cnt = Concrete.OpenConnection())
            {
                objects = cnt.Query<Object>("GetOldObjectsBySubject", new
                {
                    Id = id
                }, commandType: CommandType.StoredProcedure);
            }
            return objects;
        }

        public IEnumerable<GraphModel> GetDataForGraph()
        {
            IEnumerable<GraphModel> objects = null;
            using (var cnt = Concrete.OpenConnection())
            {
                objects = cnt.Query<GraphModel>("GetDataForGraph", new {}, commandType: CommandType.StoredProcedure);
            }
            return objects;
        }

        public IEnumerable<Station> GetInfoMap()
        {
            //{ Id = 1,
            //    PlaceName = "Библиотека имени Ленина",
            //    GeoLat = 37.610489,
            //    GeoLong = 55.752308,
            //    Line = "Сокольническая",
            //    Traffic = 1.0}
            IEnumerable<Station> objects = null;
            using (var cnt = Concrete.OpenConnection())
            {
                objects = cnt.Query<Station>("GetOldObjectsBySubject", new {}, commandType: CommandType.StoredProcedure);
            }
            return objects;
        }
    }

    
}