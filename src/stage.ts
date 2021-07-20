// class SummonPair {
//   /**
//    * @param {string} monsterType
//    * @param {number} amount
//    */
//   constructor(monsterType, amount, level) {
//     this.monsterCtor = MonsterManager.monsterCtors[monsterType]
//     this.amount = amount
//     this.level = level
//   }
// }

// class Wave {
//   /**
//    * @param {SummonPair[]} seq
//    * @param {number} interval
//    * @param {number} innerBreak
//    */
//   constructor(seq, interval) {
//     this.sequence = seq
//     this.interval = interval

//     this.lastSummonTime = performance.now()

//     this.isFinished = false
//   }

//   get canSummon() {
//     return performance.now() - this.lastSummonTime > this.interval
//   }

//   /**
//    * @param {(arg0: any, arg1: any) => void} placeMonsterFx
//    */
//   run(placeMonsterFx) {

//     if (this.canSummon) {

//       const pair = this.sequence.pop()
//       for (let i = 0; i < pair.amount; i++) {
//         placeMonsterFx(pair.monsterCtor, pair.level)
//       }
//     }

//     if (this.sequence.length === 0) {
//       this.isFinished = true
//     }
//   }
// }

// class Stage {
//   constructor() {

//     /**
//      * @type {Wave[]}
//      */
//     this.waves = []
//   }

//   push(wave) {
//     this.waves.push(wave)
//   }

//   pop() {
//     return this.waves.pop()
//   }

//   peek() {
//     return this.waves[this.waves.length - 1]
//   }

//   update(bindedFx) {
//     this.waves = this.waves.filter(wav => {
//       wav.run(bindedFx)
//       return !wav.isFinished
//     })
//   }
// }
