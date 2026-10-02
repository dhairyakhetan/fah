import { PhotoIcon } from './Icons.jsx';

// A picture filling its slot (cropped to fit, top kept in view: covers put their titles there), or, with no src yet,
// the design's dashed placeholder showing `label`. box = the slot's size styles; dark = placeholder colours for dark
// cards; icon / font = placeholder icon and label sizes.
export default function ImageSlot({ src, alt, label = alt, box, dark, icon = 18, font = '11px' }) {
  if (src) return <img src={src} alt={alt} decoding="async" style={{ objectPosition: "50% 12%", ...box, display: "block", width: box.width || "100%", boxSizing: "border-box", objectFit: "cover" }} />;
  const ink = dark ? "#CFCFCF" : "#444";
  return (
    <div style={{ ...box, background: dark ? "#262626" : "#F2F1ED", border: `1.5px dashed ${dark ? "#5A5A5A" : "#B9B5AA"}`, boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "4px", fontSize: font, color: ink }}>
      <PhotoIcon size={icon} color={ink} />
      <span>{label}</span>
    </div>
  );
}
