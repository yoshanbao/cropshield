import {SlidersHorizontal, ChevronDown} from 'lucide-react';
import {CROP_TYPES} from '@/lib/crops';
import {CROP_LABELS, type CropCase} from '@/lib/monitoring';
export interface FarmFilter {crop:string;area:string;from:string;to:string;status:string}
export const emptyFilters:FarmFilter={crop:'',area:'',from:'',to:'',status:''};
export function filterFarmCases(cases:CropCase[],f:FarmFilter) {
  return cases.filter(c=>(!f.crop||c.crop===f.crop)&&(!f.status||c.status===f.status)&&(!f.area||`${c.area} ${c.sampleLabel}`.toLowerCase().includes(f.area.toLowerCase()))&&((!f.from&&!f.to)||c.observations.some(o=>(!f.from||o.date>=f.from)&&(!f.to||o.date<=f.to))));
}
export default function FarmFilters({value,onChange,count}:{value:FarmFilter;onChange:(f:FarmFilter)=>void;count:number}) {
  const update=(key:keyof FarmFilter,v:string)=>onChange({...value,[key]:v});
  const active=Object.values(value).filter(Boolean).length;
  return <details className="panel dashboard-filters no-print" aria-label="Case filters">
    <summary><SlidersHorizontal size={18} aria-hidden="true"/><strong>Filter cases</strong><span>{active?`${active} applied · `:''}{count} matching</span><ChevronDown size={18} aria-hidden="true"/></summary>
    <div className="filter-fields"><label>Crop<select aria-label="Dashboard crop" value={value.crop} onChange={e=>update('crop',e.target.value)}><option value="">All crops</option>{CROP_TYPES.map(c=><option value={c} key={c}>{CROP_LABELS[c]}</option>)}</select></label><label>Plant / area<input aria-label="Dashboard area" placeholder="Search a location or plant" value={value.area} onChange={e=>update('area',e.target.value)}/></label><label>Observed from<input aria-label="Dashboard date from" type="date" value={value.from} max={value.to||undefined} onChange={e=>update('from',e.target.value)}/></label><label>Observed to<input aria-label="Dashboard date to" type="date" min={value.from||undefined} value={value.to} onChange={e=>update('to',e.target.value)}/></label><label>Case status<select aria-label="Dashboard status" value={value.status} onChange={e=>update('status',e.target.value)}><option value="">All statuses</option>{['Open','Monitoring','Closed'].map(s=><option key={s}>{s}</option>)}</select></label><button className="text-button" onClick={()=>onChange({...emptyFilters})}>Reset filters</button></div>
  </details>;
}
