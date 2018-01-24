using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using TheFamilyMapOnline.Models;
using System.Data.Entity;
using System.Linq;
using System.Net;

namespace TheFamilyMapOnline.Controllers
{
    public class AgenContactController : Controller
    {
        private fmDataEntities db = new fmDataEntities();
        // GET: AgenContact
        public ActionResult Index()
        {

            
            return View(db.FMOcontacts.ToList());
        }

        // GET: AgenContact/Details/5
        public ActionResult Details(int id)
        {
            return View();
        }

        // GET: AgenContact/Create
        public ActionResult Create()
        {
            return View();
        }

        // POST: AgenContact/Create
        [HttpPost]
        public ActionResult Create(FormCollection collection)
        {
            try
            {
                // TODO: Add insert logic here

                return RedirectToAction("Index");
            }
            catch
            {
                return View();
            }
        }

        // GET: AgenContact/Edit/5
        public ActionResult Edit(int id)
        {
            return View();
        }

        // POST: AgenContact/Edit/5
        [HttpPost]
        public ActionResult Edit(int id, FormCollection collection)
        {
            try
            {
                // TODO: Add update logic here

                return RedirectToAction("Index");
            }
            catch
            {
                return View();
            }
        }

        // GET: AgenContact/Delete/5
        public ActionResult Delete(int id)
        {
            return View();
        }

        // POST: AgenContact/Delete/5
        [HttpPost]
        public ActionResult Delete(int id, FormCollection collection)
        {
            try
            {
                // TODO: Add delete logic here

                return RedirectToAction("Index");
            }
            catch
            {
                return View();
            }
        }
    }
}
