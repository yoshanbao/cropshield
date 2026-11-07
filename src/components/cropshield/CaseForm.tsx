/* eslint-disable @next/next/no-img-element -- Uploaded images use protected URLs. */
'use client';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {Camera,Upload,ScanLine,LoaderCircle,Info,Check,Save,X,ArrowRight,FlaskConical,ChevronDown} from 'lucide-react';
import {CROP_TYPES,type CropType} from '@/lib/crops';
import {CROP_LABELS,today,STATE_LABELS,type CropCase,type Screening} from '@/lib/monitoring';
import {screeningInputKey} from '@/lib/casePresentation';
import {daysAgo,type DemoScenario,type DemoUser,type LibraryEntry} from '@/lib/demo';
import {CropIcon,GuidanceCard,preparePhoto,photoBlob} from './shared';
export interface Draft {id:string;crop:CropType;area:string;sampleLabel:string;date:string;symptoms:string;actions:string;plantAge:string;photo:string;nextFollowUp:string;mode?:'live'|'demo';scenario?:DemoScenario;demoKind?:'Disease'|'Pest';failureDemonstrated?:boolean;walkthroughKey?:string}
export const newDraft=():Draft=>({id:crypto.randomUUID(),crop:'Rice',area:'',sampleLabel:'Plant 01',date:today(),symptoms:'',actions:'',plantAge:'',photo:'',nextFollowUp:'',mode:'live'});
interface Props {draft:Draft;setDraft:(d:Draft)=>void;onSave:(c:CropCase)=>Promise<boolean>;onSaveDraft:()=>Promise<boolean>;onDiscard:()=>Promise<void>;library:LibraryEntry[];actor:DemoUser;draftStatus:string;demoAvailable:boolean;onActivityChange?:(busy:boolean)=>void}
export default function CaseForm({draft,setDraft,onSave,onSaveDraft,onDiscard,library,actor,draftStatus,demoAvailable,onActivityChange}:Props) {
  const mounted=useRef(true);useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  const latestDraft=useRef(draft);latestDraft.current=draft;
  const [result,setResult]=useState<Screening|null>(null);const [screeningId,setScreeningId]=useState('');
  const [busy,setBusy]=useState(false);const [uploading,setUploading]=useState(false);const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');const [failed,setFailed]=useState(false);const [restored,setRestored]=useState(false);
  const [demoOpen,setDemoOpen]=useState(draft.mode==='demo');const [cropOpen,setCropOpen]=useState(false);
  const photoInput=useRef<HTMLInputElement>(null);const cameraInput=useRef<HTMLInputElement>(null);const formRef=useRef<HTMLFormElement>(null);
  const lock=useRef(false);const resultRef=useRef<HTMLDivElement>(null);const changedDuringRestore=useRef(false);
  useEffect(()=>{onActivityChange?.(busy||uploading||saving);return()=>onActivityChange?.(false);},[busy,uploading,saving,onActivityChange]);
  useEffect(()=>{
    const controller=new AbortController();changedDuringRestore.current=false;
    setResult(null);setScreeningId('');setRestored(false);
    fetch('/api/screen?id='+encodeURIComponent(draft.id),{cache:'no-store',signal:controller.signal})
      .then(r=>r.ok?r.json():null).then(data=>{
        const r=data?.result;
        if(!controller.signal.aborted&&!changedDuringRestore.current&&r&&r.inputKey===screeningInputKey(latestDraft.current)){
          setResult(r.screening);setScreeningId(r.screeningId);setRestored(true);
        }
      }).catch(()=>{});
    return()=>controller.abort();
  },[draft.id]);
  function clearResult(){changedDuringRestore.current=true;setResult(null);setScreeningId('');setRestored(false);setError('');setFailed(false);}
  function change<K extends keyof Draft>(key:K,value:Draft[K]){
    setDraft({...draft,[key]:value});
    // Location and scheduling edits do not change image analysis.
    if(['crop','symptoms','photo','mode','scenario','demoKind'].includes(key))clearResult();
  }
  async function attach(file?:File){
    if(!file)return;const draftId=draft.id;setError('');setUploading(true);
    try {const data=await preparePhoto(file);if(!mounted.current)return;
      const form=new FormData();form.set('image',photoBlob(data),'crop.jpg');
      const response=await fetch('/api/images',{method:'POST',body:form});const json=await response.json();
      if(!response.ok)throw new Error(json.error);
      if(!mounted.current||latestDraft.current.id!==draftId)return;
      setDraft({...latestDraft.current,photo:json.photo,mode:'live'});clearResult();
    }catch(e){if(mounted.current)setError((e as Error).message);}
    finally{if(mounted.current){setUploading(false);if(photoInput.current)photoInput.current.value='';if(cameraInput.current)cameraInput.current.value='';}}
  }
  function loadDemo(){clearResult();setDraft({...newDraft(),date:daysAgo(3),photo:'/images/demo-rice-first.svg',area:'Rice field · Practice plot',sampleLabel:'Plant 01',symptoms:'Spindle-shaped brown spots with gray centers are visible on lower leaves.',mode:'demo',scenario:'supported',demoKind:'Disease'});}
  async function screen(e:FormEvent){
    e.preventDefault();if(lock.current)return;setError('');
    if(!draft.photo){setError('Add a clear photograph first. Your entered details will stay here.');photoInput.current?.focus();return;}
    changedDuringRestore.current=true;lock.current=true;setBusy(true);setResult(null);setRestored(false);
    const submitted={...draft,scenario:failed?'supported':draft.scenario||'supported'};
    try {
      // Retain the retry scenario so a successful demo retry can be restored later.
      if(failed&&draft.mode==='demo')setDraft(submitted);
      if(!await onSaveDraft())throw new Error('Your draft could not be saved. Check the connection before retrying.');
      const response=await fetch('/api/screen',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:submitted.id,crop:submitted.crop,symptoms:submitted.symptoms,photo:submitted.photo,mode:submitted.mode||'live',demoKind:submitted.demoKind||'Disease',scenario:submitted.scenario})});
      const data=await response.json();if(!response.ok)throw new Error(data.error);
      if(!mounted.current)return;
      setResult(data.screening);setScreeningId(data.screeningId);setFailed(false);
    }catch(e){if(mounted.current){setError((e as Error).message);setFailed(true);}}
    finally{lock.current=false;if(mounted.current)setBusy(false);}
  }
  async function save(without=false){
    if(lock.current)return;setError('');
    if(!formRef.current?.reportValidity())return;
    if(!draft.photo){setError('Add a crop photograph before saving.');return;}
    if(draft.date>today()){setError('Choose an observation date on or before today.');return;}
    lock.current=true;setSaving(true);
    try{await onSave({id:draft.id,crop:draft.crop,area:draft.area,sampleLabel:draft.sampleLabel||'Plant 01',plantAge:draft.plantAge,recordedBy:actor.name,createdById:actor.id,status:'Open',nextFollowUp:draft.nextFollowUp,createdAt:new Date().toISOString(),screening:without?{state:'NOT_SCREENED',observations:[]}:result||{state:'NOT_SCREENED',observations:[]},screeningId:without?undefined:screeningId,observations:[{id:draft.id+'-initial',date:draft.date,symptoms:draft.symptoms,actions:draft.actions,photo:draft.photo,change:'Not yet assessed'}],sample:draft.mode==='demo',assignedTo:[],statusHistory:[]});}
    finally{lock.current=false;if(mounted.current)setSaving(false);}
  }
  const demo=draft.mode==='demo';const disabled=busy||saving;const photoDisabled=disabled||uploading;
  const entries=library.filter(g=>g.crop===draft.crop&&g.enabled);
  useEffect(()=>{if(result&&!restored)resultRef.current?.scrollIntoView({block:'start'});},[result,restored]);
  const needPhoto=result&&['UNCLEAR_IMAGE','NOT_PLANT','CROP_MISMATCH','UNCERTAIN'].includes(result.state);
  return <div className="checker-layout"><div className="checker-main">
    {restored&&result&&<div className="restored-result notice" role="status"><Check size={20} aria-hidden="true"/><div><strong>Your screening result is ready—continue saving this case.</strong><button className="text-button" onClick={()=>resultRef.current?.scrollIntoView({block:'start'})}>View result<ArrowRight size={17} aria-hidden="true"/></button></div></div>}
    <form ref={formRef} className="panel checker-form" onSubmit={screen}>
      <p className="required-note">Fields marked <span aria-hidden="true">*</span> are required.</p>
      <section className="check-step"><div className="step-heading"><span>1</span><div><h2>Add a photo <span className="required-mark" aria-label="required">*</span></h2><p>Show the affected part or the insect clearly.</p></div></div>
        <input ref={photoInput} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Choose crop photograph" disabled={photoDisabled} onChange={e=>attach(e.target.files?.[0])}/>
        <input ref={cameraInput} className="sr-only" type="file" capture="environment" accept="image/jpeg,image/png,image/webp" aria-label="Take crop photograph" disabled={photoDisabled} onChange={e=>attach(e.target.files?.[0])}/>
        {draft.photo?<div className="photo-preview"><img src={draft.photo} alt="Crop photo selected for screening"/><button type="button" className="icon-button" aria-label="Remove selected photo" disabled={photoDisabled} onClick={()=>change('photo','')}><X size={20}/></button>{demo&&<span className="image-label">Illustrative demo image</span>}<div className="photo-replace"><button type="button" className="btn secondary" disabled={photoDisabled} onClick={()=>photoInput.current?.click()}>{uploading?'Saving photo…':'Change photo'}</button></div></div>:<div className="photo-drop" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();if(!photoDisabled)attach(e.dataTransfer.files[0]);}}>
          {uploading?<LoaderCircle className="spin" size={27} aria-hidden="true"/>:<Camera size={27} aria-hidden="true"/>}<p>{uploading?'Saving your photo…':'Use a sharp close-up in natural light.'}</p>
          <div className="button-row"><button type="button" className="btn primary" disabled={photoDisabled} onClick={()=>cameraInput.current?.click()}><Camera size={18} aria-hidden="true"/>Take photo</button><button type="button" className="btn secondary" disabled={photoDisabled} onClick={()=>photoInput.current?.click()}><Upload size={18} aria-hidden="true"/>Choose photo</button></div><small>JPEG, PNG or WebP · Up to 5 MB</small>
        </div>}
      </section>
      <section className="check-step"><div className="step-heading"><span>2</span><div><h2>Select crop <span className="required-mark" aria-label="required">*</span></h2></div></div>
        <button className="crop-choice" type="button" aria-expanded={cropOpen} aria-controls={cropOpen?'crop-options':undefined} disabled={disabled} onClick={()=>setCropOpen(!cropOpen)}><CropIcon crop={draft.crop}/><span><strong>{CROP_LABELS[draft.crop]}</strong>{CROP_LABELS[draft.crop]!==draft.crop&&<small>{draft.crop}</small>}</span><span className="crop-change">Change<ChevronDown size={17} aria-hidden="true"/></span></button>
        {cropOpen&&<div id="crop-options" className="crop-picker" role="group" aria-label="Select crop">{CROP_TYPES.map(c=><button type="button" key={c} disabled={disabled} aria-pressed={draft.crop===c} className={draft.crop===c?'selected':''} onClick={()=>{change('crop',c);setCropOpen(false);}}><CropIcon crop={c}/><strong>{CROP_LABELS[c]}</strong>{CROP_LABELS[c]!==c&&<small>{c}</small>}</button>)}</div>}
      </section>
      <section className="check-step"><div className="step-heading"><span>3</span><div><h2>Record the observation</h2></div></div>
        <label><span>Visible symptoms <span className="required-mark" aria-hidden="true">*</span></span><textarea aria-label="Visible symptoms" required maxLength={2000} rows={2} placeholder="e.g. Brown spots on lower leaves; small insects underneath." disabled={disabled} value={draft.symptoms} onChange={e=>change('symptoms',e.target.value)}/></label>
        <div className="form-grid observation-fields"><label><span>Plant or area label <span className="required-mark" aria-hidden="true">*</span></span><input aria-label="Plant or area label" aria-describedby="area-help" required maxLength={120} placeholder="e.g. Rice Plot A" disabled={disabled} value={draft.area} onChange={e=>change('area',e.target.value)}/><span id="area-help" className="field-help">Name this location so you can check it again—for example, Rice Plot A or Kalamansi Tree 5.</span></label><label><span>Observation date <span className="required-mark" aria-hidden="true">*</span></span><input aria-label="Observation date" type="date" required max={today()} disabled={disabled} value={draft.date} onChange={e=>change('date',e.target.value)}/></label></div>
        <details className="extra-details"><summary>More details <span>Optional</span><ChevronDown size={17} aria-hidden="true"/></summary><div className="form-grid"><label>Plant / sample label<input aria-describedby="sample-help" disabled={disabled} maxLength={80} value={draft.sampleLabel} onChange={e=>change('sampleLabel',e.target.value)}/><span id="sample-help" className="field-help">For an area, name the photographed plant so later photos match.</span></label><label>Plant age<input disabled={disabled} maxLength={60} placeholder="e.g. 6 weeks" value={draft.plantAge} onChange={e=>change('plantAge',e.target.value)}/></label><label>Next follow-up<input disabled={disabled} type="date" min={draft.date} value={draft.nextFollowUp} onChange={e=>change('nextFollowUp',e.target.value)}/></label></div><label>Actions already taken<textarea disabled={disabled} rows={2} maxLength={2000} value={draft.actions} onChange={e=>change('actions',e.target.value)} placeholder="What have you done so far, if anything?"/></label></details>
      </section>
      {error&&<div className="notice error" role="alert"><Info size={20} aria-hidden="true"/><div><strong>{failed?'The check did not complete':'Check your observation'}</strong><p>{error}</p>{failed&&<p>Your photo and details are retained.</p>}</div></div>}
      <div className="checker-submit"><button type="submit" className="btn primary full" disabled={photoDisabled} aria-busy={busy}>{busy?<LoaderCircle className="spin" size={20}/>:<ScanLine size={20} aria-hidden="true"/>}{busy?'Checking your photo…':failed?'Retry check':demo?'Show demo result':'Check for diseases & pests'}{!busy&&<ArrowRight size={19} aria-hidden="true"/>}</button><p>{demo?'Demo result only. No Gemini request.':'Photo and symptoms are sent to Gemini. Results are preliminary.'}</p><div><button type="button" className="text-button" disabled={photoDisabled} onClick={()=>save(true)}>Save without screening</button><button type="button" className="text-button" disabled={photoDisabled} onClick={()=>onSaveDraft()}><Save size={17} aria-hidden="true"/>Save draft</button></div></div>
    </form>
    {result&&<div ref={resultRef} tabIndex={-1} className="result-panel" aria-live="polite">
      <section className="panel result-summary"><div className="section-heading"><span className="eyebrow">Preliminary screening</span><span className="tag">{result.demo?'Demo result':result.guidance?.kind||'Image screening'}</span></div><span className="result-step">1 · {result.guidance?'Possible condition':'Screening outcome'}</span><h2>{result.guidance?.name||STATE_LABELS[result.state]}</h2><h3 className="result-step">2 · Visible evidence</h3>{result.observations.length?<ul className="evidence-list">{result.observations.map((o,i)=><li key={i}>{o}</li>)}</ul>:<p>No specific visible evidence was identified.</p>}{result.guidance?.limitations&&<p className="result-limitation">{result.guidance.limitations}</p>}<p className="preliminary-note">A preliminary finding, not a confirmed diagnosis.</p>{needPhoto&&<div className="retake-action"><p>{result.state==='CROP_MISMATCH'?'Check the selected crop, then take a clear photo.':'Take a closer photo of the affected part or insect.'}</p><button type="button" className="btn secondary" disabled={photoDisabled} onClick={()=>cameraInput.current?.click()}><Camera size={18} aria-hidden="true"/>Take another photo</button><button type="button" className="text-button" disabled={photoDisabled} onClick={()=>photoInput.current?.click()}>Choose another photo</button></div>}</section>
      <GuidanceCard screening={result} title="3 · Referenced care steps"/>
      <section className="panel result-save"><h2>4 · Save and monitor</h2><p>Keep this result with the original photo, then add follow-ups to the same case.</p><button className="btn primary full" disabled={photoDisabled} onClick={()=>save()}>{saving?<LoaderCircle className="spin" size={19}/>:<Check size={19} aria-hidden="true"/>}Save case &amp; start monitoring</button></section>
    </div>}
  </div><aside className="checker-aside"><section className="panel photo-help"><h2>Photo checklist</h2><ul className="photo-tips"><li><Check size={17} aria-hidden="true"/><span>Keep the affected part in focus.</span></li><li><Check size={17} aria-hidden="true"/><span>For pests, include the insect and its damage.</span></li><li><Check size={17} aria-hidden="true"/><span>Use the same plant for follow-up photos.</span></li></ul><div className="coverage-summary"><strong>{CROP_LABELS[draft.crop]} coverage</strong><span>{entries.filter(g=>g.kind!=='Pest').length} disease references · {entries.filter(g=>g.kind==='Pest').length} pest {entries.filter(g=>g.kind==='Pest').length===1?'reference':'references'}</span></div></section>
    <div className="save-status" role="status"><Save size={18} aria-hidden="true"/><span>{draftStatus==='saving'?'Saving draft…':draftStatus==='saved'?'Draft saved to your account':draftStatus==='error'?'Draft not saved. Try again.':draftStatus==='completed'?'Already saved. Open My cases.':'Drafts save as you work.'}</span></div>
    {demoAvailable&&<details className="demo-disclosure" open={demoOpen} onToggle={e=>setDemoOpen(e.currentTarget.open)}><summary><FlaskConical size={17} aria-hidden="true"/>Try a sample<ChevronDown size={16} aria-hidden="true"/></summary><p>Practice with a labeled demo result.</p><button className="btn secondary full" type="button" disabled={photoDisabled} onClick={loadDemo}>Load rice example</button>{demo&&<><label>Demo outcome<select disabled={photoDisabled} aria-label="Demo outcome" value={draft.scenario||'supported'} onChange={e=>change('scenario',e.target.value as DemoScenario)}><option value="supported">Possible condition</option><option value="unclear">Unclear image</option><option value="service-error">Temporary service error</option></select></label><label>Demo category<select disabled={photoDisabled} aria-label="Demo category" value={draft.demoKind||'Disease'} onChange={e=>change('demoKind',e.target.value as 'Disease'|'Pest')}><option>Disease</option><option>Pest</option></select></label><button type="button" disabled={photoDisabled} className="text-button" onClick={()=>{clearResult();setDraft({...newDraft(),area:draft.area,symptoms:draft.symptoms});}}>Return to live photo screening</button></>}</details>}
    <button type="button" className="text-button discard-draft" disabled={photoDisabled} onClick={()=>{if(window.confirm('Discard this draft? Saved cases will remain.')){clearResult();onDiscard();}}}>Discard draft</button>
  </aside></div>;
}
