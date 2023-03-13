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

export function computeElapsedTime(timestamp: number | undefined): string {
  if (!timestamp) return '';
  let diffMs = new Date().getTime() - new Date(timestamp).getTime(); // milliseconds

  let diffYears = Math.floor(diffMs / 31536000000); // years
  if (diffYears > 0) return diffYears + ' month(s) ago';

  let diffMonths = Math.floor(diffMs / 2721600000); // month
  if (diffMonths > 0) return diffMonths + ' month(s) ago';

  let diffWeeks = Math.floor(diffMs / 604800000); // weeks
  if (diffWeeks > 0) return diffWeeks + ' week(s) ago';

  let diffDays = Math.floor(diffMs / 86400000); // days
  if (diffDays > 0) return diffDays + ' day(s) ago';

  let diffHrs = Math.floor((diffMs % 86400000) / 3600000); // hours
  if (diffHrs > 0) return diffHrs + ' hour(s) ago';

  let diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes
  if (diffMins > 0) return diffMins + ' minute(s) ago';

  if (diffMs > 0) return 'few seconds ago';

  return '${timestamp}';
}