import { ref } from 'vue';
import { useSurveyUseCases } from '@/composable/useSurveyUseCases.ts'
import { useDateHelpers } from '@/composable/useDateHelpers.ts'
import { useI18n } from 'vue-i18n'

export function useFormComposable() {
  const i18n = useI18n()
  
  const { deleteSurvey, addSurvey, setSurveysListener } = useSurveyUseCases()
  const { getDateByDateAndTime } = useDateHelpers(i18n.locale.value)

  const title = ref('');
  const description = ref('');
  const date = ref('');
  const time = ref('');
  const error = ref(null);

  const submitForm = async (teamId) => {
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
        dateTime: getDateByDateAndTime(date.value, time.value),
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
