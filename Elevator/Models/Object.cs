using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Elevator.Models
{
    public class Object
    {
        public int Id { get; set; }
        public DateTime DateOfCreate { get; set; }
        public string Address { get; set; }
        public int ChangeId { get; set; }
    }
}