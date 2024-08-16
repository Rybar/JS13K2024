const fs = require('fs');

// report zip size and remaining bytes
const size = fs.statSync('dist/game.zip').size;
const limit = 1024 * 13;
const remaining = limit - size;
const percentage = Math.round((remaining / limit) * 100 * 100) / 100;
console.log('\n-------------');
console.log(`USED: ${size} BYTES`);
console.log(`REMAINING: ${remaining} BYTES (${percentage}% of 13k budget)`);
console.log('-------------\n');
var tweet = '';
{k=size/1024;for(i=f=0,s="";i<6;f=6*k/13-i,s+=f<=0?"🌑":["🌘","🌗","🌖","🌕"][((f>1?1:f)*3)|0],i++);tweet=`${s} ${(k*1000|0)/1000} KiB / 13 KiB #js13k`}
console.log(tweet);

