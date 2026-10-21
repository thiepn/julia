import {externalTestSuite} from "./external-tests.js";
export const MAX_REPORT_LENGTH=12000;
// Read-only interpretation of user-pasted text. It is NOT authenticated Julia
// output, and it never triggers evaluation, storage or a mastery transition.
export function inspectJuliaReport(raw,lesson,variant){
  const suite=externalTestSuite(lesson,variant);
  if(!suite)return {kind:"unsupported",title:"No test report for this task",advice:"Select a supported function-based task.",cases:[]};
  if(typeof raw!=="string"||raw.trim().length===0)
    return {kind:"empty",title:"No Julia report pasted",advice:"Run the generated test file in Julia, then paste its terminal output here.",cases:[]};
  if(raw.length>MAX_REPORT_LENGTH)
    return {kind:"too-large",title:"Report too long",advice:"Paste at most 12,000 characters from the relevant test output. Do not paste secrets.",cases:[]};
  const clean=raw.replace(/\x1b\[[0-9;]*m/g,"").replace(/\r/g,"");
  const mentions= suite.cases.filter(c=>clean.includes(c.name)).map(c=>c.name);
  const hasFailure=/\bTest Failed\b|\bError During Test\b|\bSome tests did not pass\b|\bFail(?:ed|ures)?\s*[:|]\s*[1-9]\d*/i.test(clean);
  const syntax=/\bParseError\b|\bsyntax:\b|\bLoadError\b.*\bsyntax\b/i.test(clean);
  const undefinedSymbol=/\bUndefVarError\b|\bnot defined in .*scope\b/i.test(clean);
  const methodError=/\bMethodError\b/i.test(clean);
  const runtimeError=/\bError During Test\b|\bERROR:\b/i.test(clean);
  const summary=/\bTest Summary:\s*\|/i.test(clean);
  if(syntax)return {kind:"syntax",title:"Pasted Julia output indicates a syntax error",
    advice:"Locate the reported line and verify matching end blocks, brackets, commas and Julia syntax before interpreting any assertions.",cases:mentions};
  if(undefinedSymbol)return {kind:"undefined",title:"Pasted Julia output references an undefined name",
    advice:"Compare the function name in your draft with "+suite.title+" and check that the definition appears before the testset.",cases:mentions};
  if(methodError)return {kind:"method",title:"Pasted Julia output reports a MethodError",
    advice:"Check the called function's argument count and accepted types, especially vectors versus scalars and integer versus floating-point inputs.",cases:mentions};
  if(hasFailure||runtimeError)return {kind:"failed",title:"Pasted Julia output reports failed assertions or runtime errors",
    advice:"Find the first Test Failed or Error During Test block. Compare the Evaluated and expected values, then reproduce the named boundary case in Julia.",cases:mentions};
  if(summary)return {kind:"summary",title:"Pasted text contains a Julia Test summary",
    advice:"No recognizable failure marker was found in this excerpt. This does not verify the output's origin, test execution, draft version or correctness.",cases:mentions};
  return {kind:"unrecognized",title:"No recognizable Julia Test marker",
    advice:"Copy the complete Test Summary or first error block from the Julia terminal. This input is not treated as an execution result.",cases:mentions};
}
