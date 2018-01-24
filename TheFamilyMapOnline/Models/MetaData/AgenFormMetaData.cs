using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;

namespace TheFamilyMapOnline.Models
{
    public class AgenFormMetaData
    {
        [Display(Name ="First Name: ")]
        public string Fname { get; set; }
        [Display(Name = "Last Name: ")]
        public string Lname { get; set; }
        [Display(Name = "Agency Name: ")]
        public string AgencyName { get; set; }
        [Display(Name = "Contact: ")]
        public Nullable<int> Contact { get; set; }
        [Display(Name = "Address: ")]
        public string Addr { get; set; }
        public string City { get; set; }
        public Nullable<int> States { get; set; }
        public string DirFname { get; set; }
        public string DirLame { get; set; }
        public string DirPhone { get; set; }
        public string DirEmail { get; set; }
        public Nullable<int> NumOfSites { get; set; }
        public Nullable<int> ProgramType { get; set; }
        public Nullable<int> NumOfPrenatalChild { get; set; }
        public Nullable<int> NumOfInfantChild { get; set; }
        public Nullable<int> NumOfPreschoolChild { get; set; }
        public Nullable<int> BetterBeginingRated { get; set; }
        public Nullable<int> BB_Level { get; set; }
        public Nullable<int> Interested { get; set; }
        public int ID { get; set; }
    }
    [MetadataType(typeof(AgenFormMetaData))]
    public partial class FMOcontact
    {

    }
}