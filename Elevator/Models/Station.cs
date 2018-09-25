using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Elevator.Models
{
    public class Station
    {
        public int Id { get; set; }
        public string PlaceName { get; set; } // название места
        public double Traffic { get; set; } // пассажиропоток
        public string Line { get; set; } // линия метро
        public double GeoLong { get; set; } // долгота - для карт google
        public double GeoLat { get; set; } // широта - для карт google
    }


    public class Station1
    {
        public int Id { get; set; }
        public string PlaceName { get; set; } // название места
        public double Traffic { get; set; } // пассажиропоток
        public string Line { get; set; } // линия метро
        public string GeoLong { get; set; } // долгота - для карт google
        public string GeoLat { get; set; } // широта - для карт google
    }
}