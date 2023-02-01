export default class Point {
  constructor(index, transactionPointId, order, time) {
    this.index = index ? index : null
    this.transactionPointId = transactionPointId ? transactionPointId : null
    this.order = order ? order : null
    this.time = time ? time : "0"
  }
}
