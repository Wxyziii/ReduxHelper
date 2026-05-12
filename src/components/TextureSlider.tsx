import { useState } from "react";
import { textureImageSrc } from "../lib/textureApi";
import type { TextureAsset } from "../types/textures";

export default function TextureSlider({ texture }: { texture: TextureAsset }) {
  const [value, setValue] = useState(54);
  const original = textureImageSrc(texture.previewPngPath);
  const edited = textureImageSrc(texture.editedPngPath);
  const metadata = texture.metadata;
  return (
    <div className="textureCompare">
      <div className="textureCanvas">
        {edited ? <img className="textureImage edited" src={edited} alt="Edited texture preview" /> : <div className="textureEmpty">Import an edited PNG to compare</div>}
        {original ? (
          <div className="textureBefore" style={{ width: `${value}%` }}>
            <img className="textureImage" src={original} alt="Original DDS PNG preview" />
          </div>
        ) : (
          <div className="textureBefore mock" style={{ width: `${value}%` }} />
        )}
        <div className="textureHandle" style={{ left: `${value}%` }} />
        <span className="textureLabel left">Original</span>
        <span className="textureLabel right">Edited</span>
      </div>
      <input aria-label="Texture A/B comparison" type="range" min="5" max="95" value={value} onChange={(event) => setValue(Number(event.target.value))} />
      <div className="textureMeta">
        <span>{metadata?.width ?? "?"} x {metadata?.height ?? "?"}</span>
        <span>{metadata?.format ?? "format unknown"}</span>
        <span>alpha: {metadata?.hasAlpha ?? "unknown"}</span>
        <span>mipmaps: {metadata?.mipmapCount ?? "unknown"}</span>
      </div>
    </div>
  );
}
