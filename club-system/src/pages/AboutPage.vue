<template>
  <div class="about">
    <h1>This is an about page</h1>
    <p>Counter is {{counterStore.counter}}</p>
    <button @click="counterStore.increment">+</button>
    <button @click="counterStore.decrement">-</button>
  </div>
</template>

<script setup>
import {useCounterStore} from "@/stores/counter.js";

const counterStore = useCounterStore();
</script>

<style>
.about {
  display: flex;
  flex-direction: column;
}
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}
</style>
