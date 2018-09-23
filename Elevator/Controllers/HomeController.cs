using Elevator.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Elevator.Controllers
{
    public class HomeController : Controller
    {
        // GET: Home
        public ActionResult Index()
        {
            IEnumerable<Region> regions = HomeContext.Exec(c => c.GetRegion());
            return View(regions);
        }

        public ActionResult Objects(int region)
        {
            IEnumerable<Elevator.Models.Object> objects = HomeContext.Exec(c => c.GetOldObjectsBySubject(region));
            return View(objects);
        }
    }
}