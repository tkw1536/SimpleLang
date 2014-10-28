var SimpleLang = require("./src/SimpleLang.js").SimpleLang;
var colors = require("colors");

//here is a simple machine that does stuff
var machine = new SimpleLang("LOAD #5 STORE 15 LOAD #0 EQUAL 15 JUMP #6 HALT #0 ADD #1 JUMP #3", 16);

machine.run_loop(100, function(i, action){
    console.log(pad(i, 3)+" "+action);
}, function(error){
    console.error(error.message.toString().red);
});

console.log(machine.memory.toString().yellow)

//simple helper to display leading zeros.
//source: http://stackoverflow.com/questions/2998784/how-to-output-integers-with-leading-zeros-in-javascript
function pad(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}
