const Position = (x, y, floor = 1) => ({x: x, y: y, floor: floor})

export const northOf = (position) => Position(position.x, position.y + 1, position.floor)
export const eastOf = (position) => Position(position.x + 1, position.y, position.floor)
export const southOf = (position) => Position(position.x, position.y - 1, position.floor)
export const westOf = (position) => Position(position.x - 1, position.y, position.floor)

export default Position
