using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace TheFamilyMapOnline.Controllers
{
    public class ResearchController : Controller
    {
        // GET: Research
        public ActionResult Index()
        {
            return View();
        }
        // Get: Newest Research 
        public ActionResult NewestResearch()
        {
            return PartialView();
        }
        // Get: What's Measured 
        public ActionResult WhatsMeasured()
        {
            return PartialView();
        }

        // GET: Reliability & Validity
        public ActionResult ReliabilityValidity()
        {
            return PartialView();
        }

        // GET: Evalutation Tool
        public ActionResult EvaluationTool()
        {
            return PartialView();
        }
        
        // GET: Intervention Tool
        public ActionResult InterventionTool()
        {
            return View();
        }
        // GET: Home Visting
        
        public ActionResult HomeVisting()
        {
            return View();
        }
        // GET: Programs/Agencies

        public ActionResult ProgramsAgencies()
        {
            return View();
        }

        // GET: Teachers & Parents
        public ActionResult TeachersParents()
        {
            return View();
        }
        // GET: Development Team 
        public ActionResult DevelopmentTeam()
        {
            return View();
        }

    }

}