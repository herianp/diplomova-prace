// useFormSubmit.js
import { ref } from 'vue';
import {useClubStore} from "@/stores/club.js";

export function useFormComposable() {
    const clubStore = useClubStore();
    const title = ref('');
    const description = ref('');
    const date = ref('');
    const time = ref('');
    const error = ref(null);

    const submitForm = async () => {
        console.log('submitForm');
        error.value = null; // Reset error before submission
        try {
            console.log('submitForm');
            if (!title.value || !description.value) {
                error.value = 'Please fill out both fields';
                return;
            }
            console.log(`submitForm ${title.value} ${description.value} ${date.value} ${time.value}`);
            await clubStore.addActiveSurvey({
                title: title.value,
                description: description.value,
                date: date.value,
                time: time.value
            });
        } catch (err) {
            console.log(`err ${err}`)
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
