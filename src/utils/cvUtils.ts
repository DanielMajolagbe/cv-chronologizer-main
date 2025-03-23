
import { format, differenceInYears, isAfter, isBefore, parseISO, differenceInMonths, addYears } from "date-fns";
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, Table, TableRow, TableCell, WidthType, Header, Footer, ImageRun, convertInchesToTwip, convertMillimetersToTwip, Media, UnderlineType, Tab, ExternalHyperlink } from "docx";

export type EntryType = "education" | "work" | "gap";

export interface TimelineEntry {
  id: string;
  type: EntryType;
  title: string;
  organization: string;
  startDate: string; // ISO format
  endDate: string; // ISO format or "present"
  description: string;
}

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO format
  email: string;
  phone: string;
  address: string;
}

export interface CVData {
  personalInfo: PersonalInfo;
  entries: TimelineEntry[];
}

export const getStartYearFromDOB = (dateOfBirth: string): number => {
  if (!dateOfBirth) return new Date().getFullYear();
  
  const dob = parseISO(dateOfBirth);
  const ageElevenDate = new Date(dob);
  ageElevenDate.setFullYear(dob.getFullYear() + 11);
  
  return ageElevenDate.getFullYear();
};

export const getDefaultStartMonth = (dateOfBirth: string): string => {
  if (!dateOfBirth) return format(new Date(), "yyyy-MM");
  
  const dob = parseISO(dateOfBirth);
  const ageElevenDate = new Date(dob);
  ageElevenDate.setFullYear(dob.getFullYear() + 11);
  
  return format(ageElevenDate, "yyyy-MM");
};

export const isDateWithinElevenYearWindow = (dob: string, startDate: string): boolean => {
  if (!dob || !startDate) return false;
  
  const dobDate = parseISO(dob);
  const startDateParsed = parseISO(startDate);
  const elevenYearsFromDOB = addYears(dobDate, 11);
  const twelveYearsFromDOB = addYears(dobDate, 12);
  
  return isAfter(startDateParsed, elevenYearsFromDOB) && 
         isBefore(startDateParsed, twelveYearsFromDOB);
};

export const isFirstChronologicalEntry = (entries: TimelineEntry[], entryId?: string): boolean => {
  if (entries.length === 0) return true;
  
  const filteredEntries = entryId 
    ? entries.filter(entry => entry.id !== entryId) 
    : entries;
  
  if (filteredEntries.length === 0) return true;
  
  return false;
};

export const isEntryInChronologicalOrder = (
  entries: TimelineEntry[],
  newEntry: TimelineEntry,
  editingEntryId?: string
): boolean => {
  // If there are no entries or just adding the first entry, allow it
  if (entries.length === 0) return true;

  const sortedEntries = [...entries];
  
  // If editing an existing entry, remove it from the comparison list
  if (editingEntryId) {
    const editingIndex = sortedEntries.findIndex(entry => entry.id === editingEntryId);
    if (editingIndex !== -1) {
      sortedEntries.splice(editingIndex, 1);
    }
  }
  
  // Sort entries by start date
  sortedEntries.sort((a, b) => 
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );
  
  const newEntryStart = new Date(newEntry.startDate);
  const newEntryEnd = newEntry.endDate === "present" 
    ? new Date() 
    : new Date(newEntry.endDate);
  
  if (sortedEntries.length > 0) {
    // Find where this entry fits in the timeline
    let previousEntry = null;
    let nextEntry = null;
    
    for (let i = 0; i < sortedEntries.length; i++) {
      const currentEntryStart = new Date(sortedEntries[i].startDate);
      
      if (newEntryStart < currentEntryStart) {
        nextEntry = sortedEntries[i];
        previousEntry = i > 0 ? sortedEntries[i-1] : null;
        break;
      }
      
      if (i === sortedEntries.length - 1) {
        previousEntry = sortedEntries[i];
      }
    }
    
    // Check if this entry follows the previous entry properly
    if (previousEntry) {
      const previousEntryEnd = previousEntry.endDate === "present" 
        ? new Date() 
        : new Date(previousEntry.endDate);
      
      // The start date of new entry should match the end date of previous entry
      // We only compare year and month, not the day
      if (
        previousEntryEnd.getMonth() !== newEntryStart.getMonth() || 
        previousEntryEnd.getFullYear() !== newEntryStart.getFullYear()
      ) {
        return false;
      }
    }
    
    // Check if the next entry follows this entry properly
    if (nextEntry) {
      const nextEntryStart = new Date(nextEntry.startDate);
      
      // The end date of new entry should match the start date of next entry
      // We only compare year and month, not the day
      if (
        newEntryEnd.getMonth() !== nextEntryStart.getMonth() || 
        newEntryEnd.getFullYear() !== nextEntryStart.getFullYear()
      ) {
        return false;
      }
    }
  }
  
  return true;
};

export const identifyGaps = (entries: TimelineEntry[]): { start: string; end: string }[] => {
  if (entries.length < 2) return [];
  
  const sortedEntries = [...entries].sort((a, b) => 
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );
  
  const gaps: { start: string; end: string }[] = [];
  
  for (let i = 1; i < sortedEntries.length; i++) {
    const prevEndDate = sortedEntries[i-1].endDate === "present" 
      ? new Date().toISOString().split('T')[0]
      : sortedEntries[i-1].endDate;
    
    const currentStartDate = sortedEntries[i].startDate;
    
    const prevEnd = new Date(prevEndDate);
    const currStart = new Date(currentStartDate);
    
    if (
      prevEnd.getMonth() !== currStart.getMonth() || 
      prevEnd.getFullYear() !== currStart.getFullYear()
    ) {
      gaps.push({
        start: prevEndDate,
        end: currentStartDate
      });
    }
  }
  
  return gaps;
};

