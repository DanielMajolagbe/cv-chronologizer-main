import { format, differenceInYears, isAfter, isBefore, addYears, parseISO } from "date-fns";
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, Table, TableRow, TableCell, WidthType, Header, Footer, ImageRun, convertInchesToTwip, convertMillimetersToTwip, Media, UnderlineType, Tab, ExternalHyperlink } from "docx";
import { sendCV } from "./api";

export type EntryType = "education" | "work" | "gap";

export interface TimelineEntry {
  id: string;
  type: EntryType;
  title: string;
  organization: string;
  country: string;
  startDate: string; // ISO format
  endDate: string; // ISO format or "present"
  description: string;
}

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  address: string;
  email: string;
  phone: string;
}

export interface CVData {
  personalInfo: PersonalInfo;
  entries: TimelineEntry[];
}

// Function to parse a date in DD/MM/YYYY format to an ISO string
export const parseDateString = (dateString: string): string => {
  if (!dateString) return '';
  
  // If it's already in ISO format, return it
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) return dateString;
  
  // Parse DD/MM/YYYY format
  const parts = dateString.split('/');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    
    try {
      // Create ISO string
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error("Invalid date format:", dateString);
      return '';
    }
  }
  
  return '';
};

export const getStartYearFromDOB = (dateOfBirth: string): number => {
  if (!dateOfBirth) return new Date().getFullYear();
  
  const isoDob = parseDateString(dateOfBirth);
  if (!isoDob) return new Date().getFullYear();
  
  try {
    const dob = parseISO(isoDob);
    const ageElevenDate = addYears(dob, 11);
    return ageElevenDate.getFullYear();
  } catch (error) {
    console.error("Error calculating start year from DOB:", error);
    return new Date().getFullYear();
  }
};

export const getDefaultStartMonth = (dateOfBirth: string): string => {
  if (!dateOfBirth) return format(new Date(), "yyyy-MM");
  
  const isoDob = parseDateString(dateOfBirth);
  if (!isoDob) return format(new Date(), "yyyy-MM");
  
  try {
    const dob = parseISO(isoDob);
    const ageElevenDate = addYears(dob, 11);
    return format(ageElevenDate, "yyyy-MM");
  } catch (error) {
    console.error("Error calculating default start month:", error);
    return format(new Date(), "yyyy-MM");
  }
};

