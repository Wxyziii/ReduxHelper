import { useState } from "react";

const projectTypes = ["Timecycle/visuals", "Tracers and hit effects", "Texture editing", "Optimization", "Full Redux project"];

export default function NewProjectWizard({ onCreate, onCancel }: { onCreate: (name: string, type: string) => void; onCancel: () => void }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("Redux AI Project");
  const [type, setType] = useState(projectTypes[4]);
  return (
    <div className="modalBackdrop" role="dialog" aria-modal="true" aria-labelledby="project-wizard-title">
      <section className="modalCard">
        <div className="uppercaseLabel">New Project Wizard</div>
        <h2 id="project-wizard-title">{["Project name", "Project location", "Project type", "Tool checks", "Create project"][step]}</h2>
        {step === 0 && <label><span>Project name</span><input value={name} onChange={(event) => setName(event.target.value)} /></label>}
        {step === 1 && <div className="infoStrip">Project folder is created under your documents ReduxAIProjects folder. You can move exports later; originals remain untouched.</div>}
        {step === 2 && <select value={type} onChange={(event) => setType(event.target.value)}>{projectTypes.map((item) => <option key={item}>{item}</option>)}</select>}
        {step === 3 && <div className="smallList"><span>OpenRouter: optional</span><span>texconv: optional until DDS conversion</span><span>ComfyUI: optional until image AI</span></div>}
        {step === 4 && <div className="infoStrip">After creation, import files or open Tool Setup from Settings.</div>}
        <div className="buttonRow">
          <button className="smallBtn" onClick={onCancel}>Cancel</button>
          <button className="smallBtn" disabled={step === 0} onClick={() => setStep((value) => value - 1)}>Back</button>
          {step < 4 ? <button className="smallBtn filled" onClick={() => setStep((value) => value + 1)}>Next</button> : <button className="smallBtn filled" onClick={() => onCreate(name, type)}>Create project</button>}
        </div>
      </section>
    </div>
  );
}
