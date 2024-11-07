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

      <button type="submit" class="btn btn-primary" style="margin: 10px 0">Submit</button>
    </form>
    <p v-if="error" class="error" style="color: red">{{ error }}</p>
    <button @click="closeModal" class="btn btn-secondary" style="margin: 5px 0">Close</button>
  </div>
</template>

<script setup>
import {useFormComposable} from "@/use/useFormComposable.js";

const emits = defineEmits(['closeModal']);

const { title, description, date, time, submitForm, error } = useFormComposable();

const closeModal = () => {
  emits('closeModal');
}

function submitFormHandler() {
  console.log(`date ${date.value}`);
  console.log(`time ${time.value}`);
  submitForm();
  closeModal();
}

</script>

<style scoped>

</style>
