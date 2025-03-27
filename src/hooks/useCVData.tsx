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
      if (!isoDob) {
        toast.error("Please add your date of birth in Personal Details", {
          style: { backgroundColor: '#fee2e2', color: '#dc2626' }
        });
        return false;
      }
      
      if (!isDateWithinElevenYearWindow(isoDob, newEntry.startDate)) {
        toast.error("First entry must start when you are between 1 and 11 years old", {
          style: { backgroundColor: '#fee2e2', color: '#dc2626' }
        });
        return false;
      }
    } else {
      // Check chronological order using the same function used for editing entries
      if (!isEntryInChronologicalOrder(entries, newEntry as TimelineEntry)) {
        toast.error("Entry dates must follow chronological order", {
          style: { backgroundColor: '#fee2e2', color: '#dc2626' }
        });
        return false;
      }
      
      // Ensure end date is after start date
      const newEntryStartDate = new Date(newEntry.startDate);
      const newEntryEndDate = newEntry.endDate === "present" 
        ? new Date() 
        : new Date(newEntry.endDate);
      
      if (newEntryEndDate <= newEntryStartDate) {
        toast.error("End date must be after the start date", {
          style: { backgroundColor: '#fee2e2', color: '#dc2626' }
        });
        return false;
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
      if (!isoDob) {
        toast.error("Please add your date of birth in Personal Details", {
          style: { backgroundColor: '#fee2e2', color: '#dc2626' }
        });
        return false;
      }
      
      if (!isDateWithinElevenYearWindow(isoDob, updatedEntry.startDate)) {
        toast.error("First entry must start when you are between 1 and 11 years old", {
          style: { backgroundColor: '#fee2e2', color: '#dc2626' }
        });
        return false;
      }
    } else {
      // Check chronological order using the same function used for new entries
      if (!isEntryInChronologicalOrder(entries, updatedEntry, id)) {
        toast.error("Entry dates must follow chronological order", {
          style: { backgroundColor: '#fee2e2', color: '#dc2626' }
        });
        return false;
      }
      
      // Ensure end date is after start date
      const updatedStartDate = new Date(updatedEntry.startDate);
      const updatedEndDate = updatedEntry.endDate === "present" 
        ? new Date() 
        : new Date(updatedEntry.endDate);
      
      if (updatedEndDate <= updatedStartDate) {
        toast.error("End date must be after the start date", {
          style: { backgroundColor: '#fee2e2', color: '#dc2626' }
        });
        return false;
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
