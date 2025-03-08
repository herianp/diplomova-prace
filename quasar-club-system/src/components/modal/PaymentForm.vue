<template>
  <div class="modal-content">
    <form @submit.prevent="submitFormHandler">
      <div class="form-group">
        <label for="teamName">Team name</label>
        <input
            type="text"
            v-model="teamName"
            class="form-control"
            id="teamName"
            placeholder="Enter name">
      </div>
      <button type="submit" class="btn btn-primary" style="margin: 10px 0">Submit</button>
    </form>
    <p v-if="error" class="error" style="color: red">{{ error }}</p>
    <button @click="closeModal" class="btn btn-secondary" style="margin: 5px 0">Close</button>
  </div>
</template>

<script setup>
import {ref} from "vue";

const emits = defineEmits(['closeModal']);

const teamName = ref('');
const error = ref(null);

const closeModal = () => {
  emits('closeModal');
}

function submitFormHandler() {
  if (!teamName.value) {
    error.value = 'Please fill in all fields';
    return;
  }
  createPayment();
  closeModal();
}

function createPayment() {
  // teamStore.addCashboxTransaction(...);
}

</script>

<style scoped>

</style>
