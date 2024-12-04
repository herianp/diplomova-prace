<template>
  <form @submit.prevent="submitRegistration">
    <div class="form-group">
      <label for="nameInput">Name</label>
      <input v-model="credentials.name" type="text" class="form-control" id="nameInput" placeholder="Enter name">
    </div>
    <div class="form-group">
      <label for="exampleInputEmail1">Email address</label>
      <input v-model="credentials.email" type="email" class="form-control" id="exampleInputEmail1" aria-describedby="emailHelp" placeholder="Enter email">
      <small id="emailHelp" class="form-text text-muted">We'll never share your email with anyone else.</small>
    </div>
    <div class="form-group">
      <label for="mainPassword">Password</label>
      <input v-model="credentials.password" type="password" class="form-control" id="mainPassword" placeholder="Password">
    </div>
    <button type="submit" class="btn btn-primary" style="margin-top: 10px">Register</button>
  </form>
</template>

<script setup>
const props = defineProps({
  submitRegistration: {
    type: Function,
    required: true
  },
  credentials: {
    type: Object,
    default: () => ({
      name: '',
      email: '',
      password: ''
    })
  }
});
</script>

<style scoped>

</style>
