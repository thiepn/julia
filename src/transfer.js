import {MAX_DRAFT_LENGTH} from "./workspace.js";

export const JULIA_SCRIPT_MIME = "text/plain;charset=utf-8";
export const MAX_IMPORT_BYTES = MAX_DRAFT_LENGTH * 4 + 3;

export function exportJuliaScript(lessonId, code) {
  if (typeof lessonId !== "string" || !/^(0[1-9]|1[0-6])$/.test(lessonId))
    throw new TypeError("Unknown lesson");
  if (typeof code !== "string" || code.length > MAX_DRAFT_LENGTH)
    throw new RangeError("Draft exceeds the local editor limit");
  return {filename: "amp-julia-lab-lesson-" + lessonId + ".jl", content:code, mime:JULIA_SCRIPT_MIME};
}
export function validateJuliaImport(filename, source) {
  // A program is treated as inert text, NEVER evaluated by Julia Lab.
  // The selected local filename is never included in a URL or used as an output path.
  if (typeof filename !== "string" || !/\.jl$/i.test(filename))
    return {ok:false, message:"Select a .jl Julia source file."};
  if (typeof source !== "string" || source.length > MAX_DRAFT_LENGTH)
    return {ok:false, message:"File is too large for this lesson editor (50,000 characters maximum)."};
  return {ok:true, code:source, message:"Julia source is ready to import. It has not been executed or graded."};
}
