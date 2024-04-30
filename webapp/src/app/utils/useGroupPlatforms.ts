import {Platform} from "../services/vis-dashboard/vis-dashboard.service";

interface GroupedPlatform {
  label: string;
  value: string;
  items: { label: string; value: string }[];
}

export function useGroupPlatforms(platforms: Platform[]): GroupedPlatform[] {
 const languageGroups = new Map<string, Platform[]>();
    platforms.forEach(platform => {
        const language = platform.PlatformLanguage;
        if (!languageGroups.has(language)) {
            languageGroups.set(language, []);
        }
        languageGroups.get(language)?.push(platform);
    });

    const groupedPlatforms: GroupedPlatform[] = [];
    languageGroups.forEach((platforms, language) => {
        const group: GroupedPlatform = {
            label: language,
            value: language,
            items: platforms.map(platform => ({
                label: platform.PlatformName.toUpperCase(),
                value: platform.PlatformName
            }))
        };
        groupedPlatforms.push(group);
    });

    return groupedPlatforms;
}
