using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using TheFamilyMapOnline.Models;
using System.Data.Entity;
using System.Net;
using System.Data;
using System.Configuration;
using SendGrid.Helpers.Mail;
using SendGrid;
using System.Threading.Tasks;
using System.Net.Http;
using System.Net.Mail;

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
        //[HttpGet]
        public ActionResult Create()
        {
            return View();
        }

        // POST: AgenContact/Create
        [HttpPost]
        //[ValidateAntiForgeryToken]
        public ActionResult Create([Bind(Include = "Fname,	Lname,	AgencyName,	ContactNum, States,	Addr, City, DirFname, DirLame,	DirPhone,	DirEmail,	NumOfSites,	ProgramType,	NumOfPrenatalChild,	NumOfInfantChild,	NumOfPreschoolChild,	BetterBeginingRated,	BB_Level,	Interested")]FMOcontact contact)
        {
            try
            {
                if (ModelState.IsValid)
                {
                    db.FMOcontacts.Add(contact);
                    db.SaveChanges();
                    sendemail(contact);
                    //return RedirectToAction("Index");
                }
            }
            catch (DataException /* dex */)
            {
                //Log the error (uncomment dex variable name and add a line here to write a log.
                ModelState.AddModelError("", "Unable to save changes. Try again, and if the problem persists see your system administrator.");
            }
            return View(contact);
        }

        private void sendemail(FMOcontact contact)
        {

            var APIKeyName = "SendGridAPIKey";
            string apiKey = ConfigurationManager.AppSettings[APIKeyName];
            if (string.IsNullOrEmpty(apiKey))
            {
                // not found.  Set it
                throw new Exception(APIKeyName + " application setting not set for email configuration");
            }
            var myMessage = new SendGridMessage();
            myMessage.AddTo(new EmailAddress("zpatterson@uams.edu"));
            myMessage.From = new EmailAddress("support@thefamilymap.org", "Family Map Support");
            myMessage.Subject = "test message";
            myMessage.PlainTextContent = "Contact created:" + contact.AgencyName;//use model vars to fill message 
            //myMessage.HtmlContent = message.Body;
            var client = new SendGridClient(apiKey);
            client.SendEmailAsync(myMessage).Wait();
            return;

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
