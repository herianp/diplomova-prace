<template>
  <ul class="nav nav-tabs">
    <li class="nav-item" v-for="(link, index) in navLinks" :key="index">
      <a
          class="nav-link"
          :class="{ active: activeIndex === index }"
          href="#"
          @click.prevent="setActive(index)"
      >
        {{ link }}
      </a>
    </li>
  </ul>

  <div v-if="activeIndex === 0" class="max-w-300">
    <h1 style="text-align: center">Login</h1>
    <form>
      <div class="form-group">
        <label for="exampleInputEmail1">Email address</label>
        <input type="email" class="form-control" id="exampleInputEmail1" aria-describedby="emailHelp" placeholder="Enter email">
        <small id="emailHelp" class="form-text text-muted">We'll never share your email with anyone else.</small>
      </div>
      <div class="form-group">
        <label for="exampleInputPassword1">Password</label>
        <input type="password" class="form-control" id="exampleInputPassword1" placeholder="Password">
      </div>
      <div class="space-between">
        <button type="submit" class="btn btn-primary" style="margin-top: 10px">Login</button>
        <a>forgot password</a>
      </div>
    </form>
  </div>

  <div v-if="activeIndex === 1" class="max-w-300">
    <h1 style="text-align: center">Register</h1>
    <form>
      <div class="form-group">
        <label for="exampleInputEmail1">Email address</label>
        <input type="email" class="form-control" id="exampleInputEmail1" aria-describedby="emailHelp" placeholder="Enter email">
        <small id="emailHelp" class="form-text text-muted">We'll never share your email with anyone else.</small>
      </div>
      <div class="form-group">
        <label for="mainPassword">Password</label>
        <input type="password" class="form-control" id="mainPassword" placeholder="Password">
      </div>
      <div class="form-group">
        <label for="passwordConfirmation">Password confirmation</label>
        <input type="password" class="form-control" id="passwordConfirmation" placeholder="Password confirmation">
      </div>
      <button type="submit" class="btn btn-primary" style="margin-top: 10px">Register</button>
    </form>
  </div>
</template>

<script setup>

import {ref} from "vue";

const navLinks = ref(['Login', 'Register']);
const activeIndex = ref(0);

// Function to set the active index
const setActive = (index) => {
  activeIndex.value = index;
};
</script>

<style scoped>
.nav-tabs {
  justify-content: center;
}
.nav-link {
  color: black;
  font-size: 20px;
}
.max-w-300 {
  max-width: 400px;
  margin: 0 auto;
  padding: 30px 0;
}
.space-between {
  display: flex;
  justify-content: space-between;
}
</style>
