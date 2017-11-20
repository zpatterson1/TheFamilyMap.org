using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace TheFamilyMapOnline.Controllers
{
    public class contactController : Controller
    {
        // GET: contact
        public ActionResult Index()
        {
            return View();
        }

        // GET: contact/Details/5
        public ActionResult Details(int id)
        {
            return View();
        }

        // GET: contact/Create
        public ActionResult Create()
        {
            return View();
        }

        // POST: contact/Create
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

        // GET: contact/Edit/5
        public ActionResult Edit(int id)
        {
            return View();
        }

        // POST: contact/Edit/5
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

        // GET: contact/Delete/5
        public ActionResult Delete(int id)
        {
            return View();
        }

        // POST: contact/Delete/5
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
