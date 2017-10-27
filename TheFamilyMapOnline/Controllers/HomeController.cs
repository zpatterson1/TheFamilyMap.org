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
        // GET: Index.
        public ActionResult Index()
        {
            return View();
        }
        // GET: Overview.
        public ActionResult Overview()
        {
            ViewBag.Message = " Your application description page.";
            Overview S = new Models.Overview();
            S.test = Convert.ToString('1');
            return View(S);
        }
        //GET: HowitWorks.
        public ActionResult HowitWorks()
        {
            ViewBag.Message = "Your application instruction page.";
            HowitWorks H = new Models.HowitWorks();
            H.test = Convert.ToString('2');
            return View(H);
        }
        // GET: Training.
        public ActionResult Training()
        {
            return View();
        }
        // GET: Research.
        public ActionResult Research()
        {

            return View();
        }
        // GET:Clients.
        public ActionResult Clients()
        {
           
            return View();
        }
        // GET:Contact.
        public ActionResult ContactUs ()
        {
            ViewBag.Message = " Your contact page.";
            return View();
        }
    }
}