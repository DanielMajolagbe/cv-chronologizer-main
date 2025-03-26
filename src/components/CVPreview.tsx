import { useEffect, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { CVData, formatDateForDisplay, parseDateString, sendCVDocument } from "@/utils/cvUtils";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import "@/styles/no-select.css";

interface CVPreviewProps {
  data: CVData;
  onBack: () => void;
  onDownload: () => void;
}

const CVPreview = ({ data, onBack, onDownload }: CVPreviewProps) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const { personalInfo, entries } = data;
  const [isSending, setIsSending] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  useEffect(() => {
    // Add entrance animation
    const element = previewRef.current;
    if (element) {
      element.classList.add("animate-fade-in");
    }
    
    // Disable text selection and right-click
    const disableTextSelection = (e: Event) => {
      e.preventDefault();
      return false;
    };
    
    document.addEventListener('selectstart', disableTextSelection);
    document.addEventListener('contextmenu', disableTextSelection);
    
    const lastSubmissionTime = localStorage.getItem('lastSubmissionTime');
    if (lastSubmissionTime) {
      const timeElapsed = Date.now() - Number(lastSubmissionTime);
      if (timeElapsed < 24 * 60 * 60 * 1000) { // 24 hours in milliseconds
        setIsButtonDisabled(true);
      }
    }
    
    return () => {
      document.removeEventListener('selectstart', disableTextSelection);
      document.removeEventListener('contextmenu', disableTextSelection);
    };
  }, []);

  const formatDOB = (dob: string) => {
    try {
      const isoDate = parseDateString(dob);
      return isoDate ? format(parseISO(isoDate), "dd/MM/yyyy") : dob;
    } catch (error) {
      return dob;
    }
  };

  const handleSendClick = async () => {
    if (!personalInfo.firstName || !personalInfo.lastName) {
      toast.error("Please fill in your name before sending the CV");
      return;
    }

    setIsSending(true);
    try {
      console.log('Sending CV for', personalInfo.firstName, personalInfo.lastName);
      await sendCVDocument(data);
      toast.success(`CV Submitted`);
      localStorage.setItem('lastSubmissionTime', String(Date.now()));
      setIsButtonDisabled(true);
    } catch (error) {
      console.error('Error sending CV:', error);
      toast.error(error instanceof Error ? error.message : "Failed to send CV. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="container mx-auto p-4" ref={previewRef}>
      <Button 
        className="mb-4" 
        variant="outline" 
        onClick={onBack}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Editor
      </Button>
      
      <Card className="border shadow-lg mb-6 no-select">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold uppercase">Curriculum Vitae</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-bold">{personalInfo.firstName} {personalInfo.lastName}</h2>
            {personalInfo.dateOfBirth && (
              <p className="text-sm">Date of Birth: {formatDOB(personalInfo.dateOfBirth)}</p>
            )}
            {personalInfo.address && (
              <p className="text-sm">{personalInfo.address}</p>
            )}
            {(personalInfo.email || personalInfo.phone) && (
              <p className="text-sm">
                {personalInfo.email && personalInfo.email}
                {personalInfo.email && personalInfo.phone && " | "}
                {personalInfo.phone && personalInfo.phone}
              </p>
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-3">Chronological History</h3>
            <div className="space-y-4">
              {entries
                .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                .map((entry) => (
                  <div key={entry.id} className="border-b pb-3">
                    <div>
                      <span className="font-medium">
                        {entry.type === "education" ? "Education" : entry.type === "work" ? "Work Experience" : "Gap/Break"}:
                      </span>{" "}
                      <span className="font-medium">
                        {entry.organization}
                        {entry.country && `, ${entry.country}`}
                      </span>
                    </div>
                    <div className="text-sm italic">
                      {formatDateForDisplay(entry.startDate)} - {formatDateForDisplay(entry.endDate)}
                    </div>
                    <div className="text-sm italic mb-2">{entry.title}</div>
                    <div className="text-sm pl-4">{entry.description}</div>
                  </div>
                ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            onClick={handleSendClick}
            disabled={isSending || isButtonDisabled}
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit CV
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CVPreview;
