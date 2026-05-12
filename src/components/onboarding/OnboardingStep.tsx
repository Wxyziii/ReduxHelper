export default function OnboardingStep({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="onboardingStep">
      <div className="uppercaseLabel">Redux AI Assistant</div>
      <h2>{title}</h2>
      <div>{children}</div>
    </div>
  );
}
