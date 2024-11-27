import {useI18n} from "vue-i18n";
import {DaysOfWeek} from "@/enums/daysEnum.js";

export function useClubComposable() {
    const getDisplayedDateTime = (date, time) => {
        const dateTime = getDateByDateAndTime(date, time);
        const dayName = getDayName(dateTime.getDay());

        return `${dayName}, ${date} ${time}`;
    }

    const getDayName = (dayNumber) => {
        const { t } = useI18n();

        const dayEnumKeys = Object.keys(DaysOfWeek);
        const dayKey = dayEnumKeys.find(key => DaysOfWeek[key] === dayNumber);
        return dayKey ? t(`days.${dayKey}`) : '';
    }

    const getDateByDateAndTime = (date, time) => {
        const [year, month, day] = date.split("-");
        const [hours, minutes] = time.split(":");
        return new Date(year, month - 1, day, hours, minutes);
    }

    return { getDisplayedDateTime, getDayName, getDateByDateAndTime };
}
