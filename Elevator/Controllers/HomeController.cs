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

        public ActionResult Map()
        {
            return View();
        }

        public JsonResult GetData()
        {
            // создадим список данных
            List<Station> stations = HomeContext.Exec(c => c.GetInfoMap()).ToList();
            
            return Json(stations, JsonRequestBehavior.AllowGet);
        }

        public ActionResult Graph()
        {            

            return View();
        }

        public JsonResult GetGraphData()
        {
            // создадим список данных
            List<GraphModel> stations = HomeContext.Exec(c => c.GetDataForGraph()).ToList();

            return Json(stations, JsonRequestBehavior.AllowGet);
        }
    }
}