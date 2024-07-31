
export default class LCG {
    constructor(seed) {
      this.seed = seed;
      this.modulus = 2 ** 31 - 1;
      this.multiplier = 48271;
      this.increment = 0;
      this.state = seed;
    }
  
    next() {
      this.state = (this.multiplier * this.state + this.increment) % this.modulus;
      return this.state / this.modulus;
    }
  
    randomInt(min, max) {
      return Math.floor(this.next() * (max - min + 1)) + min;
    }
  
    randomFloat(min, max) {
      return this.next() * (max - min) + min;
    }

    coinFlip(){
      return this.next() > 0.5;
    } 
  }