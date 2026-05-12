import { useState } from "react";
import OnboardingStep from "./OnboardingStep";

const steps = [
  { title: "Welcome", body: "Redux AI Assistant helps inspect, patch, texture-edit, and export GTA V Redux project files without touching originals." },
  { title: "Safety model", body: "The app works on project-local workspace copies. Original files and .rpf archives are read-only. AI suggestions require review." },
  { title: "Project workflow", body: "Create or open a project, import files, scan, select snippets, ask AI, validate patches, apply to workspace, then export a manual package." },
  { title: "Optional tools", body: "OpenRouter enables text AI. texconv enables DDS conversion. ComfyUI enables local PNG texture editing. All are optional until used." },
  { title: "Create or open", body: "Start with a project, then import exported GTA files or read-only archive extractions." }
];

export default function OnboardingModal({ onFinish, onCreate, onOpen }: { onFinish: () => void; onCreate: () => void; onOpen: () => void }) {
  const [index, setIndex] = useState(0);
  const step = steps[index];
  return (
    <div className="modalBackdrop" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <section className="modalCard onboardingCard">
        <OnboardingStep title={step.title}>
          <p id="onboarding-title">{step.body}</p>
          <ul>
            <li>No automatic game install.</li>
            <li>No direct archive editing.</li>
            <li>Exports are manual packages with warnings and install notes.</li>
          </ul>
        </OnboardingStep>
        <div className="buttonRow">
          <button className="smallBtn" onClick={onFinish}>Skip onboarding</button>
          <button className="smallBtn" disabled={index === 0} onClick={() => setIndex((value) => value - 1)}>Back</button>
          {index < steps.length - 1 ? <button className="smallBtn filled" onClick={() => setIndex((value) => value + 1)}>Next</button> : (
            <>
              <button className="smallBtn" onClick={onOpen}>Open project</button>
              <button className="smallBtn filled" onClick={onCreate}>Create project</button>
              <button className="smallBtn" onClick={onFinish}>Finish</button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
