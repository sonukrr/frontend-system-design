// polyfills 

Function.prototype.myBind = (...args) => {
    let context = args[0];
    let args1 = args.slice(1);
    let fnRef = this;

    return function (...args2) {
            fnRef(...args1, ...args2); 
    }
}

const add = (a, b) => {
    console.log(this.name);
    return a + b;
}


const myAddRef = add.myBind({name: 'Google'}, 10, 20);

// call later

console.log(myAddRef(30, 40));



