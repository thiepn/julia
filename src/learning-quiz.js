// L3 original learning checks. Reference snippets are executed only by CI, never by the browser.
const bank = {
  "01": [
    {
      "id": "01-predict",
      "kind": "predict",
      "prompt": "What does this Julia script print?",
      "code": "x = 3\nx = x * 2 + 1\nprintln(x)",
      "choices": [
        "6",
        "7",
        "9",
        "13"
      ],
      "correct": 1,
      "feedback": [
        "6 omits the addition of 1 after multiplication.",
        "The updated x is 3 × 2 + 1 = 7.",
        "9 adds before multiplying; multiplication occurs first.",
        "13 does not follow the two assignments; start from x = 3."
      ],
      "hint": "Track the assigned value before evaluating the next line.",
      "verifySource": "x = 3\nx = x * 2 + 1\nprintln(x)",
      "expectedOutput": "7"
    },
    {
      "id": "01-order",
      "kind": "order",
      "prompt": "Which ordering prints 9 without reading an unassigned name?",
      "code": "Unordered lines:\nprintln(total)\ntotal = n + 4\nn = 5",
      "choices": [
        "n = 5 → total = n + 4 → println(total)",
        "total = n + 4 → n = 5 → println(total)",
        "n = 5 → println(total) → total = n + 4",
        "println(total) → n = 5 → total = n + 4"
      ],
      "correct": 0,
      "feedback": [
        "Both n and total are assigned before they are read.",
        "The first statement reads n before assignment.",
        "total is printed before its assignment.",
        "The first statement tries to print total before it exists."
      ],
      "hint": "Check which variables each line must already know.",
      "verifySource": "n = 5\ntotal = n + 4\nprintln(total)",
      "expectedOutput": "9"
    },
    {
      "id": "01-debug",
      "kind": "debug",
      "prompt": "The goal is to double a and print 8. Which correction fixes this code?",
      "code": "a = 4\nprintln(a ^ 2)",
      "choices": [
        "Change a ^ 2 to a * 2",
        "Change a ^ 2 to a + 2",
        "Change a ^ 2 to a / 2",
        "Change a ^ 2 to a - 2"
      ],
      "correct": 0,
      "feedback": [
        "Multiplying 4 by 2 gives 8; ^ means exponentiation.",
        "Adding 2 to 4 would print 6.",
        "Dividing 4 by 2 would print 2.0.",
        "Subtracting 2 from 4 would print 2."
      ],
      "hint": "The current operator raises a number to a power; doubling uses a different operation.",
      "verifySource": "a = 4\nprintln(a * 2)",
      "expectedOutput": "8"
    },
    {
      "id": "01-complete",
      "kind": "complete",
      "prompt": "Which expression fills □ so this script prints the area 12?",
      "code": "width = 4\nheight = 3\nprintln(□)",
      "choices": [
        "width + height",
        "width ^ height",
        "width * height",
        "width / height"
      ],
      "correct": 2,
      "feedback": [
        "4 + 3 is 7, which is not the rectangle's area.",
        "4 cubed is 64, which is not 12.",
        "The product 4 × 3 equals 12, the rectangle's required area.",
        "Dividing 4 by 3 is approximately 1.33, not the rectangle's area of 12."
      ],
      "hint": "Area is obtained from both side lengths, not by adding them.",
      "verifySource": "width = 4\nheight = 3\nprintln(width * height)",
      "expectedOutput": "12"
    },
    {
      "id": "01-numeric",
      "kind": "numeric",
      "prompt": "Enter the exact integer printed by this script.",
      "code": "x = 6\nx = x - 2\nprintln(x ^ 2)",
      "answer": 16,
      "hint": "Follow the reassignment of x before exponentiation.",
      "correctFeedback": "After x becomes 4, squaring it prints 16.",
      "wrongFeedback": "Reassign x from 6 to 4 first; then square the updated value.",
      "verifySource": "x = 6\nx = x - 2\nprintln(x ^ 2)",
      "expectedOutput": "16"
    }
  ],
  "02": [
    {
      "id": "02-predict",
      "kind": "predict",
      "prompt": "What value is printed by this index expression?",
      "code": "v = [2, 4, 6]\nprintln(v[1] + v[end])",
      "choices": [
        "6",
        "8",
        "10",
        "12"
      ],
      "correct": 1,
      "feedback": [
        "6 is the last entry alone, not the sum.",
        "The first entry 2 plus the last entry 6 is 8.",
        "10 adds the second and last entries instead.",
        "12 is twice the last value, not the requested two entries."
      ],
      "hint": "Standard Julia vectors start at index 1; end selects the last position.",
      "verifySource": "v = [2, 4, 6]\nprintln(v[1] + v[end])",
      "expectedOutput": "8"
    },
    {
      "id": "02-order",
      "kind": "order",
      "prompt": "Which ordering changes the second entry to 11 and then prints it?",
      "code": "Unordered lines:\nprintln(v[2])\nv[2] = 11\nv = [3, 5, 7]",
      "choices": [
        "v[2] = 11 → v = [3, 5, 7] → println(v[2])",
        "v = [3, 5, 7] → println(v[2]) → v[2] = 11",
        "v = [3, 5, 7] → v[2] = 11 → println(v[2])",
        "println(v[2]) → v[2] = 11 → v = [3, 5, 7]"
      ],
      "correct": 2,
      "feedback": [
        "v does not exist before its initial assignment.",
        "The second entry is printed as 5 before the mutation.",
        "The vector is created, modified and printed in that order.",
        "The first print attempts to access an unassigned vector."
      ],
      "hint": "Make the vector exist before indexing, and mutate it before printing.",
      "verifySource": "v = [3, 5, 7]\nv[2] = 11\nprintln(v[2])",
      "expectedOutput": "11"
    },
    {
      "id": "02-debug",
      "kind": "debug",
      "prompt": "The goal is to print the first vector entry, 10. Which edit fixes this Julia indexing error?",
      "code": "v = [10, 20, 30]\nprintln(v[0])",
      "choices": [
        "Replace v[0] with v[end]",
        "Replace v[0] with v[1]",
        "Replace v[0] with v[2]",
        "Replace v[0] with length(v)"
      ],
      "correct": 1,
      "feedback": [
        "v[end] selects the last entry, 30.",
        "Julia's first ordinary vector index is 1, so v[1] is 10.",
        "v[2] selects the second entry, 20.",
        "length(v) prints 3, the number of entries."
      ],
      "hint": "Think about Julia's first valid index for a standard vector.",
      "verifySource": "v = [10, 20, 30]\nprintln(v[1])",
      "expectedOutput": "10"
    },
    {
      "id": "02-complete",
      "kind": "complete",
      "prompt": "Which expression prints the sum of the first and last entries, 12?",
      "code": "v = [4, 6, 8]\nprintln(□)",
      "choices": [
        "v[2] + v[3]",
        "v[1] + v[2]",
        "length(v) + v[end]",
        "v[1] + v[end]"
      ],
      "correct": 3,
      "feedback": [
        "6 + 8 is 14, not the requested pair.",
        "4 + 6 is 10, omitting the last entry.",
        "The vector length 3 plus 8 is 11.",
        "The first 4 and last 8 add to 12."
      ],
      "hint": "Identify the first and final positions rather than counting the entries.",
      "verifySource": "v = [4, 6, 8]\nprintln(v[1] + v[end])",
      "expectedOutput": "12"
    },
    {
      "id": "02-numeric",
      "kind": "numeric",
      "prompt": "Enter the exact integer printed after the vector is extended.",
      "code": "v = [5, 7, 9]\npush!(v, 11)\nprintln(length(v) + v[2])",
      "answer": 11,
      "hint": "First determine how many entries remain after push!, then inspect the second entry.",
      "correctFeedback": "The vector has four entries after push!, and its second entry is 7, giving 4 + 7 = 11.",
      "wrongFeedback": "push! increases the vector length to four without moving the existing second entry.",
      "verifySource": "v = [5, 7, 9]\npush!(v, 11)\nprintln(length(v) + v[2])",
      "expectedOutput": "11"
    }
  ],
  "03": [
    {
      "id": "03-predict",
      "kind": "predict",
      "prompt": "What number does this combination of broadcasting and sum print?",
      "code": "v = [1, 2, 3]\nprintln(sum(v .^ 2))",
      "choices": [
        "6",
        "12",
        "14",
        "36"
      ],
      "correct": 2,
      "feedback": [
        "6 is the sum of the original vector, not its squares.",
        "12 does not equal 1² + 2² + 3².",
        "Broadcasted squaring yields [1, 4, 9], which sums to 14.",
        "36 is the square of the sum, a different operation."
      ],
      "hint": "Follow the dotted operation before performing the reduction.",
      "verifySource": "v = [1, 2, 3]\nprintln(sum(v .^ 2))",
      "expectedOutput": "14"
    },
    {
      "id": "03-order",
      "kind": "order",
      "prompt": "Which order prints the doubled vector [2, 6]?",
      "code": "Unordered lines:\nprintln(y)\ny = x .* 2\nx = [1, 3]",
      "choices": [
        "x = [1, 3] → println(y) → y = x .* 2",
        "y = x .* 2 → x = [1, 3] → println(y)",
        "x = [1, 3] → y = x .* 2 → println(y)",
        "println(y) → x = [1, 3] → y = x .* 2"
      ],
      "correct": 2,
      "feedback": [
        "y is printed before it has been computed.",
        "x is used before its vector assignment.",
        "Initialize x, broadcast multiplication into y and print y.",
        "y is printed before it has been assigned."
      ],
      "hint": "Input arrays must be defined before broadcasting them.",
      "verifySource": "x = [1, 3]\ny = x .* 2\nprintln(y)",
      "expectedOutput": "[2, 6]"
    },
    {
      "id": "03-debug",
      "kind": "debug",
      "prompt": "This code intends to square each vector element and print [4, 9]. Which change fixes the operation?",
      "code": "x = [2, 3]\nprintln(x ^ 2)",
      "choices": [
        "Change x ^ 2 to sum(x .^ 2)",
        "Change x ^ 2 to x .* 2",
        "Change x ^ 2 to x .^ 2",
        "Change x ^ 2 to x .+ 2"
      ],
      "correct": 2,
      "feedback": [
        "The sum produces the scalar 13 rather than a vector.",
        "Broadcasted multiplication gives [4, 6], not [4, 9].",
        "The dotted exponent squares each vector element independently.",
        "Broadcasted addition gives [4, 5], not [4, 9]."
      ],
      "hint": "Check whether the operator must act independently on every vector entry.",
      "verifySource": "x = [2, 3]\nprintln(x .^ 2)",
      "expectedOutput": "[4, 9]"
    },
    {
      "id": "03-complete",
      "kind": "complete",
      "prompt": "Which expression makes the script print [1, 0, 4]?",
      "code": "x = [-1, 0, 2]\nprintln(□)",
      "choices": [
        "x .+ 2",
        "x .* 2",
        "sum(x .^ 2)",
        "x .^ 2"
      ],
      "correct": 3,
      "feedback": [
        "Adding 2 gives [1, 2, 4], not the desired middle value.",
        "Multiplying by 2 gives [-2, 0, 4], not the squared values.",
        "Summing squared elements yields the scalar 5.",
        "Broadcasting the exponent gives [1, 0, 4]."
      ],
      "hint": "Determine which elementwise operation sends negative one to positive one and keeps zero at zero.",
      "verifySource": "x = [-1, 0, 2]\nprintln(x .^ 2)",
      "expectedOutput": "[1, 0, 4]"
    },
    {
      "id": "03-numeric",
      "kind": "numeric",
      "prompt": "Enter the exact integer printed by the sum of squared range values.",
      "code": "x = collect(2:2:8)\nprintln(sum(x .^ 2))",
      "answer": 120,
      "hint": "Expand the step-size range, apply the dotted exponent, then add the results.",
      "correctFeedback": "The range produces 2, 4, 6 and 8; their squares add to 4 + 16 + 36 + 64 = 120.",
      "wrongFeedback": "The 2:2:8 range contains four entries. Square them individually before summing.",
      "verifySource": "x = collect(2:2:8)\nprintln(sum(x .^ 2))",
      "expectedOutput": "120"
    }
  ]
};
export const LEARNING_QUIZ_STORAGE_KEY="amp-julia-learn:quiz-v1";
export const LEARNING_QUIZZES=Object.freeze(Object.fromEntries(Object.entries(bank).map(([id,items])=>[
  id,Object.freeze(items.map(item=>Object.freeze({...item,
    ...(item.choices?{choices:Object.freeze([...item.choices]),feedback:Object.freeze([...item.feedback])}:{})})))
])));
export const QUIZ_KINDS=Object.freeze(["predict","order","debug","complete","numeric"]);
export function quizForLesson(id){return Object.hasOwn(LEARNING_QUIZZES,id)?LEARNING_QUIZZES[id]:null;}
export function gradeQuizAnswer(question,value){
  if(!question)return {valid:false,correct:false,feedback:"No question selected."};
  if(question.kind==="numeric"){
    const normalized=String(value??"").trim();
    if(!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(normalized)||!Number.isFinite(Number(normalized)))
      return {valid:false,correct:false,feedback:"Enter a finite decimal number."};
    const correct=Number(normalized)===question.answer;
    return {valid:true,correct,feedback:correct?question.correctFeedback:question.wrongFeedback};
  }
  const option=Number(value);
  if(!Number.isInteger(option)||String(option)!==String(value)||option<0||option>=question.choices.length)
    return {valid:false,correct:false,feedback:"Choose one of the listed answers."};
  return {valid:true,correct:option===question.correct,feedback:question.feedback[option]};
}
export function readQuizAnswers(storage=globalThis.localStorage){
  try{
    const value=JSON.parse(storage.getItem(LEARNING_QUIZ_STORAGE_KEY)||"{}");
    if(!value||Array.isArray(value)||typeof value!=="object")return {};
    const clean={};
    for(const [key,answer] of Object.entries(value)){
      const id=key.slice(0,2),q=quizForLesson(id)?.find(item=>item.id===key);
      if(q&&typeof answer==="string"&&answer.length<=40&&gradeQuizAnswer(q,answer).valid)clean[key]=answer;
    }
    return clean;
  }catch{return {};}
}
export function writeQuizAnswer(question,value,storage=globalThis.localStorage){
  const result=gradeQuizAnswer(question,value);
  if(!result.valid)return {saved:false,...result};
  try{const data=readQuizAnswers(storage);data[question.id]=String(value).trim();
    storage.setItem(LEARNING_QUIZ_STORAGE_KEY,JSON.stringify(data));return {saved:true,...result};
  }catch{return {saved:false,...result};}
}