export const formatDateForDisplay = (dateString: string): string => {
  if (dateString === "present") return "Present";
  try {
    const date = parseISO(dateString);
    return format(date, "MMMM yyyy");
  } catch (error) {
    console.error("Invalid date format:", dateString);
    return dateString;
  }
};

export const generateCVDocument = (data: CVData): void => {
  const { personalInfo, entries } = data;
  
  const doc = new Document({
    styles: {
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: {
            font: "Calibri",
            size: 32,
            bold: true,
            color: "202020",
          },
          paragraph: {
            spacing: {
              after: 240,
              before: 240,
            },
            alignment: AlignmentType.CENTER,
          },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: {
            font: "Calibri",
            size: 28,
            bold: true,
            color: "404040",
          },
          paragraph: {
            spacing: {
              before: 240,
              after: 120,
            },
          },
        },
        {
          id: "Normal",
          name: "Normal",
          next: "Normal",
          quickFormat: true,
          run: {
            font: "Calibri",
            size: 24,
            color: "333333",
          },
          paragraph: {
            spacing: {
              line: 276,
              before: 60,
              after: 60,
            },
          },
        },
        {
          id: "ContactInfo",
          name: "Contact Info",
          basedOn: "Normal",
          next: "Normal",
          run: {
            font: "Calibri",
            size: 22,
            color: "666666",
          },
          paragraph: {
            alignment: AlignmentType.CENTER,
            spacing: {
              before: 60,
              after: 120,
            },
          },
        },
        {
          id: "EntryTitle",
          name: "Entry Title",
          basedOn: "Normal",
          next: "Normal",
          run: {
            bold: true,
            font: "Calibri",
            size: 24,
          },
          paragraph: {
            spacing: {
              before: 120,
              after: 60,
            },
          },
        },
        {
          id: "EntryPosition",
          name: "Entry Position",
          basedOn: "Normal",
          next: "Normal",
          run: {
            italics: true,
            font: "Calibri",
            size: 24,
          },
          paragraph: {
            spacing: {
              before: 0,
              after: 60,
            },
          },
        },
        {
          id: "EntryDescription",
          name: "Entry Description",
          basedOn: "Normal",
          next: "Normal",
          run: {
            font: "Calibri",
            size: 22,
          },
          paragraph: {
            spacing: {
              before: 0,
              after: 180,
            },
            indent: {
              left: convertMillimetersToTwip(5),
            },
          },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `${personalInfo.firstName} ${personalInfo.lastName} - CV`,
                    font: "Calibri",
                    size: 20,
                    color: "666666",
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "CV Created with Royacare Agency CV Builder",
                    font: "Calibri",
                    size: 18,
                    color: "666666",
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: {
              before: 0,
              after: 240,
            },
            children: [
              new TextRun({
                text: "",
                font: "Calibri",
                size: 28,
                bold: true,
                color: "404040",
              }),
            ],
          }),
          
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: `${personalInfo.firstName} ${personalInfo.lastName}`,
                bold: true,
                size: 32,
              }),
            ],
          }),
          
          new Paragraph({
            style: "ContactInfo",
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: personalInfo.address,
                size: 22,
                color: "666666",
              }),
            ],
          }),
          
          new Paragraph({
            style: "ContactInfo",
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `${personalInfo.email} | ${personalInfo.phone}`,
                size: 22,
                color: "666666",
              }),
            ],
          }),
          
          new Paragraph({
            style: "ContactInfo",
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `Date of Birth: ${format(parseISO(personalInfo.dateOfBirth), "MMMM d, yyyy")}`,
                size: 22,
                color: "666666",
              }),
            ],
          }),
          
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: "Chronological History",
                bold: true,
                size: 28,
              }),
            ],
          }),
          
          ...entries
            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
            .flatMap(entry => {
              const startDate = formatDateForDisplay(entry.startDate);
              const endDate = formatDateForDisplay(entry.endDate);
              
              return [
                new Paragraph({
                  style: "EntryTitle",
                  children: [
                    new TextRun({
                      text: `${entry.type === "education" ? "Education" : entry.type === "work" ? "Work Experience" : "Gap/Break"}: `,
                      bold: true,
                    }),
                    new TextRun({
                      text: entry.organization,
                      bold: true,
                    }),
                    new TextRun({
                      text: "  ",
                    }),
                    new TextRun({
                      text: `${startDate} - ${endDate}`,
                      italics: true,
                      color: "666666",
                    }),
                  ],
                }),
                
                new Paragraph({
                  style: "EntryPosition",
                  children: [
                    new TextRun({
                      text: entry.title,
                      italics: true,
                    }),
                  ],
                }),
                
                new Paragraph({
                  style: "EntryDescription",
                  children: [
                    new TextRun({
                      text: entry.description,
                    }),
                  ],
                }),
              ];
            }),
        ],
      },
    ],
  });

  Packer.toBlob(doc).then(blob => {
    saveAs(blob, `${personalInfo.firstName}_${personalInfo.lastName}_CV.docx`);
  });
};
