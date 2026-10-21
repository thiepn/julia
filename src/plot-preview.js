const MAX_BYTES = 5 * 1024 * 1024;
const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
const LESSONS = new Set(["04", "05", "06", "09", "10", "16"]);

export function checkPlotFile(file) {
  if (!file || !/\.((png)|(svg))$/i.test(file.name || "")) return {ok:false,message:"Select a .png or .svg figure."};
  if (!Number.isFinite(file.size) || file.size <= 0 || file.size > MAX_BYTES)
    return {ok:false,message:"The figure must be between 1 byte and 5 MB."};
  const svg = /\.svg$/i.test(file.name);
  if (file.type && file.type !== (svg ? "image/svg+xml" : "image/png") && file.type !== "application/octet-stream")
    return {ok:false,message:"File type does not match its extension."};
  return {ok:true,format:svg?"svg":"png"};
}

export function hasPngSignature(bytes) {
  return PNG_SIGNATURE.every((n,i)=>bytes[i]===n);
}

const SAFE_TAGS = new Set([
  "svg","g","defs","path","rect","circle","ellipse","line","polygon","polyline",
  "text","tspan","title","desc","clippath","use","lineargradient","radialgradient","stop","style"
]);
export function validateSvgText(source) {
  if (typeof source !== "string" || !/<svg(?:\s|>)/i.test(source) ||
      /<!doctype|<!entity|<\?xml-stylesheet/i.test(source)) return false;
  return true;
}

export function safeSvgDocument(source, parser = new DOMParser(), serializer = new XMLSerializer()) {
  if (!validateSvgText(source)) throw Error("Invalid or unsafe SVG document.");
  const doc = parser.parseFromString(source,"image/svg+xml");
  const root = doc.documentElement;
  if (root.localName !== "svg" || root.namespaceURI !== "http://www.w3.org/2000/svg" ||
      doc.getElementsByTagName("parsererror").length) throw Error("Malformed SVG document.");
  for (const el of [root,...root.querySelectorAll("*")]) {
    if (!SAFE_TAGS.has(el.localName.toLowerCase())) throw Error("SVG has unsupported elements.");
    if (el.localName.toLowerCase()==="style" && /@import|url\s*\((?!\s*['"]?#)/i.test(el.textContent))
      throw Error("SVG stylesheet contains external references.");
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase(),value=attr.value.trim();
      if (name.startsWith("on") || ["src","srcset","formaction"].includes(name))
        throw Error("SVG has executable attributes.");
      if (name==="href" || name==="xlink:href") {
        if (!/^#[A-Za-z_][\w.-]*$/.test(value)) throw Error("SVG references must be local.");
      } else if (name!=="xmlns" && name!=="xmlns:xlink") {
        if (/javascript:|data:|https?:|@import|expression\s*\(/i.test(value)) throw Error("SVG has external references.");
        const withoutLocalUrls = value.replace(/url\(\s*['"]?#[A-Za-z_][\w.-]*['"]?\s*\)/gi,"");
        if (/url\s*\(/i.test(withoutLocalUrls)) throw Error("SVG has external resource URLs.");
      }
    }
  }
  return serializer.serializeToString(root);
}

export function initPlotPreview(doc = document, urls = URL) {
  const section=doc.querySelector("#local-plot-preview");
  const input=doc.querySelector("#plot-file"), img=doc.querySelector("#plot-image");
  const status=doc.querySelector("#plot-status"), clear=doc.querySelector("#plot-clear");
  let objectUrl=null, request=0, currentLesson=null;
  function clearPreview() {
    request++;
    img.removeAttribute("src");
    img.hidden=true;
    clear.hidden=true;
    input.value="";
    if (objectUrl) urls.revokeObjectURL(objectUrl);
    objectUrl=null;
    status.textContent="No local figure selected.";
  }
  function showForLesson(id) {
    if (currentLesson!==id) clearPreview();
    currentLesson=id;
    section.hidden=!LESSONS.has(id);
  }
  clear.addEventListener("click",clearPreview);
  img.addEventListener("error",()=>{
    if(!objectUrl)return;
    clearPreview();
    status.textContent="The image could not be displayed.";
  });
  input.addEventListener("change",async()=>{
    const file=input.files?.[0], token=++request, lesson=currentLesson;
    const check=checkPlotFile(file);
    if(!check.ok) {clearPreview();status.textContent=check.message;return;}
    let payload;
    try {
      if(check.format==="png") {
        const prefix=new Uint8Array(await file.slice(0,8).arrayBuffer());
        if(!hasPngSignature(prefix)) throw Error("The file is not a valid PNG.");
        payload=file;
      } else {
        payload=new Blob([safeSvgDocument(await file.text())],{type:"image/svg+xml"});
      }
    }catch(error) {
      if(token===request && lesson===currentLesson) {clearPreview();status.textContent=error.message||"Cannot read this figure.";}
      return;
    }
    if(token!==request || lesson!==currentLesson) return;
    const nextUrl=urls.createObjectURL(payload);
    if(objectUrl)urls.revokeObjectURL(objectUrl);
    objectUrl=nextUrl;
    img.src=nextUrl;
    img.alt="Local Julia figure: "+file.name;
    img.hidden=false;
    clear.hidden=false;
    status.textContent=file.name+" · local preview only; Julia code was not executed or graded.";
  });
  return {showForLesson,clearPreview};
}