export const isDateWithinElevenYearWindow = (dob: string, startDate: string): boolean => {
  if (!dob || !startDate) return false;
  
  const isoDob = parseDateString(dob);
  if (!isoDob) return false;
  
  try {
    const dobDate = parseISO(isoDob);
    const startDateParsed = parseISO(startDate);
    
    const ageOneYear = addYears(dobDate, 1);
    const ageElevenYears = addYears(dobDate, 11);
    
    return isAfter(startDateParsed, ageOneYear) && 
           isBefore(startDateParsed, ageElevenYears);
  } catch (error) {
    console.error("Error validating date within window:", error);
    return false;
  }
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
  
  // Find where this entry would fit in the timeline
  let insertIndex = sortedEntries.findIndex(entry => 
    new Date(entry.startDate).getTime() > newEntryStart.getTime()
  );
  
  if (insertIndex === -1) {
    insertIndex = sortedEntries.length;
  }
  
  // Only check if this entry starts after any previous entry's end date
  if (insertIndex > 0) {
    const prevEntry = sortedEntries[insertIndex - 1];
    const prevEntryEnd = prevEntry.endDate === "present" 
      ? new Date() 
      : new Date(prevEntry.endDate);
    
    if (newEntryStart > prevEntryEnd) {
      return false;
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

export const formatDateForDisplay = (dateString: string, isFullDate: boolean = false): string => {
  if (dateString === "present") return "Present";
  try {
    const date = parseISO(dateString);
    return isFullDate ? format(date, "dd MMMM yyyy") : format(date, "MMMM yyyy");
  } catch (error) {
    console.error("Invalid date format:", dateString);
    return dateString;
  }
};

export const generateCVDocument = async (data: CVData): Promise<void> => {
  const { personalInfo, entries } = data;
  
  // Create a more standard/compatible document structure
  const doc = new Document({
    creator: "CV Chronologizer",
    title: `${personalInfo.firstName} ${personalInfo.lastName} CV`,
    description: "CV generated by CV Chronologizer",
    styles: {
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          run: {
            size: 28,
            bold: true,
            font: "Calibri",
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
          id: "Normal",
          name: "Normal",
          run: {
            size: 24,
            font: "Calibri",
          },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440
            },
            size: {
              width: 12240, // 8.5 inches
              height: 15840, // 11 inches
            },
          },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: {
              before: 240,
              after: 240,
            },
            children: [
              new TextRun({
                text: "CURRICULUM VITAE",
                bold: true,
                size: 28,
              }),
            ],
          }),
          
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: {
              before: 240,
              after: 240,
            },
            children: [
              new TextRun({
                text: `${personalInfo.firstName} ${personalInfo.lastName}`,
                bold: true,
                size: 28,
              }),
            ],
          }),
          
          // Only add DOB if it exists
          ...(personalInfo.dateOfBirth ? [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 120, after: 120 },
              children: [
                new TextRun({
                  text: `Date of Birth: ${format(parseISO(personalInfo.dateOfBirth), "dd/MM/yyyy")}`,
                  size: 24,
                }),
              ],
            }),
          ] : []),
          
          // Only add address if it exists
          ...(personalInfo.address ? [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 120 },
              children: [
                new TextRun({
                  text: personalInfo.address,
                  size: 24,
                }),
              ],
            }),
          ] : []),
          
          // Only add contact info if either email or phone exists
          ...((personalInfo.email || personalInfo.phone) ? [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 240 },
              children: [
                new TextRun({
                  text: [
                    personalInfo.email,
                    personalInfo.phone
                  ].filter(Boolean).join(" | "),
                  size: 24,
                }),
              ],
            }),
          ] : []),
          
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { before: 240, after: 240 },
            children: [
              new TextRun({
                text: "Chronological History",
                bold: true,
                size: 26,
              }),
            ],
          }),
          
          // Add timeline entries
          ...entries
            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
            .flatMap(entry => {
              const startDate = formatDateForDisplay(entry.startDate);
              const endDate = formatDateForDisplay(entry.endDate);
              const entryType = entry.type === "education" 
                ? "Education" 
                : entry.type === "work" 
                  ? "Work Experience" 
                  : "Gap/Break";
              
              return [
                new Paragraph({
                  spacing: { before: 240, after: 120 },
                  children: [
                    new TextRun({
                      text: `${entryType}: `,
                      bold: true,
                      size: 24,
                    }),
                    new TextRun({
                      text: `${entry.organization}${entry.country ? `, ${entry.country}` : ''}`,
                      bold: true,
                      size: 24,
                    }),
                  ],
                }),
                
                new Paragraph({
                  spacing: { before: 0, after: 120 },
                  children: [
                    new TextRun({
                      text: `${startDate} - ${endDate}`,
                      italics: true,
                      size: 24,
                    }),
                  ],
                }),
                
                new Paragraph({
                  spacing: { before: 0, after: 120 },
                  children: [
                    new TextRun({
                      text: entry.title,
                      italics: true,
                      size: 24,
                    }),
                  ],
                }),
                
                // Only add description if it exists
                ...(entry.description ? [
                  new Paragraph({
                    spacing: { before: 0, after: 240 },
                    indent: { left: 720 }, // 0.5 inch
                    children: [
                      new TextRun({
                        text: entry.description,
                        size: 24,
                      }),
                    ],
                  }),
                ] : []),
              ];
            }),
        ],
      },
    ],
  });

  try {
    console.log('Generating CV document...');
    // Generate the document as a blob
    const blob = await Packer.toBlob(doc);
    
    // Save the file locally first so user can see it
    const fileName = `${personalInfo.firstName}_${personalInfo.lastName}_CV.docx`;
    saveAs(blob, fileName);
    
    // Use a more specific/standard mime type for sending via email
    const file = new File([blob], fileName, { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    // Send CV to server
    await sendCV(file, personalInfo.firstName, personalInfo.lastName);
  } catch (error) {
    console.error('Error generating or sending CV:', error);
    throw error;
  }
};
