class Solution {

    deepCopy(data) {

        const map = new WeakMap();

        return deepCopyHelper(data);
        

        function deepCopyHelper(value) {
            if (!value || typeof value !== 'object') return value;
            if(map.has(value)) return map.get(value);


            const clone = Array.isArray(value) ? [] : {};
            map.set(value, clone);
            
            // Array
            if (Array.isArray(value)) {
                return value.map(el => deepCopyHelper(el));
            }

            // Object
            for (const key in value) {
                clone[key] = deepCopyHelper(value[key]);
            }
            
            return clone;
        }
    }
}


const obj = new Solution();
const data =   {
        companyName: "Sense AI",
        employees: [
            {
                name: "Charles",
                department: 'HR'
            },
            {
                name: "Sam Altman",
                department: 'Engineering'
            }
        ],
        refs: [
            [10, 20],
            [100, 200]
        ]
    };
data.self = data;
console.log(data);
const copied = obj.deepCopy(data);
console.log(copied);

copied.employees[0].name = 'Sobaraj';
copied.refs[0][0] = 1000;
copied.self.companyName = 'Sensi Ai Pro';




console.log(data.employees[0].name);
console.log(copied.employees[0].name);