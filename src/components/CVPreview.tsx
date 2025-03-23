import { useEffect, useRef } from "react";
import { format, parseISO } from "date-fns";
import { CVData, formatDateForDisplay, parseDateString } from "@/utils/cvUtils";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Copy, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface CVPreviewProps {
  data: CVData;
  onBack: () => void;
  onDownload: () => void;
}

const CVPreview = ({ data, onBack, onDownload }: CVPreviewProps) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const { personalInfo, entries } = data;

  useEffect(() => {
    // Add entrance animation
    const element = previewRef.current;
    if (element) {
      element.classList.add("animate-fade-in");
    }
  }, []);

  const copyToClipboard = async () => {
    if (previewRef.current) {
      try {
        // Create a simplified text version of the CV
        const cvText = generateCVText();
        
        await navigator.clipboard.writeText(cvText);
        toast.success("CV copied to clipboard");
      } catch (err) {
        toast.error("Failed to copy to clipboard");
        console.error(err);
      }
    }
  };

  const formatDOB = (dob: string) => {
    try {
      const isoDate = parseDateString(dob);
      return isoDate ? format(parseISO(isoDate), "dd/MM/yyyy") : dob;
    } catch (error) {
      return dob;
    }
  };

  const generateCVText = () => {
    let cvText = "";
    
    // Add personal info
    cvText += `${personalInfo.firstName} ${personalInfo.lastName}\n`;
    if (personalInfo.email) cvText += `${personalInfo.email} • `;
    if (personalInfo.phone) cvText += `${personalInfo.phone}\n`;
    if (personalInfo.address) cvText += `${personalInfo.address}\n`;
    cvText += "\n";
    
    // Add sorted entries
    const sortedEntries = [...entries].sort((a, b) => {
      return a.startDate.localeCompare(b.startDate);
    });
    
    sortedEntries.forEach(entry => {
      const startDate = formatDateForDisplay(entry.startDate);
      const endDate = formatDateForDisplay(entry.endDate);
      
      if (entry.type === "gap") {
        cvText += `Gap/Break: ${startDate} - ${endDate}\n`;
        if (entry.description) {
          cvText += `${entry.description}\n\n`;
        } else {
          cvText += `Gap/Break Period\n\n`;
        }
      } else {
        cvText += `${entry.type === "education" ? "Education" : "Work Experience"}: ${entry.organization} ${startDate} - ${endDate}\n`;
        cvText += `${entry.title}\n`;
        if (entry.description) {
          cvText += `${entry.description}\n\n`;
        } else {
          cvText += `\n`;
        }
      }
    });
    
    return cvText;
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
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={copyToClipboard}
          >
            <Copy className="h-4 w-4 mr-2" /> Copy
          </Button>
          <Button 
            size="sm"
            onClick={onDownload}
          >
            <Download className="h-4 w-4 mr-2" /> Download
          </Button>
        </div>
      </div>

      <Card className="preview-card bg-white shadow-md border">
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
