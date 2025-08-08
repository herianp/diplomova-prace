import { ref } from 'vue';
import {useTeamComposable} from "@/composable/useTeamComposable.ts";
import { useSurveyUseCases } from '@/composable/useSurveyUseCases.js'

export function useFormComposable() {
  const { deleteSurvey, addSurvey } = useTeamComposable();
  const { setSurveysListener } = useSurveyUseCases()

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

            await addSurvey({
                title: title.value,
                description: description.value,
                date: date.value,
                time: time.value,
                dateTime: useClub.getDateByDateAndTime(date.value, time.value),
                teamId: teamId,
            });

            await setSurveysListener(teamId);
        } catch (err) {
            console.log(`err ${err}`);
            error.value = 'Failed to submit data';
        }
    };

    const deleteForm = async (surveyId) => {
        error.value = null;
        console.log(`Deleted surveyId: ${surveyId}`)
        try {
            await deleteSurvey(surveyId);
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
