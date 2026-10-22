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
