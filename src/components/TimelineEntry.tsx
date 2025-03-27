import { useState, useEffect } from "react";
import { TimelineEntry as TimelineEntryType, formatDateForDisplay } from "@/utils/cvUtils";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Pencil, Trash2, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DatePicker, MonthYearPicker } from "@/components/ui/month-year-picker";
import { format, parseISO } from "date-fns";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

interface TimelineEntryProps {
  entry: TimelineEntryType;
  isEditing: boolean;
  onSave: (updatedEntry: TimelineEntryType) => void;
  onDelete: () => void;
  onEdit: () => void;
  onCancel: () => void;
}

const TimelineEntry = ({
  entry,
  isEditing,
  onSave,
  onDelete,
  onEdit,
  onCancel
}: TimelineEntryProps) => {
  const [editedEntry, setEditedEntry] = useState<TimelineEntryType>(entry);
  const [isPresent, setIsPresent] = useState(entry.endDate === "present");
  const [startDate, setStartDate] = useState<Date | undefined>(
    entry.startDate ? parseISO(entry.startDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    entry.endDate && entry.endDate !== "present" ? parseISO(entry.endDate) : undefined
  );

  useEffect(() => {
    setEditedEntry(entry);
    setIsPresent(entry.endDate === "present");
    setStartDate(entry.startDate ? parseISO(entry.startDate) : undefined);
    setEndDate(entry.endDate && entry.endDate !== "present" ? parseISO(entry.endDate) : undefined);
  }, [entry, isEditing]);

  const handleChange = (field: keyof TimelineEntryType, value: string) => {
    setEditedEntry(prev => ({ ...prev, [field]: value }));
  };

  const handleTypeChange = (value: string) => {
    if (value === "gap") {
      setEditedEntry(prev => ({
        ...prev,
        type: value as TimelineEntryType["type"],
        title: "Gap/Break",
        organization: "Gap Period"
      }));
    } else {
      setEditedEntry(prev => ({
        ...prev,
        type: value as TimelineEntryType["type"]
      }));
    }
  };

  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date);
    if (date) {
      const formattedDate = format(date, "yyyy-MM");
      handleChange("startDate", formattedDate);
    }
  };

  const handleEndDateChange = (date: Date | undefined) => {
    setEndDate(date);
    if (date) {
      const formattedDate = format(date, "yyyy-MM");
      handleChange("endDate", formattedDate);
    }
  };

  const handlePresentToggle = (checked: boolean) => {
    setIsPresent(checked);
    if (checked) {
      setEndDate(undefined);
      setEditedEntry(prev => ({ ...prev, endDate: "present" }));
    } else {
      const today = new Date();
      setEndDate(today);
      const formattedDate = format(today, "yyyy-MM");
      setEditedEntry(prev => ({ ...prev, endDate: formattedDate }));
    }
  };

  const handleSave = () => {
    onSave(editedEntry);
  };

  return (
    <Card className={cn(
      "entry-card mb-4 overflow-hidden",
      isEditing ? "ring-2 ring-primary/20" : "",
      entry.type === "education" ? "border-l-4 border-l-blue-400" : "border-l-4 border-l-emerald-400"
    )}>
      {isEditing ? (
        <>
          <CardHeader className="pb-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Entry Type</Label>
                <Select 
                  value={editedEntry.type} 
                  onValueChange={handleTypeChange}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="work">Work Experience</SelectItem>
                    <SelectItem value="gap">Gap/Break</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {editedEntry.type !== "gap" && (
                <div className="space-y-2">
                  <Label htmlFor="title">Position/Title</Label>
                  <Input
                    id="title"
                    value={editedEntry.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    placeholder={editedEntry.type === "education" ? "Student/Degree" : "Job Title/Position"}
                  />
                </div>
              )}
            </div>
            
            {editedEntry.type !== "gap" && (
              <div className="space-y-2 mt-4">
                <Label htmlFor="organization">Organization</Label>
                <Input
                  id="organization"
                  value={editedEntry.organization}
                  onChange={(e) => handleChange("organization", e.target.value)}
                  placeholder={editedEntry.type === "education" ? "School/University" : "Company/Employer"}
                />
              </div>
            )}
            
            {editedEntry.type !== "gap" && (
              <div className="space-y-2 mt-4">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={editedEntry.country || ""}
                  onChange={(e) => handleChange("country", e.target.value)}
                  placeholder="Enter country"
                  className="transition-all focus:ring-2 focus:ring-primary/20"
                />
              </div>
            )}
          </CardHeader>
          
          <CardContent className="pb-2">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <MonthYearPicker
                  date={startDate}
                  setDate={handleStartDateChange}
                  placeholder="Select month/year"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="endDate" className={isPresent ? "text-muted-foreground" : ""}>
                    End Date
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="current"
                      checked={isPresent}
                      onCheckedChange={handlePresentToggle}
                    />
                    <Label htmlFor="current" className="text-sm cursor-pointer">
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
                    className={cn(isPresent && "opacity-50")}
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <RichTextEditor
                value={editedEntry.description}
                onChange={(value) => handleChange("description", value)}
                placeholder=""
                height="250px"
                className="min-h-[200px]"
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-end space-x-2 pt-0">
            <Button variant="outline" size="sm" onClick={onCancel}>
              <X className="h-4 w-4 mr-1" /> Cancel
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-1" /> Save
            </Button>
          </CardFooter>
        </>
      ) : (
        <>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  {entry.type === "education" ? "Education" : entry.type === "work" ? "Work Experience" : "Gap/Break"}
                </div>
                {entry.type !== "gap" ? (
                  <>
                    <h3 className="text-lg font-medium">{entry.title}</h3>
                    <h4 className="text-base text-muted-foreground">
                      {entry.organization}{entry.country ? `, ${entry.country}` : ''}
                    </h4>
                  </>
                ) : (
                  <h3 className="text-lg font-medium">Gap/Break Period</h3>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">
                  {formatDateForDisplay(entry.startDate)} - {formatDateForDisplay(entry.endDate)}
                </p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pb-2">
            <div 
              className="text-sm prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: entry.description }}
            />
          </CardContent>
          
          <CardFooter className="flex justify-end space-x-2 pt-0">
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-1" /> Edit
            </Button>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          </CardFooter>
        </>
      )}
    </Card>
  );
};

export default TimelineEntry;
