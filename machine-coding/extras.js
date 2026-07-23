function build(obj){
    const res = {};
    for(const key in obj){
        let keys = key.split('.');
        let curr = res;
        for(var i = 0; i < keys.length - 1; i++){
            curr[keys[i]] = curr[keys[i]] ?? {};
            curr = curr[keys[i]];
        }
        
        curr[keys[keys.length - 1]] = obj[key];
        
    }
    
    return res;
}

const obj = {
  "user.name": "Sonu",
  "user.age": 28,
  "user.address.city": "Bengaluru",
  "user.address.state": "Karnataka",
  "company.name": "OpenAI",
  "company.location.country": "USA",
  "settings.theme": "dark",
  "settings.notifications.email": true,
  "settings.notifications.sms": false
};

console.log(build(obj))




