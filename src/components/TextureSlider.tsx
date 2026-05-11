import { useState } from "react";
import type { TextureAsset } from "../types/project";

export default function TextureSlider({ texture }: { texture: TextureAsset }) {
  const [value, setValue] = useState(54);
  return (
    <div className="textureCompare">
      <div className="textureCanvas">
        <div className="textureBefore" style={{ width: `${value}%` }} />
        <div className="textureHandle" style={{ left: `${value}%` }} />
        <span className="textureLabel left">Original DDS preview</span>
        <span className="textureLabel right">Edited PNG mock</span>
      </div>
      <input aria-label="Texture A/B comparison" type="range" min="5" max="95" value={value} onChange={(event) => setValue(Number(event.target.value))} />
      <div className="textureMeta">
        <span>{texture.width} x {texture.height}</span>
        <span>{texture.format}</span>
        <span>alpha: {texture.hasAlpha}</span>
        <span>mipmaps: {texture.mipmaps}</span>
      </div>
    </div>
  );
}
