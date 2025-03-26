import { useState, useCallback, useEffect } from "react";
import { CVData, TimelineEntry, PersonalInfo, getStartYearFromDOB, isEntryInChronologicalOrder, isDateWithinElevenYearWindow, isFirstChronologicalEntry, parseDateString } from "../utils/cvUtils";
import { toast } from "sonner";

const initialPersonalInfo: PersonalInfo = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  address: "",
  email: "",
  phone: ""
};

export const useCVData = () => {
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>(initialPersonalInfo);
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const updatePersonalInfo = useCallback((info: Partial<PersonalInfo>) => {
    setPersonalInfo(prev => ({ ...prev, ...info }));
  }, []);

  const addEntry = useCallback((entry: Omit<TimelineEntry, "id">) => {
    const newEntry = { ...entry, id: crypto.randomUUID() };
    
    // If this is the first entry, validate that it starts within 1-11 years from DOB
    if (entries.length === 0) {
      const isoDob = parseDateString(personalInfo.dateOfBirth);
      if (!isDateWithinElevenYearWindow(isoDob, newEntry.startDate)) {
        toast.error("First entry must start when you are between 1 and 11 years old", {
          style: { backgroundColor: '#fee2e2', color: '#dc2626' }
        });
        return false;
      }
    } else {
      // For subsequent entries, validate against the previous entry
      const sortedEntries = [...entries].sort((a, b) => 
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
      const lastEntry = sortedEntries[sortedEntries.length - 1];
      
      if (lastEntry) {
        // Check that start date is valid
        const lastEntryEndDate = lastEntry.endDate === "present" 
          ? new Date() 
          : new Date(lastEntry.endDate);
        const newEntryStartDate = new Date(newEntry.startDate);
        
        // New entry should start within or after the previous entry
        if (newEntryStartDate < new Date(lastEntry.startDate)) {
          toast.error("New entry must start on or after the start date of the previous entry", {
            style: { backgroundColor: '#fee2e2', color: '#dc2626' }
          });
          return false;
        }
        
        // Check that end date is valid
        const newEntryEndDate = newEntry.endDate === "present" 
          ? new Date() 
          : new Date(newEntry.endDate);
        
        // End date must be after start date
        if (newEntryEndDate <= newEntryStartDate) {
          toast.error("End date must be after the start date", {
            style: { backgroundColor: '#fee2e2', color: '#dc2626' }
          });
          return false;
        }
        
        // End date must be after the previous entry's end date
        if (newEntryEndDate <= lastEntryEndDate && newEntry.endDate !== "present") {
          toast.error("End date must be after the previous entry's end date", {
            style: { backgroundColor: '#fee2e2', color: '#dc2626' }
          });
          return false;
        }
      }
    }
    
    setEntries(prev => [...prev, newEntry as TimelineEntry]);
    return true;
  }, [entries, personalInfo.dateOfBirth]);

  const updateEntry = useCallback((id: string, updates: Partial<TimelineEntry>) => {
    const entryToUpdate = entries.find(e => e.id === id);
    if (!entryToUpdate) return false;
    
    const updatedEntry = { ...entryToUpdate, ...updates };
    
    // If this is the first entry, validate that it starts within 1-11 years from DOB
    const isFirstEntry = entries.length === 1 || 
      (entries.length > 1 && isFirstChronologicalEntry(entries, id));
      
    if (isFirstEntry) {
      const isoDob = parseDateString(personalInfo.dateOfBirth);
      if (!isDateWithinElevenYearWindow(isoDob, updatedEntry.startDate)) {
        toast.error("First entry must start when you are between 1 and 11 years old", {
          style: { backgroundColor: '#fee2e2', color: '#dc2626' }
        });
        return false;
      }
    } else {
      // For non-first entries, check if it follows the previous entry
      const sortedEntries = [...entries].sort((a, b) => 
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
      const entryIndex = sortedEntries.findIndex(e => e.id === id);
      
      if (entryIndex > 0) {
        const prevEntry = sortedEntries[entryIndex - 1];
        const updatedStartDate = new Date(updatedEntry.startDate);
        
        // Updated entry should start within or after the previous entry
        if (updatedStartDate < new Date(prevEntry.startDate)) {
          toast.error("Entry must start on or after the start date of the previous entry", {
            style: { backgroundColor: '#fee2e2', color: '#dc2626' }
          });
          return false;
        }
        
        // Check that end date is valid
        const updatedEndDate = updatedEntry.endDate === "present" 
          ? new Date() 
          : new Date(updatedEntry.endDate);
        
        // End date must be after start date
        if (updatedEndDate <= updatedStartDate) {
          toast.error("End date must be after the start date", {
            style: { backgroundColor: '#fee2e2', color: '#dc2626' }
          });
          return false;
        }
        
        // End date must be after the previous entry's end date
        const prevEntryEndDate = prevEntry.endDate === "present" 
          ? new Date() 
          : new Date(prevEntry.endDate);
          
        if (updatedEndDate <= prevEntryEndDate && updatedEntry.endDate !== "present") {
          toast.error("End date must be after the previous entry's end date", {
            style: { backgroundColor: '#fee2e2', color: '#dc2626' }
          });
          return false;
        }
      }
      
      // Also check if the next entry starts after or within this one
      if (entryIndex < sortedEntries.length - 1) {
        const nextEntry = sortedEntries[entryIndex + 1];
        const updatedEndDate = updatedEntry.endDate === "present" 
          ? new Date() 
          : new Date(updatedEntry.endDate);
        const nextStartDate = new Date(nextEntry.startDate);
        
        // Next entry should start after this entry's start date
        if (nextStartDate < new Date(updatedEntry.startDate)) {
          toast.error("Next entry must start after this entry's start date");
          return false;
        }
      }
    }
    
    setEntries(prev => prev.map(e => e.id === id ? updatedEntry : e));
    return true;
  }, [entries, personalInfo.dateOfBirth]);

  const removeEntry = useCallback((id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    if (editingEntryId === id) {
      setEditingEntryId(null);
    }
  }, [editingEntryId]);

  const startEditingEntry = useCallback((id: string) => {
    setEditingEntryId(id);
  }, []);

  const cancelEditingEntry = useCallback(() => {
    setEditingEntryId(null);
  }, []);

  const togglePreviewMode = useCallback(() => {
    if (!isPreviewMode && (!personalInfo.firstName || !personalInfo.dateOfBirth)) {
      toast.error("Please fill in at least your name and date of birth before previewing");
      return;
    }
    setIsPreviewMode(prev => !prev);
  }, [isPreviewMode, personalInfo]);

  const getCVData = useCallback((): CVData => {
    return {
      personalInfo: {
        ...personalInfo,
        dateOfBirth: parseDateString(personalInfo.dateOfBirth)
      },
      entries: entries.sort((a, b) => 
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      )
    };
  }, [personalInfo, entries]);

  return {
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
  };
};
