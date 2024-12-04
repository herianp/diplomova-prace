<template>
  <form @submit.prevent="submitLogin">
    <div class="form-group">
      <label for="exampleInputEmail1">Email address</label>
      <input v-model="credentials.email" type="email" class="form-control" id="exampleInputEmail1" aria-describedby="emailHelp" placeholder="Enter email">
      <small id="emailHelp" class="form-text text-muted">We'll never share your email with anyone else.</small>
    </div>
    <div class="form-group">
      <label for="exampleInputPassword1">Password</label>
      <input v-model="credentials.password" type="password" class="form-control" id="exampleInputPassword1" placeholder="Password">
    </div>
    <div class="space-between">
      <button type="submit" class="btn btn-primary" style="margin-top: 10px">Login</button>
      <a>forgot password</a>
    </div>
  </form>
</template>

<script setup>
const props = defineProps({
  submitLogin: {
    type: Function,
    required: true
  },
  credentials: {
    type: Object,
    default: () => ({
      email: '',
      password: ''
    })
  }
});
</script>

<style scoped>

</style>
