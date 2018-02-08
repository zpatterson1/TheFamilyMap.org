using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using TheFamilyMapOnline.Models;
using TheFamilyMapOnline;

namespace TheFamilyMapOnline.Controllers
{
    public class ContactController : Controller
    {
        private fmDataEntities db = new fmDataEntities();
        // GET: contact
        public ActionResult Contact()
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
        [ValidateAntiForgeryToken]
        public ActionResult Create([Bind(Include = "Fname")] FMOcontact fMOcontact)
        {
            
            try
            {
                if (ModelState.IsValid)
                {
                    db.FMOcontacts.Add(fMOcontact);
                    db.SaveChanges();
                    return RedirectToAction("Index");
                }
            }
            catch (DataException ex)
            {
                //Log the error (uncomment dex variable name and add a line here to write a log.
                string errormsg = ex.ToString();
                ModelState.AddModelError(errormsg, "Unable to save changes. Try again, and if the problem persists see your system administrator.");
            }
            return View(fMOcontact);
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
