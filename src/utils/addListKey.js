export const addListKey = (data = []) => {
  return data.map((item, index) => ({ ...item, key: index }))
}
