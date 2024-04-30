export function useSelectedPlatforms(platforms1:string[], platforms2:string[]){
  if(platforms1.length === 0){
    return platforms2
  }else return platforms1
}
