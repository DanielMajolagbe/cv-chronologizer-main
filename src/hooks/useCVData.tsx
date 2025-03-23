
import { useState, useCallback, useEffect } from "react";
import { CVData, TimelineEntry, PersonalInfo, getStartYearFromDOB, isEntryInChronologicalOrder, isDateWithinElevenYearWindow, isFirstChronologicalEntry } from "../utils/cvUtils";
import { toast } from "sonner";

const initialPersonalInfo: PersonalInfo = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  email: "",
  phone: "",
  address: ""
};

export const useCVData = () => {
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>(initialPersonalInfo);
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Remove the auto-generation of a placeholder entry

  const updatePersonalInfo = useCallback((info: Partial<PersonalInfo>) => {
    setPersonalInfo(prev => ({ ...prev, ...info }));
  }, []);

  const addEntry = useCallback((entry: Omit<TimelineEntry, "id">) => {
    const newEntry = { ...entry, id: crypto.randomUUID() };
    
    // If this is the first entry, validate that it starts when the person is 11 years old
    if (entries.length === 0) {
      if (!isDateWithinElevenYearWindow(personalInfo.dateOfBirth, newEntry.startDate)) {
        toast.error("First entry must start when you are 11 years old (within 11-12 years from your date of birth)");
        return false;
      }
    }
    
    // Validate chronological order without gaps
    if (!isEntryInChronologicalOrder(entries, newEntry as TimelineEntry)) {
      toast.error("Each entry must start exactly when the previous one ends (same month and year)");
      return false;
    }
    
    setEntries(prev => [...prev, newEntry as TimelineEntry]);
    return true;
  }, [entries, personalInfo.dateOfBirth]);

  const updateEntry = useCallback((id: string, updates: Partial<TimelineEntry>) => {
    const entryToUpdate = entries.find(e => e.id === id);
    if (!entryToUpdate) return false;
    
    const updatedEntry = { ...entryToUpdate, ...updates };
    
    // If this is the first entry, validate that it starts when the person is 11 years old
    const isFirstEntry = entries.length === 1 || 
      (entries.length > 1 && entries.indexOf(entryToUpdate) === 0);
      
    if (isFirstEntry) {
      if (!isDateWithinElevenYearWindow(personalInfo.dateOfBirth, updatedEntry.startDate)) {
        toast.error("First entry must start when you are 11 years old (within 11-12 years from your date of birth)");
        return false;
      }
    }
    
    // Validate chronological order without gaps
    if (!isEntryInChronologicalOrder(entries, updatedEntry, id)) {
      toast.error("Each entry must start exactly when the previous one ends (same month and year)");
      return false;
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
      personalInfo,
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
