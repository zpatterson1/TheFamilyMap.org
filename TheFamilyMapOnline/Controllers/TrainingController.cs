using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace TheFamilyMapOnline.Controllers
{
    public class TrainingController : Controller
    {
        // GET: Training
        public ActionResult Index()
        {
            return View();
        }
        // GET: Annual Renewal 
        public ActionResult AnnualRenewal()
        {
            return View();
        }
        // GET: Arkansas Providers
        public ActionResult ArkansasProviders()
        {
            return View();
        }
    }

}