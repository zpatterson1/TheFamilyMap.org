using System;
using System.ComponentModel.DataAnnotations;
using Foolproof;


namespace TheFamilyMapOnline.Models
{
    public class AgenFormMetaData
    {
        [Required (ErrorMessage ="Please enter {0}")]
        [StringLength (100,MinimumLength =3,ErrorMessage ="{0} should be 3-100 charcters")]
        [Display(Name = "First Name: ")]
        public string Fname { get; set; }
        [Required(ErrorMessage = "Please enter {0}")]
        [StringLength(100, MinimumLength = 3, ErrorMessage = "{0} should be 3-100 charcters")]
        [Display(Name = "Last Name: ")]
        public string Lname { get; set; }
        [Display(Name = "Agency Name: ")]
        [Required(ErrorMessage = "Please enter {0}")]
        [StringLength(150, MinimumLength = 3, ErrorMessage = "{0} should be 3-150 charcters")]
        public string AgencyName { get; set; }
        public Nullable<int> ContactNum { get; set; }
        [Display(Name = "Address: ")]
        [RequiredIf("ContactNum", 3, ErrorMessage = "Please provide details for preferred contact method")]
        public string Addr { get; set; }
        [RequiredIf("ContactNum", 3, ErrorMessage = "Please provide details for preferred contact method")]
        public string City { get; set; }
        [RequiredIf("ContactNum", 3, ErrorMessage = "Please provide details for preferred contact method")]
        public string States { get; set; }
        public string DirFname { get; set; }
        public string DirLame { get; set; }
        [RequiredIf("ContactNum", 1, ErrorMessage = "Please provide details for preferred contact method")]
        [DataType(DataType.PhoneNumber,ErrorMessage ="Please provide a vaild phone number")]
        [Phone(ErrorMessage = "Please provide a valid phone number 2")]
        public string DirPhone { get; set; }
        [RequiredIf("ContactNum", 2, ErrorMessage = "Please provide details for preferred contact method")]
        [DataType(DataType.EmailAddress, ErrorMessage = "Please provide a vaild email address")]
        [Display(Name ="Director Email")]
        public string DirEmail { get; set; }
        [Range(1,500,ErrorMessage ="Please enter a valid number")]
        public Nullable<int> NumOfSites { get; set; }
        public Nullable<int> ProgramType { get; set; }
        [Range(1, 2000, ErrorMessage = "Please enter a valid number")]
        public Nullable<int> NumOfPrenatalChild { get; set; }
        [Range(1, 2000, ErrorMessage = "Please enter a valid number")]
        public Nullable<int> NumOfInfantChild { get; set; }
        [Range(1, 2000, ErrorMessage = "Please enter a valid number")]
        public Nullable<int> NumOfPreschoolChild { get; set; }
        public Nullable<int> BetterBeginingRated { get; set; }
        [RequiredIf("BetterBeginingRated", 1, ErrorMessage = "Please select Better Beginnings level.")]
        public Nullable<int> BB_Level { get; set; }
        public Nullable<int> Interested { get; set; }
        public int ID { get; set; }
    }
    [MetadataType(typeof(AgenFormMetaData))]
    public partial class FMOcontact
    {

    }
}