function curry (fn){
    
    return function myCurried(...args){
        // fn.length gives the number of expected params
        if(args.length >= fn.length){
            // enough params, execute the function
            return fn(...args);
        }else{
            // keep collecting
            return (...args1) => {
                return myCurried(...args, ...args1);
            }
        }
    }
}


function multiply (a, b, c){
    return a * b * c;
}

const myCury = curry(multiply);

console.log(myCury(10, 20, 30));
console.log(myCury(10, 20)(30));
console.log(myCury(10)(20)(30));






function sum(...intitalArgs){
    let total = intitalArgs.reduce((acc, curr) => acc + curr, 0);
    
    function inner (...args){
        if(args.length == 0){
            return total;
        }
            total += args.reduce((acc, curr) => acc + curr, 0);
            return inner;
        
    }
    
    return intitalArgs.length == 0 ? 0 : inner; 
}


console.log(sum(1, 2)(3, 4)(5)());       // 15
console.log(sum(1)(2)(3)(4)());          // 10
console.log(sum(1, 2, 3, 4)());          // 10
console.log(sum());                      // 0
console.log(sum(10)(-5)(0)(2, 3)());     // 10