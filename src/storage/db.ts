import type { Contact } from '../types';
const DB='medical-contact-finder',STORE='contacts';
const open=()=>new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore(STORE,{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
export async function loadContacts():Promise<Contact[]>{const db=await open();return new Promise((resolve,reject)=>{const r=db.transaction(STORE).objectStore(STORE).getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
export async function saveContacts(rows:Contact[]){const db=await open();const tx=db.transaction(STORE,'readwrite'),store=tx.objectStore(STORE);store.clear();rows.forEach(r=>store.put(r));return new Promise<void>((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)})}
