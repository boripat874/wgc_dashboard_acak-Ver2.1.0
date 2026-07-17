// const seconds = Math.floor(Date.now() / 1000);
// console.log(seconds);
const datetime = new Date(1783904401 * 1000);

console.log(datetime.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }));

const dayOfWeek = datetime.getDay(); 
console.log(dayOfWeek); // Output: 3 (หมายถึง วันพุธ)
console.log(typeof(dayOfWeek)); // Output: "number"