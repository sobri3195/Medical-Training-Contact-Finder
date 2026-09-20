import type { Contact } from '../types';
const DB='medical-contact-finder',STORE='contacts';
const open=()=>new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE,{keyPath:'id'})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
export async function loadContacts():Promise<Contact[]>{const db=await open();return new Promise((resolve,reject)=>{const r=db.transaction(STORE).objectStore(STORE).getAll();r.onsuccess=()=>{db.close();resolve(r.result)};r.onerror=()=>{db.close();reject(r.error)}})}
let saveQueue:Promise<void>=Promise.resolve();
async function replaceContacts(rows:Contact[]){const db=await open();const tx=db.transaction(STORE,'readwrite'),store=tx.objectStore(STORE);store.clear();rows.forEach(r=>store.put(r));return new Promise<void>((resolve,reject)=>{tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error)};tx.onabort=()=>{db.close();reject(tx.error)}})}
export function saveContacts(rows:Contact[]){const snapshot=rows.map(row=>({...row,source_urls:[...row.source_urls]}));saveQueue=saveQueue.catch(()=>undefined).then(()=>replaceContacts(snapshot));return saveQueue}
