// Mixed, ungraded revision from the EXISTING canonical AMP exercises.
import {PROOF_SCAFFOLDS} from "./completion-proofs.js";
import {completionTrack} from "./completion-tracks.js";

export const SEMESTER_AREAS = Object.freeze([
  Object.freeze({
    id:"arithmetic",name:"Maschinenzahlen und Fehleranalyse",
    proofs:Object.freeze(["G2-error-bound","UE02-derivative","UE02-roots","UE02-landau"]),
    coding:Object.freeze(["squared_bound","vector_amplification"])
  }),
  Object.freeze({
    id:"solvers",name:"Lineare Gleichungssysteme · LR und QR",
    proofs:Object.freeze(["B-pivot","B-qr"]),
    coding:Object.freeze(["pivoted_lr"])
  }),
  Object.freeze({
    id:"least-squares",name:"Lineare Ausgleichsprobleme",
    proofs:Object.freeze(["B-normal"]),
    coding:Object.freeze(["qr_fit","rank_aware_fit"])
  })
]);

// A seed changes the selection without storing grades or new course progress.
export function createSemesterRehearsal(seed=0){
  if(!Number.isSafeInteger(seed)||seed<0)throw new RangeError("Invalid practice-set seed.");
  let state=(seed>>>0)||1;
  const pick=options=>{
    state=(Math.imul(state,1664525)+1013904223)>>>0;
    return options[state%options.length];
  };
  const tasks=[];
  for(const area of SEMESTER_AREAS){
    const proofId=pick(area.proofs);
    const proof=PROOF_SCAFFOLDS.find(item=>item.id===proofId);
    if(!proof)throw Error("Missing original proof exercise: "+proofId);
    tasks.push(Object.freeze({
      id:proof.id,kind:"proof",area:area.id,topic:area.name,lesson:proof.lesson,
      title:proof.title,source:proof.sourcePart,prompt:proof.target,
      context:proof.assumptions,steps:Object.freeze([...proof.steps]),
      followup:proof.transfer,warning:proof.notice||""
    }));
    const codeId=pick(area.coding);
    const track=completionTrack(codeId);
    if(!track)throw Error("Missing canonical Julia exercise: "+codeId);
    tasks.push(Object.freeze({
      id:track.id,kind:"coding",area:area.id,topic:area.name,lesson:track.lesson,
      title:track.title,source:track.source,prompt:track.question,
      context:track.concept,steps:Object.freeze([...track.steps]),
      checks:Object.freeze(track.checks.map(x=>x.name)),
      followup:"Write code in the existing lesson editor and run its Julia Test cases when available.",
      warning:""
    }));
  }
  return Object.freeze(tasks);
}
