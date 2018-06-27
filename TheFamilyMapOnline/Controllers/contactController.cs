using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using TheFamilyMapOnline.Models;
using TheFamilyMapOnline;
using System.Configuration;
using SendGrid.Helpers.Mail;
using SendGrid;

namespace TheFamilyMapOnline.Controllers
{
    public class ContactController : Controller
    {
        private fmDataEntities db = new fmDataEntities();
        // GET: contact
        //Index page with contact form
        [HttpGet]
        public ActionResult Contact()
        {
            Contact s = new Contact();
            return View(s);
        }
        [HttpPost]
        public ActionResult Contact(Contact s)
        {
            Sendemail(s);
            return View("Confirmation",s);
        }
        //thank you page for confirmation of contact submission
        public ActionResult Confirmation(Contact s)
        {
            return View(s);
        }
        //post action for contact. Sends email to FMTeam and redirects to confirmation (thank you) page. 
        
        //method to create sendgrid object from model variables and sends email to FM Team
        private void Sendemail(Contact contact)
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
            myMessage.From = new EmailAddress(contact.Email, contact.Name);
            myMessage.Subject = "New Contact recieved from TheFamilyMap.org!";
            myMessage.HtmlContent = 
                "<html>" +
                "<body style='border:1px dashed gray; border-radius: 10px; padding:10px;'>" +
                "<h2>"+contact.AgencyName+" - <small>" + contact.City + ", " + contact.State + "</small></h2>" +
                "<h3>"+contact.Name+ " (<a href='mailto:"+contact.Email+"'>" + contact.Email+"</a>)</h3>" +
                "<p style='padding-bottom:10px;border-bottom:1px dashed gray'><b>Message:</b></p>"+
                "<p> '" + contact.Message + "'</p>" +
                "</body>" +
                "</html>";
                
                //"Contact recieved from:" + contact.AgencyName +Environment.NewLine + 
                //"Name: " + contact.Name + Environment.NewLine +
                //"State: " + contact.State + Environment.NewLine +
                //"City: " + contact.City + Environment.NewLine +
                //"Message: : " + contact.Message + Environment.NewLine;
            //myMessage.HtmlContent = message.Body;
            var client = new SendGridClient(apiKey);
            client.SendEmailAsync(myMessage).Wait();
            return;

        }
        //// POST: contact/Create
        //[HttpPost]
        //[ValidateAntiForgeryToken]
        //public ActionResult Create([Bind(Include = "Fname")] FMOcontact fMOcontact)
        //{
            
        //    try
        //    {
        //        if (ModelState.IsValid)
        //        {
        //            db.FMOcontacts.Add(fMOcontact);
        //            db.SaveChanges();
        //            return RedirectToAction("Index");
        //        }
        //    }
        //    catch (DataException ex)
        //    {
        //        //Log the error (uncomment dex variable name and add a line here to write a log.
        //        string errormsg = ex.ToString();
        //        ModelState.AddModelError(errormsg, "Unable to save changes. Try again, and if the problem persists see your system administrator.");
        //    }
        //    return View(fMOcontact);
        //}

        // GET: contact/Edit/5
        //public ActionResult Edit(int id)
        //{
        //    return View();
        //}

        //// POST: contact/Edit/5
        //[HttpPost]
        //public ActionResult Edit(int id, FormCollection collection)
        //{
        //    try
        //    {
        //        // TODO: Add update logic here

        //        return RedirectToAction("Index");
        //    }
        //    catch
        //    {
        //        return View();
        //    }
        //}

        //// GET: contact/Delete/5
        //public ActionResult Delete(int id)
        //{
        //    return View();
        //}

        //// POST: contact/Delete/5
        //[HttpPost]
        //public ActionResult Delete(int id, FormCollection collection)
        //{
        //    try
        //    {
        //        // TODO: Add delete logic here

        //        return RedirectToAction("Index");
        //    }
        //    catch
        //    {
        //        return View();
        //    }
        //}
    }
}
