
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, Mail, Lock, User, Building, BookOpen } from "lucide-react";

interface UserData {
  name: string;
  email: string;
  semester: string;
  college: string;
}

interface AuthFormProps {
  onLogin: (userData: UserData) => void;
}

const AuthForm = ({ onLogin }: AuthFormProps) => {
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    semester: "",
    college: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    console.log("Login attempt:", { email: loginData.email, password: loginData.password });

    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (loginData.email && loginData.password) {
        // Mock successful login
        const userData: UserData = {
          name: "BCA Student",
          email: loginData.email,
          semester: "5",
          college: "XYZ University"
        };
        console.log("Login successful:", userData);
        onLogin(userData);
      } else {
        throw new Error("Please fill in all fields");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    console.log("Signup attempt:", signupData);

    try {
      // Validation
      if (!signupData.name || !signupData.email || !signupData.password || !signupData.semester || !signupData.college) {
        throw new Error("Please fill in all fields");
      }
      
      if (signupData.password !== signupData.confirmPassword) {
        throw new Error("Passwords don't match");
      }

      if (signupData.password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const userData: UserData = {
        name: signupData.name,
        email: signupData.email,
        semester: signupData.semester,
        college: signupData.college
      };
      
      console.log("Signup successful:", userData);
      onLogin(userData);
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg">
          <div className="flex items-center justify-center mb-4">
            <GraduationCap className="h-8 w-8 mr-2" />
            <CardTitle className="text-2xl">Study Spark - BCA</CardTitle>
          </div>
          <CardDescription className="text-purple-100">
            Your complete BCA learning companion 🎓
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <Tabs defaultValue="login" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="flex items-center">
                    <Lock className="h-4 w-4 mr-2" />
                    Password
                  </Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? "Logging in..." : "Login to Study Spark"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Full Name
                  </Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Your full name"
                    value={signupData.name}
                    onChange={(e) => setSignupData({...signupData, name: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={signupData.email}
                    onChange={(e) => setSignupData({...signupData, email: e.target.value})}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-semester" className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Semester
                    </Label>
                    <select
                      id="signup-semester"
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={signupData.semester}
                      onChange={(e) => setSignupData({...signupData, semester: e.target.value})}
                      required
                    >
                      <option value="">Select</option>
                      <option value="1">1st Semester</option>
                      <option value="2">2nd Semester</option>
                      <option value="3">3rd Semester</option>
                      <option value="4">4th Semester</option>
                      <option value="5">5th Semester</option>
                      <option value="6">6th Semester</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-college" className="flex items-center">
                      <Building className="h-4 w-4 mr-2" />
                      College
                    </Label>
                    <Input
                      id="signup-college"
                      type="text"
                      placeholder="Your college"
                      value={signupData.college}
                      onChange={(e) => setSignupData({...signupData, college: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="flex items-center">
                    <Lock className="h-4 w-4 mr-2" />
                    Password
                  </Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password"
                    value={signupData.password}
                    onChange={(e) => setSignupData({...signupData, password: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password" className="flex items-center">
                    <Lock className="h-4 w-4 mr-2" />
                    Confirm Password
                  </Label>
                  <Input
                    id="signup-confirm-password"
                    type="password"
                    placeholder="Confirm your password"
                    value={signupData.confirmPassword}
                    onChange={(e) => setSignupData({...signupData, confirmPassword: e.target.value})}
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Account..." : "Join Study Spark"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthForm;
