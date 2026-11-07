/* eslint-disable @next/next/no-img-element -- Case photographs use protected URLs. */
'use client';
import {useState} from 'react';
import {Plus, RefreshCw, CalendarDays, ArrowRight, FolderOpen} from 'lucide-react';
import {CROP_LABELS, formatDate, orderedObservations, STATE_LABELS, type CropCase} from '@/lib/monitoring';
import {followUpReminder, changeLabel} from '@/lib/casePresentation';
import {canUpdateCase, type DemoUser} from '@/lib/demo';
import {CropIcon, Badge} from './shared';
import FarmFilters, {emptyFilters, filterFarmCases} from './FarmFilters';

export default function Cases({cases, actor, onOpen, onNew, onRefresh}: {
  cases: CropCase[]; actor: DemoUser; onOpen: (id:string, followUp?:boolean)=>void; onNew:()=>void; onRefresh:()=>void;
}) {
  const [filters,setFilters]=useState({...emptyFilters});
  const visible=filterFarmCases(cases,filters);
  const reminders=cases.map(c=>followUpReminder(c));
  const overdue=reminders.filter(r=>r.kind==='overdue').length;
  const due=reminders.filter(r=>r.kind==='today').length;
  return <>
    <div className="page-heading"><div><h1>{actor.role==='Worker'?'My cases':'Farm cases'}</h1><p>Check what needs a follow-up, or open an earlier observation.</p></div>{actor.role!=='Administrator'&&<button className="btn primary" onClick={onNew}><Plus size={19} aria-hidden="true"/>Check a crop</button>}</div>
    <div className="case-overview" aria-label="Follow-up overview"><CalendarDays size={20} aria-hidden="true"/><span><strong>{due}</strong> due today</span><span><strong>{overdue}</strong> overdue</span><span className="muted">{cases.filter(c=>c.status!=='Closed').length} active cases</span></div>
    <FarmFilters value={filters} onChange={setFilters} count={visible.length}/>
    <section className="panel cases-panel"><div className="section-heading"><h2>{visible.length} {visible.length===1?'case':'cases'}</h2><button className="text-button" onClick={onRefresh}><RefreshCw size={16} aria-hidden="true"/>Refresh</button></div>
      <div className="case-list">{visible.map(c=>{
        const ordered=orderedObservations(c.observations);const latest=ordered.at(-1)!;
        const photo=ordered.filter(o=>o.photo).at(-1);const reminder=followUpReminder(c);
        return <article className="case-record" key={c.id}>
          <button className="case-open" aria-label={`Open ${CROP_LABELS[c.crop]} case, ${c.area}, ${c.sampleLabel}`} onClick={()=>onOpen(c.id)}>
            <span className="case-thumbnail">{photo?<img src={photo.photo} alt="" loading="lazy"/>:<CropIcon crop={c.crop} large/>}</span>
            <span className="case-identity"><span className="case-heading"><strong>{CROP_LABELS[c.crop]}</strong>{c.sample&&<span className="tag">Sample</span>}<Badge status={c.status}/></span><span className="case-location">{c.area} · {c.sampleLabel}</span><span className="case-condition">{c.screening.guidance?.name||STATE_LABELS[c.screening.state]}</span><span className="case-change">Latest change: <strong>{changeLabel(latest.change)}</strong> · {formatDate(latest.date)}</span></span>
            <ArrowRight size={19} aria-hidden="true"/>
          </button>
          <div className="case-followup"><div><span className={`reminder ${reminder.kind}`}>{reminder.label}</span><span className="reminder-date">{reminder.detail}</span></div>{canUpdateCase(actor,c)&&c.status!=='Closed'&&<button className="btn secondary" onClick={()=>onOpen(c.id,true)} aria-label={`Add follow-up for ${CROP_LABELS[c.crop]}, ${c.area}`}><Plus size={17} aria-hidden="true"/>Add follow-up</button>}</div>
        </article>;
      })}{!visible.length&&<div className="empty-state"><FolderOpen size={32} aria-hidden="true"/><h3>No matching cases</h3><p>Clear the filters or record a new observation.</p><button className="btn secondary" onClick={()=>setFilters({...emptyFilters})}>Clear filters</button></div>}</div>
    </section>
  </>;
}
