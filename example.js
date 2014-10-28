var SimpleLang = require("./src/SimpleLang.js").SimpleLang;
var colors = require("colors");

var machine = new SimpleLang([
    ["LOAD", true, 5],
    ["STORE", false, 15],
    ["LOAD", true, 0],
    ["EQUAL", false, 15],
    ["JUMP", true, 6],
    ["HALT", true, 0],
    ["ADD", true, 1],
    ["JUMP", true, 3]
], 16);

machine.run_loop(100, function(i, action){
    console.log(pad(i, 3)+" "+action);
}, function(error){
    console.error(error.message.toString().red);
});


//simple helper to display leading zeros.
//source: http://stackoverflow.com/questions/2998784/how-to-output-integers-with-leading-zeros-in-javascript
function pad(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}
