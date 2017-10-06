using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using TheFamilyMapOnline.Models;

namespace TheFamilyMapOnline.Controllers
{
    public class HomeController : Controller
    {
        public ActionResult index()
        {
            return View();
        }

        public ActionResult HowitWorks()
        {
            ViewBag.Message = "Your application description page.";
            Overview S = new Overview();
            S.test = Convert.ToString('1');
            return View(S);
        }

        public ActionResult Traning()
        {
            ViewBag.Message = "Your contact page.";

            return View();
        }
        public ActionResult Research()
        {

            return View();
        }
        public ActionResult Clients()
        {
            ViewBag.Message = " ";
            return View();
        }
        public ActionResult ContactUs ()
        {
            ViewBag.Message = "";
            return View();
        }
    }
}