import { useState } from "react";
import { useCVData } from "@/hooks/useCVData";
import { getDefaultStartMonth, generateCVDocument, TimelineEntry as TimelineEntryType, identifyGaps } from "@/utils/cvUtils";
import PersonalDetails from "@/components/PersonalDetails";
import TimelineEntry from "@/components/TimelineEntry";
import CVPreview from "@/components/CVPreview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Eye, ArrowRight, Download } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const emptyEntry: Omit<TimelineEntryType, "id"> = {
  type: "education",
  title: "",
  organization: "",
  startDate: "",
  endDate: "",
  description: "",
  country: ""
};

const Index = () => {
  const {
    personalInfo,
    entries,
    editingEntryId,
    isPreviewMode,
    updatePersonalInfo,
    addEntry,
    updateEntry,
    removeEntry,
    startEditingEntry,
    cancelEditingEntry,
    togglePreviewMode,
    getCVData
  } = useCVData();

  const [newEntry, setNewEntry] = useState<Omit<TimelineEntryType, "id">>({...emptyEntry});
  const [isPresent, setIsPresent] = useState(false);
  const [showGaps, setShowGaps] = useState(false);

  const handleNewEntryChange = (field: keyof TimelineEntryType, value: string) => {
    setNewEntry(prev => ({ ...prev, [field]: value }));
  };

  const handleTypeChange = (value: string) => {
    setNewEntry(prev => ({ ...prev, type: value as TimelineEntryType["type"] }));
  };

  const handlePresentToggle = (checked: boolean) => {
    setIsPresent(checked);
    if (checked) {
      setNewEntry(prev => ({ ...prev, endDate: "present" }));
    } else {
      const today = new Date();
      const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      setNewEntry(prev => ({ ...prev, endDate: formattedDate }));
    }
  };

  const handleAddEntry = () => {
    if (!newEntry.title || !newEntry.organization || !newEntry.startDate || (!isPresent && !newEntry.endDate)) {
      toast.error("Please fill all required fields");
      return;
    }

    const success = addEntry(newEntry);
    if (success) {
      setNewEntry({...emptyEntry});
      setIsPresent(false);
      toast.success("Entry added successfully");
    }
  };

  const handleEntryUpdate = (updatedEntry: TimelineEntryType) => {
    const success = updateEntry(updatedEntry.id, updatedEntry);
    if (success) {
      cancelEditingEntry();
      toast.success("Entry updated successfully");
    }
  };

  const handleDownload = () => {
    generateCVDocument(getCVData());
    toast.success("CV downloading...");
  };

  const handleGapsClick = () => {
    const gaps = identifyGaps(entries);
    setShowGaps(!showGaps);

    if (gaps.length > 0) {
      toast.info(`Found ${gaps.length} gap${gaps.length > 1 ? 's' : ''} in your timeline`);
    } else {
      toast.success("No gaps found in your timeline");
    }
  };

  const defaultFirstEntryStart = personalInfo.dateOfBirth 
    ? getDefaultStartMonth(personalInfo.dateOfBirth)
    : "";

  if (personalInfo.dateOfBirth && !newEntry.startDate) {
    setNewEntry(prev => ({ ...prev, startDate: defaultFirstEntryStart }));
  }

  const gaps = showGaps ? identifyGaps(entries) : [];

  if (isPreviewMode) {
    return (
      <CVPreview
        data={getCVData()}
        onBack={togglePreviewMode}
        onDownload={handleDownload}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-10">
          <img 
            src="https://royacare-agency.vercel.app/_next/image?url=%2Froya.png&w=256&q=75" 
            alt="" 
            className="h-16 mx-auto mb-3"
          />
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Royacare Agency CV Builder
          </h1>
          <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto">
            Build your chronological CV easily, ensuring all entries follow each other in sequence from age 1-11 onwards.
          </p>
        </header>

        <PersonalDetails 
          personalInfo={personalInfo}
          onChange={updatePersonalInfo}
        />

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Timeline Entries</h2>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleGapsClick}>
                {showGaps ? "Hide Gaps" : "Show Gaps"}
              </Button>
              <Button variant="outline" size="sm" onClick={togglePreviewMode}>
                <Eye className="h-4 w-4 mr-2" /> Preview
              </Button>
              <Button size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" /> Download
              </Button>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            {entries.length === 0 ? (
              <Card className="text-center p-6 bg-muted/50">
                <p className="text-muted-foreground">
                  No entries yet. Add your first education or work experience below.
                </p>
              </Card>
            ) : (
              <div>
                {entries
                  .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                  .map((entry) => (
                    <TimelineEntry
                      key={entry.id}
                      entry={entry}
                      isEditing={editingEntryId === entry.id}
                      onSave={handleEntryUpdate}
                      onDelete={() => removeEntry(entry.id)}
                      onEdit={() => startEditingEntry(entry.id)}
                      onCancel={cancelEditingEntry}
                    />
                  ))}
              </div>
            )}

            {showGaps && gaps.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Timeline Gaps</h3>
                <div className="space-y-2">
                  {gaps.map((gap, index) => (
                    <Card key={index} className="border-l-4 border-l-amber-400">
                      <CardHeader className="py-3">
                        <CardTitle className="text-base">Gap in Timeline</CardTitle>
                        <CardDescription>
                          From {gap.start ? new Date(gap.start).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long'
                          }) : 'Unknown'} to {gap.end ? new Date(gap.end).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long'
                          }) : 'Unknown'}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Card className="entry-card">
            <CardHeader>
              <CardTitle className="text-lg">Add New Entry</CardTitle>
              <CardDescription>
                Add a new education or work experience to your timeline
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="new-type">Entry Type</Label>
                  <Select 
                    value={newEntry.type} 
                    onValueChange={handleTypeChange}
                  >
                    <SelectTrigger id="new-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="work">Work Experience</SelectItem>
                      <SelectItem value="gap">Gap/Break</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new-title">Position/Title</Label>
                  <Input
                    id="new-title"
                    value={newEntry.title}
                    onChange={(e) => handleNewEntryChange("title", e.target.value)}
                    placeholder={newEntry.type === "education" ? "Student/Degree" : "Job Title/Position"}
                  />
                </div>
              </div>
              
              <div className="grid gap-6 sm:grid-cols-2 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="new-organization">Organization</Label>
                  <Input
                    id="new-organization"
                    value={newEntry.organization}
                    onChange={(e) => handleNewEntryChange("organization", e.target.value)}
                    placeholder={newEntry.type === "education" ? "School/University" : "Company/Employer"}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new-country">Country</Label>
                  <Input
                    id="new-country"
                    value={newEntry.country || ""}
                    onChange={(e) => handleNewEntryChange("country", e.target.value)}
                    placeholder="Enter country"
                  />
                </div>
              </div>
              
              <div className="grid gap-6 sm:grid-cols-2 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="new-startDate">Start Date (MM.YYYY)</Label>
                  <Input
                    id="new-startDate"
                    value={newEntry.startDate.includes('-') 
                      ? `${newEntry.startDate.split('-')[1]}.${newEntry.startDate.split('-')[0]}` 
                      : newEntry.startDate}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow typing by updating the value immediately
                      handleNewEntryChange("startDate", value);
                      
                      // If the value is complete (has the expected length), validate it
                      if (value.length === 7) {
                        const dateFormatRegex = /^(0[1-9]|1[0-2])\.(19|20)\d{2}$/;
                        if (!dateFormatRegex.test(value)) {
                          toast.error("Please use the format MM.YYYY (e.g., 09.2015)");
                          return;
                        }
                        // Convert MM.YYYY to YYYY-MM only if format is valid
                        const parts = value.split('.');
                        const month = parts[0].padStart(2, '0');
                        const year = parts[1];
                        handleNewEntryChange("startDate", `${year}-${month}`);
                      }
                    }}
                    placeholder="Example: 09.2015"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="new-endDate" className={isPresent ? "text-muted-foreground" : ""}>
                      End Date (MM.YYYY)
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="new-current"
                        checked={isPresent}
                        onCheckedChange={handlePresentToggle}
                      />
                      <Label htmlFor="new-current" className="text-sm cursor-pointer">
                        Present
                      </Label>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <Input
                      id="new-endDate"
                      value={isPresent ? "" : (
                        newEntry.endDate.includes('-') 
                          ? `${newEntry.endDate.split('-')[1]}.${newEntry.endDate.split('-')[0]}` 
                          : newEntry.endDate
                      )}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Allow typing by updating the value immediately
                        handleNewEntryChange("endDate", value);
                        
                        // If the value is complete (has the expected length), validate it
                        if (value.length === 7) {
                          const dateFormatRegex = /^(0[1-9]|1[0-2])\.(19|20)\d{2}$/;
                          if (!dateFormatRegex.test(value)) {
                            toast.error("Please use the format MM.YYYY (e.g., 09.2015)");
                            return;
                          }
                          // Convert MM.YYYY to YYYY-MM only if format is valid
                          const parts = value.split('.');
                          const month = parts[0].padStart(2, '0');
                          const year = parts[1];
                          handleNewEntryChange("endDate", `${year}-${month}`);
                        }
                      }}
                      disabled={isPresent}
                      className={cn(isPresent && "opacity-50")}
                      placeholder="Example: 06.2020"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-description">Description</Label>
                <Textarea
                  id="new-description"
                  value={newEntry.description}
                  onChange={(e) => handleNewEntryChange("description", e.target.value)}
                  placeholder="Describe your role, responsibilities, achievements, or studies..."
                  className="min-h-[100px]"
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-end">
              <Button onClick={handleAddEntry}>
                <Plus className="h-4 w-4 mr-2" /> Add Entry
              </Button>
            </CardFooter>
          </Card>

        </div>

        <div className="text-center mt-12 mb-6">
          <p className="text-sm text-muted-foreground">
            All entries must follow chronological order from age 1-11 onwards. Ensure there are no unexplained gaps.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
