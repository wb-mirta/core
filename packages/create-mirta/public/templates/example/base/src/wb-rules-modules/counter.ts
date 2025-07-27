export function useCounter() {

  let count = 0

  return {
    get count() {
      return count
    },
    increment() {
      count += 1
    }
  }

}
