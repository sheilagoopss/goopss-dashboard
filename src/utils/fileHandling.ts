import * as XLSX from 'xlsx';

interface ParsedData {
  [key: string]: string;
}

export async function parseFile(file: File): Promise<ParsedData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const data = e.target?.result;
      try {
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet) as ParsedData[];
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
}

export function generateCSV(data: { listingId: string; optimizedTitle: string; optimizedDescription: string }[]): string {
  const headers = ['Listing ID', 'Optimized Title', 'Optimized Description'];
  const csvContent = [
    headers.join(','),
    ...data.map(item => 
      `${item.listingId},"${item.optimizedTitle}","${item.optimizedDescription.replace(/"/g, '""')}"`
    )
  ].join('\n');
  return csvContent;
}