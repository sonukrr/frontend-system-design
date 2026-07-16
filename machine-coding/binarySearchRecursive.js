
class Solution {

    binarySearch(list = [],target = 0) {


        return rec(0, list.length - 1);


        function rec(l, r) {
            if(l > r) return -1;

            let mid = Math.floor((l + r) / 2);

            if (list[mid] === target) return mid;


            return target < list[mid] ?
                rec(l, mid - 1) :
                rec(mid + 1, r);
        }


    }
}

const obj = new Solution();
console.log(obj.binarySearch([20, 30, 40, 50, 60, 100, 300], 3030));



