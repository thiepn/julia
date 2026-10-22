// Interprets a result received from the authenticated local Julia companion.
// This is a statement about one Julia process run, never a course grade.
export function localTestVerdict(result){
  if(!result || typeof result!=="object")return {kind:"invalid",message:"No Julia execution result was received."};
  if(result.timedOut===true)return {kind:"timeout",message:"Local Julia exceeded the 120-second execution limit. No test result was established."};
  if(result.ok!==true)return {kind:"failed",message:"Local Julia tests did not complete successfully (exit code "+String(result.exitCode??"unknown")+"). Inspect the reported failure."};
  const combined=[result.stdout,result.stderr].filter(x=>typeof x==="string").join("\n");
  if(!/Test Summary:\s*\|/.test(combined))
    return {kind:"unconfirmed",message:"Julia exited successfully, but no Test Summary was detected. Inspect the terminal output."};
  return {kind:"passed",message:"Julia Test assertions passed for this exact draft and selected suite. This is not a course grade or proof of general correctness."};
}

// A reviewed built-in numerical experiment is a reference demonstration, not
// the learner's draft or a course grade. It may contain @test without a
// Test Summary, so successful execution is established by the Julia exit code.
export function localExperimentVerdict(result){
  if(!result||typeof result!=="object")return {kind:"invalid",message:"No Julia experiment result was received."};
  if(result.timedOut===true)return {kind:"timeout",message:"Julia experiment timed out after 120 seconds."};
  if(result.ok!==true)return {kind:"failed",message:"Julia experiment failed (exit code "+String(result.exitCode??"unknown")+"). Inspect the terminal output."};
  return {kind:"completed",message:"Original experiment executed with local Julia. Numerical output is shown below; no learner code was tested or graded."};
}

export function localRepairVerdict(result){
  if(!result||typeof result!=="object")
    return {kind:"invalid",message:"No Julia repair result was received."};
  if(result.timedOut===true)
    return {kind:"timeout",message:"Repair execution timed out after 120 seconds."};
  if(result.ok!==true)
    return {kind:"failed",message:"Julia repair draft failed (exit code "+String(result.exitCode??"unknown")+"). Inspect the error output."};
  return {kind:"completed",message:"Repair draft executed with local Julia. Compare the output to the expected behavior; correctness is not automatically graded."};
}
