import path from "path"

import { nestedFolderSort } from "./fs"

export function calculateControllerRoots(filenames: string[]) {
  const controllerRoots: string[] = [];

  filenames = filenames.sort(nestedFolderSort)

  const findClosest = (basename: string) => {
    const splits = basename.split("/")

    for (let i = 0; i < splits.length + 1; i++) {
      const possbilePath = splits.slice(0, i).join("/")

      if (controllerRoots.includes(possbilePath) && possbilePath !== basename) {
        return possbilePath
      }
    }
  }

  filenames.forEach(filename => {
    const splits = path.dirname(filename).split("/")
    const controllersIndex = splits.indexOf("controllers")

    if (controllersIndex !== -1) {
      const controllerRoot = splits.slice(0, controllersIndex + 1).join("/")

      if (!controllerRoots.includes(controllerRoot)) {
        controllerRoots.push(controllerRoot)
      }
    } else {
      const controllerRoot = splits.slice(0, splits.length).join("/")
      const found = findClosest(controllerRoot)

      if (found) {
        const index = controllerRoots.indexOf(controllerRoot)
        if (index !== -1) controllerRoots.splice(index, 1)
      } else {
        if (!controllerRoots.includes(controllerRoot)) {
          controllerRoots.push(controllerRoot)
        }
      }
    }
  })

  return controllerRoots.sort(nestedFolderSort)
}
