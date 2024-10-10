<script setup>
import {useCounter} from "@/use/useCounter.js";
import {useCounterStore} from "@/stores/counter.js";
import {ref} from "vue";

const useCounterStoreComposable = useCounter();
const counterStore = useCounterStore();
const newTitle = ref('')

const changeTitle = () => {
  if (newTitle.value.trim()) {
    counterStore.setTitle(newTitle.value) // Call the store action to update the title
    newTitle.value = '' // Clear the input after updating
  }
}
</script>

<template>
  <div class="homeView">
    <p>Title is: {{ counterStore.title }}</p>
    <p>BIG title is: {{ useCounterStoreComposable.bigTitle }}</p>
    <input v-model="newTitle" placeholder="edit me" />
    <button @click="changeTitle">update title </button>
    <button @click="counterStore.increment">+</button>
    <button @click="counterStore.decrement">-</button>
    <p :class="{evenClass: counterStore.isNumberEven}">Counter is {{counterStore.counter}}</p>
    <p>Double is {{counterStore.doubleCount}}</p>
  </div>
</template>

<style>
@media (min-width: 1024px) {
  .homeView {
    min-height: 100%;
    display: flex;
    align-items: start;
    margin-top: 5%;
    flex-direction: column;
  }
}

.evenClass {
  background-color: orange;
}
</style>
