import { ref } from 'vue';
import {useTeamComposable} from "@/composable/useTeamComposable.ts";
import {useTeamStore} from "@/stores/teamStore.ts";

export function useFormComposable() {
    const teamStore = useTeamStore();
    const title = ref('');
    const description = ref('');
    const date = ref('');
    const time = ref('');
    const error = ref(null);

    const submitForm = async (teamId) => {
        const useClub = useTeamComposable();
        error.value = null; // Reset error before submission

        try {
            console.log('submitForm');
            if (!title.value || !description.value) {
                error.value = 'Please fill out both fields';
                return;
            }

            await teamStore.addSurvey({
                title: title.value,
                description: description.value,
                date: date.value,
                time: time.value,
                dateTime: useClub.getDateByDateAndTime(date.value, time.value),
                teamId: teamId,
            });

            await teamStore.setSurveysListener(teamId);
        } catch (err) {
            console.log(`err ${err}`);
            error.value = 'Failed to submit data';
        }
    };

    const deleteForm = async (surveyId) => {
        error.value = null;
        console.log(`Deleted surveyId: ${surveyId}`)
        try {
            // Todo delete survey from the DB
            await teamStore.deleteSurvey(surveyId);
        } catch (err) {
            console.log(`err ${err}`)
            error.value = 'Failed to delete data';
        }
    }

    const updateForm = async (surveyId, newTitle, newDescription, newDate, newTime) => {
      console.log(`updateForm surveyId: ${surveyId}, newTitle: ${newTitle}, newDescription: ${newDescription}, newDate: ${newDate}, newTime: ${newTime}`);
    }

    return { title, description, submitForm, deleteForm, error, date, time, updateForm };
}
