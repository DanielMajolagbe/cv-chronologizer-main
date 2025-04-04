import { useState, useEffect, useRef } from "react";
import { useCVData } from "@/hooks/useCVData";
import { 
  getDefaultStartMonth, 
  sendCVDocument,
  TimelineEntry as TimelineEntryType, 
  identifyGaps,
  isEntryInChronologicalOrder 
} from "@/utils/cvUtils";
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
import { Plus, Eye, ArrowRight, Download, Send, AlertCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DatePicker, MonthYearPicker } from "@/components/ui/month-year-picker";
import { format, parseISO } from "date-fns";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
// import "@/styles/animations.css";

// Helper function to check for effectively empty rich text content
const isEmptyRichText = (value: string): boolean => {
  if (!value) return true;
  const trimmed = value.trim();
  // Consider variations of empty paragraph tags or just breaks
  return trimmed === '' || trimmed === '<p></p>' || trimmed === '<p><br></p>' || trimmed === '<p><br/></p>';
};

const emptyEntry: Omit<TimelineEntryType, "id"> = {
  type: "education",
  title: "",
  organization: "",
  country: "",
  startDate: "",
  endDate: "",
  description: ""
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

  const [newEntry, setNewEntry] = useState<Omit<TimelineEntryType, "id">>({
    type: "education",
    title: "",
    organization: "",
    country: "",
    startDate: "",
    endDate: "",
    description: ""
  });
  const [isPresent, setIsPresent] = useState(false);
  const [showGaps, setShowGaps] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(
    newEntry.startDate ? parseISO(newEntry.startDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    newEntry.endDate && newEntry.endDate !== "present" ? parseISO(newEntry.endDate) : undefined
  );
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});
  const formRefs = useRef<Record<string, HTMLElement | null>>({});
  const [isFormModified, setIsFormModified] = useState(false);
  const [showPreviewWarning, setShowPreviewWarning] = useState(false);
  const [hasIncompleteEntries, setHasIncompleteEntries] = useState(false);

  // Refactored function to check if the form has actual user input
  const checkFormHasValues = (entry: Omit<TimelineEntryType, "id">, isPresentChecked: boolean) => {
    const descriptionHasValue = entry.description && !isEmptyRichText(entry.description);
    const startDateHasValue = entry.startDate && entry.startDate.trim() !== '';
    // End date has value if it's not empty, not 'present', and the 'present' switch isn't checked
    const endDateHasValue = entry.endDate && entry.endDate.trim() !== '' && entry.endDate !== 'present' && !isPresentChecked;

    if (entry.type === 'gap') {
      // For gap, only check dates and description
      return startDateHasValue || endDateHasValue || descriptionHasValue;
    } else if (entry.type === 'education') {
      // For education, title, country, description, and dates are required (organization is optional)
      const titleHasValue = entry.title && entry.title.trim() !== '';
      const countryHasValue = entry.country && entry.country.trim() !== '';
      
      return (
        titleHasValue || 
        countryHasValue || 
        startDateHasValue || 
        endDateHasValue || 
        descriptionHasValue
      );
    } else { // Assumes 'work' type if not 'gap' or 'education'
      // For work entries, all fields except potentially endDate are required
      const titleHasValue = entry.title && entry.title.trim() !== '';
      const countryHasValue = entry.country && entry.country.trim() !== '';
      
      return (
        titleHasValue || 
        countryHasValue || 
        startDateHasValue || 
        endDateHasValue || 
        descriptionHasValue
      );
    }
  };

  const handleNewEntryChange = (field: keyof TimelineEntryType, value: string) => {
    setNewEntry(prev => ({ ...prev, [field]: value }));
    // Clear validation error when field is filled
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: false }));
    }
    
    // Update form with the new values first
    const updatedEntry = {
      ...newEntry,
      [field]: value
    };
    
    // Check if any field has a value using the updated function
    const hasValue = checkFormHasValues(updatedEntry, isPresent);
    setIsFormModified(hasValue);
    if (!hasValue) {
      setShowPreviewWarning(false); // Hide warning if form becomes empty
    }
  };

  const handleNewEntryTypeChange = (value: string) => {
    const type = value as TimelineEntryType["type"];
    let updatedEntry;
    
    if (type === "gap") {
      updatedEntry = { 
        ...newEntry, 
        type, 
        title: "Gap/Break",
        organization: "Gap Period",
        country: "",
        description: ""
      };
    } else {
      updatedEntry = { 
        ...newEntry, 
        type,
        title: "",
        organization: "",
        country: "",
        description: ""
      };
    }
    
    setNewEntry(updatedEntry);
    
    // Check if the form has any values now using the updated function
    const hasValue = checkFormHasValues(updatedEntry, isPresent);
    setIsFormModified(hasValue);
    if (!hasValue) {
      setShowPreviewWarning(false); // Hide warning if form becomes empty
    }
  };

  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date);
    let formattedDate = "";
    
    if (date) {
      formattedDate = format(date, "yyyy-MM");
    }
    
    const updatedEntry = {
      ...newEntry,
      startDate: formattedDate
    };
    
    setNewEntry(updatedEntry);
    
    // Update form modified state using the updated function
    const hasValue = checkFormHasValues(updatedEntry, isPresent);
    setIsFormModified(hasValue);
    if (!hasValue) {
      setShowPreviewWarning(false); // Hide warning if form becomes empty
    }
  };

  const handleEndDateChange = (date: Date | undefined) => {
    setEndDate(date);
    let formattedDate = "";
    
    if (date) {
      formattedDate = format(date, "yyyy-MM");
    }
    
    const updatedEntry = {
      ...newEntry,
      endDate: formattedDate
    };
    
    setNewEntry(updatedEntry);
    
    // Update form modified state using the updated function
    const hasValue = checkFormHasValues(updatedEntry, isPresent);
    setIsFormModified(hasValue);
    if (!hasValue) {
      setShowPreviewWarning(false); // Hide warning if form becomes empty
    }
  };

  const handlePresentToggle = (checked: boolean) => {
    setIsPresent(checked);
    
    let updatedEntry = { ...newEntry };
    
    if (checked) {
      setEndDate(undefined);
      updatedEntry = { ...updatedEntry, endDate: "present" };
    } else {
      const today = new Date();
      setEndDate(today);
      const formattedDate = format(today, "yyyy-MM");
      updatedEntry = { ...updatedEntry, endDate: formattedDate };
    }
    
    setNewEntry(updatedEntry);
    
    // Update form modified state using the updated function, passing the new 'checked' state
    const hasValue = checkFormHasValues(updatedEntry, checked);
    setIsFormModified(hasValue);
    if (!hasValue) {
      setShowPreviewWarning(false); // Hide warning if form becomes empty
    }
  };

  const handleAddEntry = () => {
    // Validate required fields
    const errors: Record<string, boolean> = {};
    let requiredFields: (keyof TimelineEntryType)[] = ['description', 'startDate'];

    if (newEntry.type === 'gap') {
      // For gap entries, only description and dates are required
      if (!isPresent) requiredFields.push('endDate');
    } else if (newEntry.type === 'education') {
      // For education, title, country, description, and dates are required (organization is optional)
      requiredFields = [
        'title',
        'country',
        'description',
        'startDate'
      ];
      if (!isPresent) requiredFields.push('endDate');
    } else { // Assumes 'work' type if not 'gap' or 'education'
      // For work entries, all fields except potentially endDate are required
      requiredFields = [
        'title',
        'country',
        'description',
        'startDate'
      ];
      if (!isPresent) requiredFields.push('endDate');
    }

    requiredFields.forEach(field => {
      if (!newEntry[field]) {
        errors[field] = true;
        // Scroll to first error field
        if (formRefs.current[field]) {
          formRefs.current[field]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error(
        newEntry.type === 'gap' 
          ? "Please provide a description and dates for the gap period"
          : "Please fill all required fields",
        {
          style: { backgroundColor: '#fee2e2', color: '#dc2626' }
        }
      );
      return;
    }

    // Check chronological order
    const entryToCheck = {
      ...newEntry,
      id: 'temp'
    };

    if (!isEntryInChronologicalOrder(entries, entryToCheck)) {
      toast.error("Entry dates must follow chronological order", {
        style: { backgroundColor: '#fee2e2', color: '#dc2626' }
      });
      setValidationErrors(prev => ({ ...prev, startDate: true, endDate: true }));
      formRefs.current.startDate?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const success = addEntry(newEntry);
    if (success) {
      // Reset form to default state
      setStartDate(undefined);
      setEndDate(undefined);
      
      // Reset other fields
      const resetEntry: Omit<TimelineEntryType, "id"> = {
        ...emptyEntry,
        startDate: "",
        type: newEntry.type
      };
      
      setNewEntry(resetEntry);
      setIsPresent(false);
      
      // Reset form modification state and hide reminder
      setIsFormModified(false);
      setShowPreviewWarning(false);
      setHasIncompleteEntries(false); // Also reset incomplete entries state
      
      toast.success("Entry added successfully");
    }
  };

  // Function to clear the new entry form
  const handleClearForm = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    
    // Create a new object based on emptyEntry, ensuring startDate is cleared
    const resetEntry: Omit<TimelineEntryType, "id"> = {
      ...emptyEntry, // Spread the default empty entry (which has type: "education")
      startDate: "", // Explicitly clear startDate
      // Type should be correctly inferred from emptyEntry here
    };
    
    setNewEntry(resetEntry);
    setIsPresent(false);
    setValidationErrors({}); // Clear any validation errors
    setIsFormModified(false); // Reset modification state
    setShowPreviewWarning(false); // Hide any warnings
    toast.info("Form cleared");
  };

  const handleEntryUpdate = (updatedEntry: TimelineEntryType) => {
    // Check if the entry is still incomplete after the update
    const stillIncomplete = isEntryIncomplete(updatedEntry);
    
    const success = updateEntry(updatedEntry.id, updatedEntry);
    if (success) {
      setHasIncompleteEntries(false); // Reset incomplete entries state
      setShowPreviewWarning(false); // Hide warning when successfully updated
      cancelEditingEntry();
      toast.success("Entry updated successfully");
    } else {
      // If update fails, keep the warning visible if the entry is incomplete
      setHasIncompleteEntries(stillIncomplete);
      setShowPreviewWarning(stillIncomplete);
    }
  };

  const handleDownload = () => {
    sendCVDocument(getCVData());
    toast.success("CV Submitted");
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

  const handleFinishAndPreview = () => {
    // Check if the new entry form has any data entered but is incomplete
    let newEntryIncomplete = false;
    
    if (isFormModified) {
      // Check if the current new entry has all required fields
      const errors: Record<string, boolean> = {};
      let requiredFields: (keyof TimelineEntryType)[] = ['description', 'startDate'];

      if (newEntry.type === 'gap') {
        // For gap entries, only description and dates are required
        if (!isPresent) requiredFields.push('endDate');
      } else if (newEntry.type === 'education') {
        // For education, title, country, description, and dates are required
        requiredFields = [
          'title',
          'country',
          'description',
          'startDate'
        ];
        if (!isPresent) requiredFields.push('endDate');
      } else { // Assumes 'work' type
        // For work entries, all fields are required
        requiredFields = [
          'title',
          'organization',
          'country',
          'description',
          'startDate'
        ];
        if (!isPresent) requiredFields.push('endDate');
      }

      // Check if any required field is missing
      requiredFields.forEach(field => {
        if (!newEntry[field] || 
            (field === 'description' && isEmptyRichText(newEntry[field] as string))) {
          errors[field] = true;
        }
      });

      if (Object.keys(errors).length > 0) {
        newEntryIncomplete = true;
      }
    }

    // If form is modified but incomplete, show warning
    if (newEntryIncomplete) {
      setShowPreviewWarning(true);
      toast.warning("Please complete your current entry before previewing.", {
        style: { backgroundColor: '#fef3c7', color: '#ca8a04' }
      });
      return; // Stop execution here
    }
    
    // Existing check for entries being edited
    const entryBeingEdited = entries.find(entry => entry.id === editingEntryId);
    let isIncomplete = false;

    if (entryBeingEdited) {
      const { type, title, organization, country, startDate, endDate, description } = entryBeingEdited;
      // Use helper to check if rich text description is effectively empty
      const isDescriptionEmpty = !description || isEmptyRichText(description);
      
      if (type === 'gap') {
        // Required: startDate, endDate (if not present), description
        isIncomplete = !startDate || (!endDate && endDate !== 'present') || isDescriptionEmpty;
      } else if (type === 'education') {
        // Required: title, country, startDate, endDate (if not present), description
        isIncomplete = !title || !country || !startDate || (!endDate && endDate !== 'present') || isDescriptionEmpty;
      } else { // 'work'
        // Required: title, organization, country, startDate, endDate (if not present), description
        isIncomplete = !title || !organization || !country || !startDate || (!endDate && endDate !== 'present') || isDescriptionEmpty;
      }
    }

    if (isIncomplete && entryBeingEdited) {
      setHasIncompleteEntries(true);
      setShowPreviewWarning(true);
      toast.error("Please complete the entry you are currently editing before previewing.", {
        style: { backgroundColor: '#fee2e2', color: '#dc2626' }
      });
      const entryElement = document.getElementById(`entry-${entryBeingEdited.id}`);
      entryElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    } else {
      setHasIncompleteEntries(false);
      setShowPreviewWarning(false);
    }

    if (editingEntryId) {
      cancelEditingEntry();
    }
    
    togglePreviewMode();
  };

  // Add a function to check if an entry is incomplete
  const isEntryIncomplete = (entry: TimelineEntryType): boolean => {
    const { type, title, organization, country, startDate, endDate, description } = entry;
    // Use helper to check if rich text description is effectively empty
    const isDescriptionEmpty = !description || isEmptyRichText(description);
    
    if (type === 'gap') {
      // Required: startDate, endDate (if not present), description
      return !startDate || (!endDate && endDate !== 'present') || isDescriptionEmpty;
    } else if (type === 'education') {
      // Required: title, country, startDate, endDate (if not present), description
      // Organization is optional
      return !title || !country || !startDate || (!endDate && endDate !== 'present') || isDescriptionEmpty;
    } else { // 'work'
      // Required: title, organization, country, startDate, endDate (if not present), description
      return !title || !organization || !country || !startDate || (!endDate && endDate !== 'present') || isDescriptionEmpty;
    }
  };

  // Wrap the startEditingEntry function to check for incomplete entries
  const handleStartEditing = (entryId: string) => {
    const entryToEdit = entries.find(entry => entry.id === entryId);
    if (entryToEdit && isEntryIncomplete(entryToEdit)) {
      setHasIncompleteEntries(true);
      setShowPreviewWarning(true);
    } else {
      setHasIncompleteEntries(false);
      setShowPreviewWarning(false);
    }
    startEditingEntry(entryId);
  };

  // Update the cancelEditingEntry wrapper
  const handleCancelEditing = () => {
    setHasIncompleteEntries(false);
    setShowPreviewWarning(isFormModified); // Only show warning if new entry form is modified
    cancelEditingEntry();
  };

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
          {/* <div className="flex items-center justify-between mb-4">
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
          </div> */}

          <div className="space-y-4 mb-6">
            {entries.length === 0 ? (
              <Card className="text-center p-6 bg-muted/50">
                {/* <p className="text-muted-foreground">
                  No entries yet. Add your first education or work experience below.
                </p> */}
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
                      onEdit={() => handleStartEditing(entry.id)}
                      onCancel={handleCancelEditing}
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
                <div className="space-y-2" ref={el => formRefs.current.type = el}>
                  <Label htmlFor="new-type">Entry Type</Label>
                  <Select 
                    value={newEntry.type} 
                    onValueChange={handleNewEntryTypeChange}
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
                
                {newEntry.type !== "gap" && (
                  <div className="space-y-2" ref={el => formRefs.current.title = el}>
                    <Label htmlFor="new-title" className="flex items-center">
                      {newEntry.type === 'education' ? 'School Name' : 'Position/Title'}
                      {validationErrors.title && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    <Input
                      id="new-title"
                      value={newEntry.title}
                      onChange={(e) => handleNewEntryChange("title", e.target.value)}
                      placeholder={newEntry.type === "education" ? "Enter school/university name" : "Enter job title/position"}
                      className={cn(validationErrors.title && "border-red-500 focus:ring-red-500")}
                    />
                  </div>
                )}
              </div>
              
              {newEntry.type === "work" && ( // Only show organization for work experience
                <div className="space-y-2 mt-4" ref={el => formRefs.current.organization = el}>
                  <Label htmlFor="new-organization" className="flex items-center">
                    Company Name 
                    {validationErrors.organization && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  <Input
                    id="new-organization"
                    value={newEntry.organization}
                    onChange={(e) => handleNewEntryChange("organization", e.target.value)}
                    placeholder="Enter company/employer name"
                    className={cn(validationErrors.organization && "border-red-500 focus:ring-red-500")}
                  />
                </div>
              )}

              {newEntry.type !== "gap" && ( // Keep country for both education and work
                <div className="space-y-2 mt-4" ref={el => formRefs.current.country = el}>
                  <Label htmlFor="new-country" className="flex items-center">
                    Country
                    {validationErrors.country && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  <Input
                    id="new-country"
                    value={newEntry.country}
                    onChange={(e) => handleNewEntryChange("country", e.target.value)}
                    placeholder="Enter country"
                    className={cn(
                      "transition-all focus:ring-2 focus:ring-primary/20",
                      validationErrors.country && "border-red-500 focus:ring-red-500"
                    )}
                  />
                </div>
              )}
              
              <div className="grid gap-6 sm:grid-cols-2 mb-4 mt-4">
                <div className="space-y-2" ref={el => formRefs.current.startDate = el}>
                  <Label htmlFor="new-startDate" className="flex items-center">
                    Start Date
                    {validationErrors.startDate && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  <MonthYearPicker
                    date={startDate}
                    setDate={handleStartDateChange}
                    placeholder="Select month/year"
                    className={cn(validationErrors.startDate && "border-red-500 focus:ring-red-500")}
                  />
                </div>
                
                <div className="space-y-2" ref={el => formRefs.current.endDate = el}>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="new-endDate" className={cn(
                      isPresent ? "text-muted-foreground" : "",
                      "flex items-center"
                    )}>
                      End Date
                      {validationErrors.endDate && !isPresent && <span className="text-red-500 ml-1">*</span>}
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
                    <MonthYearPicker
                      date={endDate}
                      setDate={handleEndDateChange}
                      placeholder="Select month/year"
                      disabled={isPresent}
                      className={cn(
                        isPresent && "opacity-50",
                        validationErrors.endDate && !isPresent && "border-red-500 focus:ring-red-500"
                      )}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2" ref={el => formRefs.current.description = el}>
                <Label htmlFor="new-description" className="flex items-center">
                  {newEntry.type === 'work' ? 'Description/Responsibilities' : 'Description'}
                  {validationErrors.description && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <RichTextEditor
                  value={newEntry.description}
                  onChange={(value) => handleNewEntryChange("description", value)}
                  placeholder={newEntry.type === 'education' ? "Describe your studies, key subjects, achievements" : newEntry.type === 'work' ? "Describe your key responsibilities and achievements" : "Explain the reason for this gap/break"}
                  height="250px"
                  className={cn(
                    "min-h-[200px]",
                    validationErrors.description && "border-red-500 focus:ring-red-500"
                  )}
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4">
              <div className="flex w-full justify-end space-x-2">
                <Button variant="outline" onClick={handleClearForm}>
                  <XCircle className="h-4 w-4 mr-2" /> Clear Form
                </Button>
                <Button onClick={handleAddEntry}>
                  <Plus className="h-4 w-4 mr-2" /> Add Entry
                </Button>
              </div>
            </CardFooter>
          </Card>

        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-2 justify-between items-center">
            <Button variant="outline" onClick={handleFinishAndPreview} data-finish-preview>
              <Eye className="h-4 w-4 mr-2" /> Finish & Preview
            </Button>
            
            {(showPreviewWarning || hasIncompleteEntries) && (
              <div className="flex items-center bg-amber-50 text-amber-700 p-2 px-3 rounded-md animate-pulse-custom">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                <span className="text-sm font-medium">
                  {hasIncompleteEntries 
                    ? "Please complete the entry you are currently editing!"
                    : "Don't forget to add your entry before proceeding!"}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="h-20"></div>
      </div>
    </div>
  );
};

export default Index;
