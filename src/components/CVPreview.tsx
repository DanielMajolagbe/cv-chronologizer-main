import { useEffect, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { CVData, formatDateForDisplay, parseDateString } from "@/utils/cvUtils";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, Copy, ArrowLeft, Loader2 } from "lucide-react";
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
      await onDownload();
      toast.success(`CV Submitted  `);
    } catch (error) {
      console.error('Error sending CV:', error);
      toast.error(error instanceof Error ? error.message : "Failed to send CV. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div ref={previewRef} className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Editor
        </Button>
        <Button 
          size="sm"
          onClick={handleSendClick}
          disabled={isSending}
        >
          {isSending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending CV...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" /> Submit CV
            </>
          )}
        </Button>
      </div>

      <Card className="preview-card bg-white shadow-md border select-none no-select no-copy" style={{ userSelect: 'none' }}>
        <CardHeader className="pb-0">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-1">{personalInfo.firstName} {personalInfo.lastName}</h2>
            <div className="text-center text-muted-foreground">
              <p>Date of Birth: {formatDOB(personalInfo.dateOfBirth)}</p>
              {personalInfo.address && <p>{personalInfo.address}</p>}
              <p>{personalInfo.email} | {personalInfo.phone}</p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="py-6">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2"></h2>
          
          {entries.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No entries added yet</p>
          ) : (
            <div className="space-y-6">
              {entries.map((entry, index) => (
                <div key={entry.id} className="cv-entry">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <span className="font-semibold">
                        {entry.type === "education" ? "Education" : entry.type === "work" ? "Work Experience" : "Gap/Break"}:
                      </span>{" "}
                      {entry.type !== "gap" && (
                        <span>
                          {entry.organization}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-muted-foreground">
                        {formatDateForDisplay(entry.startDate)} - {formatDateForDisplay(entry.endDate)}
                      </span>
                    </div>
                  </div>
                  {entry.type !== "gap" ? (
                    <p className="font-medium">{entry.title}</p>
                  ) : (
                    <p className="font-medium">Gap/Break Period</p>
                  )}
                  <p className="text-muted-foreground">{entry.description}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="border-t pt-6 text-center text-sm text-muted-foreground">
          CV Created with Royacare Agency CV Builder
        </CardFooter>
      </Card>
    </div>
  );
};

export default CVPreview;
