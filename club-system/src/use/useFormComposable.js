// useFormSubmit.js
import { ref } from 'vue';
import {useClubStore} from "@/stores/club.js";
import {useClubComposable} from "@/use/useClubComposable.js";
import {useTeamStore} from "@/stores/team.js";

export function useFormComposable() {
    const clubStore = useClubStore();
    const teamStore = useTeamStore();
    const title = ref('');
    const description = ref('');
    const date = ref('');
    const time = ref('');
    const error = ref(null);

    const submitForm = async (teamId) => {
        const useClub = useClubComposable();
        error.value = null; // Reset error before submission

        try {
            console.log('submitForm');
            if (!title.value || !description.value) {
                error.value = 'Please fill out both fields';
                return;
            }

            console.log(`submitForm ${title.value} ${description.value} ${date.value} ${time.value}`);
            console.log(`useClub.getDateByDateAndTime(date.value, time.value) ${useClub.getDateByDateAndTime(date.value, time.value)}`);

            await teamStore.addSurvey({
                title: title.value,
                description: description.value,
                date: date.value,
                time: time.value,
                dateTime: useClub.getDateByDateAndTime(date.value, time.value),
                teamId: teamId,
            });

            await teamStore.getSurveysByTeamId(teamId);
        } catch (err) {
            console.log(`err ${err}`);
            error.value = 'Failed to submit data';
        }
    };

    const deleteForm = async (surveyId) => {
        error.value = null; // Reset error before submission
        console.log(`Deleted surveyId: ${surveyId}`)
        try {
            // Todo delete survey from the DB
            await clubStore.deleteActiveSurvey(surveyId);
        } catch (err) {
            console.log(`err ${error}`)
            error.value = 'Failed to delete data';
        }
    }

    const updateForm = async (surveyId, newTitle, newDescription, newDate, newTime) => {
        error.value = null; // Reset error before submission
        console.log(`Updated surveyId: ${surveyId}`)
        try {
            // Todo update survey in the DB
            await clubStore.updateActiveSurvey(surveyId, newTitle, newDescription, newDate, newTime);
        } catch (err) {
            console.log(`err ${error}`)
            error.value = 'Failed to update data';
        }
    }

    return { title, description, submitForm, deleteForm, error, date, time, updateForm };
}
