export default class MarkerDTO {
  constructor(id, description, position = {}, type) {
    this.id = id ? id : null
    this.description = description ? description : null
    this.position = position ? position : null
    this.type = type ? type : null
  }
}
