using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace TheFamilyMapOnline.Controllers
{
    public class HowitWorksController : Controller
    {
        // GET: HowitWorks

        public ActionResult Index()
        {
            return View();
        }

        // GET: HowitWorks/Content

        public ActionResult Content()
        {
            return PartialView();
        }

        // GET: HowitWorks/Format

        public ActionResult Format()
        {
            return PartialView();
        }

        // GET: HowitWorks/StepstoAdapting

        public ActionResult StepstoAdapting()
            {
                return PartialView();
            }
        // GET: HowitWorks/FAQS

         public ActionResult FAQS()
            {
            return PartialView(); 
            }

      }
  }