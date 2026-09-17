import Papa from 'papaparse';
export const CSV_COLUMNS=['full_name','role','specialty','training_program','institution','country','professional_email','profile_url','source_url','notes'] as const;
export type CsvRow=Record<(typeof CSV_COLUMNS)[number],string>;
export function parseCsv(text:string):CsvRow[]{const parsed=Papa.parse<Record<string,string>>(text,{header:true,skipEmptyLines:true,transformHeader:h=>h.trim().toLowerCase()});if(parsed.errors.length)throw new Error(parsed.errors[0].message);if(!parsed.meta.fields?.includes('professional_email'))throw new Error('CSV must include a professional_email column.');return parsed.data.map(row=>Object.fromEntries(CSV_COLUMNS.map(k=>[k,(row[k]||'').trim()])) as CsvRow)}
export const toCsv=(rows:Record<string,string>[])=>Papa.unparse(rows,{columns:['full_name','role','specialty','training_program','institution','country','professional_email','email_classification','verification_status','source_url','collected_at','notes']});
