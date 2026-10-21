import {externalTestSuite,buildJuliaTestFile} from "./external-tests.js";
// Source-authored input transformations: compare relationships, not memorized outputs.
export const PROPERTY_TRANSFER=Object.freeze({
  "13":Object.freeze({
    original:Object.freeze([
      Object.freeze({id:"p1",name:"Residual under new data",question:"Does the computed solution satisfy a new lower-triangular system?",reason:"A correct forward solve makes Lx approximately equal to b; rounding may leave a tiny residual.",assertion:"@test norm([3.0 0; -1 2]*forward_substitution([3.0 0; -1 2], [6.0, 4.0]) - [6.0, 4.0]) < 1e-10"}),
      Object.freeze({id:"p2",name:"Right-hand-side scaling",question:"If the right-hand side doubles, should the solution also double?",reason:"Linearity holds for a fixed nonsingular triangular matrix.",assertion:"@test isapprox(forward_substitution([2.0 0; -1 4], [8.0, 4.0]), 2 .* forward_substitution([2.0 0; -1 4], [4.0, 2.0]); atol=1e-10)"}),
    ]),
    a:Object.freeze([
      Object.freeze({id:"p1",name:"Residual under new data",question:"Does backward substitution satisfy a different upper-triangular system?",reason:"A correct solve reconstructs b through Ux, to floating-point precision.",assertion:"@test norm([3.0 -2; 0 5]*backward_substitution([3.0 -2; 0 5], [1.0, 10.0]) - [1.0, 10.0]) < 1e-10"}),
      Object.freeze({id:"p2",name:"Right-hand-side scaling",question:"What happens when b is doubled for fixed invertible U?",reason:"Because U is linear, a correct solution for 2b is twice that for b.",assertion:"@test isapprox(backward_substitution([2.0 1; 0 5], [8.0, 20.0]), 2 .* backward_substitution([2.0 1; 0 5], [4.0, 10.0]); atol=1e-10)"}),
    ]),
    b:Object.freeze([
      Object.freeze({id:"p1",name:"Residual with signed entry",question:"Can forward substitution handle a negative off-diagonal entry?",reason:"Reconstruction of b checks the solution on a signed example.",assertion:"@test norm([4.0 0; -3 2]*forward_substitution([4.0 0; -3 2], [8.0, -2.0]) - [8.0, -2.0]) < 1e-10"}),
      Object.freeze({id:"p2",name:"Right-hand-side scaling",question:"Is the forward solution homogeneous for a fixed nonsingular matrix?",reason:"Doubling b should double the solution when L remains unchanged.",assertion:"@test isapprox(forward_substitution([4.0 0; -1 2], [16.0, 6.0]), 2 .* forward_substitution([4.0 0; -1 2], [8.0, 3.0]); atol=1e-10)"}),
    ]),
  }),
  "08":Object.freeze({
    original:Object.freeze([
      Object.freeze({id:"p1",name:"Sign symmetry",question:"Does reversing the signs of every input change a sum of squares?",reason:"Squaring removes signs; the sum is unchanged.",assertion:"@test sum_of_squares([1, -2, 3]) == sum_of_squares([-1, 2, -3])"}),
      Object.freeze({id:"p2",name:"Appending zero",question:"Can a zero entry change the sum of squares?",reason:"A zero contributes nothing to a sum of squares.",assertion:"@test sum_of_squares([2, -4, 0]) == sum_of_squares([2, -4])"}),
    ]),
    a:Object.freeze([
      Object.freeze({id:"p1",name:"Permutation invariance",question:"Does changing input order alter the count above a fixed threshold?",reason:"The predicate is evaluated independently on each element.",assertion:"@test count_above([2, 7, -1, 5], 3) == count_above([5, -1, 2, 7], 3)"}),
      Object.freeze({id:"p2",name:"Threshold monotonicity",question:"Can increasing a strict threshold increase the count?",reason:"Any value above the larger threshold is also above the smaller threshold.",assertion:"@test count_above([1, 4, 6, 9], 6) <= count_above([1, 4, 6, 9], 3)"}),
    ]),
    b:Object.freeze([
      Object.freeze({id:"p1",name:"Multiplicative identity",question:"What happens to the product when 1 is appended?",reason:"Multiplication by one leaves the product unchanged.",assertion:"@test product_or_one([2, -3, 4, 1]) == product_or_one([2, -3, 4])"}),
      Object.freeze({id:"p2",name:"Permutation invariance",question:"Can reordering factors change their product for these integers?",reason:"Integer multiplication is commutative and associative for these values.",assertion:"@test product_or_one([-2, 5, 3]) == product_or_one([3, -2, 5])"}),
    ]),
  }),
  "09":Object.freeze({
    original:Object.freeze([
      Object.freeze({id:"p1",name:"Argument symmetry",question:"Should exchanging the two compared numbers affect an absolute tolerance check?",reason:"The absolute difference is symmetric in its arguments.",assertion:"@test isclose(1.0, 1.125, 0.125) === isclose(1.125, 1.0, 0.125)"}),
      Object.freeze({id:"p2",name:"Tolerance monotonicity",question:"If a comparison succeeds at a smaller tolerance, can it fail at a larger one?",reason:"For a nonnegative absolute tolerance, increasing it cannot turn a true result false.",assertion:"@test isclose(1.0, 1.125, 0.125) === true && isclose(1.0, 1.125, 0.25) === true"}),
    ]),
    a:Object.freeze([
      Object.freeze({id:"p1",name:"Sign reflection",question:"Can changing the sign of x change an absolute zero comparison?",reason:"The magnitude |x| is unchanged by replacing x with -x.",assertion:"@test approxzero(0.0000002, 0.000001) === approxzero(-0.0000002, 0.000001)"}),
      Object.freeze({id:"p2",name:"Tolerance monotonicity",question:"Does loosening a zero tolerance turn an already accepted value into a rejection?",reason:"For nonnegative tolerances, an accepted magnitude remains acceptable.",assertion:"@test approxzero(-0.0000008, 0.000001) === true && approxzero(-0.0000008, 0.00001) === true"}),
    ]),
    b:Object.freeze([
      Object.freeze({id:"p1",name:"Argument symmetry",question:"Does the relative predicate depend on argument order?",reason:"Both the absolute difference and max(|a|,|b|) are symmetric.",assertion:"@test near_relative(100, 101, 0.02) === near_relative(101, 100, 0.02)"}),
      Object.freeze({id:"p2",name:"Common scale invariance",question:"What happens when both inputs are multiplied by the same positive factor?",reason:"Both sides of the relative comparison scale by the same positive factor.",assertion:"@test near_relative(100, 101, 0.02) === near_relative(200, 202, 0.02)"}),
    ]),
  }),
});
export function propertiesForTask(lesson,variant){
  if(!externalTestSuite(lesson,variant))return [];
  return PROPERTY_TRANSFER[lesson]?.[variant]??[];
}
export function buildPropertyFile(lesson,variant,code,propertyId=null){
  const cases=propertiesForTask(lesson,variant);
  if(!cases.length)throw new RangeError("No source-backed properties for this task");
  const selected=propertyId===null?cases:cases.filter(c=>c.id===propertyId);
  if(!selected.length)throw new RangeError("Unknown property");
  const namePart=propertyId===null?"-properties":"-property-"+propertyId;
  const entries=selected.map(c=>({name:c.name,assertion:c.assertion}));
  return buildJuliaTestFile(lesson,variant,code,entries,namePart,
    "Property tests compare transformed inputs. Run in Julia; no execution or grading occurs in this browser.");
}
