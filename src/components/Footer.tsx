
import { GraduationCap, Code, Database, Globe, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 text-white mt-16">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center">
              <GraduationCap className="h-8 w-8 mr-2" />
              <h3 className="text-2xl font-bold">Study Spark</h3>
            </div>
            <p className="text-purple-200">
              Empowering BCA students to excel in their academic journey and build successful IT careers.
            </p>
            <div className="flex space-x-4">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-500 cursor-pointer">
                <span className="text-white font-bold">f</span>
              </div>
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-500 cursor-pointer">
                <span className="text-white font-bold">t</span>
              </div>
              <div className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center hover:bg-pink-500 cursor-pointer">
                <span className="text-white font-bold">in</span>
              </div>
            </div>
          </div>

          {/* BCA Subjects */}
          <div className="space-y-4">
            <h4 className="text-xl font-semibold">BCA Subjects</h4>
            <ul className="space-y-2 text-purple-200">
              <li className="flex items-center hover:text-white cursor-pointer">
                <Code className="h-4 w-4 mr-2" />
                Programming in C
              </li>
              <li className="flex items-center hover:text-white cursor-pointer">
                <Code className="h-4 w-4 mr-2" />
                Java & OOP
              </li>
              <li className="flex items-center hover:text-white cursor-pointer">
                <Database className="h-4 w-4 mr-2" />
                Database Management
              </li>
              <li className="flex items-center hover:text-white cursor-pointer">
                <Globe className="h-4 w-4 mr-2" />
                Web Development
              </li>
              <li className="flex items-center hover:text-white cursor-pointer">
                <Code className="h-4 w-4 mr-2" />
                Data Structures
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-xl font-semibold">Quick Links</h4>
            <ul className="space-y-2 text-purple-200">
              <li className="hover:text-white cursor-pointer">Study Planner</li>
              <li className="hover:text-white cursor-pointer">BCA Quiz</li>
              <li className="hover:text-white cursor-pointer">Coding Practice</li>
              <li className="hover:text-white cursor-pointer">Progress Dashboard</li>
              <li className="hover:text-white cursor-pointer">Career Guidance</li>
              <li className="hover:text-white cursor-pointer">IT Placements</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-xl font-semibold">Contact Us</h4>
            <div className="space-y-3 text-purple-200">
              <div className="flex items-center">
                <Mail className="h-5 w-5 mr-3" />
                <span>support@studyspark.com</span>
              </div>
              <div className="flex items-center">
                <Phone className="h-5 w-5 mr-3" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-5 w-5 mr-3" />
                <span>New Delhi, India</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-purple-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-purple-300 text-sm">
              © 2024 Study Spark - BCA Edition. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <span className="text-purple-300 text-sm hover:text-white cursor-pointer">Privacy Policy</span>
              <span className="text-purple-300 text-sm hover:text-white cursor-pointer">Terms of Service</span>
              <span className="text-purple-300 text-sm hover:text-white cursor-pointer">Help & Support</span>
            </div>
          </div>
        </div>

        {/* BCA Success Message */}
        <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg p-6 mt-8 text-center">
          <h5 className="text-xl font-bold mb-2">🎓 Future IT Professional!</h5>
          <p className="text-yellow-100">
            Master your BCA curriculum, build amazing projects, and land your dream IT job! 💻🚀
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
