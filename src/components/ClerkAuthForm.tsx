import { SignIn, SignUp } from "@clerk/clerk-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap } from "lucide-react";

const ClerkAuthForm = () => {
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
          <Tabs defaultValue="signin" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <SignIn
                redirectUrl="/"
                signUpUrl="#"
                appearance={{
                  elements: {
                    formButtonPrimary: "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700",
                    card: "shadow-none",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                    socialButtonsBlockButton: "bg-white border border-gray-300 hover:bg-gray-50",
                    formFieldInput: "border border-gray-300 rounded-md",
                    footerActionLink: "text-purple-600 hover:text-purple-700"
                  }
                }}
              />
            </TabsContent>

            <TabsContent value="signup">
              <SignUp
                redirectUrl="/"
                signInUrl="#"
                appearance={{
                  elements: {
                    formButtonPrimary: "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700",
                    card: "shadow-none",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                    socialButtonsBlockButton: "bg-white border border-gray-300 hover:bg-gray-50",
                    formFieldInput: "border border-gray-300 rounded-md",
                    footerActionLink: "text-purple-600 hover:text-purple-700"
                  }
                }}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClerkAuthForm;
