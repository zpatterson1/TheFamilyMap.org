﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace TheFamilyMapOnline.Models
{
    public class home
    {
        // GET & SET: The Username and passwword from user.
        public class MemberLogin
        {
            public string Username { get; set; }
            public string Password { get; set; }
        }
        //GET & SET: The information from user through Quick Connect.
        public class QuickConnect
        {
            public string YourName { get; set; }
            public string AgencyName { get; set; }
            public string YourEmail { get; set; }
            public string City { get; set; }
            public string ST { get; set; }
        }
    }
}