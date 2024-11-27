<template>
  <div class="modal-content">
    <form @submit.prevent="submitFormHandler">

      <div class="form-group">
        <label for="title">Title</label>
        <input
            type="text"
            v-model="title"
            class="form-control"
            id="title"
            placeholder="Enter title">
      </div>

      <div class="form-group">
        <label for="description">Description</label>
        <input
            type="text"
            v-model="description"
            class="form-control"
            id="description"
            placeholder="Description">
      </div>

      <!--   Date picker   -->
      <div class="form-group">
        <label for="date">Date</label>
        <input
            type="date"
            v-model="date"
            class="form-control"
            id="date"
            placeholder="Date">
      </div>

      <div class="form-group">
        <label for="time">Time</label>
        <input
            type="time"
            v-model="time"
            class="form-control"
            id="time"
            placeholder="Time">
      </div>

      <button type="submit" class="btn btn-primary" style="margin: 10px 0">Update</button>
    </form>

    <p v-if="error" class="error" style="color: red">{{ error }}</p>
    <button v-if="!deleteProcess" class="btn btn-danger"
            @click="deleteProcess = true">
      Delete
    </button>
    <button v-if="deleteProcess" type="submit" class="btn btn-warning" @click="deleteSurveyHandler">
      Are you sure?
    </button>

    <button @click="closeModal" class="btn btn-secondary" style="margin: 5px 0">Close</button>
  </div>
</template>

<script setup>
import {useFormComposable} from "@/use/useFormComposable.js";
import {onMounted, ref} from "vue";

const emits = defineEmits(['closeModal']);
const props = defineProps({
  survey: {
    type: Object,
    default: () => ({})
  }
});

const {title, description, updateForm, deleteForm, date, time, error} = useFormComposable();
const deleteProcess = ref(false);

const closeModal = () => {
  emits('closeModal');
}

function submitFormHandler() {
  updateForm(props.survey.id, title, description, date, time);
  closeModal();
}

function deleteSurveyHandler() {
  deleteForm(props.survey.id);
  closeModal();
}

function initFormValues() {
  title.value = props.survey.title;
  description.value = props.survey.description;
  date.value = props.survey.date;
  time.value = props.survey.time;
}

onMounted(() => {
  initFormValues();
});
</script>

<style scoped>

</style>
