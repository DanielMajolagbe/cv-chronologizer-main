
import { useEffect, useRef } from "react";
import { format, parseISO } from "date-fns";
import { CVData, formatDateForDisplay } from "@/utils/cvUtils";
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
        let cvText = `${personalInfo.firstName} ${personalInfo.lastName}\n`;
        cvText += `${personalInfo.address}\n`;
        cvText += `${personalInfo.email} | ${personalInfo.phone}\n`;
        cvText += `Date of Birth: ${format(parseISO(personalInfo.dateOfBirth), "MMMM d, yyyy")}\n\n`;
        cvText += `Education & Employment History\n\n`;
        
        entries.forEach(entry => {
          const startDate = formatDateForDisplay(entry.startDate);
          const endDate = formatDateForDisplay(entry.endDate);
          cvText += `${entry.type === "education" ? "Education" : "Work Experience"}: ${entry.organization} ${startDate} - ${endDate}\n`;
          cvText += `${entry.title}\n`;
          cvText += `${entry.description}\n\n`;
        });
        
        await navigator.clipboard.writeText(cvText);
        toast.success("CV copied to clipboard");
      } catch (err) {
        toast.error("Failed to copy to clipboard");
        console.error(err);
      }
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
        <CardHeader className="border-b pb-6">
          <div className="text-center mb-2">
            <img 
              src="https://royacare-agency.vercel.app/_next/image?url=%2Froya.png&w=256&q=75" 
              alt="Royacare Agency Logo" 
              className="h-12 mx-auto mb-3"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            {personalInfo.firstName} {personalInfo.lastName}
          </CardTitle>
          <div className="text-center text-muted-foreground">
            <p>{personalInfo.address}</p>
            <p>{personalInfo.email} | {personalInfo.phone}</p>
            <p>Date of Birth: {personalInfo.dateOfBirth ? format(parseISO(personalInfo.dateOfBirth), "MMMM d, yyyy") : ""}</p>
          </div>
        </CardHeader>
        
        <CardContent className="py-6">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Chronological History</h2>
          
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
                      <span>{entry.organization}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-muted-foreground">
                        {formatDateForDisplay(entry.startDate)} - {formatDateForDisplay(entry.endDate)}
                      </span>
                    </div>
                  </div>
                  <p className="font-medium">{entry.title}</p>
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
