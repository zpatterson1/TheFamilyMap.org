using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;

namespace TheFamilyMapOnline.Models
{
    public class ClientsTestimonials
    {
    }
    public class RoutingConfig 
    {
        public static void RegisterRoutes(RouteCollection routes)
        {
            routes.IgnoreRoute("{resource}.axd/{*pathInfo}");
            routes.MapRoute(
                name: "Default",                        // Route name 
                url: "{Controller}/{action}/{id}",          //URl with Parameters
                defaults: new { controller = "Client", action = "Client", id ="" } // Parameter Defaults
                );
        }

    }
}