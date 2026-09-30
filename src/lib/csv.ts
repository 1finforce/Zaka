import Papa from "papaparse";
export const toCsv = (rows: Record<string, unknown>[]) => Papa.unparse(rows);
export const fromCsv = <T = Record<string, string>>(text: string) => Papa.parse<T>(text, { header: true, skipEmptyLines: true });
