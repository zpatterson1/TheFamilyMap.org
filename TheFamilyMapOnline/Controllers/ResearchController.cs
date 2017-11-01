using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace TheFamilyMapOnline.Controllers
{
    public class researchController : Controller
    {
        // GET: Research
        public ActionResult Research()
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
            return PartialView();
        }
        // GET: Home Visting
        
        public ActionResult HomeVisiting()
        {
            return PartialView();
        }
        // GET: Programs/Agencies

        public ActionResult ProgramsAgencies()
        {
            return PartialView();
        }

        // GET: Teachers & Parents
        public ActionResult TeacherParents()
        {
            return PartialView();
        }
        // GET: Development Team 
        public ActionResult DevelopmentTeam()
        {
            return PartialView();
        }

    }

}