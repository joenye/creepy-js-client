const Position = (x, y, z = 0) => ({ x: x, y: y, z: z })

export const northOf = (pos) => Position(pos.x, pos.y + 1, pos.z)
export const eastOf = (pos) => Position(pos.x + 1, pos.y, pos.z)
export const southOf = (pos) => Position(pos.x, pos.y - 1, pos.z)
export const westOf = (pos) => Position(pos.x - 1, pos.y, pos.z)

export const upOf = (pos) => Position(pos.x, pos.y, pos.z - 1)
export const downOf = (pos) => Position(pos.x, pos.y, pos.z + 1)

export default Position
