
// <input onkeypress="onSearch()" placeholder="start typing to search...">


let count = 0;
const fetchData = () => {
  // mock api response
  count++;
  console.log(count);
}

window.onSearch = debounce(fetchData, 200);

function debounce(fn, delay) {
  let timer;
  
  return function (){
    let context = this;
    let args = arguments;
    clearTimeout(timer);
    timer = setTimeout(()=> {
      fn.apply(context, args);
    }, delay);
  }
}