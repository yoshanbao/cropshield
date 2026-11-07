'use client';
import {useState} from 'react';
import {Search, ScanLine, ChevronRight, ArrowUpRight, Info, BookOpen} from 'lucide-react';
import {CROP_TYPES, type CropType} from '@/lib/crops';
import {CROP_LABELS, formatDate} from '@/lib/monitoring';
import type {LibraryEntry} from '@/lib/demo';
import {CropIcon} from './shared';

export default function Guide({entries,onCheck}:{entries:LibraryEntry[];onCheck:()=>void}) {
  const [crop,setCrop]=useState<CropType|'all'>('all');
  const [kind,setKind]=useState('all');
  const [search,setSearch]=useState('');
  const filtered=entries.filter(e=>(crop==='all'||e.crop===crop)&&(kind==='all'||e.kind===kind)&&(!search||`${e.name} ${e.cues} ${e.crop} ${CROP_LABELS[e.crop]}`.toLowerCase().includes(search.toLowerCase())));
  return <div className="crop-guide">
    <div className="page-heading"><div><h1>Crop guide</h1><p>Find symptoms, care steps, and their sources.</p></div><button className="btn secondary" onClick={onCheck}><ScanLine size={18} aria-hidden="true"/>Check a photo</button></div>
    <section className="guide-filters panel" aria-label="Filter crop guide">
      <label className="guide-search"><span>Search crop guide</span><span className="guide-search-control"><Search size={19} aria-hidden="true"/><input aria-label="Search crop guide" type="search" placeholder="Disease, pest, or symptom" value={search} onChange={e=>setSearch(e.target.value)}/></span></label>
      <label><span>Crop</span><select aria-label="Guide crop" value={crop} onChange={e=>setCrop(e.target.value as CropType|'all')}><option value="all">All crops</option>{CROP_TYPES.map(c=><option key={c} value={c}>{CROP_LABELS[c]}</option>)}</select></label>
      <label><span>Category</span><select aria-label="Guide category" value={kind} onChange={e=>setKind(e.target.value)}><option value="all">Diseases &amp; pests</option><option>Disease</option><option>Pest</option></select></label>
    </section>
    <div className="guide-count" aria-live="polite">{filtered.length} referenced {filtered.length===1?'entry':'entries'}</div>
    <div className="guide-grid">{filtered.map(e=><details key={e.id} className="panel guide-card"><summary><CropIcon crop={e.crop}/><div><span>{CROP_LABELS[e.crop]} · {e.kind||'Disease'}</span><h2>{e.name}</h2></div><ChevronRight size={19} aria-hidden="true"/></summary><div className="guide-body"><h3>What to look for</h3><p>{e.cues}</p><h3>Care for this crop</h3><p>{e.care}</p><h3>Prevention</h3><p>{e.prevention}</p>{e.limitations&&<div className="notice"><Info size={18} aria-hidden="true"/><p>{e.limitations}</p></div>}<a className="source-link" href={e.sourceUrl} target="_blank" rel="noreferrer">{e.source}<ArrowUpRight size={16} aria-hidden="true"/></a><small>{e.version} · Content checked {e.reviewedAt?formatDate(e.reviewedAt):'date not recorded'}</small></div></details>)}</div>
    {!filtered.length&&<div className="panel empty-state"><BookOpen size={32} aria-hidden="true"/><h2>No matching references</h2><p>Try another crop, category, or search.</p></div>}
  </div>;
}
