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
      // For subsequent entries, validate they start exactly when the previous one ends
      const lastEntry = [...entries].sort((a, b) => 
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      )[0];
      
      if (lastEntry && lastEntry.endDate !== "present") {
        // Extract the year and month from both dates for comparison
        const prevEndDate = new Date(lastEntry.endDate);
        const newStartDate = new Date(newEntry.startDate);
        
        const prevEndYear = prevEndDate.getFullYear();
        const prevEndMonth = prevEndDate.getMonth();
        
        const newStartYear = newStartDate.getFullYear();
        const newStartMonth = newStartDate.getMonth();
        
        if (prevEndYear !== newStartYear || prevEndMonth !== newStartMonth) {
          toast.error("Each entry must start exactly when the previous one ends (same month and year)");
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
      (entries.length > 1 && entries.indexOf(entryToUpdate) === 0);
      
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
      const entryIndex = entries.findIndex(e => e.id === id);
      if (entryIndex > 0) {
        const prevEntry = entries[entryIndex - 1];
        if (prevEntry.endDate !== "present") {
          // Extract the year and month from both dates for comparison
          const prevEndDate = new Date(prevEntry.endDate);
          const updatedStartDate = new Date(updatedEntry.startDate);
          
          const prevEndYear = prevEndDate.getFullYear();
          const prevEndMonth = prevEndDate.getMonth();
          
          const updatedStartYear = updatedStartDate.getFullYear();
          const updatedStartMonth = updatedStartDate.getMonth();
          
          if (prevEndYear !== updatedStartYear || prevEndMonth !== updatedStartMonth) {
            toast.error("Each entry must start exactly when the previous one ends (same month and year)");
            return false;
          }
        }
      }
      
      // Also check if the next entry starts when this one ends (if there is a next entry)
      if (entryIndex < entries.length - 1 && updatedEntry.endDate !== "present") {
        const nextEntry = entries[entryIndex + 1];
        const updatedEndDate = new Date(updatedEntry.endDate);
        const nextStartDate = new Date(nextEntry.startDate);
        
        const updatedEndYear = updatedEndDate.getFullYear();
        const updatedEndMonth = updatedEndDate.getMonth();
        
        const nextStartYear = nextStartDate.getFullYear();
        const nextStartMonth = nextStartDate.getMonth();
        
        if (updatedEndYear !== nextStartYear || updatedEndMonth !== nextStartMonth) {
          toast.error("Next entry must start exactly when this one ends (same month and year)");
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
    removeEntry: useCallback((id: string) => {
      setEntries(prev => prev.filter(e => e.id !== id));
      if (editingEntryId === id) {
        setEditingEntryId(null);
      }
    }, [editingEntryId]),
    startEditingEntry: useCallback((id: string) => {
      setEditingEntryId(id);
    }, []),
    cancelEditingEntry: useCallback(() => {
      setEditingEntryId(null);
    }, []),
    togglePreviewMode,
    getCVData
  };
};
