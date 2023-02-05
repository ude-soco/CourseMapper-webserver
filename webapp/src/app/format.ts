export function printTime(time: number) {
    const seconds = time % 60;
    const minutes = Math.floor(time / 60) % 60;
    const hours = Math.floor(time / 3600);

    const secondsStr = seconds.toString().padStart(2, "0");
    const minutesStr = minutes.toString().padStart(2, "0");
    const hoursStr = hours.toString().padStart(2, "0");

    return `${hoursStr}:${minutesStr}:${secondsStr}`;
}

export function getInitials(name: string): string {
  if (!name) return "";
  return name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}