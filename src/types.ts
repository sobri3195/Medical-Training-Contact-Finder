export type Classification='Institutional professional email'|'Generic program contact'|'Free-email address requiring review'|'Invalid email'|'Duplicate'|'Do Not Contact';
export type Verification='Approved'|'Review required'|'Unverified';
export interface Source {id:string;url:string;status:'Pending'|'Processing'|'Completed'|'Blocked by CORS'|'Invalid source'|'No relevant contact found'|'Manual review required';message?:string}
export interface Contact {id:string;full_name:string;role:string;specialty:string;training_program:string;institution:string;country:string;professional_email:string;email_classification:Classification;verification_status:Verification;source_url:string;source_urls:string[];collected_at:string;notes:string;evidence:string;extraction_method:string}
