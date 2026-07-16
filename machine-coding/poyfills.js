// polyfill for map
const arr = [10, 20, 40, 50];

Array.prototype.myMap = (cb) => {
    const res = [];
    for(const el of this){
        res.push(cb(el));
    }
    return res;
}

// bind
Function.prototype.myBind = function (...args){
    let fnRef = this;
    let args1 = args.slice(1);
    return function(...args2){
        fnRef.apply(args[0], [...args1, ...args2]);
    }

}

const fetchData = function (company, message) {
    console.log(`${this.value} - ${company} - ${message}`);
}

const fetchDataCopy = fetchData.myBind({value: 'sam'}, 'ZS');

console.log(fetchDataCopy("Welcome"));

// apply

Function.prototype.myApply = function (context, args = []) {
    return this.call(context, ...args);
};

Function.prototype.myApply = function (context, args = []){
    // null / undefined
    context = context ?? globalThis;

    context = Object(context);

    // Symbol() guarantees a unique property key and avoids overwriting an existing property
    const fn = Symbol();
    context[fn] = this;

    let res = context[fn](...args);

    delete context[fn];

    return res;

}