﻿using System;
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
            return PartialView();
        }

        // GET: Annual Renewal
        
        public ActionResult AnnualRenewal()
        {
            return PartialView();
        }

        // GET: Arkansas Providers
        public ActionResult ArkansasProviders()
        {
            return PartialView();
        }
    }

}