// L4: original Julia fundamentals. Source and stdout verified by real Julia in CI.
const chapters=[
  {
    "id": "variables",
    "title": "Variables and assignment",
    "explain": "Assignment binds a name to a value. Julia evaluates the right-hand expression before storing its result in the name on the left. Later statements see the most recently assigned value. Updating a variable is a sequence of computations rather than an algebraic equation that holds simultaneously. Use descriptive variable names such as `radius` or `total` to make mathematical algorithms easier to trace.\n\nA script does not print the value of every assignment. Use `println` to make output explicit. Interactive REPL expression display is different from running a script. To predict output, follow the statements in order and record the current value of each variable. This habit also helps when an algorithm uses accumulators or temporary variables.",
    "concepts": [
      "`=` assigns values; `==` compares them.",
      "The right side of an assignment is evaluated first.",
      "`println` makes script output explicit."
    ],
    "examples": [
      {
        "title": "Update after printing",
        "code": "total = 6\nprintln(total)\ntotal = total + 4\nprintln(total)",
        "output": "6\n10",
        "steps": [
          "Assign 6 to total.",
          "Print 6 before updating the variable.",
          "Add 4 to 6 and print 10."
        ],
        "why": "The old and new values are printed at different points in the program. The second assignment uses the value stored after the first assignment.",
        "trap": "An assignment in a script does not automatically print its value."
      },
      {
        "title": "Use a named intermediate",
        "code": "radius = 3\ndiameter = 2 * radius\nprintln(diameter)",
        "output": "6",
        "steps": [
          "Store 3 as the radius.",
          "Multiply the current radius by two.",
          "Print the result stored in diameter."
        ],
        "why": "Intermediate names allow algorithms to express a formula clearly without rewriting the same expression several times.",
        "trap": "Do not assume changing diameter also updates radius; these are separate assigned names."
      }
    ],
    "checks": [
      {
        "prompt": "What is printed after the update?",
        "code": "x = 4\nx = x + 3\nprintln(x)",
        "options": [
          "3",
          "4",
          "7",
          "11"
        ],
        "answer": 2,
        "feedback": [
          "3 is the increment, not the result.",
          "4 was the initial value before the update.",
          "The new x is 4 + 3 = 7.",
          "11 does not follow from the specified assignments."
        ],
        "hint": "Use the old value on the right of the second assignment.",
        "output": "7"
      },
      {
        "prompt": "What is the value of the named result?",
        "code": "a = 2\nb = a * 5\nprintln(b)",
        "options": [
          "2",
          "5",
          "7",
          "10"
        ],
        "answer": 3,
        "feedback": [
          "2 is the input a.",
          "5 is the multiplier, not b.",
          "7 results from adding, not multiplying.",
          "2 multiplied by 5 gives 10."
        ],
        "hint": "Check the operation in the second assignment.",
        "output": "10"
      }
    ],
    "related": [
      "01"
    ]
  },
  {
    "id": "types",
    "title": "Types and numeric operations",
    "explain": "Julia values have types. An integer, floating-point number, Boolean, and string represent different kinds of data even when printed values look similar. `typeof` reveals the actual type of a value. For example, a floating-point decimal generally has type `Float64`, while `true` has type `Bool`. An ordinary unannotated variable can later be assigned a value of a different type.\n\nThe operator `/` performs division and can return a floating-point result even when both operands are integers. `div` instead finds an integer quotient. Floating-point numbers store approximations to many mathematical real numbers; that becomes important in numerical mathematics. Choosing the correct operation and inspecting types help avoid silent mathematical mistakes.",
    "concepts": [
      "`typeof` inspects the type of a value.",
      "`/` and `div` implement different quotient operations.",
      "Floating-point representations can be approximate."
    ],
    "examples": [
      {
        "title": "Inspect two types",
        "code": "println(typeof(4.5))\nprintln(typeof(true))",
        "output": "Float64\nBool",
        "steps": [
          "A decimal literal is represented as Float64.",
          "A Boolean value belongs to the Bool type.",
          "Print each type name on its own line."
        ],
        "why": "The printed names reveal the Julia types of values, not the declared type of a variable. The word true without quotes is a Boolean value.",
        "trap": "The string \"true\" would not have the same type as the Boolean value true."
      },
      {
        "title": "Compare two quotients",
        "code": "println(7 / 2)\nprintln(div(7, 2))",
        "output": "3.5\n3",
        "steps": [
          "Ordinary / computes a noninteger quotient.",
          "div computes the integer quotient.",
          "Print the two different results."
        ],
        "why": "The distinction matters whenever a numerical algorithm requires a fractional ratio versus an integer loop count.",
        "trap": "Do not expect ordinary / to truncate merely because both inputs are integers."
      }
    ],
    "checks": [
      {
        "prompt": "What type is printed?",
        "code": "println(typeof(1.5))",
        "options": [
          "Int64",
          "Float64",
          "Bool",
          "String"
        ],
        "answer": 1,
        "feedback": [
          "Int64 denotes integers, not the decimal literal.",
          "1.5 has Float64 type.",
          "Bool is used for true or false.",
          "String is used for quoted text."
        ],
        "hint": "Distinguish decimal literals from integer literals.",
        "output": "Float64"
      },
      {
        "prompt": "What is the integer quotient?",
        "code": "println(div(9, 2))",
        "options": [
          "4",
          "4.5",
          "5",
          "9"
        ],
        "answer": 0,
        "feedback": [
          "The integer quotient of nine divided by two is four.",
          "4.5 is the result of ordinary /.",
          "Five would be rounding upward.",
          "Nine is the dividend, not the quotient."
        ],
        "hint": "The function name specifies integer quotient, not ordinary division.",
        "output": "4"
      }
    ],
    "related": [
      "01",
      "09"
    ]
  },
  {
    "id": "strings",
    "title": "Strings and interpolation",
    "explain": "A string is text written inside double quotes. Julia uses `*` to concatenate strings and `$name` or `$(expression)` to insert a value or expression into a string. Interpolation evaluates the expression before assembling the text, which lets you label a computed result clearly. Strings are not numbers even if the characters inside them look like digits.\n\nDo arithmetic on numeric values first, then format a result for display. `length` counts the characters of a string; Unicode characters can have different byte lengths, so do not assume text indexing is the same as indexing a vector of one-byte symbols. When preparing numerical output, interpolation and explicit printing make the reported values easier to understand.",
    "concepts": [
      "Double quotes create strings.",
      "`*` concatenates string values.",
      "`$(expression)` inserts a calculated value into text."
    ],
    "examples": [
      {
        "title": "Join two pieces of text",
        "code": "language = \"Julia\"\nprintln(\"Learn \" * language)",
        "output": "Learn Julia",
        "steps": [
          "Store the string Julia.",
          "Concatenate it after the prefix Learn and a space.",
          "Print the combined text."
        ],
        "why": "The multiplication-shaped symbol is Julia's string concatenation operator; it is not numerical multiplication here.",
        "trap": "Use * rather than assuming + has the same meaning as in another programming language."
      },
      {
        "title": "Interpolate arithmetic",
        "code": "a = 4\nb = 5\nprintln(\"Sum: $(a + b)\")",
        "output": "Sum: 9",
        "steps": [
          "Assign the values 4 and 5 to the two variables.",
          "Evaluate a + b inside interpolation.",
          "Insert 9 into the final string."
        ],
        "why": "Julia calculates the numeric expression before constructing the output string. This separates computing a result from showing it.",
        "trap": "Without interpolation, literal characters a + b would not produce the sum."
      }
    ],
    "checks": [
      {
        "prompt": "What text is printed?",
        "code": "word = \"Math\"\nprintln(\"Julia \" * word)",
        "options": [
          "JuliaMath",
          "Julia Math",
          "Math Julia",
          "Julia * Math"
        ],
        "answer": 1,
        "feedback": [
          "The first string includes a space.",
          "The literal space is preserved in Julia Math.",
          "The operand order is reversed in this choice.",
          "The operator is not printed as a character."
        ],
        "hint": "Pay attention to the final space inside the first quoted string.",
        "output": "Julia Math"
      },
      {
        "prompt": "What does interpolation produce?",
        "code": "n = 3\nprintln(\"Twice: $(2 * n)\")",
        "options": [
          "Twice: n",
          "Twice: 5",
          "Twice: 6",
          "2 * n"
        ],
        "answer": 2,
        "feedback": [
          "The expression is evaluated, not printed as n.",
          "2 × 3 is six, not five.",
          "The interpolated expression evaluates to six.",
          "The string prefix is included in the output."
        ],
        "hint": "Evaluate the expression in parentheses before assembling the message.",
        "output": "Twice: 6"
      }
    ],
    "related": [
      "01"
    ]
  },
  {
    "id": "conditions",
    "title": "Conditions and branches",
    "explain": "An `if` statement runs one branch when a condition is true and optionally another branch through `else`. For multiple mutually exclusive cases, add `elseif` clauses and finish the block with `end`. Julia conditions must evaluate to Boolean values; it does not automatically interpret arbitrary integers as true or false. Operators such as `<`, `>` and `==` create comparisons.\n\nDo not confuse `=` (assignment) with `==` (equality comparison). For a program trace, evaluate the conditions in order and record which branch executes. The first matching `elseif` branch is selected, and later alternatives are skipped. This distinction is important for sign checks, algorithm termination, and guarding against invalid numerical inputs.",
    "concepts": [
      "`if ... elseif ... else ... end` selects a path.",
      "`==` tests equality, while `=` assigns.",
      "A condition must evaluate to true or false."
    ],
    "examples": [
      {
        "title": "Choose the sign label",
        "code": "x = -3\nif x < 0\n    println(\"negative\")\nelse\n    println(\"nonnegative\")\nend",
        "output": "negative",
        "steps": [
          "Evaluate whether -3 is less than zero.",
          "The condition is true, so enter the first branch.",
          "Print negative and skip else."
        ],
        "why": "The branches are alternatives: Julia does not execute both and then select an output afterward.",
        "trap": "An else branch is not a separate unconditional print statement."
      },
      {
        "title": "Handle the zero case",
        "code": "n = 0\nif n > 0\n    println(\"positive\")\nelseif n == 0\n    println(\"zero\")\nelse\n    println(\"negative\")\nend",
        "output": "zero",
        "steps": [
          "The positive test is false.",
          "The equality test succeeds for zero.",
          "Print zero and skip later branches."
        ],
        "why": "Branch order matters when cases overlap. Here the cases are exclusive and exactly one prints.",
        "trap": "Use n == 0 to compare; n = 0 assigns rather than comparing."
      }
    ],
    "checks": [
      {
        "prompt": "Which branch is chosen?",
        "code": "n = -2\nif n > 0\n    println(\"A\")\nelse\n    println(\"B\")\nend",
        "options": [
          "A",
          "B",
          "A then B",
          "Nothing"
        ],
        "answer": 1,
        "feedback": [
          "The condition is false, so A is skipped.",
          "The else branch prints B.",
          "Only one of these branches executes.",
          "The else branch has a print statement."
        ],
        "hint": "Evaluate the comparison using the actual n.",
        "output": "B"
      },
      {
        "prompt": "Which label is printed?",
        "code": "x = 0\nif x < 0\n    println(\"left\")\nelseif x == 0\n    println(\"center\")\nelse\n    println(\"right\")\nend",
        "options": [
          "left",
          "right",
          "center",
          "left center"
        ],
        "answer": 2,
        "feedback": [
          "Zero is not less than zero.",
          "The else fallback is not reached.",
          "The equality test succeeds and prints center.",
          "Only the matching branch is executed."
        ],
        "hint": "Check the conditions from top to bottom.",
        "output": "center"
      }
    ],
    "related": [
      "07"
    ]
  },
  {
    "id": "loops",
    "title": "Loops and accumulators",
    "explain": "A `for` loop visits the values of an iterable, including a range such as `1:4`, in order. In a running-sum algorithm, define an accumulator outside the loop, update it each iteration, and print its final value after the loop. A `while` loop instead repeats as long as its Boolean condition remains true. Both use `end` to mark the close of the block. In a noninteractive Julia script, wrap the working accumulator and loop in a `let ... end` local scope to avoid the special global-loop scoping rules.\n\nThe values of a loop variable and a stored accumulator are different: a loop variable identifies the current item, while the accumulator remembers past work. In a while loop, the body should normally update the variable involved in its stopping condition. Tracing the condition before every iteration is necessary to predict termination and avoid off-by-one mistakes.",
    "concepts": [
      "A `for` loop processes iterable values in order.",
      "Use `let ... end` around mutable accumulators in standalone script examples.",
      "A `while` condition is checked before each iteration."
    ],
    "examples": [
      {
        "title": "Sum a range",
        "code": "let\n    total = 0\n    for k in 1:4\n        total += k\n    end\n    println(total)\nend",
        "output": "10",
        "steps": [
          "Open a local let block and initialize total to zero.",
          "Accumulate 1, 2, 3 and 4.",
          "Print 10 after the loop."
        ],
        "why": "The accumulator is shared across all iterations, so it remembers the sum that has already been computed.",
        "trap": "Starting the accumulator at 1 adds an unintended extra unit."
      },
      {
        "title": "Double until a threshold",
        "code": "let\n    n = 1\n    while n < 8\n        n *= 2\n    end\n    println(n)\nend",
        "output": "8",
        "steps": [
          "Start a local let block with n equal to one.",
          "Double to 2, then 4, then 8.",
          "Stop because 8 is not less than 8."
        ],
        "why": "The condition is evaluated before each run of the loop body. Termination occurs when the condition becomes false.",
        "trap": "If n never changed inside the loop, the condition could remain true forever."
      }
    ],
    "checks": [
      {
        "prompt": "What is the final sum?",
        "code": "let\n    s = 0\n    for k in 1:3\n        s += k\n    end\n    println(s)\nend",
        "options": [
          "3",
          "4",
          "6",
          "9"
        ],
        "answer": 2,
        "feedback": [
          "Three is only the final iteration value.",
          "Four omits some accumulated terms.",
          "One plus two plus three equals six.",
          "Nine does not equal the range sum."
        ],
        "hint": "Track the accumulator after each iteration.",
        "output": "6"
      },
      {
        "prompt": "What value ends the loop?",
        "code": "let\n    x = 1\n    while x < 5\n        x *= 2\n    end\n    println(x)\nend",
        "options": [
          "4",
          "5",
          "8",
          "16"
        ],
        "answer": 2,
        "feedback": [
          "At four, the loop condition still holds.",
          "The loop doubles rather than incrementing.",
          "The sequence reaches eight, where the test fails.",
          "The loop stops before a further doubling."
        ],
        "hint": "Check the while condition after every doubling.",
        "output": "8"
      }
    ],
    "related": [
      "07",
      "08"
    ]
  },
  {
    "id": "functions",
    "title": "Functions and return values",
    "explain": "A function groups a calculation so it can be reused with different inputs. Define one with `function name(parameters) ... end`, then call it with concrete argument values. Inside the function, parameters are local bindings. An explicit `return` sends a value back to the caller, but Julia also returns the value of the final expression when no return is written.\n\nReturning a value and printing it are different operations. A reusable mathematical function should normally compute its result and let the caller decide how to show it. Default arguments can be supplied when a common case should be convenient without limiting more general calls. Good function design makes it possible to test an algorithm using multiple inputs and compare its actual outputs to calculated expectations.",
    "concepts": [
      "A function definition does not print a result automatically.",
      "`return` sends a result to the caller.",
      "The last expression is returned when no explicit return is used."
    ],
    "examples": [
      {
        "title": "Call a square function",
        "code": "function square(x)\n    return x * x\nend\nprintln(square(5))",
        "output": "25",
        "steps": [
          "Define square with parameter x.",
          "Call it with x equal to five.",
          "Return 25 and print it."
        ],
        "why": "The function returns a number; the caller's println controls whether that number appears in the output.",
        "trap": "Putting println in the function body is not a substitute for returning a useful result."
      },
      {
        "title": "Use a default parameter",
        "code": "function area(width, height=2)\n    return width * height\nend\nprintln(area(3))\nprintln(area(3, 4))",
        "output": "6\n12",
        "steps": [
          "The first call uses default height 2.",
          "Three multiplied by two gives six.",
          "The second call overrides height to four, giving twelve."
        ],
        "why": "A default parameter provides a value only when the caller omits that argument. Each call can still use another value.",
        "trap": "A default is not permanently changed when a later call passes a new argument."
      }
    ],
    "checks": [
      {
        "prompt": "What does the function return?",
        "code": "function triple(x)\n    return 3 * x\nend\nprintln(triple(4))",
        "options": [
          "3",
          "4",
          "7",
          "12"
        ],
        "answer": 3,
        "feedback": [
          "Three is the multiplier.",
          "Four is the input parameter.",
          "Seven is the sum rather than the product.",
          "Three times four returns twelve."
        ],
        "hint": "Trace the argument into the function body.",
        "output": "12"
      },
      {
        "prompt": "What is printed by the caller?",
        "code": "function offset(x)\n    x + 2\nend\nprintln(offset(5))",
        "options": [
          "2",
          "5",
          "7",
          "nothing"
        ],
        "answer": 2,
        "feedback": [
          "Two is the offset, not the result.",
          "Five is the argument before addition.",
          "Julia returns the final expression value seven.",
          "The outer println prints the returned value."
        ],
        "hint": "Julia may return the last expression without an explicit return keyword.",
        "output": "7"
      }
    ],
    "related": [
      "08"
    ]
  },
  {
    "id": "arrays",
    "title": "Arrays and indexing",
    "explain": "A vector is an ordered collection created using brackets such as `[3, 5, 7]`. Standard Julia indexing begins at one, meaning `v[1]` selects the first entry. `length(v)` counts how many entries exist, and `v[end]` selects the last one. Arrays are mutable: assigning `v[2] = 10` changes the stored value at that position. `push!` appends a new entry to a vector.\n\nWhen an algorithm must preserve its input, create an independent copy with `copy(v)`. Assigning another name directly to the same mutable vector does not create an independent copy. This matters for numerical code because unintentional mutation can change later computations and make debugging difficult. Always distinguish element values from the indexes that locate them.",
    "concepts": [
      "Index 1 selects the first standard array element.",
      "`end` selects the last valid array index.",
      "`copy(v)` permits changes without modifying the original vector."
    ],
    "examples": [
      {
        "title": "Select by index",
        "code": "v = [3, 5, 7]\nprintln(v[2])\nprintln(v[end])",
        "output": "5\n7",
        "steps": [
          "Create the vector with three entries.",
          "Index 2 selects the value five.",
          "end selects the value seven."
        ],
        "why": "A vector index refers to a position. The position number and the element stored there are separate concepts.",
        "trap": "Index zero does not select the first element of a standard Julia vector."
      },
      {
        "title": "Modify an independent copy",
        "code": "v = [2, 4, 6]\nw = copy(v)\nw[2] = 10\nprintln(v)\nprintln(w)",
        "output": "[2, 4, 6]\n[2, 10, 6]",
        "steps": [
          "Copy the original vector into an independent array.",
          "Update the second element in w.",
          "Print both vectors to see only w changed."
        ],
        "why": "This technique prevents a calculation from accidentally changing its input array, which is important when comparing numerical methods.",
        "trap": "Using w = v instead of copy(v) would share the mutable vector."
      }
    ],
    "checks": [
      {
        "prompt": "What value is selected?",
        "code": "v = [4, 8, 12]\nprintln(v[2])",
        "options": [
          "4",
          "8",
          "12",
          "2"
        ],
        "answer": 1,
        "feedback": [
          "Four is the first element.",
          "Eight is the second element.",
          "Twelve is the final element.",
          "Two is the index, not the element value."
        ],
        "hint": "Julia standard vectors start at index one.",
        "output": "8"
      },
      {
        "prompt": "What is the last element?",
        "code": "v = [1, 2, 3]\npush!(v, 4)\nprintln(v[end])",
        "options": [
          "2",
          "3",
          "4",
          "5"
        ],
        "answer": 2,
        "feedback": [
          "Two is an earlier entry.",
          "Three is no longer last after appending.",
          "Four was appended to the end.",
          "Five was never appended."
        ],
        "hint": "Consider the effect of push! before indexing with end.",
        "output": "4"
      }
    ],
    "related": [
      "02",
      "06"
    ]
  },
  {
    "id": "broadcasting",
    "title": "Ranges and broadcasting",
    "explain": "A range describes regularly spaced values. The syntax `start:step:stop` specifies an initial value, an increment, and an endpoint. `collect` materializes the range into a vector. Numerical algorithms often generate ranges to sample a mathematical function over an interval before plotting or analyzing the result.\n\nJulia uses dotted syntax to perform elementwise operations. `x .^ 2` squares each vector entry, `2 .* x` multiplies each entry by two, and a dotted function call applies a function to every entry. This differs from matrix algebra: an elementwise square is not the same operation as a matrix square. Decide from the underlying mathematical formula whether the operation is elementwise or a matrix computation, then choose Julia syntax accordingly.",
    "concepts": [
      "`0:2:4` represents zero, two and four.",
      "`collect` converts a range to an array.",
      "A dotted operator applies its action elementwise."
    ],
    "examples": [
      {
        "title": "Square each element",
        "code": "x = [-2, 0, 3]\nprintln(x .^ 2)",
        "output": "[4, 0, 9]",
        "steps": [
          "Construct the vector -2, 0, 3.",
          "Apply the square to each entry with .^.",
          "Print the new vector of squares."
        ],
        "why": "Broadcasted exponentiation preserves the elementwise structure of the calculation and produces one square per original entry.",
        "trap": "A missing dot does not request the same vector calculation."
      },
      {
        "title": "Scale a stepped range",
        "code": "x = collect(0:2:4)\nprintln(2 .* x .+ 1)",
        "output": "[1, 5, 9]",
        "steps": [
          "The range becomes [0, 2, 4].",
          "Multiply each entry by two.",
          "Add one to each entry, giving [1, 5, 9]."
        ],
        "why": "Dotted arithmetic expresses a whole sequence of numerical samples without spelling out a loop for each value.",
        "trap": "Adding a scalar to an array without dotted syntax is not the same intended elementwise expression."
      }
    ],
    "checks": [
      {
        "prompt": "What vector is produced?",
        "code": "v = [-1, 2]\nprintln(v .^ 2)",
        "options": [
          "[-1, 4]",
          "[1, 4]",
          "[1, 2]",
          "5"
        ],
        "answer": 1,
        "feedback": [
          "The negative entry becomes positive when squared.",
          "The squares are one and four.",
          "The second entry must also be squared.",
          "The script prints a vector, not a summed scalar."
        ],
        "hint": "Square each entry independently.",
        "output": "[1, 4]"
      },
      {
        "prompt": "What values are in the range?",
        "code": "println(collect(1:2:5))",
        "options": [
          "[1, 2, 5]",
          "[1, 2, 3, 4, 5]",
          "[1, 3, 5]",
          "[2, 4]"
        ],
        "answer": 2,
        "feedback": [
          "The middle number specifies step size.",
          "Those values would use step size one.",
          "Starting at one and stepping by two yields 1, 3, 5.",
          "The range starts at one, not two."
        ],
        "hint": "The middle number is an increment.",
        "output": "[1, 3, 5]"
      }
    ],
    "related": [
      "03"
    ]
  }
];
export const FUNDAMENTALS=Object.freeze(chapters.map(ch=>Object.freeze({...ch,
 concepts:Object.freeze(ch.concepts),related:Object.freeze(ch.related),
 examples:Object.freeze(ch.examples.map(ex=>Object.freeze({...ex,steps:Object.freeze(ex.steps)}))),
 checks:Object.freeze(ch.checks.map((q,i)=>Object.freeze({...q,id:ch.id+"-"+(i+1),options:Object.freeze(q.options),feedback:Object.freeze(q.feedback)})))
})));
export const FUNDAMENTALS_STORAGE_KEY="amp-julia-learn:fundamentals-v1";
export function fundamentalsFor(id){return FUNDAMENTALS.find(ch=>ch.id===id)||null;}
export function gradeFundamentalsCheck(question,selection){
 if(!question)return {valid:false,correct:false,feedback:"Question unavailable."};
 const index=Number(selection);
 if(!Number.isInteger(index)||String(index)!==String(selection)||index<0||index>=question.options.length)
   return {valid:false,correct:false,feedback:"Select an answer."};
 return {valid:true,correct:index===question.answer,feedback:question.feedback[index]};
}
export function readFundamentalsAnswers(storage=globalThis.localStorage){
 try{
  const record=JSON.parse(storage.getItem(FUNDAMENTALS_STORAGE_KEY)||"{}");
  if(!record||typeof record!=="object"||Array.isArray(record))return {};
  const cleaned={};
  for(const [key,value] of Object.entries(record)){
   const q=FUNDAMENTALS.flatMap(ch=>ch.checks).find(q=>q.id===key);
   if(q&&typeof value==="string"&&gradeFundamentalsCheck(q,value).valid)cleaned[key]=value;
  }
  return cleaned;
 }catch{return {};}
}
export function writeFundamentalsAnswer(q,selection,storage=globalThis.localStorage){
 const result=gradeFundamentalsCheck(q,selection);
 if(!result.valid)return {...result,saved:false};
 try{
  const record=readFundamentalsAnswers(storage);record[q.id]=String(selection);
  storage.setItem(FUNDAMENTALS_STORAGE_KEY,JSON.stringify(record));return {...result,saved:true};
 }catch{return {...result,saved:false};}
}
