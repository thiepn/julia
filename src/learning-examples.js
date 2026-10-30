// L2: original, source-authored Julia teaching examples. Browser display only.
// Exact stdout is qualified with real Julia 1.11 in CI; none runs in the UI.
const raw = {
  "01": [
    {
      "title": "Assignments and addition",
      "code": "a = 5\nb = 3\nprintln(a + b)",
      "output": "8",
      "steps": [
        "Assign 5 to a and 3 to b.",
        "Compute a + b using the current values: 5 + 3 = 8.",
        "println writes the result and a newline."
      ],
      "explanation": "Assignments bind names to values. The last line evaluates the addition before printing, so neither variable name appears in the output.",
      "pitfall": "An assignment such as a = 5 does not print 5 when the code runs as a script.",
      "id": "01-01"
    },
    {
      "title": "Updating a variable",
      "code": "x = 6\nx = x + 4\nprintln(x)",
      "output": "10",
      "steps": [
        "Start with x equal to 6.",
        "Evaluate the right side using the old x, giving 6 + 4 = 10.",
        "Assign the result back to x and print 10."
      ],
      "explanation": "Julia processes statements in order. The second assignment replaces the value associated with x; it does not create an equation to solve.",
      "pitfall": "The second line is an update, not a mathematical assertion that x equals x + 4 simultaneously.",
      "id": "01-02"
    },
    {
      "title": "Exponentiation and precedence",
      "code": "println(2 ^ 3)\nprintln(2 * 3 ^ 2)",
      "output": "8\n18",
      "steps": [
        "The operator ^ means exponentiation, so 2 ^ 3 is 8.",
        "Exponentiation takes precedence over multiplication: 3 ^ 2 is 9.",
        "Multiply 2 by 9 to obtain 18; println creates separate lines."
      ],
      "explanation": "The operators ^ and * are different: ^ raises a base to a power. Without parentheses Julia evaluates the power before the product here.",
      "pitfall": "Do not confuse ^ with multiplication or evaluate 2 * 3 first in the second expression.",
      "id": "01-03"
    },
    {
      "title": "Division versus integer quotient",
      "code": "println(7 / 2)\nprintln(div(7, 2))",
      "output": "3.5\n3",
      "steps": [
        "The / operator divides seven by two and produces 3.5.",
        "div computes the integer quotient, truncating toward zero.",
        "The two println calls print different numeric results."
      ],
      "explanation": "Julia's / performs floating-point division for these integers; div is a distinct operation that returns the integer quotient.",
      "pitfall": "Do not assume ordinary / automatically truncates to an integer because both operands are integers.",
      "id": "01-04"
    },
    {
      "title": "Evaluate several expressions",
      "code": "x = 4\ny = 2\nprintln(x + y)\nprintln(x - y)\nprintln(x * y)",
      "output": "6\n2\n8",
      "steps": [
        "Assign x = 4 and y = 2.",
        "Addition gives 6 and subtraction gives 2.",
        "Multiplication gives 8; each println uses its own line."
      ],
      "explanation": "The same assigned numbers can be reused in several expressions. Reusing variables does not change their values unless another assignment occurs.",
      "pitfall": "Multiplication uses *; writing x y with a space is not a multiplication operator.",
      "id": "01-05"
    },
    {
      "title": "Square-and-add expression",
      "code": "println(3 ^ 2 + 4 ^ 2)",
      "output": "25",
      "steps": [
        "Compute 3 squared, obtaining 9.",
        "Compute 4 squared, obtaining 16.",
        "Add the two squared terms: 9 + 16 = 25."
      ],
      "explanation": "This is the familiar sum of two squares expressed directly with Julia's exponentiation syntax. It is evaluated before println prints the result.",
      "pitfall": "The expression squares each term separately: it does not mean (3 + 4) ^ 2.",
      "id": "01-06"
    }
  ],
  "02": [
    {
      "title": "Index the second element",
      "code": "v = [10, 20, 30]\nprintln(v[2])",
      "output": "20",
      "steps": [
        "Construct a vector containing three integers.",
        "Julia's default vector indexing starts at 1, so index 2 refers to 20.",
        "println outputs that element, not its position."
      ],
      "explanation": "Square brackets construct a vector and later select an element. For a standard Julia vector, v[1] is the first entry and v[2] is the second.",
      "pitfall": "Transferring zero-based indexing habits from Python or JavaScript would give the wrong element.",
      "id": "02-01"
    },
    {
      "title": "Last element and length",
      "code": "v = [3, 5, 7, 9]\nprintln(v[end])\nprintln(length(v))",
      "output": "9\n4",
      "steps": [
        "Construct a four-element vector.",
        "Within v[...], end denotes its last valid index and returns 9.",
        "length(v) counts four elements and prints 4."
      ],
      "explanation": "The end keyword follows the actual array endpoint inside indexing expressions, which makes code robust when a vector's size changes.",
      "pitfall": "Do not treat end inside an index as a stored number or assume it can be used as a standalone variable.",
      "id": "02-02"
    },
    {
      "title": "Combine indexed values",
      "code": "v = [3, 5, 7, 9]\nprintln(v[2] + v[end])",
      "output": "14",
      "steps": [
        "The second element v[2] equals 5.",
        "The final element v[end] equals 9.",
        "The addition produces 14 and println displays it."
      ],
      "explanation": "You can place indexing expressions directly inside arithmetic; Julia evaluates the selected values first and then adds them.",
      "pitfall": "Hard-coding 5 + 9 would happen to work here but would not adapt when the vector changes.",
      "id": "02-03"
    },
    {
      "title": "Mutation with push!",
      "code": "v = [1, 2, 3]\npush!(v, 4)\nprintln(v)",
      "output": "[1, 2, 3, 4]",
      "steps": [
        "Start with three elements.",
        "push! appends 4 to the same vector v.",
        "Printing v now shows four elements."
      ],
      "explanation": "The trailing ! in the Julia name convention indicates that this operation mutates its argument. The original vector is extended rather than replaced by a new vector.",
      "pitfall": "The exclamation mark is part of the function name convention, not a logical NOT operator here.",
      "id": "02-04"
    },
    {
      "title": "Copy before changing an element",
      "code": "v = [4, 5, 6]\nw = copy(v)\nw[1] = 99\nprintln(v)\nprintln(w)",
      "output": "[4, 5, 6]\n[99, 5, 6]",
      "steps": [
        "Construct the initial vector v.",
        "copy(v) creates an independent vector w.",
        "Changing w[1] leaves v intact, so their printed contents differ."
      ],
      "explanation": "A copied vector can be changed independently. This is especially useful when an algorithm should preserve its input data while computing a modified result.",
      "pitfall": "Writing w = v instead would make both names refer to the same mutable vector.",
      "id": "02-05"
    },
    {
      "title": "Matrix row and column indexes",
      "code": "A = [1 2; 3 4]\nprintln(A[2, 1])\nprintln(size(A))",
      "output": "3\n(2, 2)",
      "steps": [
        "The semicolon separates matrix rows: [1 2] and [3 4].",
        "A[2, 1] selects row 2, column 1, which is 3.",
        "size(A) returns the pair (rows, columns), namely (2, 2)."
      ],
      "explanation": "Julia matrices use two indexes separated by a comma. Their dimensions are retrieved with size, and rows come before columns.",
      "pitfall": "Do not read A[2, 1] as column 2, row 1 or assume commas separate matrix rows.",
      "id": "02-06"
    }
  ],
  "03": [
    {
      "title": "Square every vector element",
      "code": "x = [-2, -1, 0, 1, 2]\ny = x .^ 2\nprintln(y)",
      "output": "[4, 1, 0, 1, 4]",
      "steps": [
        "Construct a vector containing five integers.",
        "The dotted exponentiation .^ squares each element independently.",
        "The resulting vector y is printed with five squared entries."
      ],
      "explanation": "Julia's dot syntax broadcasts operations across the elements of an array. For this example .^ computes a vector of squares rather than a matrix power.",
      "pitfall": "Without the dot, ^ is not the elementwise vector operation shown in this lesson.",
      "id": "03-01"
    },
    {
      "title": "Collect a stepped range",
      "code": "println(collect(2:2:8))",
      "output": "[2, 4, 6, 8]",
      "steps": [
        "The first 2 is the starting value.",
        "The middle 2 is the increment and 8 is the inclusive endpoint.",
        "collect materializes the stepped range as a vector."
      ],
      "explanation": "The syntax start:step:stop defines a sequence with the specified increment. collect converts this range into a concrete array for display or further array operations.",
      "pitfall": "The middle number specifies the step, not the count of generated elements.",
      "id": "03-02"
    },
    {
      "title": "Broadcast addition and multiplication",
      "code": "v = [1, 2, 3]\nprintln(v .+ 5)\nprintln(v .* 3)",
      "output": "[6, 7, 8]\n[3, 6, 9]",
      "steps": [
        "The vector has values 1, 2 and 3.",
        "The .+ operator adds 5 independently to all three entries.",
        "The .* operator multiplies each entry by 3."
      ],
      "explanation": "Broadcasting works for more than powers: dotted arithmetic with a scalar transforms every array element and returns an array of corresponding results.",
      "pitfall": "The dots are meaningful syntax, not optional decoration in a lesson about elementwise operations.",
      "id": "03-03"
    },
    {
      "title": "Generate evenly spaced points",
      "code": "x = collect(range(0, 1; length=3))\nprintln(x)",
      "output": "[0.0, 0.5, 1.0]",
      "steps": [
        "range requests three equally spaced samples including the endpoints 0 and 1.",
        "The resulting positions are 0.0, 0.5 and 1.0.",
        "collect converts the range into a vector to print."
      ],
      "explanation": "This is useful when numerical code needs a fixed number of points over an interval. The sample spacing is determined by the endpoint interval and length.",
      "pitfall": "length=3 means three sampled values, not a step size of three.",
      "id": "03-04"
    },
    {
      "title": "Broadcast a function",
      "code": "x = [-2, -1, 0, 1, 2]\nprintln(abs.(x))",
      "output": "[2, 1, 0, 1, 2]",
      "steps": [
        "Construct a vector with negative and positive entries.",
        "abs.(x) calls abs separately on each entry.",
        "The absolute values are printed in a new vector."
      ],
      "explanation": "In Julia the dot-call syntax also broadcasts ordinary functions, not only arithmetic operators. This pattern applies to many numerical functions.",
      "pitfall": "Writing abs(x) does not mean automatically applying abs elementwise to a vector.",
      "id": "03-05"
    },
    {
      "title": "Combine broadcasting with a reduction",
      "code": "v = [1, 2, 3]\nprintln(sum(v .^ 2))",
      "output": "14",
      "steps": [
        "Square the elements with .^ 2 to get [1, 4, 9].",
        "sum adds the squared elements: 1 + 4 + 9.",
        "println displays the scalar result 14."
      ],
      "explanation": "A vectorized transformation can be composed with a reduction. The result is one number, not the intermediate array of squares.",
      "pitfall": "sum(v) ^ 2 would square the total sum and give 36 instead of the sum of squares 14.",
      "id": "03-06"
    }
  ]
};
export const LEARNING_EXAMPLES=Object.freeze(Object.fromEntries(Object.entries(raw).map(([id,examples])=>
  [id,Object.freeze(examples.map(example=>Object.freeze({...example,steps:Object.freeze([...example.steps])})))])));
export function examplesForLesson(id){return Object.hasOwn(LEARNING_EXAMPLES,id)?LEARNING_EXAMPLES[id]:null;}
