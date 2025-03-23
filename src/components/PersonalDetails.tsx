import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PersonalInfo } from "@/utils/cvUtils";

interface PersonalDetailsProps {
  personalInfo: PersonalInfo;
  onChange: (info: Partial<PersonalInfo>) => void;
}

const PersonalDetails = ({ personalInfo, onChange }: PersonalDetailsProps) => {
  const handleChange = (field: keyof PersonalInfo, value: string) => {
    onChange({ [field]: value });
  };

  useEffect(() => {
    // Add a smooth entry animation when the component mounts
    const element = document.getElementById('personalDetails');
    if (element) {
      element.classList.add('animate-scale-in');
    }
  }, []);

  return (
    <Card 
      id="personalDetails" 
      className="mb-8 shadow-sm border-l-4 border-l-primary"
    >
      <CardHeader>
        <CardTitle className="text-xl text-center sm:text-left">Personal Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-sm font-medium">
              First Name
            </Label>
            <Input
              id="firstName"
              value={personalInfo.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              className="transition-all focus:ring-2 focus:ring-primary/20"
              placeholder="Enter your first name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-sm font-medium">
              Last Name
            </Label>
            <Input
              id="lastName"
              value={personalInfo.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
              className="transition-all focus:ring-2 focus:ring-primary/20"
              placeholder="Enter your last name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth" className="text-sm font-medium">
              Date of Birth
            </Label>
            <Input
              id="dateOfBirth"
              value={personalInfo.dateOfBirth}
              onChange={(e) => {
                // Keep the original value for validation in the background
                handleChange("dateOfBirth", e.target.value);
              }}
              className="transition-all focus:ring-2 focus:ring-primary/20"
              placeholder="Example: 01.01.2000"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="country" className="text-sm font-medium">
              Country
            </Label>
            <Input
              id="country"
              value={personalInfo.country}
              onChange={(e) => handleChange("country", e.target.value)}
              className="transition-all focus:ring-2 focus:ring-primary/20"
              placeholder="Enter your country"
            />
          </div>
          
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address" className="text-sm font-medium">
              Address
            </Label>
            <Textarea
              id="address"
              value={personalInfo.address}
              onChange={(e) => handleChange("address", e.target.value)}
              className="min-h-[80px] transition-all focus:ring-2 focus:ring-primary/20"
              placeholder="Enter your full address"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={personalInfo.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="transition-all focus:ring-2 focus:ring-primary/20"
              placeholder="Enter your email address"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">
              Phone
            </Label>
            <Input
              id="phone"
              value={personalInfo.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              className="transition-all focus:ring-2 focus:ring-primary/20"
              placeholder="Enter your phone number"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalDetails;
