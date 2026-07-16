
const add = (x) => x + 2;
const multiply3 = (x) => x * 3;
const square = (x) => Math.pow(x, 2);

const calculate = flow([add, multiply3, square]);

console.log(calculate(2)); //24

function flow(fns) {
    return function (x){
        return fns.reduce((res, fn) => fn(res), x);
    }
}

